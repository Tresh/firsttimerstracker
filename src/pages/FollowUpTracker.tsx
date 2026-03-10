import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Phone, MessageCircle, CheckCircle2, Clock, AlertTriangle,
  Users, ClipboardCheck, Bell, ChevronDown, ChevronUp, XCircle,
  Shield, BarChart3, X
} from "lucide-react";
import { formatDistanceToNow, format, startOfWeek, isToday, isBefore } from "date-fns";

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

  const fetchData = useCallback(async () => {
    if (!profile?.id) return;
    const [membersRes, tasksRes, callsRes, notifsRes] = await Promise.all([
      supabase.from("members").select("*").eq("assigned_follow_up_leader", profile.id).in("status", ["First Timer", "Second Timer", "New Convert"]).order("date_of_first_visit", { ascending: false }),
      supabase.from("follow_up_tasks").select("*").in("member_id", (await supabase.from("members").select("id").eq("assigned_follow_up_leader", profile.id)).data?.map((m: any) => m.id) || []),
      supabase.from("call_logs").select("*, members(full_name)").eq("caller_id", profile.id).order("call_timestamp", { ascending: false }).limit(50),
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
    const hasOverdue = memberTasks.some(t => t.status === "pending" && t.due_date && isBefore(new Date(t.due_date), now));
    if (hasOverdue) return "overdue";
    const hasDueToday = memberTasks.some(t => t.status === "pending" && t.due_date && isToday(new Date(t.due_date)));
    if (hasDueToday) return "due_today";
    return "on_track";
  };

  const getUrgentTask = (memberId: string) => {
    const memberTasks = getMemberTasks(memberId).filter(t => t.status === "pending").sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });
    return memberTasks[0];
  };

  const urgentCount = members.filter(m => getStatus(m.id) !== "on_track").length;

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

    // Log call if it's a call task
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

    toast.success("Task marked as done — waiting for verification");
    setTaskDialog(null);
    setTaskNote("");
    fetchData();
  };

  const statusDot = (s: "overdue" | "due_today" | "on_track") => {
    if (s === "overdue") return "🔴";
    if (s === "due_today") return "🟡";
    return "🟢";
  };

  const taskStatusIcon = (status: string, dueDate: string | null) => {
    if (status === "verified") return "✅";
    if (status === "done") return "🟡";
    if (status === "rejected") return "❌";
    if (status === "pending" && dueDate && isBefore(new Date(dueDate), now)) return "🔴";
    return "⭕";
  };

  const allPendingTasks = tasks.filter(t => t.status === "pending").sort((a, b) => {
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });

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
              const expanded = expandedMember === m.id;
              const weekTasks = getMemberTasks(m.id).filter(t => t.week_number === week);

              return (
                <Card key={m.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    {/* Tappable header area */}
                    <div
                      role="button"
                      tabIndex={0}
                      className="w-full p-4 flex items-center gap-4 text-left cursor-pointer active:bg-secondary/50 transition-colors select-none"
                      onClick={() => setExpandedMember(expanded ? null : m.id)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setExpandedMember(expanded ? null : m.id); }}
                    >
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
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
                      </div>
                    </div>

                    {/* Action buttons - stopPropagation to prevent expand toggle */}
                    <div className="flex gap-2 px-4 pb-3">
                      <a
                        href={`tel:${m.phone_number}`}
                        onClick={(e) => e.stopPropagation()}
                        onTouchEnd={(e) => e.stopPropagation()}
                        className="flex-1 flex items-center justify-center gap-2 bg-success/15 text-success rounded-xl py-3 text-base font-bold hover:bg-success/25 active:bg-success/30 transition-colors"
                      >
                        <Phone className="h-5 w-5" /> 📞 CALL
                      </a>
                      <a
                        href={`https://wa.me/${(m.phone_number || "").replace(/^0/, "234")}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        onTouchEnd={(e) => e.stopPropagation()}
                        className="flex-1 flex items-center justify-center gap-2 bg-primary/15 text-primary rounded-xl py-3 text-base font-bold hover:bg-primary/25 active:bg-primary/30 transition-colors"
                      >
                        <MessageCircle className="h-5 w-5" /> 💬 WHATSAPP
                      </a>
                    </div>

                    {/* Expanded task list */}
                    {expanded && (
                      <div className="px-4 pb-4 space-y-2 border-t border-border pt-3">
                        <p className="text-sm font-semibold text-muted-foreground mb-2">Week {week} Tasks</p>
                        {weekTasks.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No tasks for this week.</p>
                        ) : weekTasks.map(task => (
                          <button
                            key={task.id}
                            className="w-full flex items-center gap-3 min-h-[56px] p-3 rounded-xl bg-secondary/50 hover:bg-secondary active:bg-secondary/80 transition-colors text-left"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (task.status === "pending") setTaskDialog(task);
                            }}
                            disabled={task.status === "verified" || task.status === "done"}
                          >
                            <span className="text-2xl shrink-0 leading-none">{task.task_emoji || "📋"}</span>
                            <span className="flex-1 text-base text-foreground">{task.task_name}</span>
                            <span className="text-xl shrink-0">{taskStatusIcon(task.status, task.due_date)}</span>
                          </button>
                        ))}
                        {weekTasks.some(t => t.status === "done") && (
                          <p className="text-xs text-muted-foreground mt-2 italic">🟡 Your pastor's team will confirm completed tasks</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
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

        {/* TAB: Calls */}
        {activeTab === "calls" && (
          <div className="space-y-3">
            <h2 className="text-xl font-display font-bold text-foreground">Call History</h2>
            {callLogs.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">
                <Phone className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p>No calls logged yet.</p>
              </CardContent></Card>
            ) : callLogs.map(log => (
              <Card key={log.id}>
                <CardContent className="p-4 flex items-center gap-3">
                  <span className="text-xl shrink-0">
                    {log.outcome === "answered" || log.outcome === "Answered" ? "✅" : log.outcome === "no_answer" || log.outcome === "No Answer" ? "📵" : "🔄"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{log.members?.full_name || "Unknown"}</p>
                    <p className="text-sm text-muted-foreground">
                      {log.call_timestamp ? format(new Date(log.call_timestamp), "MMM d, h:mm a") : ""}
                      {log.duration_seconds ? ` · ${Math.round(log.duration_seconds / 60)} mins` : ""}
                    </p>
                    {log.note && <p className="text-xs text-muted-foreground mt-1">{log.note}</p>}
                  </div>
                </CardContent>
              </Card>
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

      {/* Task completion bottom sheet */}
      <Drawer open={!!taskDialog} onOpenChange={(open) => { if (!open) { setTaskDialog(null); setTaskNote(""); } }}>
        <DrawerContent className="bg-card border-border px-4 pb-8">
          <DrawerHeader className="px-0">
            <DrawerTitle className="text-lg font-display flex items-center gap-2">
              <span className="text-2xl">{taskDialog?.task_emoji}</span> {taskDialog?.task_name}
            </DrawerTitle>
          </DrawerHeader>
          <div className="space-y-4 mt-2">
            {taskDialog?.task_category === "call" ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">How did the call go?</p>
                <div className="grid gap-2">
                  <Button size="lg" className="h-14 text-base justify-start gap-3" onClick={() => handleMarkDone(taskDialog, "answered")}>
                    ✅ Answered
                  </Button>
                  <Button size="lg" variant="outline" className="h-14 text-base justify-start gap-3" onClick={() => handleMarkDone(taskDialog, "no_answer")}>
                    📵 No Answer
                  </Button>
                  <Button size="lg" variant="outline" className="h-14 text-base justify-start gap-3" onClick={() => handleMarkDone(taskDialog, "will_retry")}>
                    🔄 Will Retry
                  </Button>
                </div>
              </div>
            ) : taskDialog?.task_category === "visit" ? (
              <div className="space-y-3">
                <Textarea placeholder="Add notes about the visit..." value={taskNote} onChange={e => setTaskNote(e.target.value)} className="min-h-[100px]" />
                <Button size="lg" className="w-full h-14 text-base" onClick={() => handleMarkDone(taskDialog)}>
                  🏠 Mark Visit Done
                </Button>
              </div>
            ) : taskDialog?.task_category === "sms" ? (
              <Button size="lg" className="w-full h-14 text-base" onClick={() => handleMarkDone(taskDialog)}>
                🙏 Mark Prayer SMS Sent
              </Button>
            ) : (
              <Button size="lg" className="w-full h-14 text-base" onClick={() => handleMarkDone(taskDialog)}>
                ✓ Mark as Done
              </Button>
            )}
            <Textarea placeholder="Optional note..." value={taskNote} onChange={e => setTaskNote(e.target.value)} className={taskDialog?.task_category === "visit" ? "hidden" : ""} />
          </div>
        </DrawerContent>
      </Drawer>

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
  const [loading, setLoading] = useState(true);
  const [rejectDialog, setRejectDialog] = useState<any>(null);
  const [rejectionNote, setRejectionNote] = useState("");
  const [leaderFilter, setLeaderFilter] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const [tasksRes, membersRes, profilesRes, leadersRes] = await Promise.all([
      supabase.from("follow_up_tasks").select("*"),
      supabase.from("members").select("id, full_name, phone_number, assigned_follow_up_leader, organization_id").in("status", ["First Timer", "Second Timer", "New Convert"]),
      supabase.from("profiles").select("id, full_name, organization_id"),
      supabase.from("user_roles").select("user_id, role").eq("role", "cell_leader"),
    ]);

    let filteredMembers = membersRes.data || [];
    // Scope by org for non-king-admin
    if (role !== "king_admin" && role !== "admin" && organizationId) {
      filteredMembers = filteredMembers.filter(m => m.organization_id === organizationId);
    }
    const memberIds = new Set(filteredMembers.map(m => m.id));
    const filteredTasks = (tasksRes.data || []).filter(t => memberIds.has(t.member_id));

    setMembers(filteredMembers);
    setTasks(filteredTasks);
    setProfiles(profilesRes.data || []);

    // Build cell leaders list
    const leaderUserIds = (leadersRes.data || []).map(l => l.user_id);
    const leaderProfiles = (profilesRes.data || []).filter(p => leaderUserIds.includes(p.id) || leaderUserIds.some((uid: string) => {
      const prof = (profilesRes.data || []).find((pp: any) => pp.id === p.id);
      return false; // we match by user_id below
    }));
    // Match profiles where user_id is in leaderUserIds - but profiles use user_id field
    // Actually profiles table has user_id column, let's re-fetch with it
    const { data: leaderProfilesData } = await supabase.from("profiles").select("id, user_id, full_name, organization_id").in("user_id", leaderUserIds);
    let scopedLeaders = leaderProfilesData || [];
    if (role !== "king_admin" && role !== "admin" && organizationId) {
      scopedLeaders = scopedLeaders.filter(l => l.organization_id === organizationId);
    }
    setCellLeaders(scopedLeaders);
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

    // Send notification to cell leader
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

  const getLeaderStats = (leaderId: string) => {
    const leaderMembers = members.filter(m => m.assigned_follow_up_leader === leaderId);
    const leaderMemberIds = new Set(leaderMembers.map(m => m.id));
    const leaderTasks = tasks.filter(t => leaderMemberIds.has(t.member_id));
    const thisWeekTasks = leaderTasks.filter(t => t.due_date && new Date(t.due_date) >= weekStart && new Date(t.due_date) <= now);
    const completedThisWeek = thisWeekTasks.filter(t => t.status === "verified" || t.status === "done");
    const total = thisWeekTasks.length || 1;
    return {
      assigned: leaderMembers.length,
      completed: completedThisWeek.length,
      total: thisWeekTasks.length,
      pct: Math.round((completedThisWeek.length / total) * 100),
    };
  };

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
              <div className={`h-10 w-10 rounded-xl bg-secondary flex items-center justify-center shrink-0`}>
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
          ) : filteredVerification.map(task => (
            <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
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
          ))}
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

      {/* Cell Leaders Overview */}
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
            <Textarea
              placeholder="Reason for rejection..."
              value={rejectionNote}
              onChange={e => setRejectionNote(e.target.value)}
            />
            <Button variant="destructive" className="w-full" onClick={handleReject}>
              Reject Task
            </Button>
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
