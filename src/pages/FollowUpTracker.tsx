import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Phone, MessageCircle, CheckCircle2, Clock, AlertTriangle,
  Users, ClipboardCheck, Bell, ChevronDown, XCircle,
  Shield, BarChart3, X, Camera, MapPin, Edit3, Image
} from "lucide-react";
import { formatDistanceToNow, format, startOfWeek, isToday, isYesterday, isBefore } from "date-fns";

// ─── CALL OUTCOME BANNER (shared) ──────────────────────────────────────────

type CallBannerState = {
  callLogId: string;
  memberId: string;
  memberName: string;
} | null;

function CallOutcomeBanner({
  banner,
  onDismiss,
  onOutcome,
}: {
  banner: CallBannerState;
  onDismiss: () => void;
  onOutcome: (outcome: string) => void;
}) {
  if (!banner) return null;
  return (
    <div className="fixed bottom-16 left-0 right-0 z-50 px-3 pb-2 safe-area-bottom">
      <div className="glass-card rounded-2xl p-4 border border-primary/30 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-foreground">📞 How did the call with {banner.memberName} go?</p>
          <button onClick={onDismiss} className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onOutcome("answered")}
            className="flex-1 h-12 rounded-xl bg-[hsl(var(--success)/0.2)] text-[hsl(var(--success))] font-bold text-sm flex items-center justify-center gap-1 active:opacity-70"
          >
            ✅ Answered
          </button>
          <button
            onClick={() => onOutcome("no_answer")}
            className="flex-1 h-12 rounded-xl bg-warning/20 text-warning font-bold text-sm flex items-center justify-center gap-1 active:opacity-70"
          >
            📵 No Answer
          </button>
          <button
            onClick={() => onOutcome("will_retry")}
            className="flex-1 h-12 rounded-xl bg-secondary text-muted-foreground font-bold text-sm flex items-center justify-center gap-1 active:opacity-70"
          >
            🔄 Retry
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── HELPER: format call time ─────────────────────────────────────────────

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
  return <Badge className="bg-secondary text-muted-foreground border-0 text-xs">🔄 Will Retry</Badge>;
}

// ─── HELPER: group calls by date ──────────────────────────────────────────

function groupCallsByDate(logs: any[]) {
  const groups: { label: string; calls: any[] }[] = [];
  const map = new Map<string, any[]>();
  for (const log of logs) {
    const d = new Date(log.call_timestamp);
    let label: string;
    if (isToday(d)) label = "Today";
    else if (isYesterday(d)) label = "Yesterday";
    else label = format(d, "EEEE, MMM d");
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(log);
  }
  map.forEach((calls, label) => groups.push({ label, calls }));
  return groups;
}

// ─── CELL LEADER VIEW ───────────────────────────────────────────────────────

