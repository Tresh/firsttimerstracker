import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Phone, Users, CheckCircle2, Clock, AlertTriangle,
  Plus, MoreVertical, ChevronRight, CalendarIcon, X,
  MessageCircle, ArrowRight, ArrowLeft, Search
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { format, isToday, isYesterday, startOfDay, startOfWeek } from "date-fns";

// ─── TYPES ──────────────────────────────────────────────────────────────────

const CAMPAIGN_TYPE_MAP: Record<string, { emoji: string; label: string }> = {
  program_event: { emoji: "🎉", label: "Program/Event Reminder" },
  portal_login: { emoji: "💻", label: "Portal Login Reminder" },
  service_attendance: { emoji: "⛪", label: "Service Attendance" },
  prayer_meeting: { emoji: "🙏", label: "Prayer Meeting Reminder" },
  custom: { emoji: "📋", label: "Custom Campaign" },
  emergency: { emoji: "🚨", label: "Emergency Announcement" },
};

const PRIORITY_MAP: Record<string, { emoji: string; color: string }> = {
  emergency: { emoji: "🔴", color: "bg-destructive/20 text-destructive" },
  high: { emoji: "🟠", color: "bg-warning/20 text-warning" },
  normal: { emoji: "🔵", color: "bg-primary/20 text-primary" },
};

const STATUS_MAP: Record<string, string> = {
  draft: "bg-secondary text-muted-foreground",
  active: "bg-[hsl(var(--success)/0.2)] text-[hsl(var(--success))]",
  paused: "bg-warning/20 text-warning",
  completed: "bg-primary/20 text-primary",
};

function formatCallTime(ts: string) {
  const d = new Date(ts);
  if (isToday(d)) return `Today ${format(d, "h:mm a")}`;
  if (isYesterday(d)) return `Yesterday ${format(d, "h:mm a")}`;
  return format(d, "MMM d, h:mm a");
}

function outcomeBadge(outcome: string | null) {
  if (!outcome) return <Badge className="bg-primary/20 text-primary border-0 text-xs">⏳ Pending</Badge>;
  if (outcome === "answered") return <Badge className="bg-[hsl(var(--success)/0.2)] text-[hsl(var(--success))] border-0 text-xs">✅ Answered</Badge>;
  if (outcome === "no_answer") return <Badge className="bg-warning/20 text-warning border-0 text-xs">📵 No Answer</Badge>;
  if (outcome === "busy") return <Badge className="bg-destructive/20 text-destructive border-0 text-xs">🔴 Busy</Badge>;
  if (outcome === "callback") return <Badge className="bg-primary/20 text-primary border-0 text-xs">🔄 Callback</Badge>;
  if (outcome === "wrong_number") return <Badge className="bg-destructive/20 text-destructive border-0 text-xs">❌ Wrong #</Badge>;
  return <Badge className="bg-secondary text-muted-foreground border-0 text-xs">🔄 Will Retry</Badge>;
}

// ─── ADMIN VIEW ─────────────────────────────────────────────────────────────

