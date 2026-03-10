import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CheckCircle2, User, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { KingsRetentionLogo } from "@/components/KingsRetentionLogo";

const PREFIXES = ["Brother", "Sister", "Pastor", "Deacon", "Deaconess", "Evang", "Dr", "Prof"];
const today = () => new Date().toISOString().split("T")[0];

export default function WelcomeDesk() {
  const { profile, organizationId, signOut } = useAuth();
  const [prefix, setPrefix] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [service, setService] = useState("Sunday Service");
  const [invitedBy, setInvitedBy] = useState<string | null>(null);
  const [invitedByName, setInvitedByName] = useState("");
  const [invitedBySearch, setInvitedBySearch] = useState("");
  const [invitedByResults, setInvitedByResults] = useState<any[]>([]);
  const [invitedByLinked, setInvitedByLinked] = useState(false);
  const [successName, setSuccessName] = useState("");
  const [todayList, setTodayList] = useState<any[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const fetchToday = useCallback(async () => {
    const { data, count } = await supabase
      .from("members")
      .select("id, prefix, full_name, phone_number", { count: "exact" })
      .eq("date_of_first_visit", today())
      .order("created_at", { ascending: false })
      .limit(8);
    setTodayList(data || []);
    setTodayCount(count || 0);
  }, []);

  useEffect(() => { fetchToday(); const i = setInterval(fetchToday, 30000); return () => clearInterval(i); }, [fetchToday]);

  // Invited-by search
  useEffect(() => {
    if (invitedBySearch.length < 2) { setInvitedByResults([]); return; }
    const t = setTimeout(async () => {
      const { data } = await supabase.from("members").select("id, prefix, full_name").ilike("full_name", `%${invitedBySearch}%`).limit(5);
      setInvitedByResults(data || []);
    }, 300);
    return () => clearTimeout(t);
  }, [invitedBySearch]);

  const resetForm = () => {
    setPrefix(""); setFullName(""); setPhone(""); setGender(""); setService("Sunday Service");
    setInvitedBy(null); setInvitedByName(""); setInvitedBySearch(""); setInvitedByLinked(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) { toast.error("Name and phone are required."); return; }
    setSubmitting(true);

    const { data: existing } = await supabase.from("members").select("id").eq("phone_number", phone.trim()).limit(1);
    if (existing && existing.length > 0) { toast.error("This phone number is already in the system."); setSubmitting(false); return; }

    const { error } = await supabase.from("members").insert([{
      prefix: (prefix || null) as any,
      full_name: fullName.trim(),
      phone_number: phone.trim(),
      gender: gender || null,
      service_attended: service as any,
      date_of_first_visit: today(),
      organization_id: organizationId || null,
      registered_by: profile?.id || null,
      invited_by: invitedBy,
      invited_by_name: invitedByName || null,
      status: "First Timer" as const,
    }]);

    setSubmitting(false);
    if (error) { toast.error(error.message); return; }

    setSuccessName(`${prefix ? prefix + " " : ""}${fullName.trim()}`);
    resetForm();
    fetchToday();
    setTimeout(() => setSuccessName(""), 3000);
  };

  const dateStr = new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 shrink-0">
        <KingsRetentionLogo size="sm" showText />
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold bg-success/15 text-success border border-success/30 px-3 py-1 rounded-full">{todayCount} registered</span>
          <span className="text-xs font-medium bg-secondary text-muted-foreground px-3 py-1 rounded-full">{dateStr}</span>
          <button onClick={signOut} className="ml-2 p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Sign Out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4">
        <div className="max-w-[500px] mx-auto space-y-4">
          {/* Success banner */}
          {successName && (
            <div className="bg-success/15 border border-success/30 rounded-2xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="h-8 w-8 text-success shrink-0" />
              <div>
                <p className="font-display font-bold text-success text-lg">{successName}</p>
                <p className="text-sm text-success/80">Successfully registered! Welcome to church. 🙌</p>
              </div>
            </div>
          )}

          {/* Form */}
          <Card>
            <CardContent className="p-5">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Prefix + Name */}
                <div className="flex gap-2">
                  <div className="w-28 shrink-0">
                    <Select value={prefix} onValueChange={setPrefix}>
                      <SelectTrigger className="h-12"><SelectValue placeholder="Title" /></SelectTrigger>
                      <SelectContent>{PREFIXES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <Input required placeholder="Full Name *" value={fullName} onChange={e => setFullName(e.target.value)} className="h-12 flex-1 text-base" />
                </div>

                {/* Phone */}
                <Input required type="tel" placeholder="Phone Number *" value={phone} onChange={e => setPhone(e.target.value)} className="h-14 text-lg" />

                {/* Gender toggles */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Gender</p>
                  <div className="grid grid-cols-2 gap-2">
                    {["Male", "Female"].map(g => (
                      <button key={g} type="button" onClick={() => setGender(g)}
                        className={`h-12 rounded-xl font-semibold text-sm border transition-all ${gender === g ? "gradient-primary text-primary-foreground border-primary" : "bg-secondary text-muted-foreground border-border hover:border-primary/30"}`}>
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Service toggles */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Service</p>
                  <div className="grid grid-cols-3 gap-2">
                    {["Sunday Service", "Midweek Service", "Special Program"].map(s => (
                      <button key={s} type="button" onClick={() => setService(s)}
                        className={`h-11 rounded-xl font-semibold text-xs border transition-all px-2 ${service === s ? "gradient-primary text-primary-foreground border-primary" : "bg-secondary text-muted-foreground border-border hover:border-primary/30"}`}>
                        {s.replace(" Service", "")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Invited By */}
                <div className="relative">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Invited By</p>
                  <Input
                    placeholder="Search member name..."
                    value={invitedByLinked ? invitedByName : invitedBySearch}
                    onChange={e => { setInvitedBySearch(e.target.value); setInvitedByLinked(false); setInvitedBy(null); setInvitedByName(""); }}
                    className="h-11"
                  />
                  {invitedByResults.length > 0 && !invitedByLinked && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {invitedByResults.map(r => (
                        <button type="button" key={r.id}
                          className="w-full text-left px-4 py-2.5 hover:bg-secondary/50 flex items-center gap-2 text-sm"
                          onClick={() => {
                            const dn = [r.prefix, r.full_name].filter(Boolean).join(" ");
                            setInvitedBy(r.id); setInvitedByName(dn); setInvitedByLinked(true); setInvitedByResults([]);
                          }}>
                          <User className="h-4 w-4 text-muted-foreground" />{r.prefix ? `${r.prefix} ` : ""}{r.full_name}
                        </button>
                      ))}
                    </div>
                  )}
                  {invitedByLinked && <p className="text-xs text-success flex items-center gap-1 mt-1"><CheckCircle2 className="h-3 w-3" />Linked — they'll get credit!</p>}
                </div>

                <Button type="submit" disabled={submitting} className="w-full h-14 text-base font-bold">
                  {submitting ? "Registering..." : "Register ✓"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Today's registrations */}
          {todayList.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Today's Registrations</h3>
              {todayList.map(m => (
                <div key={m.id} className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
                  <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">{m.full_name?.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{m.prefix ? `${m.prefix} ` : ""}{m.full_name}</p>
                    <p className="text-xs text-muted-foreground">{m.phone_number || "—"}</p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