function CellLeaderView() {
  const { profile } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [callLogs, setCallLogs] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"members" | "tasks" | "calls" | "notifications">("members");
  const [taskDialog, setTaskDialog] = useState<any>(null);
  const [taskNote, setTaskNote] = useState("");
  const [callBanner, setCallBanner] = useState<CallBannerState>(null);

  const fetchData = useCallback(async () => {
    if (!profile?.id) return;
    const [membersRes, tasksRes, callsRes, notifsRes] = await Promise.all([
      supabase.from("members").select("*").eq("assigned_follow_up_leader", profile.id).in("status", ["First Timer", "Second Timer", "New Convert"]).order("date_of_first_visit", { ascending: false }),
      supabase.from("follow_up_tasks").select("*").in("member_id", (await supabase.from("members").select("id").eq("assigned_follow_up_leader", profile.id)).data?.map((m: any) => m.id) || []),
      supabase.from("call_logs").select("*, members(full_name, phone_number)").eq("caller_id", profile.id).order("call_timestamp", { ascending: false }).limit(100),
      supabase.from("notifications").select("*").eq("user_id", profile.id).order("created_at", { ascending: false }).limit(20),
    ]);
    setMembers(membersRes.data || []);
    setTasks(tasksRes.data || []);
    setCallLogs(callsRes.data || []);
    setNotifications(notifsRes.data || []);
    setLoading(false);
  }, [profile?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const getMemberTasks = (memberId: string) => tasks.filter(t => t.member_id === memberId);
  const getCurrentWeek = (memberId: string) => {
    const memberTasks = getMemberTasks(memberId);
    if (memberTasks.length === 0) return 1;
    const pendingWeeks = memberTasks.filter(t => t.status === "pending" || t.status === "done").map(t => t.week_number);
    return pendingWeeks.length > 0 ? Math.min(...pendingWeeks) : 6;
  };

  const getStatus = (memberId: string): "overdue" | "due_today" | "on_track" => {
    const memberTasks = getMemberTasks(memberId);
    if (memberTasks.some(t => t.status === "pending" && t.due_date && isBefore(new Date(t.due_date), now))) return "overdue";
    if (memberTasks.some(t => t.status === "pending" && t.due_date && isToday(new Date(t.due_date)))) return "due_today";
    return "on_track";
  };

  const getUrgentTask = (memberId: string) => {
    return getMemberTasks(memberId).filter(t => t.status === "pending").sort((a: any, b: any) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    })[0];
  };

  const urgentCount = members.filter(m => getStatus(m.id) !== "on_track").length;

  // ── CALL button handler: log + dial + show banner ──
  const handleCallButton = async (member: any) => {
    if (!profile?.id || !member.phone_number) {
      toast.error("No phone number available");
      return;
    }
    // 1. Log call attempt
    const { data: logRow } = await supabase.from("call_logs").insert([{
      member_id: member.id,
      caller_id: profile.id,
      phone_number: member.phone_number,
      call_timestamp: new Date().toISOString(),
      outcome: null,
    }]).select("id").single();

    // 2. Open dialler
    window.location.href = "tel:" + member.phone_number;

    // 3. Show outcome banner (replaces any existing)
    if (logRow) {
      setCallBanner({
        callLogId: logRow.id,
        memberId: member.id,
        memberName: member.full_name,
      });
    }
  };

  const handleCallOutcome = async (outcome: string) => {
    if (!callBanner || !profile?.id) return;
    // Update call_logs row
    await supabase.from("call_logs").update({ outcome }).eq("id", callBanner.callLogId);

    // Find & complete the most recent pending call task for this member
    const pendingCallTask = tasks
      .filter(t => t.member_id === callBanner.memberId && t.task_category === "call" && t.status === "pending")
      .sort((a: any, b: any) => {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      })[0];

    if (pendingCallTask) {
      await supabase.from("follow_up_tasks").update({
        status: "done",
        completed_at: new Date().toISOString(),
        completed_by: profile.id,
        call_outcome: outcome,
        call_attempted: true,
        call_timestamp: new Date().toISOString(),
      }).eq("id", pendingCallTask.id);
    }

    toast.success("Call logged ✓");
    setCallBanner(null);
    fetchData();
  };

  const handleMarkDone = async (task: any, outcome?: string) => {
    const updates: any = {
      status: "done",
      completed_at: new Date().toISOString(),
      completed_by: profile?.id,
    };
    if (outcome) {
      updates.call_outcome = outcome;
      updates.call_attempted = true;
      updates.call_timestamp = new Date().toISOString();
    }
    if (taskNote) updates.notes = taskNote;

    await supabase.from("follow_up_tasks").update(updates).eq("id", task.id);

    if (task.task_category === "call") {
      const member = members.find(m => m.id === task.member_id);
      await supabase.from("call_logs").insert([{
        member_id: task.member_id,
        caller_id: profile!.id,
        phone_number: member?.phone_number || "",
        call_timestamp: new Date().toISOString(),
        outcome: outcome || "completed",
        note: taskNote || null,
        task_id: task.id,
      }]);
    }

    // Anti-gaming: check if 5+ tasks done in last 3 minutes
    await checkBulkCompletion();

    toast.success("Task marked as done — waiting for verification");
    setTaskDialog(null);
    setTaskNote("");
    fetchData();
  };

  // Photo proof for house visits
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [proofMode, setProofMode] = useState<"choose" | "photo" | "gps" | "manual" | null>(null);
  const [manualOverrideReason, setManualOverrideReason] = useState("");
  const [uploadingProof, setUploadingProof] = useState(false);

  const handleVisitPhotoProof = async (task: any, file: File) => {
    if (!profile?.id) return;
    setUploadingProof(true);
    try {
      const path = `visits/${task.id}/${Date.now()}.jpg`;
      const { error: uploadErr } = await supabase.storage.from("task-proofs").upload(path, file);
      if (uploadErr) { toast.error("Upload failed: " + uploadErr.message); setUploadingProof(false); return; }
      const { data: urlData } = supabase.storage.from("task-proofs").getPublicUrl(path);
      const photoUrl = urlData.publicUrl;

      // Get GPS
      let lat: number | null = null, lng: number | null = null, acc: number | null = null;
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 }));
        lat = pos.coords.latitude; lng = pos.coords.longitude; acc = pos.coords.accuracy;
      } catch { /* GPS unavailable */ }

      // Insert proof
      const { data: proof } = await supabase.from("task_proof").insert([{
        task_id: task.id,
        uploaded_by: profile.id,
        proof_type: "photo",
        photo_url: photoUrl,
        latitude: lat,
        longitude: lng,
        gps_accuracy: acc,
      }]).select("id").single();

      // Update task
      await supabase.from("follow_up_tasks").update({
        status: "done",
        completed_at: new Date().toISOString(),
        completed_by: profile.id,
        proof_id: proof?.id,
        notes: taskNote || null,
      }).eq("id", task.id);

      await checkBulkCompletion();
      toast.success("✅ Visit logged with photo proof!");
      setTaskDialog(null); setTaskNote(""); setProofMode(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Error");
    }
    setUploadingProof(false);
  };

  const handleVisitGPSOnly = async (task: any) => {
    if (!profile?.id) return;
    setUploadingProof(true);
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 }));
      const { data: proof } = await supabase.from("task_proof").insert([{
        task_id: task.id,
        uploaded_by: profile.id,
        proof_type: "gps",
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        gps_accuracy: pos.coords.accuracy,
      }]).select("id").single();

      await supabase.from("follow_up_tasks").update({
        status: "done",
        completed_at: new Date().toISOString(),
        completed_by: profile.id,
        proof_id: proof?.id,
        notes: taskNote || null,
      }).eq("id", task.id);

      await checkBulkCompletion();
      toast.success("✅ Visit logged with GPS!");
      setTaskDialog(null); setTaskNote(""); setProofMode(null);
      fetchData();
    } catch {
      toast.error("Could not get GPS location");
    }
    setUploadingProof(false);
  };

  const handleVisitManual = async (task: any) => {
    if (!profile?.id || !manualOverrideReason.trim()) return;
    setUploadingProof(true);

    const { data: proof } = await supabase.from("task_proof").insert([{
      task_id: task.id,
      uploaded_by: profile.id,
      proof_type: "manual",
      is_manual_override: true,
      override_reason: manualOverrideReason,
    }]).select("id").single();

    await supabase.from("follow_up_tasks").update({
      status: "done",
      completed_at: new Date().toISOString(),
      completed_by: profile.id,
      is_manual_override: true,
      override_reason: manualOverrideReason,
      proof_id: proof?.id,
      notes: taskNote || null,
    }).eq("id", task.id);

    // Flag it
    const member = members.find(m => m.id === task.member_id);
    await supabase.from("activity_flags").insert([{
      flagged_user_id: profile.id,
      flag_type: "no_proof",
      description: `${profile.full_name} marked house visit for ${member?.full_name || "unknown"} without proof`,
      severity: "medium",
    }]);

    await checkBulkCompletion();
    toast.success("Visit marked (no proof — flagged for review)");
    setTaskDialog(null); setTaskNote(""); setProofMode(null); setManualOverrideReason("");
    fetchData();
    setUploadingProof(false);
  };

  const checkBulkCompletion = async () => {
    if (!profile?.id) return;
    const threeMinAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString();
    const { count } = await supabase.from("follow_up_tasks").select("id", { count: "exact" })
      .eq("completed_by", profile.id).gte("completed_at", threeMinAgo);
    if ((count || 0) >= 5) {
      await supabase.from("activity_flags").insert([{
        flagged_user_id: profile.id,
        flag_type: "too_fast",
        description: `${profile.full_name} completed ${count} tasks in under 3 minutes`,
        severity: "high",
      }]);
    }
  };

  const statusDot = (s: "overdue" | "due_today" | "on_track") =>
    s === "overdue" ? "🔴" : s === "due_today" ? "🟡" : "🟢";

  const taskStatusIcon = (status: string, dueDate: string | null) => {
    if (status === "verified") return "✅";
    if (status === "done") return "🟡";
    if (status === "rejected") return "❌";
    if (status === "pending" && dueDate && isBefore(new Date(dueDate), now)) return "🔴";
    return "⭕";
  };

  const allPendingTasks = tasks.filter(t => t.status === "pending").sort((a: any, b: any) => {
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });

  // ── Call stats for the Calls tab ──
  const thisWeekCalls = callLogs.filter(c => c.call_timestamp && new Date(c.call_timestamp) >= weekStart);
  const answeredCount = thisWeekCalls.filter(c => c.outcome === "answered").length;
  const noAnswerCount = thisWeekCalls.filter(c => c.outcome === "no_answer").length;
  const callGroups = groupCallsByDate(callLogs);

  if (loading) return (
    <div className="space-y-4 p-4">
      {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
    </div>
  );

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      <div className="flex-1 space-y-4 pb-20 px-1">
        {/* Greeting */}
        <div className="pt-2">
          <h1 className="text-2xl font-display font-extrabold text-foreground">
            {greeting}, {profile?.full_name?.split(" ")[0]} 🙏
          </h1>
          <p className="text-sm text-muted-foreground">{format(now, "EEEE, MMMM d, yyyy")}</p>
        </div>

        {urgentCount > 0 && (
          <div className="bg-destructive/15 border border-destructive/30 rounded-2xl p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <p className="text-sm font-semibold text-destructive">⚠️ {urgentCount} task{urgentCount > 1 ? "s" : ""} need your attention today</p>
          </div>
        )}

        {/* TAB: Members */}
        {activeTab === "members" && (
          <>
            {members.length === 0 ? (
              <Card><CardContent className="p-12 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg">No members assigned to you yet.</p>
              </CardContent></Card>
            ) : members.map(m => {
              const status = getStatus(m.id);
              const week = getCurrentWeek(m.id);
              const urgent = getUrgentTask(m.id);
              const isOpen = expandedMember === m.id;
              const weekTasks = getMemberTasks(m.id).filter(t => t.week_number === week);

              return (
                <div
                  key={m.id}
                  className="glass-card rounded-2xl overflow-hidden"
                  onClick={() => setExpandedMember(isOpen ? null : m.id)}
                >
                  {/* Top row */}
                  <div className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg shrink-0">
                      {m.full_name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-bold text-foreground truncate">{m.full_name}</p>
                      <p className="text-sm text-muted-foreground">Week {week} of 6</p>
                      {urgent && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {urgent.task_emoji} {urgent.task_name}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <span className="text-xl">{statusDot(status)}</span>
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                    </div>
                  </div>

                  {/* CALL and WHATSAPP buttons */}
                  <div className="flex gap-2 px-4 pb-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCallButton(m); }}
                      className="flex-1 flex items-center justify-center gap-2 bg-[hsl(var(--success)/0.15)] text-[hsl(var(--success))] rounded-xl py-3 text-base font-bold active:opacity-70 transition-opacity"
                    >
                      <Phone className="h-5 w-5" /> 📞 CALL
                    </button>
                    <a
                      href={`https://wa.me/${(m.phone_number || "").replace(/^0/, "234")}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => { e.stopPropagation(); }}
                      className="flex-1 flex items-center justify-center gap-2 bg-primary/15 text-primary rounded-xl py-3 text-base font-bold active:opacity-70 transition-opacity"
                    >
                      <MessageCircle className="h-5 w-5" /> 💬 WHATSAPP
                    </a>
                  </div>

                  {/* Expanded task list */}
                  {isOpen && (
                    <div className="px-4 pb-4 space-y-2 border-t border-border pt-3" onClick={(e) => e.stopPropagation()}>
                      <p className="text-sm font-semibold text-muted-foreground mb-2">📋 Week {week} Tasks</p>
                      {weekTasks.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No tasks for this week.</p>
                      ) : weekTasks.map(task => (
                        <div
                          key={task.id}
                          className="flex items-center gap-3 min-h-[56px] p-3 rounded-xl bg-secondary/50 active:bg-secondary transition-colors cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (task.status === "pending") setTaskDialog(task);
                          }}
                        >
                          <span className="text-2xl shrink-0 leading-none">{task.task_emoji || "📋"}</span>
                          <span className="flex-1 text-base text-foreground">{task.task_name}</span>
                          <span className="text-xl shrink-0">{taskStatusIcon(task.status, task.due_date)}</span>
                        </div>
                      ))}
                      {weekTasks.some(t => t.status === "done") && (
                        <p className="text-xs text-muted-foreground mt-2 italic">🟡 Your pastor's team will confirm completed tasks</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        {/* TAB: Tasks */}
        {activeTab === "tasks" && (
          <div className="space-y-3">
            <h2 className="text-xl font-display font-bold text-foreground">All Pending Tasks</h2>
            {allPendingTasks.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">
                <CheckCircle2 className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p>All tasks completed! 🎉</p>
              </CardContent></Card>
            ) : allPendingTasks.map(task => {
              const member = members.find(m => m.id === task.member_id);
              const isOverdue = task.due_date && isBefore(new Date(task.due_date), now);
              return (
                <button key={task.id} className="w-full text-left" onClick={() => setTaskDialog(task)}>
                  <Card className={isOverdue ? "border-destructive/40" : ""}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <span className="text-xl">{task.task_emoji || "📋"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{task.task_name}</p>
                        <p className="text-sm text-muted-foreground">{member?.full_name} · Week {task.week_number}</p>
                      </div>
                      {isOverdue && <Badge variant="destructive" className="shrink-0">Overdue</Badge>}
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>
        )}

        {/* TAB: Calls — PART 2: Rich call history */}
        {activeTab === "calls" && (
          <div className="space-y-4">
            <h2 className="text-xl font-display font-bold text-foreground">Call History</h2>

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-2">
              <Card><CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-primary">{thisWeekCalls.length}</p>
                <p className="text-xs text-muted-foreground">Calls This Week</p>
              </CardContent></Card>
              <Card><CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-[hsl(var(--success))]">{answeredCount}</p>
                <p className="text-xs text-muted-foreground">Answered</p>
              </CardContent></Card>
              <Card><CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-warning">{noAnswerCount}</p>
                <p className="text-xs text-muted-foreground">No Answer</p>
              </CardContent></Card>
            </div>

            {callLogs.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">
                <Phone className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p>No calls logged yet.</p>
              </CardContent></Card>
            ) : callGroups.map(group => (
              <div key={group.label} className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">{group.label}</p>
                {group.calls.map((log: any) => (
                  <Card key={log.id}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
                        {(log.members?.full_name || "?").charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{log.members?.full_name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{formatCallTime(log.call_timestamp)}</p>
                        <p className="text-xs text-muted-foreground/70">{log.phone_number}</p>
                        {log.note && <p className="text-xs text-muted-foreground mt-1 italic">{log.note}</p>}
                      </div>
                      <div className="shrink-0">{outcomeBadge(log.outcome)}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* TAB: Notifications */}
        {activeTab === "notifications" && (
          <div className="space-y-3">
            <h2 className="text-xl font-display font-bold text-foreground">Notifications</h2>
            {notifications.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">
                <Bell className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p>No notifications.</p>
              </CardContent></Card>
            ) : notifications.map(n => (
              <Card key={n.id} className={n.read ? "opacity-60" : ""}>
                <CardContent className="p-4">
                  <p className="font-semibold text-foreground">{n.title}</p>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{n.created_at ? formatDistanceToNow(new Date(n.created_at), { addSuffix: true }) : ""}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Hidden file input for photo proof */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && taskDialog) handleVisitPhotoProof(taskDialog, file);
          e.target.value = "";
        }}
      />

      {/* Task completion — fixed bottom panel */}
      {taskDialog && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={() => { setTaskDialog(null); setTaskNote(""); setProofMode(null); setManualOverrideReason(""); }}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative bg-card border-t border-border rounded-t-2xl p-6 pb-8 space-y-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button className="absolute top-4 right-4 h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground" onClick={() => { setTaskDialog(null); setTaskNote(""); setProofMode(null); setManualOverrideReason(""); }}>
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3 pr-8">
              <span className="text-3xl">{taskDialog.task_emoji || "📋"}</span>
              <p className="text-lg font-bold text-foreground">{taskDialog.task_name}</p>
            </div>

            {/* HOUSE VISIT TASKS */}
            {taskDialog.task_category === "visit" ? (
              proofMode === null || proofMode === "choose" ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">How would you like to log this visit?</p>
                  <button
                    className="w-full h-14 rounded-xl bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))] text-base font-bold flex items-center justify-center gap-2 active:opacity-80"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingProof}
                  >
                    <Camera className="h-5 w-5" /> 📸 Take Photo as Proof
                  </button>
                  <button
                    className="w-full h-14 rounded-xl bg-primary/15 text-primary text-base font-bold flex items-center justify-center gap-2 active:opacity-80"
                    onClick={() => handleVisitGPSOnly(taskDialog)}
                    disabled={uploadingProof}
                  >
                    <MapPin className="h-5 w-5" /> 📍 Use GPS Only
                  </button>
                  <button
                    className="text-sm text-muted-foreground underline hover:text-foreground transition-colors text-center w-full"
                    onClick={() => setProofMode("manual")}
                  >
                    ✏️ Mark Without Proof (explain why)
                  </button>
                  {uploadingProof && <p className="text-center text-sm text-muted-foreground">Uploading...</p>}
                </div>
              ) : proofMode === "manual" ? (
                <div className="space-y-3">
                  <p className="text-sm text-warning font-medium">⚠️ No proof provided — this will be flagged for review.</p>
                  <Textarea
                    placeholder="Why can't you provide proof? (required)"
                    value={manualOverrideReason}
                    onChange={e => setManualOverrideReason(e.target.value)}
                    className="min-h-[80px]"
                  />
                  <Button
                    className="w-full h-12"
                    disabled={!manualOverrideReason.trim() || uploadingProof}
                    onClick={() => handleVisitManual(taskDialog)}
                  >
                    Submit Without Proof
                  </Button>
                  <button className="text-sm text-muted-foreground underline text-center w-full" onClick={() => setProofMode("choose")}>Back</button>
                </div>
              ) : null
            ) : taskDialog.task_category === "call" ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">How did the call go?</p>
                <button className="w-full h-14 rounded-xl gradient-primary text-primary-foreground text-base font-bold flex items-center justify-center gap-2 active:opacity-80" onClick={() => handleMarkDone(taskDialog, "answered")}>✅ Answered</button>
                <button className="w-full h-14 rounded-xl border border-border bg-secondary text-foreground text-base font-bold flex items-center justify-center gap-2 active:opacity-80" onClick={() => handleMarkDone(taskDialog, "no_answer")}>📵 No Answer</button>
                <button className="w-full h-14 rounded-xl border border-border bg-secondary text-foreground text-base font-bold flex items-center justify-center gap-2 active:opacity-80" onClick={() => handleMarkDone(taskDialog, "will_retry")}>🔄 Will Retry</button>
              </div>
            ) : (
              <button className="w-full h-14 rounded-xl bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))] text-lg font-bold flex items-center justify-center gap-2 active:opacity-80" onClick={() => handleMarkDone(taskDialog)}>✅ Mark as Done</button>
            )}
            <Textarea placeholder="Optional note..." value={taskNote} onChange={e => setTaskNote(e.target.value)} className="min-h-[80px]" />
          </div>
        </div>
      )}

      {/* Call outcome banner */}
      <CallOutcomeBanner banner={callBanner} onDismiss={() => setCallBanner(null)} onOutcome={handleCallOutcome} />

      {/* Bottom tab bar */}
      <div className="fixed bottom-0 left-0 right-0 glass-navbar z-40 flex justify-around py-2 px-2 safe-area-bottom">
        {([
          { key: "members" as const, icon: "👥", label: "My Members" },
          { key: "tasks" as const, icon: "✅", label: "Tasks" },
          { key: "calls" as const, icon: "📞", label: "Calls Log" },
          { key: "notifications" as const, icon: "🔔", label: "Alerts" },
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${activeTab === tab.key ? "text-primary bg-primary/10" : "text-muted-foreground"}`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── STAFF / PASTOR VIEW ─────────────────────────────────────────────────────

function StaffView() {
  const { profile, role, organizationId } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [cellLeaders, setCellLeaders] = useState<any[]>([]);
  const [allCallLogs, setAllCallLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectDialog, setRejectDialog] = useState<any>(null);
  const [rejectionNote, setRejectionNote] = useState("");
  const [leaderFilter, setLeaderFilter] = useState<string | null>(null);
  const [callLeaderFilter, setCallLeaderFilter] = useState<string>("all");

  const fetchData = useCallback(async () => {
    const [tasksRes, membersRes, profilesRes, leadersRes] = await Promise.all([
      supabase.from("follow_up_tasks").select("*"),
      supabase.from("members").select("id, full_name, phone_number, assigned_follow_up_leader, organization_id").in("status", ["First Timer", "Second Timer", "New Convert"]),
      supabase.from("profiles").select("id, user_id, full_name, organization_id"),
      supabase.from("user_roles").select("user_id, role").eq("role", "cell_leader"),
    ]);

    let filteredMembers = membersRes.data || [];
    if (role !== "king_admin" && role !== "admin" && organizationId) {
      filteredMembers = filteredMembers.filter(m => m.organization_id === organizationId);
    }
    const memberIds = new Set(filteredMembers.map(m => m.id));
    const filteredTasks = (tasksRes.data || []).filter(t => memberIds.has(t.member_id));

    setMembers(filteredMembers);
    setTasks(filteredTasks);
    setProfiles(profilesRes.data || []);

    const leaderUserIds = (leadersRes.data || []).map(l => l.user_id);
    const { data: leaderProfilesData } = await supabase.from("profiles").select("id, user_id, full_name, organization_id").in("user_id", leaderUserIds);
    let scopedLeaders = leaderProfilesData || [];
    if (role !== "king_admin" && role !== "admin" && organizationId) {
      scopedLeaders = scopedLeaders.filter(l => l.organization_id === organizationId);
    }
    setCellLeaders(scopedLeaders);

    // Fetch ALL call logs for scoped cell leaders
    const leaderProfileIds = scopedLeaders.map(l => l.id);
    if (leaderProfileIds.length > 0) {
      const { data: callData } = await supabase
        .from("call_logs")
        .select("*, members(full_name, phone_number)")
        .in("caller_id", leaderProfileIds)
        .order("call_timestamp", { ascending: false })
        .limit(200);
      setAllCallLogs(callData || []);
    }

    setLoading(false);
  }, [role, organizationId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });

  const pendingVerification = tasks.filter(t => t.status === "done");
  const overdueTasks = tasks.filter(t => t.status === "pending" && t.due_date && isBefore(new Date(t.due_date), now));
  const completedThisWeek = tasks.filter(t => t.status === "verified" && t.verified_at && new Date(t.verified_at) >= weekStart);
  const totalTracked = members.length;

  const handleVerify = async (task: any) => {
    await supabase.from("follow_up_tasks").update({
      status: "verified",
      verified_at: new Date().toISOString(),
      verified_by: profile?.id,
    }).eq("id", task.id);
    toast.success("Task verified ✓");
    fetchData();
  };

  const handleReject = async () => {
    if (!rejectDialog) return;
    await supabase.from("follow_up_tasks").update({
      status: "rejected",
      rejected_at: new Date().toISOString(),
      rejected_by: profile?.id,
      rejection_note: rejectionNote,
    }).eq("id", rejectDialog.id);
    if (rejectDialog.completed_by) {
      const member = members.find(m => m.id === rejectDialog.member_id);
      await supabase.from("notifications").insert([{
        user_id: rejectDialog.completed_by,
        title: "Task Rejected",
        message: `"${rejectDialog.task_name}" for ${member?.full_name || "a member"} was rejected. Reason: ${rejectionNote || "No reason given"}`,
      }]);
    }
    toast.success("Task rejected");
    setRejectDialog(null);
    setRejectionNote("");
    fetchData();
  };

  const getProfileName = (profileId: string | null) => {
    if (!profileId) return "Unknown";
    return profiles.find(p => p.id === profileId)?.full_name || "Unknown";
  };
  const getMemberName = (memberId: string) => members.find(m => m.id === memberId)?.full_name || "Unknown";

  const filteredVerification = leaderFilter
    ? pendingVerification.filter(t => {
        const member = members.find(m => m.id === t.member_id);
        return member?.assigned_follow_up_leader === leaderFilter;
      })
    : pendingVerification;

  // ── PART 4: leader stats with call data ──
  const getLeaderStats = (leaderId: string) => {
    const leaderMembers = members.filter(m => m.assigned_follow_up_leader === leaderId);
    const leaderMemberIds = new Set(leaderMembers.map(m => m.id));
    const leaderTasks = tasks.filter(t => leaderMemberIds.has(t.member_id));
    const thisWeekTasks = leaderTasks.filter(t => t.due_date && new Date(t.due_date) >= weekStart && new Date(t.due_date) <= now);
    const completedThisWeek = thisWeekTasks.filter(t => t.status === "verified" || t.status === "done");
    const total = thisWeekTasks.length || 1;

    // Call stats
    const leaderCalls = allCallLogs.filter(c => c.caller_id === leaderId);
    const callsThisWeek = leaderCalls.filter(c => c.call_timestamp && new Date(c.call_timestamp) >= weekStart);
    const lastCall = leaderCalls[0]; // already sorted desc

    return {
      assigned: leaderMembers.length,
      completed: completedThisWeek.length,
      total: thisWeekTasks.length,
      pct: Math.round((completedThisWeek.length / total) * 100),
      callsThisWeek: callsThisWeek.length,
      lastCallTime: lastCall?.call_timestamp || null,
    };
  };

  // ── PART 3: filtered call logs for staff ──
  const filteredCallLogs = callLeaderFilter === "all"
    ? allCallLogs
    : allCallLogs.filter(c => c.caller_id === callLeaderFilter);
  const staffCallGroups = groupCallsByDate(filteredCallLogs);

  if (loading) return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-extrabold text-foreground">Follow-Up Tracker</h1>
        <p className="text-muted-foreground mt-1">Oversight & verification dashboard</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Being Tracked", value: totalTracked, icon: Users, color: "text-primary" },
          { label: "Pending Verification", value: pendingVerification.length, icon: Clock, color: "text-warning" },
          { label: "Overdue", value: overdueTasks.length, icon: AlertTriangle, color: "text-destructive" },
          { label: "Verified This Week", value: completedThisWeek.length, icon: CheckCircle2, color: "text-success" },
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

      {/* Verification Queue */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-warning" />
            Pending Verification
            <Badge variant="secondary" className="ml-2">{filteredVerification.length}</Badge>
            {leaderFilter && (
              <Button variant="ghost" size="sm" onClick={() => setLeaderFilter(null)} className="ml-auto text-xs">Clear filter</Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredVerification.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">No tasks waiting for verification 🎉</p>
          ) : filteredVerification.map(task => {
            const hasProof = task.proof_id;
            const isVisit = task.task_category === "visit";
            const isManualOverride = task.is_manual_override;
            return (
            <div key={task.id} className="p-3 rounded-xl bg-secondary/30 space-y-2">
              <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
                {getMemberName(task.member_id).charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{getMemberName(task.member_id)}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {task.task_emoji} {task.task_name} · <Badge variant="outline" className="text-xs">W{task.week_number}</Badge>
                </p>
                <p className="text-xs text-muted-foreground">
                  By {getProfileName(task.completed_by)} · {task.completed_at ? formatDistanceToNow(new Date(task.completed_at), { addSuffix: true }) : ""}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" className="bg-success hover:bg-success/80 text-success-foreground" onClick={() => handleVerify(task)}>✓ Verify</Button>
                <Button size="sm" variant="destructive" onClick={() => setRejectDialog(task)}>✗ Reject</Button>
              </div>
              </div>
              {/* Proof display for visit tasks */}
              {isVisit && isManualOverride && (
                <div className="ml-[52px] bg-warning/10 border border-warning/30 rounded-lg p-2">
                  <p className="text-xs text-warning font-medium">⚠️ No proof provided — {task.override_reason || "No reason given"}</p>
                </div>
              )}
              {isVisit && hasProof && !isManualOverride && (
                <div className="ml-[52px] text-xs text-muted-foreground">
                  <span className="text-success font-medium">📸 Photo proof attached</span>
                </div>
              )}
            </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Overdue Alerts */}
      {overdueTasks.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Overdue Alerts
              <Badge variant="destructive" className="ml-2">{overdueTasks.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {overdueTasks.slice(0, 10).map(task => {
              const daysOverdue = Math.ceil((now.getTime() - new Date(task.due_date).getTime()) / (1000 * 60 * 60 * 24));
              const member = members.find(m => m.id === task.member_id);
              return (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl bg-destructive/5 border border-destructive/20">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{member?.full_name}</p>
                    <p className="text-sm text-destructive">{task.task_name}</p>
                    <p className="text-xs text-destructive">{daysOverdue} day{daysOverdue > 1 ? "s" : ""} overdue · Leader: {getProfileName(member?.assigned_follow_up_leader)}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => toast.success(`Reminder sent to ${getProfileName(member?.assigned_follow_up_leader)}`)}>
                    Send Reminder
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Cell Leaders Overview — PART 4: with call stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Cell Leaders Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {cellLeaders.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No cell leaders found.</p>
          ) : cellLeaders.map(leader => {
            const stats = getLeaderStats(leader.id);
            const barColor = stats.pct >= 80 ? "bg-success" : stats.pct >= 50 ? "bg-warning" : "bg-destructive";
            return (
              <button
                key={leader.id}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors text-left"
                onClick={() => setLeaderFilter(leader.id === leaderFilter ? null : leader.id)}
              >
                <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
                  {leader.full_name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm truncate">{leader.full_name}</p>
                  <p className="text-xs text-muted-foreground">{stats.assigned} members · {stats.completed}/{stats.total} tasks</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">📞 {stats.callsThisWeek} calls this week</span>
                    <span className="text-xs">·</span>
                    {stats.lastCallTime ? (
                      <span className="text-xs text-muted-foreground">Last: {formatDistanceToNow(new Date(stats.lastCallTime), { addSuffix: true })}</span>
                    ) : (
                      <span className="text-xs text-destructive font-semibold">No calls yet</span>
                    )}
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary mt-1.5 overflow-hidden">
                    <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${stats.pct}%` }} />
                  </div>
                </div>
                <span className={`text-sm font-bold ${stats.pct >= 80 ? "text-success" : stats.pct >= 50 ? "text-warning" : "text-destructive"}`}>
                  {stats.pct}%
                </span>
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* PART 3: Call Logs section for staff */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            📞 Call Logs
            <Badge variant="secondary" className="ml-2">{filteredCallLogs.length}</Badge>
          </CardTitle>
          <div className="mt-2">
            <Select value={callLeaderFilter} onValueChange={setCallLeaderFilter}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="All Cell Leaders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cell Leaders</SelectItem>
                {cellLeaders.map(l => (
                  <SelectItem key={l.id} value={l.id}>{l.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredCallLogs.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">No call logs found.</p>
          ) : staffCallGroups.map(group => (
            <div key={group.label} className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{group.label}</p>
              {group.calls.map((log: any) => (
                <div key={log.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
                  <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
                    {(log.members?.full_name || "?").charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{log.members?.full_name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">
                      by <span className="font-medium">{getProfileName(log.caller_id)}</span> · {formatCallTime(log.call_timestamp)}
                    </p>
                    <p className="text-xs text-muted-foreground/70">{log.phone_number}</p>
                    {log.note && <p className="text-xs text-muted-foreground italic mt-0.5">{log.note}</p>}
                  </div>
                  <div className="shrink-0">{outcomeBadge(log.outcome)}</div>
                </div>
              ))}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Reject dialog */}
      <Dialog open={!!rejectDialog} onOpenChange={(open) => { if (!open) { setRejectDialog(null); setRejectionNote(""); } }}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-display flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" /> Reject Task
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">
              Rejecting "{rejectDialog?.task_name}" — the cell leader will be notified.
            </p>
            <Textarea placeholder="Reason for rejection..." value={rejectionNote} onChange={e => setRejectionNote(e.target.value)} />
            <Button variant="destructive" className="w-full" onClick={handleReject}>Reject Task</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function FollowUpTracker() {
  const { role, isLoading } = useAuth();

  if (isLoading) return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
    </div>
  );

  if (role === "cell_leader") return <CellLeaderView />;
  return <StaffView />;
}