function AdminCallCenter() {
  const { profile, role, organizationId } = useAuth();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [callLogs, setCallLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [reportCampaign, setReportCampaign] = useState<any>(null);

  const fetchData = useCallback(async () => {
    const [camRes, assRes, logRes] = await Promise.all([
      supabase.from("call_campaigns").select("*, organizations(name)").order("created_at", { ascending: false }),
      supabase.from("campaign_assignments").select("*"),
      supabase.from("campaign_call_logs").select("*, members(full_name), profiles:rep_id(full_name)").order("call_start", { ascending: false }).limit(500),
    ]);
    let filteredCampaigns = camRes.data || [];
    if (role !== "king_admin" && role !== "admin" && organizationId) {
      filteredCampaigns = filteredCampaigns.filter((c: any) => !c.organization_id || c.organization_id === organizationId);
    }
    setCampaigns(filteredCampaigns);
    setAssignments(assRes.data || []);
    setCallLogs(logRes.data || []);
    setLoading(false);
  }, [role, organizationId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });

  const activeCampaigns = campaigns.filter(c => c.status === "active").length;
  const todayCalls = callLogs.filter(l => l.call_start && new Date(l.call_start) >= todayStart).length;
  const weekCalls = callLogs.filter(l => l.call_start && new Date(l.call_start) >= weekStart);
  const weekAnswered = weekCalls.filter(l => l.outcome === "answered").length;
  const answerRate = weekCalls.length > 0 ? Math.round((weekAnswered / weekCalls.length) * 100) : 0;
  const todayReps = new Set(callLogs.filter(l => l.call_start && new Date(l.call_start) >= todayStart).map(l => l.rep_id)).size;

  const getCampaignStats = (campaignId: string) => {
    const ca = assignments.filter(a => a.campaign_id === campaignId);
    const called = ca.filter(a => a.status !== "pending").length;
    const cl = callLogs.filter(l => l.campaign_id === campaignId);
    const answered = cl.filter(l => l.outcome === "answered").length;
    return { total: ca.length, called, answered, rate: cl.length > 0 ? Math.round((answered / cl.length) * 100) : 0 };
  };

  const handleStatusChange = async (campaignId: string, newStatus: string) => {
    await supabase.from("call_campaigns").update({ status: newStatus, updated_at: new Date().toISOString() }).eq("id", campaignId);
    toast.success(`Campaign ${newStatus}`);
    fetchData();
  };

  const handleDelete = async (campaignId: string) => {
    await supabase.from("call_campaigns").delete().eq("id", campaignId);
    toast.success("Campaign deleted");
    fetchData();
  };

  if (loading) return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-extrabold text-foreground">📞 Call Center</h1>
          <p className="text-muted-foreground mt-1">Campaign management & oversight</p>
        </div>
        <Button onClick={() => setShowNewDialog(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Campaign
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Active Campaigns", value: activeCampaigns, icon: Phone, color: "text-primary" },
          { label: "Calls Today", value: todayCalls, icon: CheckCircle2, color: "text-[hsl(var(--success))]" },
          { label: "Answer Rate", value: `${answerRate}%`, icon: AlertTriangle, color: "text-warning" },
          { label: "Reps On Duty", value: todayReps, icon: Users, color: "text-primary" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Campaign list */}
      <div className="space-y-3">
        <h2 className="text-xl font-display font-bold text-foreground">Campaigns</h2>
        {campaigns.length === 0 ? (
          <Card><CardContent className="p-12 text-center text-muted-foreground">
            <Phone className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg">No campaigns yet. Create your first one!</p>
          </CardContent></Card>
        ) : campaigns.map(c => {
          const type = CAMPAIGN_TYPE_MAP[c.campaign_type] || { emoji: "📋", label: c.campaign_type };
          const priority = PRIORITY_MAP[c.priority] || PRIORITY_MAP.normal;
          const statusClass = STATUS_MAP[c.status] || STATUS_MAP.draft;
          const stats = getCampaignStats(c.id);
          const pct = stats.total > 0 ? Math.round((stats.called / stats.total) * 100) : 0;

          return (
            <Card key={c.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{type.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={`${priority.color} border-0 text-xs`}>{priority.emoji} {c.priority}</Badge>
                      <Badge className={`${statusClass} border-0 text-xs capitalize`}>{c.status}</Badge>
                    </div>
                    <p className="font-bold text-foreground text-lg mt-1">{c.title}</p>
                    <p className="text-sm text-muted-foreground">{type.label}</p>
                    <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                      <span>Target: {c.target_type === "all_members" ? "All Members" : c.target_type === "first_timers" ? "First Timers" : "Custom List"}</span>
                      <span>·</span>
                      <span>Scope: {(c as any).organizations?.name || "Zone-Wide"}</span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="shrink-0"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {c.status === "draft" && <DropdownMenuItem onClick={() => handleStatusChange(c.id, "active")}>▶ Activate</DropdownMenuItem>}
                      {c.status === "active" && <DropdownMenuItem onClick={() => handleStatusChange(c.id, "paused")}>⏸ Pause</DropdownMenuItem>}
                      {c.status === "paused" && <DropdownMenuItem onClick={() => handleStatusChange(c.id, "active")}>▶ Resume</DropdownMenuItem>}
                      {(c.status === "active" || c.status === "paused") && <DropdownMenuItem onClick={() => handleStatusChange(c.id, "completed")}>✅ Complete</DropdownMenuItem>}
                      <DropdownMenuItem onClick={() => setReportCampaign(c)}>📊 View Report</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(c.id)}>🗑 Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {/* Progress */}
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>{stats.called} of {stats.total} called</span>
                    <span>{stats.rate}% answer rate</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                {c.start_date && (
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(c.start_date), "MMM d")} — {c.end_date ? format(new Date(c.end_date), "MMM d") : "Ongoing"}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* New Campaign Dialog */}
      <NewCampaignDialog
        open={showNewDialog}
        onClose={() => setShowNewDialog(false)}
        onCreated={() => { setShowNewDialog(false); fetchData(); }}
        profile={profile}
        role={role}
        organizationId={organizationId}
      />

      {/* Campaign Report */}
      {reportCampaign && (
        <CampaignReport
          campaign={reportCampaign}
          assignments={assignments.filter(a => a.campaign_id === reportCampaign.id)}
          callLogs={callLogs.filter(l => l.campaign_id === reportCampaign.id)}
          onClose={() => setReportCampaign(null)}
        />
      )}
    </div>
  );
}

// ─── NEW CAMPAIGN DIALOG ────────────────────────────────────────────────────

function NewCampaignDialog({
  open, onClose, onCreated, profile, role, organizationId,
}: {
  open: boolean; onClose: () => void; onCreated: () => void;
  profile: any; role: any; organizationId: string | null;
}) {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [campaignType, setCampaignType] = useState("custom");
  const [priority, setPriority] = useState("normal");
  const [objective, setObjective] = useState("");
  const [script, setScript] = useState("");
  const [scopeType, setScopeType] = useState<"zone" | "org">("zone");
  const [scopeOrgId, setScopeOrgId] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [targetType, setTargetType] = useState("all_members");
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [memberSearch, setMemberSearch] = useState("");
  const [reps, setReps] = useState<any[]>([]);
  const [selectedReps, setSelectedReps] = useState<Set<string>>(new Set());
  const [autoDistribute, setAutoDistribute] = useState(true);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep(1); setTitle(""); setCampaignType("custom"); setPriority("normal");
    setObjective(""); setScript(""); setScopeType("zone"); setScopeOrgId("");
    setStartDate(undefined); setEndDate(undefined); setTargetType("all_members");
    setSelectedMembers(new Set()); setSelectedReps(new Set()); setAutoDistribute(true);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const [mRes, oRes] = await Promise.all([
        supabase.from("members").select("id, full_name, phone_number, status, organization_id").order("full_name"),
        supabase.from("organizations").select("id, name, level"),
      ]);
      setMembers(mRes.data || []);
      setOrgs(oRes.data || []);

      // Fetch reps: cell_leader, follow_up_team
      const { data: rolesData } = await supabase.from("user_roles").select("user_id, role").in("role", ["cell_leader", "follow_up_team"]);
      if (rolesData && rolesData.length > 0) {
        const userIds = rolesData.map(r => r.user_id);
        const { data: repProfiles } = await supabase.from("profiles").select("id, user_id, full_name, organization_id").in("user_id", userIds);
        setReps(repProfiles || []);
      }
    })();
  }, [open]);

  const targetMembers = (() => {
    let list = members;
    if (scopeType === "org" && scopeOrgId) list = list.filter(m => m.organization_id === scopeOrgId);
    else if (role !== "king_admin" && role !== "admin" && organizationId) list = list.filter(m => m.organization_id === organizationId);

    if (targetType === "first_timers") list = list.filter(m => m.status === "First Timer");
    if (targetType === "custom") list = list.filter(m => selectedMembers.has(m.id));
    return list;
  })();

  const filteredForSearch = members.filter(m => {
    if (!memberSearch) return true;
    return m.full_name?.toLowerCase().includes(memberSearch.toLowerCase());
  });

  const repDistribution = (() => {
    const selReps = reps.filter(r => selectedReps.has(r.id));
    if (selReps.length === 0) return [];
    const perRep = Math.floor(targetMembers.length / selReps.length);
    const remainder = targetMembers.length % selReps.length;
    return selReps.map((r, i) => ({
      ...r,
      count: perRep + (i < remainder ? 1 : 0),
    }));
  })();

  const handleCreate = async () => {
    if (!title || !objective) { toast.error("Title and objective required"); return; }
    if (selectedReps.size === 0) { toast.error("Select at least one rep"); return; }
    if (targetMembers.length === 0) { toast.error("No target members"); return; }

    setCreating(true);
    try {
      const { data: campaign, error } = await supabase.from("call_campaigns").insert([{
        title,
        campaign_type: campaignType,
        objective,
        message_script: script || null,
        target_type: targetType,
        organization_id: scopeType === "org" && scopeOrgId ? scopeOrgId : organizationId,
        status: "draft",
        priority,
        start_date: startDate?.toISOString() || null,
        end_date: endDate?.toISOString() || null,
        created_by: profile?.id,
      }]).select("id").single();

      if (error || !campaign) throw error || new Error("Failed to create campaign");

      // Distribute members across reps
      const selReps = reps.filter(r => selectedReps.has(r.id));
      const assignmentRows = targetMembers.map((m, i) => ({
        campaign_id: campaign.id,
        member_id: m.id,
        rep_id: autoDistribute ? selReps[i % selReps.length].id : selReps[0].id,
        status: "pending",
        priority_order: i,
      }));

      await supabase.from("campaign_assignments").insert(assignmentRows);
      toast.success(`✅ Campaign created! ${targetMembers.length} members assigned across ${selReps.length} reps`);
      onCreated();
    } catch (err: any) {
      toast.error(err.message || "Failed to create campaign");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-display">
            {step === 1 && "📋 Campaign Details"}
            {step === 2 && "👥 Target Members"}
            {step === 3 && "🎯 Assign Reps"}
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label>Campaign Title *</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Sunday Service Reminder" />
            </div>
            <div>
              <Label>Campaign Type</Label>
              <Select value={campaignType} onValueChange={setCampaignType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CAMPAIGN_TYPE_MAP).map(([key, val]) => (
                    <SelectItem key={key} value={key}>{val.emoji} {val.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">🔵 Normal</SelectItem>
                  <SelectItem value="high">🟠 High</SelectItem>
                  <SelectItem value="emergency">🔴 Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Objective *</Label>
              <Textarea value={objective} onChange={e => setObjective(e.target.value)} placeholder="What should reps achieve on each call?" />
            </div>
            <div>
              <Label>Call Script</Label>
              <Textarea value={script} onChange={e => setScript(e.target.value)} placeholder="Exact words the rep should say..." className="min-h-[80px]" />
            </div>
            <div>
              <Label>Scope</Label>
              <Select value={scopeType} onValueChange={(v: "zone" | "org") => setScopeType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="zone">🌍 Zone-Wide</SelectItem>
                  <SelectItem value="org">⛪ Specific Church/Group</SelectItem>
                </SelectContent>
              </Select>
              {scopeType === "org" && (
                <Select value={scopeOrgId} onValueChange={setScopeOrgId}>
                  <SelectTrigger className="mt-2"><SelectValue placeholder="Select organization" /></SelectTrigger>
                  <SelectContent>
                    {orgs.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {startDate ? format(startDate, "PPP") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={startDate} onSelect={setStartDate} className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {endDate ? format(endDate, "PPP") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={endDate} onSelect={setEndDate} className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <Button className="w-full" onClick={() => setStep(2)}>Next: Target Members <ArrowRight className="h-4 w-4 ml-2" /></Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              {(["all_members", "first_timers", "custom"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTargetType(t)}
                  className={`w-full p-3 rounded-xl border text-left transition-colors ${targetType === t ? "border-primary bg-primary/10" : "border-border bg-secondary/30"}`}
                >
                  <p className="font-semibold text-foreground">
                    {t === "all_members" && "👥 All Members"}
                    {t === "first_timers" && "🆕 First Timers Only"}
                    {t === "custom" && "✏️ Custom Selection"}
                  </p>
                </button>
              ))}
            </div>

            {targetType === "custom" && (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={memberSearch} onChange={e => setMemberSearch(e.target.value)} placeholder="Search members..." className="pl-9" />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1 border border-border rounded-xl p-2">
                  {filteredForSearch.slice(0, 50).map(m => (
                    <label key={m.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/50 cursor-pointer">
                      <Checkbox
                        checked={selectedMembers.has(m.id)}
                        onCheckedChange={(checked) => {
                          const next = new Set(selectedMembers);
                          checked ? next.add(m.id) : next.delete(m.id);
                          setSelectedMembers(next);
                        }}
                      />
                      <span className="text-sm text-foreground">{m.full_name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{m.phone_number}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <p className="text-sm font-semibold text-primary">📊 {targetMembers.length} members will be called</p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
              <Button className="flex-1" onClick={() => setStep(3)}>Next: Assign Reps <ArrowRight className="h-4 w-4 ml-2" /></Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              {reps.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">No reps available. Assign cell leaders or follow-up team members first.</p>
              ) : reps.map(r => (
                <label key={r.id} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-secondary/50 cursor-pointer">
                  <Checkbox
                    checked={selectedReps.has(r.id)}
                    onCheckedChange={(checked) => {
                      const next = new Set(selectedReps);
                      checked ? next.add(r.id) : next.delete(r.id);
                      setSelectedReps(next);
                    }}
                  />
                  <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
                    {r.full_name?.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-foreground">{r.full_name}</span>
                </label>
              ))}
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
              <Switch checked={autoDistribute} onCheckedChange={setAutoDistribute} />
              <Label className="text-sm">Auto-distribute members evenly across reps</Label>
            </div>

            {selectedReps.size > 0 && autoDistribute && (
              <div className="space-y-1">
                {repDistribution.map(r => (
                  <p key={r.id} className="text-sm text-muted-foreground">
                    {r.full_name} → <span className="font-semibold text-foreground">{r.count} members</span>
                  </p>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)}><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
              <Button className="flex-1" onClick={handleCreate} disabled={creating}>
                {creating ? "Creating..." : "✅ Create Campaign"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── CAMPAIGN REPORT ────────────────────────────────────────────────────────

function CampaignReport({
  campaign, assignments, callLogs, onClose,
}: {
  campaign: any; assignments: any[]; callLogs: any[]; onClose: () => void;
}) {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const repIds = [...new Set(callLogs.map(l => l.rep_id).filter(Boolean))];
      const memberIds = [...new Set(assignments.map(a => a.member_id))];
      const [pRes, mRes] = await Promise.all([
        repIds.length > 0 ? supabase.from("profiles").select("id, full_name").in("id", repIds) : { data: [] },
        memberIds.length > 0 ? supabase.from("members").select("id, full_name").in("id", memberIds) : { data: [] },
      ]);
      setProfiles(pRes.data || []);
      setMembers(mRes.data || []);
    })();
  }, [callLogs, assignments]);

  const getName = (id: string, list: any[]) => list.find(x => x.id === id)?.full_name || "Unknown";
  const called = assignments.filter(a => a.status !== "pending").length;
  const answered = callLogs.filter(l => l.outcome === "answered").length;
  const noAnswer = callLogs.filter(l => l.outcome === "no_answer").length;
  const callback = callLogs.filter(l => l.outcome === "callback").length;
  const skipped = assignments.filter(a => a.status === "skipped").length;
  const rate = callLogs.length > 0 ? Math.round((answered / callLogs.length) * 100) : 0;

  // Rep performance
  const repIds = [...new Set(assignments.map(a => a.rep_id).filter(Boolean))];
  const repPerf = repIds.map(rid => {
    const repAssign = assignments.filter(a => a.rep_id === rid);
    const repLogs = callLogs.filter(l => l.rep_id === rid);
    const repAnswered = repLogs.filter(l => l.outcome === "answered").length;
    const lastLog = repLogs[0];
    return {
      id: rid,
      name: getName(rid, profiles),
      assigned: repAssign.length,
      called: repAssign.filter(a => a.status !== "pending").length,
      answered: repAnswered,
      rate: repLogs.length > 0 ? Math.round((repAnswered / repLogs.length) * 100) : 0,
      lastActive: lastLog?.call_start || null,
    };
  });

  const type = CAMPAIGN_TYPE_MAP[campaign.campaign_type] || { emoji: "📋", label: campaign.campaign_type };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-display flex items-center gap-2">
            {type.emoji} {campaign.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">{campaign.objective}</p>

          {/* Progress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-semibold">{called} / {assignments.length} called</span>
              <span className="text-2xl font-bold text-primary">{rate}%</span>
            </div>
            <div className="h-3 rounded-full bg-secondary overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${assignments.length > 0 ? (called / assignments.length) * 100 : 0}%` }} />
            </div>
          </div>

          {/* Outcome breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-3 rounded-xl bg-[hsl(var(--success)/0.1)] text-center">
              <p className="text-xl font-bold text-[hsl(var(--success))]">{answered}</p>
              <p className="text-xs text-muted-foreground">Answered</p>
            </div>
            <div className="p-3 rounded-xl bg-warning/10 text-center">
              <p className="text-xl font-bold text-warning">{noAnswer}</p>
              <p className="text-xs text-muted-foreground">No Answer</p>
            </div>
            <div className="p-3 rounded-xl bg-primary/10 text-center">
              <p className="text-xl font-bold text-primary">{callback}</p>
              <p className="text-xs text-muted-foreground">Callback</p>
            </div>
            <div className="p-3 rounded-xl bg-secondary text-center">
              <p className="text-xl font-bold text-muted-foreground">{skipped}</p>
              <p className="text-xs text-muted-foreground">Skipped</p>
            </div>
          </div>

          {/* Rep Performance */}
          <div>
            <h3 className="font-bold text-foreground mb-2">Rep Performance</h3>
            <div className="space-y-2">
              {repPerf.map(r => (
                <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 text-sm">
                  <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-xs shrink-0">{r.name.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.called}/{r.assigned} called · {r.answered} answered · {r.rate}%</p>
                  </div>
                  {r.lastActive && <span className="text-xs text-muted-foreground shrink-0">{formatCallTime(r.lastActive)}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Recent Call Logs */}
          <div>
            <h3 className="font-bold text-foreground mb-2">Recent Calls</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {callLogs.slice(0, 30).map(log => (
                <div key={log.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/20 text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{getName(log.member_id, members)}</p>
                    <p className="text-xs text-muted-foreground">
                      {getName(log.rep_id, profiles)} · {log.contact_method || "call"} · {log.duration_seconds || 0}s · {formatCallTime(log.call_start)}
                    </p>
                    {log.rep_note && <p className="text-xs text-muted-foreground italic">{log.rep_note}</p>}
                  </div>
                  {outcomeBadge(log.outcome)}
                </div>
              ))}
            </div>
          </div>

          <Button variant="outline" disabled className="w-full opacity-50">📥 Export Report (Coming Soon)</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── REP DIALLER VIEW ───────────────────────────────────────────────────────

type RepCallBanner = { logId: string; memberName: string; callStart: Date } | null;

function RepDiallerView() {
  const { profile } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [callBanner, setCallBanner] = useState<RepCallBanner>(null);

  const fetchData = useCallback(async () => {
    if (!profile?.id) return;
    // Get active campaign assignments for this rep
    const { data: assData } = await supabase
      .from("campaign_assignments")
      .select("*, members(id, full_name, phone_number), call_campaigns(id, title, objective, campaign_type, message_script)")
      .eq("rep_id", profile.id)
      .in("status", ["pending", "no_answer", "callback"])
      .order("priority_order");

    const items = assData || [];
    setAssignments(items);
    if (items.length > 0 && items[0].call_campaigns) {
      setCampaign(items[0].call_campaigns);
    }
    setLoading(false);
  }, [profile?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const completedToday = assignments.filter(a => a.status === "completed" || a.status === "called").length;
  const total = assignments.length + completedToday;
  const remaining = assignments.length;

  const handleCall = async (assignment: any) => {
    const member = assignment.members;
    if (!member?.phone_number || !profile?.id) {
      toast.error("No phone number");
      return;
    }

    const { data: logRow } = await supabase.from("campaign_call_logs").insert([{
      campaign_id: assignment.campaign_id || campaign?.id,
      assignment_id: assignment.id,
      rep_id: profile.id,
      member_id: member.id,
      phone_number: member.phone_number,
      contact_method: "call",
      call_start: new Date().toISOString(),
    }]).select("id").single();

    window.location.href = "tel:" + member.phone_number;

    if (logRow) {
      setCallBanner({ logId: logRow.id, memberName: member.full_name, callStart: new Date() });
    }
  };

  const handleOutcome = async (outcome: string) => {
    if (!callBanner || !profile?.id) return;
    const callEnd = new Date();
    const durationSeconds = Math.round((callEnd.getTime() - callBanner.callStart.getTime()) / 1000);

    await supabase.from("campaign_call_logs").update({
      outcome,
      call_end: callEnd.toISOString(),
      duration_seconds: durationSeconds,
    }).eq("id", callBanner.logId);

    // Update assignment status
    const assignmentStatus = outcome === "answered" ? "completed" : outcome === "no_answer" ? "no_answer" : outcome === "callback" ? "callback" : "skipped";
    // Find the assignment matching this call log
    const { data: logData } = await supabase.from("campaign_call_logs").select("assignment_id").eq("id", callBanner.logId).single();
    if (logData?.assignment_id) {
      await supabase.from("campaign_assignments").update({ status: assignmentStatus }).eq("id", logData.assignment_id);
    }

    if (durationSeconds < 30 && outcome === "answered") {
      toast("⚡ Quick call detected — marked as answered", { duration: 3000 });
    } else {
      toast.success("Call logged ✓");
    }

    setCallBanner(null);
    fetchData();
  };

  const statusBadge = (status: string) => {
    if (status === "pending") return <Badge className="bg-primary/20 text-primary border-0 text-xs">⏳ Pending</Badge>;
    if (status === "no_answer") return <Badge className="bg-warning/20 text-warning border-0 text-xs">📵 No Answer</Badge>;
    if (status === "callback") return <Badge className="bg-primary/20 text-primary border-0 text-xs">🔄 Callback</Badge>;
    if (status === "completed") return <Badge className="bg-[hsl(var(--success)/0.2)] text-[hsl(var(--success))] border-0 text-xs">✅ Done</Badge>;
    return <Badge className="bg-secondary text-muted-foreground border-0 text-xs">{status}</Badge>;
  };

  if (loading) return (
    <div className="space-y-4 p-4">
      {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
    </div>
  );

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      <div className="flex-1 space-y-4 pb-24 px-1">
        <div className="pt-2">
          <h1 className="text-2xl font-display font-extrabold text-foreground">
            {greeting}, {profile?.full_name?.split(" ")[0]} 🙏
          </h1>
          <p className="text-sm text-muted-foreground">{format(now, "EEEE, MMMM d, yyyy")}</p>
        </div>

        {campaign && (
          <div className="rounded-2xl bg-primary/10 border border-primary/20 p-4">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">Active Campaign</p>
            <p className="text-lg font-bold text-foreground mt-1">{campaign.title}</p>
            <p className="text-sm text-muted-foreground italic mt-1">{campaign.objective}</p>
            {campaign.message_script && (
              <div className="mt-2 p-3 rounded-xl bg-card border border-border">
                <p className="text-xs font-semibold text-muted-foreground mb-1">📝 Script:</p>
                <p className="text-sm text-foreground">{campaign.message_script}</p>
              </div>
            )}
          </div>
        )}

        {/* Progress */}
        <div>
          <div className="flex justify-between text-sm text-muted-foreground mb-1">
            <span>{completedToday} of {total} calls completed</span>
            <span>{remaining} remaining</span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${total > 0 ? (completedToday / total) * 100 : 0}%` }} />
          </div>
        </div>

        {/* Call list */}
        {assignments.length === 0 ? (
          <Card><CardContent className="p-12 text-center text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg">All calls completed! 🎉</p>
          </CardContent></Card>
        ) : assignments.map(a => {
          const member = a.members;
          return (
            <div key={a.id} className="glass-card rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-xl shrink-0">
                  {member?.full_name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xl font-bold text-foreground truncate">{member?.full_name}</p>
                  <p className="text-base text-muted-foreground">{member?.phone_number}</p>
                  {statusBadge(a.status)}
                </div>
              </div>

              {campaign?.objective && (
                <p className="text-sm text-muted-foreground italic pl-1">💡 {campaign.objective}</p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => handleCall(a)}
                  className="flex-1 flex items-center justify-center gap-2 bg-[hsl(var(--success)/0.15)] text-[hsl(var(--success))] rounded-xl py-3 text-base font-bold active:opacity-70 transition-opacity"
                >
                  <Phone className="h-5 w-5" /> 📞 CALL
                </button>
                <a
                  href={`https://wa.me/${(member?.phone_number || "").replace(/^0/, "234")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-primary/15 text-primary rounded-xl py-3 text-base font-bold active:opacity-70 transition-opacity"
                >
                  <MessageCircle className="h-5 w-5" /> 💬 WHATSAPP
                </a>
                <a
                  href={`sms:${member?.phone_number}`}
                  className="flex items-center justify-center gap-1 bg-secondary text-muted-foreground rounded-xl py-3 px-4 text-base font-bold active:opacity-70 transition-opacity"
                >
                  📱 SMS
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Call outcome banner */}
      {callBanner && (
        <div className="fixed bottom-16 left-0 right-0 z-50 px-3 pb-2 safe-area-bottom">
          <div className="glass-card rounded-2xl p-4 border border-primary/30 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-foreground">📞 How did the call with {callBanner.memberName} go?</p>
              <button onClick={() => setCallBanner(null)} className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => handleOutcome("answered")} className="h-12 rounded-xl bg-[hsl(var(--success)/0.2)] text-[hsl(var(--success))] font-bold text-sm flex items-center justify-center gap-1 active:opacity-70">✅ Answered</button>
              <button onClick={() => handleOutcome("no_answer")} className="h-12 rounded-xl bg-warning/20 text-warning font-bold text-sm flex items-center justify-center gap-1 active:opacity-70">📵 No Answer</button>
              <button onClick={() => handleOutcome("callback")} className="h-12 rounded-xl bg-primary/20 text-primary font-bold text-sm flex items-center justify-center gap-1 active:opacity-70">🔄 Callback</button>
              <button onClick={() => handleOutcome("skipped")} className="h-12 rounded-xl bg-secondary text-muted-foreground font-bold text-sm flex items-center justify-center gap-1 active:opacity-70">⏭ Skip</button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom stats bar */}
      <div className="fixed bottom-0 left-0 right-0 glass-navbar z-40 flex justify-around py-3 px-4 safe-area-bottom">
        <div className="text-center">
          <p className="text-lg font-bold text-foreground">{completedToday}</p>
          <p className="text-xs text-muted-foreground">Called</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-[hsl(var(--success))]">
            {assignments.filter(a => a.status === "completed").length}
          </p>
          <p className="text-xs text-muted-foreground">Answered</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-warning">{remaining}</p>
          <p className="text-xs text-muted-foreground">Remaining</p>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function CallCenter() {
  const { role, isLoading } = useAuth();

  if (isLoading) return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
    </div>
  );

  // Cell leaders and follow_up_team who are assigned to campaigns see the rep view
  // Admins and pastors see the admin view
  const adminRoles = ["king_admin", "admin", "erediauwa_admin", "loveworldcity_admin", "youth_teens_admin", "church_pastor", "pastor"];
  if (adminRoles.includes(role || "")) return <AdminCallCenter />;

  return <RepDiallerView />;
}
