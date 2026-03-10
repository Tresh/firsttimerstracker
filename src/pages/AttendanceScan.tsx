import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { KingsRetentionLogo } from "@/components/KingsRetentionLogo";
import { CheckCircle2, XCircle, Clock, UserPlus, Loader2, ArrowLeft } from "lucide-react";

type PageState = "loading" | "invalid" | "expired" | "ready" | "success" | "first_timer" | "already_marked";

interface ServiceInfo {
  id: string;
  service_name: string | null;
  service_type: string;
  service_date: string;
  valid_from: string;
  valid_until: string;
  churchName: string;
}

export default function AttendanceScan() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");
  const [state, setState] = useState<PageState>("loading");
  const [serviceInfo, setServiceInfo] = useState<ServiceInfo | null>(null);
  const [phone, setPhone] = useState("");
  const [memberName, setMemberName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!code) { setState("invalid"); return; }
    (async () => {
      const { data } = await supabase
        .from("services")
        .select("id, service_name, service_type, service_date, valid_from, valid_until, organizations(name)")
        .eq("qr_code", code)
        .limit(1)
        .single();
      if (!data) { setState("invalid"); return; }
      const now = new Date();
      if (now < new Date(data.valid_from) || now > new Date(data.valid_until)) {
        setServiceInfo({
          id: data.id, service_name: data.service_name, service_type: data.service_type,
          service_date: data.service_date, valid_from: data.valid_from, valid_until: data.valid_until,
          churchName: (data.organizations as any)?.name || "",
        });
        setState("expired");
        return;
      }
      setServiceInfo({
        id: data.id, service_name: data.service_name, service_type: data.service_type,
        service_date: data.service_date, valid_from: data.valid_from, valid_until: data.valid_until,
        churchName: (data.organizations as any)?.name || "",
      });
      setState("ready");
    })();
  }, [code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !serviceInfo) return;
    setSubmitting(true);

    const { data: member } = await supabase
      .from("members").select("id, prefix, full_name").eq("phone_number", phone.trim()).limit(1).single();

    if (!member) { setState("first_timer"); setSubmitting(false); return; }

    const { data: existing } = await supabase
      .from("attendance").select("id").eq("service_id", serviceInfo.id).eq("phone_number", phone.trim()).limit(1);

    if (existing && existing.length > 0) {
      setMemberName([member.prefix, member.full_name].filter(Boolean).join(" "));
      setState("already_marked");
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from("attendance").insert([{
      service_id: serviceInfo.id,
      member_id: member.id,
      phone_number: phone.trim(),
      scan_method: "qr",
      verified: true,
      is_first_timer: false,
    }]);

    setSubmitting(false);
    if (error) { setState("invalid"); return; }
    setMemberName([member.prefix, member.full_name].filter(Boolean).join(" "));
    setState("success");
  };

  const dateLabel = serviceInfo ? new Date(serviceInfo.service_date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "";

  const ServiceCard = () => serviceInfo ? (
    <div className="bg-secondary/50 border border-border rounded-xl p-4 text-center space-y-1">
      <p className="font-display font-bold text-foreground">{serviceInfo.service_name || serviceInfo.service_type}</p>
      <p className="text-sm text-muted-foreground">{serviceInfo.churchName}</p>
      <p className="text-xs text-muted-foreground">{dateLabel}</p>
    </div>
  ) : null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">

        {/* Loading */}
        {state === "loading" && (
          <div className="text-center space-y-4 py-16">
            <Loader2 className="h-12 w-12 text-primary mx-auto animate-spin" />
            <p className="text-muted-foreground">Verifying attendance code...</p>
          </div>
        )}

        {/* Invalid */}
        {state === "invalid" && (
          <div className="text-center space-y-4 py-12">
            <div className="w-20 h-20 rounded-full bg-destructive/15 flex items-center justify-center mx-auto">
              <XCircle className="h-10 w-10 text-destructive" />
            </div>
            <h1 className="text-2xl font-display font-extrabold text-foreground">Invalid QR Code</h1>
            <p className="text-muted-foreground">This attendance link is not valid. Please scan the QR code displayed at your church entrance.</p>
          </div>
        )}

        {/* Expired */}
        {state === "expired" && (
          <div className="text-center space-y-4 py-12">
            <div className="w-20 h-20 rounded-full bg-warning/15 flex items-center justify-center mx-auto">
              <Clock className="h-10 w-10 text-warning" />
            </div>
            <h1 className="text-2xl font-display font-extrabold text-foreground">Session Expired</h1>
            <ServiceCard />
            <p className="text-muted-foreground">The attendance window for this service has closed.</p>
          </div>
        )}

        {/* Ready — Check-in form */}
        {state === "ready" && (
          <div className="space-y-6">
            <div className="flex justify-center"><KingsRetentionLogo size="md" showText /></div>
            <h1 className="text-2xl font-display font-extrabold text-foreground text-center">Mark Attendance</h1>
            <div className="relative">
              <ServiceCard />
              <span className="absolute top-3 right-3 flex items-center gap-1.5 text-xs text-success font-medium">
                <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" /><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" /></span>
                Open
              </span>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="tel" required autoFocus placeholder="08012345678"
                value={phone} onChange={e => setPhone(e.target.value)}
                className="h-16 text-xl text-center tracking-wider"
              />
              <p className="text-xs text-muted-foreground text-center">Use the same number you registered with</p>
              <Button type="submit" disabled={submitting} className="w-full h-14 text-base font-bold">
                {submitting ? "Checking..." : "Check In ✓"}
              </Button>
            </form>
          </div>
        )}

        {/* Success */}
        {state === "success" && (
          <div className="text-center space-y-5 py-8">
            <div className="w-24 h-24 rounded-full bg-success/15 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-14 w-14 text-success" />
            </div>
            <h1 className="text-3xl font-display font-extrabold text-foreground">Welcome!</h1>
            <p className="text-xl font-display font-bold text-success">{memberName}</p>
            <ServiceCard />
            <p className="text-muted-foreground">Your attendance has been recorded. God bless you! 🙏</p>
            <div className="pt-4"><KingsRetentionLogo size="sm" showText /></div>
          </div>
        )}

        {/* First Timer */}
        {state === "first_timer" && (
          <div className="text-center space-y-5 py-8">
            <div className="w-20 h-20 rounded-full bg-warning/15 flex items-center justify-center mx-auto">
              <UserPlus className="h-10 w-10 text-warning" />
            </div>
            <h1 className="text-2xl font-display font-extrabold text-foreground">Welcome to Church!</h1>
            <p className="text-muted-foreground">It looks like this is your first time visiting — we're so glad you're here!</p>
            <Card className="border-warning/30 bg-warning/5">
              <CardContent className="p-5 space-y-2">
                <p className="font-display font-bold text-warning text-lg">Please visit the Welcome Desk</p>
                <p className="text-sm text-muted-foreground">Our team is ready to welcome you and get you registered!</p>
                <p className="text-xs text-muted-foreground">Look for the Welcome Stand at the front of the hall.</p>
              </CardContent>
            </Card>
            <Button variant="outline" className="gap-2" onClick={() => { setState("ready"); setPhone(""); }}>
              <ArrowLeft className="h-4 w-4" />Try a different number
            </Button>
          </div>
        )}

        {/* Already Marked */}
        {state === "already_marked" && (
          <div className="text-center space-y-5 py-8">
            <div className="w-20 h-20 rounded-full bg-info/15 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-10 w-10 text-info" />
            </div>
            <h1 className="text-2xl font-display font-extrabold text-foreground">Already Marked!</h1>
            <p className="text-lg font-display font-bold text-info">{memberName}</p>
            <p className="text-muted-foreground">Your attendance for this service was already recorded. Enjoy the service! 🙏</p>
          </div>
        )}
      </div>
    </div>
  );
}
