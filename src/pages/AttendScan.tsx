import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

type CheckInState = "idle" | "loading" | "success" | "already" | "not_found" | "no_service" | "register";

export default function AttendScan() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || searchParams.get("code") || "";

  const [phone, setPhone] = useState("");
  const [state, setState] = useState<CheckInState>("idle");
  const [memberName, setMemberName] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [loading, setLoading] = useState(false);

  // Quick register state
  const [quickName, setQuickName] = useState("");
  const [registering, setRegistering] = useState(false);

  const handleCheckIn = async () => {
    if (!phone.trim()) { toast.error("Enter your phone number"); return; }
    setLoading(true);
    setState("loading");

    // 1. Validate token
    if (!token) { setState("no_service"); setLoading(false); return; }

    // 2. Find active service
    const { data: services } = await supabase
      .from("services")
      .select("id, title, service_name, qr_active, organization_id, organizations:organization_id(name)")
      .eq("qr_code", token)
      .eq("qr_active", true)
      .limit(1);

    if (!services || services.length === 0) { setState("no_service"); setLoading(false); return; }
    const service = services[0];
    setServiceName(service.title || service.service_name || "Service");

    // 3. Find member by phone
    const cleanPhone = phone.trim().replace(/\s+/g, "");
    const { data: members } = await supabase
      .from("members")
      .select("id, full_name, status, phone_number")
      .or(`phone_number.eq.${cleanPhone},phone_number.eq.+${cleanPhone}`)
      .limit(1);

    if (!members || members.length === 0) {
      setState("not_found");
      setLoading(false);
      return;
    }

    const member = members[0];
    setMemberName(member.full_name);

    // 4. Check if already checked in
    const { data: existing } = await supabase
      .from("service_attendance")
      .select("id")
      .eq("service_id", service.id)
      .eq("member_id", member.id)
      .limit(1);

    if (existing && existing.length > 0) {
      setState("already");
      setLoading(false);
      return;
    }

    // 5. Insert attendance
    const { error } = await supabase.from("service_attendance").insert({
      service_id: service.id,
      member_id: member.id,
      scan_method: "qr_self",
      is_first_timer: member.status === "First Timer",
    });

    if (error) {
      if (error.code === "23505") { setState("already"); }
      else { toast.error("Check-in failed"); setState("idle"); }
    } else {
      setState("success");
    }
    setLoading(false);
  };

  const handleQuickRegister = async () => {
    if (!quickName.trim() || !phone.trim()) { toast.error("Enter name and phone"); return; }
    setRegistering(true);

    // Find the service to get org_id
    const { data: services } = await supabase
      .from("services")
      .select("id, organization_id")
      .eq("qr_code", token)
      .eq("qr_active", true)
      .limit(1);

    if (!services || services.length === 0) { setState("no_service"); setRegistering(false); return; }
    const service = services[0];

    const cleanPhone = phone.trim().replace(/\s+/g, "");
    const { data: newMember, error: memberErr } = await supabase.from("members").insert({
      full_name: quickName.trim(),
      phone_number: cleanPhone,
      status: "First Timer",
      date_of_first_visit: new Date().toISOString().split("T")[0],
      service_attended: "Sunday Service",
      organization_id: service.organization_id,
    }).select("id, full_name").single();

    if (memberErr) { toast.error("Registration failed"); setRegistering(false); return; }

    // Check in
    await supabase.from("service_attendance").insert({
      service_id: service.id,
      member_id: newMember.id,
      scan_method: "qr_self",
      is_first_timer: true,
    });

    setMemberName(newMember.full_name);
    setServiceName("Service");
    setState("success");
    setRegistering(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-display font-bold text-foreground">⛪ KingsRetention Check-In</h1>
            <p className="text-muted-foreground mt-1">Enter your phone number to check in</p>
          </div>

          {state === "idle" || state === "loading" ? (
            <div className="space-y-4">
              <Input
                placeholder="Phone number (e.g. 08012345678)"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="h-12 text-base text-center"
                type="tel"
              />
              <Button onClick={handleCheckIn} disabled={loading} className="w-full h-12 text-base">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Checking...</> : "Check In ✓"}
              </Button>
            </div>
          ) : state === "success" ? (
            <div className="text-center space-y-4 py-6">
              <CheckCircle2 className="h-20 w-20 text-success mx-auto" />
              <div>
                <p className="text-xl font-bold text-foreground">✅ {memberName}, welcome to service!</p>
                <p className="text-muted-foreground">You're checked in to {serviceName}</p>
              </div>
            </div>
          ) : state === "already" ? (
            <div className="text-center space-y-4 py-6">
              <CheckCircle2 className="h-16 w-16 text-primary mx-auto" />
              <p className="text-lg font-bold text-foreground">✅ {memberName}, you're already checked in!</p>
              <Button variant="outline" onClick={() => setState("idle")}>Back</Button>
            </div>
          ) : state === "no_service" ? (
            <div className="text-center space-y-4 py-6">
              <XCircle className="h-16 w-16 text-destructive mx-auto" />
              <p className="text-lg font-bold text-foreground">❌ Check-in is not currently open</p>
              <p className="text-sm text-muted-foreground">Please ask a team member for help</p>
              <Button variant="outline" onClick={() => setState("idle")}>Try Again</Button>
            </div>
          ) : state === "not_found" ? (
            <div className="text-center space-y-4 py-4">
              <p className="text-lg font-semibold text-foreground">Phone number not found</p>
              <p className="text-sm text-muted-foreground">Would you like to register as a first timer?</p>
              <div className="space-y-3">
                <Input placeholder="Your full name" value={quickName} onChange={e => setQuickName(e.target.value)} className="h-11" />
                <Button onClick={handleQuickRegister} disabled={registering} className="w-full">
                  {registering ? "Registering..." : "Register & Check In"}
                </Button>
                <Button variant="outline" onClick={() => setState("idle")} className="w-full">Back</Button>
              </div>
            </div>
          ) : null}

          {!token && state === "idle" && (
            <p className="text-xs text-destructive text-center">No check-in token found. Please scan the QR code.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
