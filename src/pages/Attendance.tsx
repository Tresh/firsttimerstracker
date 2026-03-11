import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { CalendarIcon, Users, UserPlus, TrendingUp, Church, Search, QrCode, Lock, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const SERVICE_TYPES = ["Sunday Service", "Wednesday Service", "Prayer Meeting", "Special Program", "Youth Service", "Other"];

export default function Attendance() {
  const { profile, isKingAdmin, isGroupAdmin } = useAuth();
  const isAdmin = isKingAdmin || isGroupAdmin;

  const [todayService, setTodayService] = useState<any>(null);
  const [checkedInList, setCheckedInList] = useState<any[]>([]);
  const [checkedInCount, setCheckedInCount] = useState(0);
  const [firstTimerCount, setFirstTimerCount] = useState(0);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [pastServices, setPastServices] = useState<any[]>([]);
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null);
  const [expandedAttendees, setExpandedAttendees] = useState<any[]>([]);

  // Create service dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [svcTitle, setSvcTitle] = useState("");
  const [svcType, setSvcType] = useState("Sunday Service");
  const [svcDate, setSvcDate] = useState<Date>(new Date());
  const [svcTime, setSvcTime] = useState("09:00");
  const [svcExpected, setSvcExpected] = useState("");
  const [svcOrgId, setSvcOrgId] = useState("");
  const [creating, setCreating] = useState(false);

  // Manual add dialog
  const [manualOpen, setManualOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberResults, setMemberResults] = useState<any[]>([]);

  // History filters
  const [filterType, setFilterType] = useState("all");

  const today = new Date().toISOString().split("T")[0];
  const [isUpcoming, setIsUpcoming] = useState(false);

  const fetchTodayService = useCallback(async () => {
    // First try today
    const { data } = await supabase.from("services").select("*").eq("service_date", today).order("created_at", { ascending: false }).limit(1);
    if (data && data.length > 0) {
      setTodayService(data[0]);
      setIsUpcoming(false);
      return data[0];
    }
    // If no today service, look ahead 7 days
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split("T")[0];
    const { data: upcoming } = await supabase.from("services").select("*").gt("service_date", today).lte("service_date", nextWeekStr).order("service_date", { ascending: true }).limit(1);
    if (upcoming && upcoming.length > 0) {
      setTodayService(upcoming[0]);
      setIsUpcoming(true);
      return upcoming[0];
    }
    setTodayService(null);
    setIsUpcoming(false);
    return null;
  }, [today]);

  const fetchCheckedIn = useCallback(async (serviceId: string) => {
    const { data, count } = await supabase
      .from("service_attendance")
      .select("*, members:member_id(full_name, status)", { count: "exact" })
      .eq("service_id", serviceId)
      .order("scanned_at", { ascending: false });
    setCheckedInList(data || []);
    setCheckedInCount(count || 0);
    const ft = (data || []).filter(r => r.is_first_timer).length;
    setFirstTimerCount(ft);
  }, []);

  const fetchOrgs = useCallback(async () => {
    const { data } = await supabase.from("organizations").select("id, name");
    setOrganizations(data || []);
    if (data && data.length > 0 && !svcOrgId) {
      const match = data.find(o => o.id === profile?.organization_id);
      setSvcOrgId(match?.id || data[0].id);
    }
  }, [profile?.organization_id, svcOrgId]);

  const fetchHistory = useCallback(async () => {
    let q = supabase.from("services").select("*").order("service_date", { ascending: false }).limit(50);
    if (filterType !== "all") q = q.eq("service_type", filterType);
    const { data } = await q;
    setPastServices((data || []).filter(s => s.service_date !== today));
  }, [filterType, today]);

  useEffect(() => {
    fetchTodayService().then(svc => { if (svc) fetchCheckedIn(svc.id); });
    fetchOrgs();
    fetchHistory();
  }, []);

  // Polling for live count
  useEffect(() => {
    if (!todayService?.qr_active) return;
    const interval = setInterval(() => fetchCheckedIn(todayService.id), 5000);
    return () => clearInterval(interval);
  }, [todayService?.qr_active, todayService?.id, fetchCheckedIn]);

  const handleCreateService = async () => {
    if (!svcTitle || !svcOrgId) { toast.error("Fill in title and organization"); return; }
    setCreating(true);
    const dateStr = format(svcDate, "yyyy-MM-dd");
    const validFrom = new Date(`${dateStr}T06:00:00Z`).toISOString();
    const validUntil = new Date(`${dateStr}T23:59:59Z`).toISOString();
    const { error } = await supabase.from("services").insert({
      title: svcTitle,
      service_name: svcTitle,
      service_type: svcType,
      service_date: dateStr,
      service_time: svcTime,
      expected_attendance: svcExpected ? parseInt(svcExpected) : null,
      organization_id: svcOrgId,
      valid_from: validFrom,
      valid_until: validUntil,
    });
    setCreating(false);
    if (error) { toast.error("Failed to create service"); return; }
    toast.success("Service created!");
    setCreateOpen(false);
    const svc = await fetchTodayService();
    if (svc) fetchCheckedIn(svc.id);
    fetchHistory();
  };

  const openQR = async () => {
    if (!todayService) return;
    await supabase.from("services").update({ qr_active: true, qr_opened_at: new Date().toISOString() }).eq("id", todayService.id);
    toast.success("QR Check-In opened!");
    fetchTodayService();
  };

  const closeQR = async () => {
    if (!todayService) return;
    await supabase.from("services").update({ qr_active: false, qr_closed_at: new Date().toISOString(), actual_attendance: checkedInCount }).eq("id", todayService.id);
    toast.success("Check-In closed");
    fetchTodayService();
    fetchHistory();
  };

  const searchMembers = async (term: string) => {
    setMemberSearch(term);
    if (term.length < 2) { setMemberResults([]); return; }
    const { data } = await supabase.from("members").select("id, full_name, status, phone_number").ilike("full_name", `%${term}%`).limit(10);
    setMemberResults(data || []);
  };

  const addManually = async (member: any) => {
    if (!todayService) return;
    const { error } = await supabase.from("service_attendance").insert({
      service_id: todayService.id,
      member_id: member.id,
      scan_method: "manual",
      is_first_timer: member.status === "First Timer",
      is_manual_override: true,
    });
    if (error?.code === "23505") { toast.info(`${member.full_name} already checked in`); return; }
    if (error) { toast.error("Failed to add"); return; }
    toast.success(`${member.full_name} added!`);
    fetchCheckedIn(todayService.id);
    setManualOpen(false);
    setMemberSearch("");
    setMemberResults([]);
  };

  const toggleExpand = async (serviceId: string) => {
    if (expandedServiceId === serviceId) { setExpandedServiceId(null); return; }
    setExpandedServiceId(serviceId);
    const { data } = await supabase.from("service_attendance").select("*, members:member_id(full_name, status)").eq("service_id", serviceId).order("scanned_at", { ascending: false });
    setExpandedAttendees(data || []);
  };

  const attendanceRate = todayService?.expected_attendance ? Math.round((checkedInCount / todayService.expected_attendance) * 100) : 0;
  const qrUrl = todayService ? `https://cebz1retention.site/attend?token=${todayService.qr_code}` : "";

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-display font-extrabold text-foreground">Attendance & QR</h2>

      {/* SECTION 1: Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center">
          <Church className="h-5 w-5 mx-auto text-primary mb-1" />
          <p className="text-xs text-muted-foreground">Today's Service</p>
         <p className="text-sm font-bold text-foreground truncate">
           {todayService ? (isUpcoming ? `📅 ${todayService.title || todayService.service_name} (${todayService.service_date})` : (todayService.title || todayService.service_name)) : "No service today"}
         </p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <Users className="h-5 w-5 mx-auto text-primary mb-1" />
          <p className="text-xs text-muted-foreground">Checked In</p>
          <p className="text-2xl font-bold text-foreground">{checkedInCount}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <UserPlus className="h-5 w-5 mx-auto text-success mb-1" />
          <p className="text-xs text-muted-foreground">First Timers</p>
          <p className="text-2xl font-bold text-foreground">{firstTimerCount}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <TrendingUp className="h-5 w-5 mx-auto text-accent mb-1" />
          <p className="text-xs text-muted-foreground">Rate</p>
          <p className="text-2xl font-bold text-foreground">{attendanceRate}%</p>
        </CardContent></Card>
      </div>

      {/* SECTION 2: Create Service */}
      {isAdmin && !todayService && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>⛪ Today's Service</CardTitle>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button>Create Service</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Create New Service</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <Input placeholder="Service Title" value={svcTitle} onChange={e => setSvcTitle(e.target.value)} />
                  <Select value={svcType} onValueChange={setSvcType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SERVICE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left", !svcDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {svcDate ? format(svcDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={svcDate} onSelect={d => d && setSvcDate(d)} className="p-3 pointer-events-auto" /></PopoverContent>
                  </Popover>
                  <Input type="time" value={svcTime} onChange={e => setSvcTime(e.target.value)} />
                  <Input type="number" placeholder="Expected Attendance" value={svcExpected} onChange={e => setSvcExpected(e.target.value)} />
                  <Select value={svcOrgId} onValueChange={setSvcOrgId}>
                    <SelectTrigger><SelectValue placeholder="Organization" /></SelectTrigger>
                    <SelectContent>
                      {organizations.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleCreateService} disabled={creating} className="w-full">{creating ? "Creating..." : "Create Service"}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent><p className="text-muted-foreground">No service created for today yet.</p></CardContent>
        </Card>
      )}

      {/* SECTION 3: QR Panel */}
      {todayService && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              {todayService.title || todayService.service_name} — {todayService.service_date}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!todayService.qr_active ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">QR Check-In is not active yet</p>
                {isAdmin && (
                  <Button onClick={openQR} className="bg-success hover:bg-success/90 text-success-foreground h-12 px-8 text-base">
                    📱 Open QR Check-In
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-white p-4 rounded-2xl">
                    <QRCodeSVG value={qrUrl} size={220} />
                  </div>
                  <p className="text-sm text-muted-foreground break-all text-center max-w-xs">{qrUrl}</p>
                  <Badge variant="secondary" className="text-lg px-4 py-1">{checkedInCount} members checked in</Badge>
                </div>

                {/* Checked-in list */}
                <div className="max-h-60 overflow-y-auto space-y-1 rounded-xl bg-secondary/30 p-2">
                  {checkedInList.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No check-ins yet</p>
                  ) : checkedInList.map(r => (
                    <div key={r.id} className="flex items-center justify-between p-2 rounded-lg bg-card">
                      <span className="text-sm font-medium text-foreground">{r.members?.full_name || "Unknown"}</span>
                      {r.is_first_timer && <Badge className="bg-amber-500/20 text-amber-400 text-xs">First Timer 🆕</Badge>}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 flex-wrap">
                  {isAdmin && (
                    <Button variant="destructive" onClick={closeQR}>🔒 Close Check-In</Button>
                  )}
                  <Dialog open={manualOpen} onOpenChange={setManualOpen}>
                    <DialogTrigger asChild>
                      <Button variant="secondary">➕ Add Manually</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Add Member Manually</DialogTitle></DialogHeader>
                      <div className="space-y-3">
                        <div className="relative">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="Search by name..." className="pl-9" value={memberSearch} onChange={e => searchMembers(e.target.value)} />
                        </div>
                        <div className="max-h-60 overflow-y-auto space-y-1">
                          {memberResults.map(m => (
                            <button key={m.id} onClick={() => addManually(m)} className="w-full flex items-center justify-between p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-left">
                              <div>
                                <p className="text-sm font-medium text-foreground">{m.full_name}</p>
                                <p className="text-xs text-muted-foreground">{m.phone_number || "No phone"}</p>
                              </div>
                              {m.status === "First Timer" && <Badge className="text-xs">FT</Badge>}
                            </button>
                          ))}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* SECTION 4: History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Attendance History</CardTitle>
          <Select value={filterType} onValueChange={v => { setFilterType(v); }}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {SERVICE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {pastServices.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">No past services found</p>
          ) : (
            <div className="space-y-2">
              {pastServices.map(svc => {
                const rate = svc.expected_attendance ? Math.round(((svc.actual_attendance || 0) / svc.expected_attendance) * 100) : 0;
                const isExpanded = expandedServiceId === svc.id;
                return (
                  <div key={svc.id}>
                    <button onClick={() => toggleExpand(svc.id)} className="w-full flex items-center justify-between p-3 rounded-xl bg-secondary/40 hover:bg-secondary/60 transition-colors text-left">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{svc.title || svc.service_name || svc.service_type}</p>
                          <p className="text-xs text-muted-foreground">{svc.service_date}</p>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">{svc.service_type}</Badge>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm text-foreground font-medium">{svc.actual_attendance || 0}/{svc.expected_attendance || "?"}</span>
                        <span className="text-xs text-muted-foreground">{rate}%</span>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="ml-4 mt-1 space-y-1 max-h-40 overflow-y-auto">
                        {expandedAttendees.length === 0 ? (
                          <p className="text-xs text-muted-foreground py-2">No attendees</p>
                        ) : expandedAttendees.map(a => (
                          <div key={a.id} className="flex items-center gap-2 p-2 text-sm">
                            <span className="text-foreground">{a.members?.full_name || "Unknown"}</span>
                            {a.is_first_timer && <Badge className="text-[10px] bg-amber-500/20 text-amber-400">FT 🆕</Badge>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
