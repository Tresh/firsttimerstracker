import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { KingsRetentionLogo } from "@/components/KingsRetentionLogo";
import { CheckCircle2, XCircle, Clock, Loader2, BookOpen } from "lucide-react";

type PageState = "loading" | "invalid" | "expired" | "ready" | "success" | "not_found" | "already_scanned";

interface SessionInfo {
  id: string;
  classTitle: string;
  classCode: string;
  churchName: string;
}

export default function FSScan() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [state, setState] = useState<PageState>("loading");
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [phone, setPhone] = useState("");
  const [memberName, setMemberName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { setState("invalid"); return; }
    (async () => {
      const { data } = await supabase
        .from("fs_qr_sessions")
        .select("id, is_active, class_id, foundation_school_classes(class_title, class_code), organizations(name)")
        .eq("qr_code", token)
        .limit(1)
        .single();
      if (!data) { setState("invalid"); return; }
      if (!data.is_active) { setState("expired"); return; }
      setSessionInfo({
        id: data.id,
        classTitle: (data.foundation_school_classes as any)?.class_title || "",
        classCode: (data.foundation_school_classes as any)?.class_code || "",
        churchName: (data.organizations as any)?.name || "",
      });
      setState("ready");
    })();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !sessionInfo) return;
    setSubmitting(true);

    // Look up member
    const { data: member } = await supabase
      .from("members").select("id, prefix, full_name, fs_enrolled")
      .eq("phone_number", phone.trim()).limit(1).single();

    if (!member) { setState("not_found"); setSubmitting(false); return; }

    // Check already scanned
    const { data: existing } = await supabase
      .from("fs_qr_scans").select("id")
      .eq("session_id", sessionInfo.id).eq("member_id", member.id).limit(1);

    if (existing && existing.length > 0) {
      setMemberName([member.prefix, member.full_name].filter(Boolean).join(" "));
      setState("already_scanned");
      setSubmitting(false);
      return;
    }

    // Re-check session is still active
    const { data: sess } = await supabase
      .from("fs_qr_sessions").select("is_active, class_id").eq("id", sessionInfo.id).single();
    if (!sess?.is_active) { setState("expired"); setSubmitting(false); return; }

    // Insert scan record
    await supabase.from("fs_qr_scans").insert([{
      session_id: sessionInfo.id,
      member_id: member.id,
    }]);

    // Upsert attendance
    await supabase.from("foundation_school_attendance").upsert({
      class_id: sess.class_id,
      member_id: member.id,
      attended: true,
      scan_verified: true,
      qr_session_id: sessionInfo.id,
      marked_at: new Date().toISOString(),
    }, { onConflict: "class_id,member_id" });

    // Increment scan count (best effort)
    try {
      await supabase.from("fs_qr_sessions").update({
        scan_count: (await supabase.from("fs_qr_scans").select("id", { count: "exact" }).eq("session_id", sessionInfo.id)).count || 0,
      }).eq("id", sessionInfo.id);
    } catch { /* ignore */ }

    setMemberName([member.prefix, member.full_name].filter(Boolean).join(" "));
    setState("success");
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">

        {state === "loading" && (
          <div className="text-center space-y-4 py-16">
            <Loader2 className="h-12 w-12 text-primary mx-auto animate-spin" />
            <p className="text-muted-foreground">Verifying session...</p>
          </div>
        )}

        {state === "invalid" && (
          <div className="text-center space-y-4 py-12">
            <div className="w-20 h-20 rounded-full bg-destructive/15 flex items-center justify-center mx-auto">
              <XCircle className="h-10 w-10 text-destructive" />
            </div>
            <h1 className="text-2xl font-display font-extrabold text-foreground">Invalid QR Code</h1>
            <p className="text-muted-foreground">This Foundation School attendance link is not valid.</p>
          </div>
        )}

        {state === "expired" && (
          <div className="text-center space-y-4 py-12">
            <div className="w-20 h-20 rounded-full bg-warning/15 flex items-center justify-center mx-auto">
              <Clock className="h-10 w-10 text-warning" />
            </div>
            <h1 className="text-2xl font-display font-extrabold text-foreground">Session Closed</h1>
            <p className="text-muted-foreground">This attendance session has been closed by the facilitator.</p>
          </div>
        )}

        {state === "ready" && sessionInfo && (
          <div className="space-y-6">
            <div className="flex justify-center"><KingsRetentionLogo size="md" showText /></div>
            <h1 className="text-2xl font-display font-extrabold text-foreground text-center">📖 Foundation School</h1>
            <div className="bg-secondary/50 border border-border rounded-xl p-4 text-center space-y-1">
              <p className="font-display font-bold text-foreground">{sessionInfo.classCode} — {sessionInfo.classTitle}</p>
              {sessionInfo.churchName && <p className="text-sm text-muted-foreground">{sessionInfo.churchName}</p>}
              <span className="inline-flex items-center gap-1.5 text-xs text-success font-medium mt-1">
                <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" /><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" /></span>
                Session Open
              </span>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="tel" required autoFocus placeholder="08012345678"
                value={phone} onChange={e => setPhone(e.target.value)}
                className="h-16 text-xl text-center tracking-wider"
              />
              <p className="text-xs text-muted-foreground text-center">Enter your phone number to mark attendance</p>
              <Button type="submit" disabled={submitting} className="w-full h-14 text-base font-bold">
                {submitting ? "Checking..." : "Mark My Attendance ✓"}
              </Button>
            </form>
          </div>
        )}

        {state === "success" && (
          <div className="text-center space-y-5 py-8">
            <div className="w-24 h-24 rounded-full bg-success/15 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-14 w-14 text-success" />
            </div>
            <h1 className="text-3xl font-display font-extrabold text-foreground">Marked! ✅</h1>
            <p className="text-xl font-display font-bold text-success">{memberName}</p>
            {sessionInfo && (
              <div className="bg-secondary/50 border border-border rounded-xl p-3 text-center">
                <p className="text-sm font-medium text-foreground">{sessionInfo.classCode} — {sessionInfo.classTitle}</p>
              </div>
            )}
            <p className="text-muted-foreground">Your attendance has been recorded. God bless you! 🙏</p>
            <div className="pt-4"><KingsRetentionLogo size="sm" showText /></div>
          </div>
        )}

        {state === "not_found" && (
          <div className="text-center space-y-5 py-8">
            <div className="w-20 h-20 rounded-full bg-warning/15 flex items-center justify-center mx-auto">
              <BookOpen className="h-10 w-10 text-warning" />
            </div>
            <h1 className="text-2xl font-display font-extrabold text-foreground">Not Found</h1>
            <p className="text-muted-foreground">We couldn't find a member with this phone number. Please check and try again.</p>
            <Button variant="outline" onClick={() => { setState("ready"); setPhone(""); }}>Try Again</Button>
          </div>
        )}

        {state === "already_scanned" && (
          <div className="text-center space-y-5 py-8">
            <div className="w-20 h-20 rounded-full bg-info/15 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-10 w-10 text-info" />
            </div>
            <h1 className="text-2xl font-display font-extrabold text-foreground">Already Marked!</h1>
            <p className="text-lg font-display font-bold text-info">{memberName}</p>
            <p className="text-muted-foreground">Your attendance for this class was already recorded. 🙏</p>
          </div>
        )}
      </div>
    </div>
  );
}
