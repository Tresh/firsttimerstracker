import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Search, UserPlus, FileSpreadsheet, Phone, MessageCircle, MapPin, CheckCircle2, ChevronRight, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const WEEK_TASKS = [
  { week: 1, tasks: ["Welcome Call", "WhatsApp Welcome", "Cell Group Invitation"] },
  { week: 2, tasks: ["Follow-Up Call", "Cell Meeting Attendance Check"] },
  { week: 3, tasks: ["Foundation School Registration", "Personal Visit"] },
  { week: 4, tasks: ["Baptism Counseling", "Water Baptism"] },
  { week: 5, tasks: ["Department Integration", "Spiritual Gift Assessment"] },
  { week: 6, tasks: ["Membership Confirmation", "Certificate Presentation"] },
];

const STATUS_PIPELINE = ["First Timer", "Second Timer", "New Convert", "Member", "Worker"] as const;

const statusColors: Record<string, string> = {
  "First Timer": "badge-gold",
  "Second Timer": "badge-primary",
  "New Convert": "bg-purple-500/15 text-purple-400 border border-purple-500/30",
  "Member": "bg-success/15 text-success border border-success/30",
  "Worker": "bg-info/15 text-info border border-info/30",
};

const PREFIXES = ["Brother", "Sister", "Pastor", "Deacon", "Deaconess", "Evang", "Dr", "Prof"];
const AGE_RANGES = ["Under 18", "18-25", "26-35", "36-45", "46+"];
const SERVICE_TYPES = ["Sunday Service", "Midweek Service", "Special Program", "Cell Meeting"] as const;

const COMPLETENESS_FIELDS = [
  "full_name", "phone_number", "email", "gender", "age_range",
  "location", "organization_id", "assigned_cell_group", "kingschat_name", "emp_display_name",
];

function getCompleteness(m: any): number {
  const filled = COMPLETENESS_FIELDS.filter(f => m[f] && m[f] !== "").length;
  return Math.round((filled / COMPLETENESS_FIELDS.length) * 100);
}

export default function FirstTimers() {
  const { profile, isKingAdmin, isGroupAdmin, organizationId } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [followUpTasks, setFollowUpTasks] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);

  // Org dropdowns for admins
  const [groups, setGroups] = useState<any[]>([]);
  const [churches, setChurches] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");

  // Invited-by search
  const [invitedBySearch, setInvitedBySearch] = useState("");
  const [invitedByResults, setInvitedByResults] = useState<any[]>([]);
  const [invitedByLinked, setInvitedByLinked] = useState(false);

  const defaultForm = {
    prefix: "" as string,
    full_name: "",
    phone_number: "",
    email: "",
    gender: "",
    age_range: "",
    address: "",
    location: "",
    date_of_first_visit: new Date().toISOString().split("T")[0],
    service_attended: "Sunday Service" as typeof SERVICE_TYPES[number],
    organization_id: "" as string,
    invited_by: null as string | null,
    invited_by_name: "",
    kingschat_name: "",
    kingschat_phone: "",
    emp_display_name: "",
  };

  const [formData, setFormData] = useState(defaultForm);

  const fetchData = useCallback(async () => {
    let membersQuery = supabase.from("members").select("*, organizations(name)").in("status", ["First Timer", "Second Timer", "New Convert"]).order("date_of_first_visit", { ascending: false });
    if (!isKingAdmin && !isGroupAdmin && organizationId) {
      membersQuery = membersQuery.eq("organization_id", organizationId);
    }
    const [membersRes, tasksRes] = await Promise.all([
      membersQuery,
      supabase.from("follow_up_tasks").select("*"),
    ]);
    setMembers(membersRes.data || []);
    setFollowUpTasks(tasksRes.data || []);
  }, [isKingAdmin, isGroupAdmin, organizationId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Load groups for admins
  useEffect(() => {
    if (isKingAdmin || isGroupAdmin) {
      supabase.from("organizations").select("id, name").eq("level", "group").then(({ data }) => setGroups(data || []));
    }
  }, [isKingAdmin, isGroupAdmin]);

  // Load churches when group selected
  useEffect(() => {
    if (selectedGroupId) {
      supabase.from("organizations").select("id, name").eq("level", "church").eq("parent_id", selectedGroupId).then(({ data }) => setChurches(data || []));
    } else {
      setChurches([]);
    }
  }, [selectedGroupId]);

  // Invited-by search
  useEffect(() => {
    if (invitedBySearch.length < 2) { setInvitedByResults([]); return; }
    const timer = setTimeout(async () => {
      const { data } = await supabase.from("members").select("id, prefix, full_name").ilike("full_name", `%${invitedBySearch}%`).limit(5);
      setInvitedByResults(data || []);
    }, 300);
    return () => clearTimeout(timer);
  }, [invitedBySearch]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim() || !formData.phone_number.trim()) {
      toast.error("Full name and phone number are required.");
      return;
    }

    const payload: any = {
      prefix: formData.prefix || null,
      full_name: formData.full_name.trim(),
      phone_number: formData.phone_number.trim(),
      email: formData.email || null,
      gender: formData.gender || null,
      age_range: formData.age_range || null,
      address: formData.address || null,
      location: formData.location || null,
      date_of_first_visit: formData.date_of_first_visit,
      service_attended: formData.service_attended,
      organization_id: (isKingAdmin || isGroupAdmin) ? (formData.organization_id || null) : (organizationId || null),
      invited_by: formData.invited_by || null,
      invited_by_name: formData.invited_by_name || null,
      kingschat_name: formData.kingschat_name || null,
      kingschat_phone: formData.kingschat_phone || null,
      emp_display_name: formData.emp_display_name || null,
      registered_by: profile?.id || null,
      status: "First Timer" as const,
    };

    // Check if phone already exists
    const { data: existing } = await supabase.from("members").select("id").eq("phone_number", payload.phone_number).limit(1);
    if (existing && existing.length > 0) {
      toast.error("This phone number is already registered.");
      return;
    }

    const { error } = await supabase.from("members").insert([payload]);
    if (error) { toast.error(error.message); return; }
    toast.success("First Timer registered!");
    setIsRegisterOpen(false);
    setFormData(defaultForm);
    setInvitedBySearch("");
    setInvitedByLinked(false);
    setSelectedGroupId("");
    fetchData();
  };

  const getWeekProgress = (memberId: string) => {
    return [1, 2, 3, 4, 5, 6].map(w => {
      const task = followUpTasks.find(t => t.member_id === memberId && t.week_number === w);
      return task?.completed || false;
    });
  };

  const updateStatus = async (memberId: string, newStatus: string) => {
    const { error } = await supabase.from("members").update({ status: newStatus }).eq("id", memberId);
    if (error) { toast.error(error.message); return; }
    toast.success(`Status updated to ${newStatus}`);
    setSelectedMember((prev: any) => prev ? { ...prev, status: newStatus } : null);
    setShowStatusUpdate(false);
    fetchData();
  };

  const filtered = members.filter(m =>
    m.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || m.phone_number?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-extrabold text-foreground">First Timers</h2>
          <p className="text-muted-foreground mt-1">{filtered.length} visitors in pipeline</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={isRegisterOpen} onOpenChange={(open) => { setIsRegisterOpen(open); if (!open) { setFormData(defaultForm); setInvitedBySearch(""); setInvitedByLinked(false); setSelectedGroupId(""); } }}>
            <DialogTrigger asChild>
              <Button className="gap-2"><UserPlus className="h-4 w-4" />Register</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-[rgba(255,255,255,0.07)]">
              <DialogHeader><DialogTitle className="font-display text-xl">Register First Timer</DialogTitle></DialogHeader>
              <form onSubmit={handleRegister} className="space-y-6 mt-4">
                {/* Section 1 — Identity */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Identity</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Prefix</Label>
                      <Select value={formData.prefix} onValueChange={v => setFormData({ ...formData, prefix: v })}>
                        <SelectTrigger className="h-11"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{PREFIXES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>Full Name *</Label><Input required value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} className="h-11" /></div>
                    <div className="space-y-2"><Label>Phone Number *</Label><Input required value={formData.phone_number} onChange={e => setFormData({ ...formData, phone_number: e.target.value })} className="h-11" /></div>
                    <div className="space-y-2"><Label>Email</Label><Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="h-11" /></div>
                    <div className="space-y-2">
                      <Label>Gender</Label>
                      <Select value={formData.gender} onValueChange={v => setFormData({ ...formData, gender: v })}>
                        <SelectTrigger className="h-11"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Age Range</Label>
                      <Select value={formData.age_range} onValueChange={v => setFormData({ ...formData, age_range: v })}>
                        <SelectTrigger className="h-11"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{AGE_RANGES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-full space-y-2"><Label>Address</Label><Input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="h-11" /></div>
                    <div className="space-y-2"><Label>Location / Area</Label><Input value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="h-11" /></div>
                  </div>
                </div>

                {/* Section 2 — Church Placement */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Church Placement</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(isKingAdmin || isGroupAdmin) ? (
                      <>
                        <div className="space-y-2">
                          <Label>Group</Label>
                          <Select value={selectedGroupId} onValueChange={v => { setSelectedGroupId(v); setFormData({ ...formData, organization_id: "" }); }}>
                            <SelectTrigger className="h-11"><SelectValue placeholder="Select group" /></SelectTrigger>
                            <SelectContent>{groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Church / Assembly</Label>
                          <Select value={formData.organization_id} onValueChange={v => setFormData({ ...formData, organization_id: v })} disabled={!selectedGroupId}>
                            <SelectTrigger className="h-11"><SelectValue placeholder={selectedGroupId ? "Select church" : "Select group first"} /></SelectTrigger>
                            <SelectContent>{churches.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      </>
                    ) : null}
                    <div className="space-y-2"><Label>Date of First Visit</Label><Input type="date" value={formData.date_of_first_visit} onChange={e => setFormData({ ...formData, date_of_first_visit: e.target.value })} className="h-11" /></div>
                    <div className="space-y-2">
                      <Label>Service Attended</Label>
                      <Select value={formData.service_attended} onValueChange={v => setFormData({ ...formData, service_attended: v as any })}>
                        <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                        <SelectContent>{SERVICE_TYPES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Section 3 — Invited By */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Invited By</h4>
                  <div className="space-y-2 relative">
                    <Label>Search existing member</Label>
                    <Input
                      placeholder="Type a name to search..."
                      value={invitedByLinked ? formData.invited_by_name : invitedBySearch}
                      onChange={e => {
                        setInvitedBySearch(e.target.value);
                        setInvitedByLinked(false);
                        setFormData({ ...formData, invited_by: null, invited_by_name: "" });
                      }}
                      className="h-11"
                    />
                    {invitedByResults.length > 0 && !invitedByLinked && (
                      <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {invitedByResults.map(r => (
                          <button
                            type="button"
                            key={r.id}
                            className="w-full text-left px-4 py-2.5 hover:bg-secondary/50 flex items-center gap-2 text-sm"
                            onClick={() => {
                              const displayName = [r.prefix, r.full_name].filter(Boolean).join(" ");
                              setFormData({ ...formData, invited_by: r.id, invited_by_name: displayName });
                              setInvitedByLinked(true);
                              setInvitedByResults([]);
                            }}
                          >
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{r.prefix ? `${r.prefix} ` : ""}{r.full_name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {invitedByLinked && (
                      <p className="text-xs text-success flex items-center gap-1 mt-1">
                        <CheckCircle2 className="h-3 w-3" /> Linked to member record
                      </p>
                    )}
                  </div>
                </div>

                {/* Section 4 — KingsChat */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">KingsChat</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>KingsChat Name</Label><Input value={formData.kingschat_name} onChange={e => setFormData({ ...formData, kingschat_name: e.target.value })} className="h-11" /></div>
                    <div className="space-y-2"><Label>KingsChat Phone</Label><Input value={formData.kingschat_phone} onChange={e => setFormData({ ...formData, kingschat_phone: e.target.value })} className="h-11" /></div>
                  </div>
                </div>

                {/* Section 5 — EMP */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Early Morning Prayer</h4>
                  <div className="space-y-2">
                    <Label>EMP Display Name</Label>
                    <Input value={formData.emp_display_name} onChange={e => setFormData({ ...formData, emp_display_name: e.target.value })} className="h-11" />
                    <p className="text-xs text-muted-foreground">Name they use on Free Conference app</p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsRegisterOpen(false)}>Cancel</Button>
                  <Button type="submit">Register</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Button variant="outline" className="gap-2" onClick={() => toast.info("Excel import coming soon!")}><FileSpreadsheet className="h-4 w-4 text-success" />Import</Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by name or phone..." className="pl-9 h-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card><CardContent className="p-12 text-center text-muted-foreground"><UserPlus className="h-12 w-12 mx-auto mb-4 opacity-20" /><p>No first timers found.</p></CardContent></Card>
        ) : filtered.map((m) => {
          const progress = getWeekProgress(m.id);
          const done = progress.filter(Boolean).length;
          const completeness = getCompleteness(m);
          const churchName = m.organizations?.name;
          return (
            <Card key={m.id} className="cursor-pointer" onClick={() => { setSelectedMember(m); setShowStatusUpdate(false); }}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm flex-shrink-0">{m.full_name?.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-foreground">{m.prefix ? `${m.prefix} ` : ""}{m.full_name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[m.status] || "badge-primary"}`}>{m.status}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{m.phone_number || "—"} • {new Date(m.date_of_first_visit).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}{churchName ? ` • ${churchName}` : ""}</p>
                  </div>
                </div>

                {/* 6-week progress */}
                <div className="space-y-1 mb-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>6-Week Follow-Up</span>
                    <span className="font-medium text-primary">{done}/6 weeks</span>
                  </div>
                  <div className="h-1.5 rounded-full progress-bar-track overflow-hidden">
                    <div className="h-full rounded-full progress-bar-fill" style={{ width: `${(done / 6) * 100}%` }} />
                  </div>
                </div>

                {/* Completeness */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Profile Completeness</span>
                    <span className={`font-medium ${completeness >= 80 ? "text-success" : completeness >= 50 ? "text-warning" : "text-destructive"}`}>{completeness}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className={`h-full rounded-full ${completeness >= 80 ? "bg-success" : completeness >= 50 ? "bg-warning" : "bg-destructive"}`} style={{ width: `${completeness}%` }} />
                  </div>
                </div>

                {m.location && <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1"><MapPin className="h-3 w-3" />{m.location}</p>}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Profile Modal */}
      <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-[rgba(255,255,255,0.07)]">
          {selectedMember && (
            <div className="space-y-5">
              <DialogHeader><DialogTitle className="font-display text-xl">Member Profile</DialogTitle></DialogHeader>

              {/* Avatar + name */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-2xl">{selectedMember.full_name?.charAt(0)}</div>
                <div>
                  <h3 className="text-xl font-display font-bold text-foreground">{selectedMember.prefix ? `${selectedMember.prefix} ` : ""}{selectedMember.full_name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[selectedMember.status] || "badge-primary"}`}>{selectedMember.status}</span>
                  <p className="text-sm text-muted-foreground mt-1">{selectedMember.phone_number}</p>
                </div>
              </div>

              {/* Status Pipeline */}
              <div className="bg-secondary/30 rounded-xl p-4 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-foreground">Status Pipeline</h4>
                  <Button size="sm" variant="outline" onClick={() => setShowStatusUpdate(!showStatusUpdate)}>
                    {showStatusUpdate ? "Cancel" : "Update Status"}
                  </Button>
                </div>
                <div className="flex items-center gap-1 overflow-x-auto pb-1">
                  {STATUS_PIPELINE.map((s, i) => {
                    const isCurrent = selectedMember.status === s;
                    const isPast = STATUS_PIPELINE.indexOf(selectedMember.status) > i;
                    return (
                      <div key={s} className="flex items-center">
                        <div className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                          isCurrent ? "gradient-primary text-primary-foreground border-primary" :
                          isPast ? "bg-success/15 text-success border-success/30" :
                          "bg-secondary text-muted-foreground border-border"
                        }`}>{s}</div>
                        {i < STATUS_PIPELINE.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground mx-0.5 flex-shrink-0" />}
                      </div>
                    );
                  })}
                </div>
                {showStatusUpdate && (
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border">
                    {STATUS_PIPELINE.filter(s => s !== selectedMember.status).map(s => (
                      <Button key={s} size="sm" variant="outline" onClick={() => updateStatus(selectedMember.id, s)}>{s}</Button>
                    ))}
                  </div>
                )}
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ["📅 First Visit", selectedMember.date_of_first_visit],
                  ["⛪ Service", selectedMember.service_attended],
                  ["📍 Location", selectedMember.location],
                  ["👤 Invited By", selectedMember.invited_by_name],
                  ["🎂 Age", selectedMember.age_range],
                  ["📧 Email", selectedMember.email],
                  ["🚻 Gender", selectedMember.gender],
                  ["💬 KingsChat", selectedMember.kingschat_name],
                  ["📱 KC Phone", selectedMember.kingschat_phone],
                  ["🙏 EMP Name", selectedMember.emp_display_name],
                  ["🏛 Church", selectedMember.organizations?.name],
                  ["📋 Address", selectedMember.address],
                ].map(([k, v]) => (
                  <div key={k as string} className="bg-secondary rounded-xl p-3">
                    <p className="text-xs text-muted-foreground">{k}</p>
                    <p className="font-medium text-foreground">{(v as string) || "—"}</p>
                  </div>
                ))}
              </div>

              {/* 6-Week Follow-Up */}
              <div className="bg-primary/5 border border-primary/10 rounded-xl p-4">
                <h4 className="font-display font-bold text-foreground mb-3">6-Week Follow-Up Progress</h4>
                {WEEK_TASKS.map((wk, wi) => {
                  const progress = getWeekProgress(selectedMember.id);
                  const done = progress[wi];
                  const weekTasks = followUpTasks.filter(t => t.member_id === selectedMember.id && t.week_number === wi + 1);
                  return (
                    <div key={wi} className="mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${done ? "bg-success text-success-foreground" : "bg-secondary text-muted-foreground"}`}>{wi + 1}</span>
                        <span className="text-sm font-medium text-foreground">Week {wi + 1}</span>
                        {done && <span className="text-success text-xs font-semibold">✓ Complete</span>}
                      </div>
                      <div className="ml-8 space-y-1">
                        {wk.tasks.map((t, ti) => {
                          const taskRecord = weekTasks.find(wt => wt.action_name === t);
                          return (
                            <div key={ti} className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className={taskRecord?.completed ? "text-success" : "text-muted-foreground/30"}>●</span>
                              {t}
                              {taskRecord?.completed_at && <span className="text-muted-foreground/50 ml-auto">{new Date(taskRecord.completed_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <a href={`tel:${selectedMember.phone_number}`} className="flex-1">
                  <Button variant="outline" className="w-full gap-2"><Phone className="h-4 w-4" />Call</Button>
                </a>
                <a href={`https://wa.me/${encodeURIComponent((selectedMember.phone_number || "").replace(/^0/, "234"))}`} target="_blank" rel="noreferrer" className="flex-1">
                  <Button variant="outline" className="w-full gap-2 text-success border-success/30 hover:bg-success/10"><MessageCircle className="h-4 w-4" />WhatsApp</Button>
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
