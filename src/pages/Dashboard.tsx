import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type AppRole } from "@/contexts/AuthContext";
import { scopeQuery } from "@/utils/scopeQuery";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  UserPlus, Users, TrendingUp, ClipboardList, AlertTriangle, Phone,
  MessageCircle, GraduationCap, Building2, Award, CheckCircle2, XCircle,
  Calendar, ChevronDown, ChevronUp, Shield
} from "lucide-react";
import {
  FunnelChart, Funnel, Cell, Tooltip, PieChart, Pie, ResponsiveContainer, BarChart, Bar, XAxis, YAxis
} from "recharts";

// ─── Constants ───
const GROUP_IDS: Record<string, { id: string; name: string; icon: string }> = {
  erediauwa: { id: "00000000-0000-0000-0000-000000000001", name: "Erediauwa Group", icon: "🏛" },
  loveworldcity: { id: "00000000-0000-0000-0000-000000000002", name: "LoveworldCity & Environs", icon: "🌍" },
  youth: { id: "00000000-0000-0000-0000-000000000003", name: "Youth & Teens Church", icon: "⚡" },
};

const STATUS_ORDER = ["First Timer", "Second Timer", "New Convert", "Member", "Worker"];
const FUNNEL_COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#a855f7", "hsl(var(--success))", "hsl(var(--info))"];
const DONUT_COLORS = ["hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))"];

function sixWeeksAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 42);
  return d.toISOString().split("T")[0];
}
function monthStart() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

// ─── Skeleton Loader ───
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </div>
  );
}

// ─── Stat Card ───
function StatCard({ icon, label, value, bg, iconColor, valueColor }: {
  icon: React.ReactNode; label: string; value: string | number;
  bg: string; iconColor: string; valueColor: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className={`${bg} p-2.5 rounded-xl w-fit mb-3`}>
          <span className={iconColor}>{icon}</span>
        </div>
        <p className={`text-3xl font-display font-extrabold ${valueColor}`}>{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}

// ────────────────────────────────────────────
// VARIANT 1: King Admin
// ────────────────────────────────────────────
function KingAdminDashboard() {
  const navigate = useNavigate();
  const [members, setMembers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [cellLeaderCount, setCellLeaderCount] = useState(0);
  const [activityFlags, setActivityFlags] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from("members").select("*"),
      supabase.from("follow_up_tasks").select("*"),
      supabase.from("organizations").select("*"),
      supabase.from("user_roles").select("user_id").eq("role", "cell_leader"),
      supabase.from("activity_flags").select("*, profiles:flagged_user_id(full_name)").eq("resolved", false).order("created_at", { ascending: false }).limit(10),
    ]).then(([mRes, tRes, oRes, clRes, flagsRes]) => {
      setMembers(mRes.data || []);
      setTasks(tRes.data || []);
      setOrgs(oRes.data || []);
      setCellLeaderCount(clRes.data?.length || 0);
      setActivityFlags(flagsRes.data || []);
      setLoaded(true);
    });
  }, []);

  const dismissFlag = async (flagId: string) => {
    await supabase.from("activity_flags").update({ resolved: true, resolved_at: new Date().toISOString() }).eq("id", flagId);
    setActivityFlags(prev => prev.filter(f => f.id !== flagId));
  };

  if (!loaded) return <DashboardSkeleton />;

  const ms = monthStart();
  const sw = sixWeeksAgo();
  const totalMembers = members.filter(m => ["Member", "Worker"].includes(m.status)).length;
  const ftThisMonth = members.filter(m => m.status === "First Timer" && m.date_of_first_visit >= ms).length;
  const ftLast6w = members.filter(m => m.date_of_first_visit >= sw).length;
  const retained6w = members.filter(m => m.date_of_first_visit >= sw && ["Member", "Worker"].includes(m.status)).length;
  const retentionRate = ftLast6w > 0 ? Math.round((retained6w / ftLast6w) * 100) : 0;

  // Funnel
  const funnelData = STATUS_ORDER.map((s, i) => ({
    name: s, value: members.filter(m => m.status === s).length, fill: FUNNEL_COLORS[i]
  }));

  // Follow-up health
  const completed = tasks.filter(t => t.completed).length;
  const overdue = tasks.filter(t => !t.completed && t.due_date && t.due_date < new Date().toISOString().split("T")[0]).length;
  const pending = tasks.length - completed - overdue;
  const healthData = [
    { name: "Completed", value: completed || 1 },
    { name: "Pending", value: pending || 0 },
    { name: "Overdue", value: overdue || 0 },
  ];

  // Group comparison
  const groupKeys = Object.keys(GROUP_IDS);
  const groupStats = groupKeys.map(key => {
    const g = GROUP_IDS[key];
    const childChurchIds = orgs.filter(o => o.parent_id === g.id).map(o => o.id);
    const allIds = [g.id, ...childChurchIds];
    const gMembers = members.filter(m => m.organization_id && allIds.includes(m.organization_id));
    const gft = gMembers.filter(m => m.status === "First Timer" && m.date_of_first_visit >= ms).length;
    const gftAll = gMembers.filter(m => m.date_of_first_visit >= sw).length;
    const gRetained = gMembers.filter(m => m.date_of_first_visit >= sw && ["Member", "Worker"].includes(m.status)).length;
    return {
      ...g, key, ftThisMonth: gft, churchCount: childChurchIds.length,
      retentionRate: gftAll > 0 ? Math.round((gRetained / gftAll) * 100) : 0,
      totalMembers: gMembers.length,
    };
  });
  const maxFt = Math.max(...groupStats.map(g => g.ftThisMonth), 1);

  // Recent activity
  const recentMembers = [...members].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10);
  const recentTasks = [...tasks].filter(t => t.completed_at).sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()).slice(0, 10);
  type ActivityItem = { time: string; text: string; type: string };
  const activity: ActivityItem[] = [
    ...recentMembers.map(m => ({ time: m.created_at, text: `${m.full_name} registered as ${m.status}`, type: "register" })),
    ...recentTasks.map(t => ({ time: t.completed_at, text: `Task "${t.action_name}" completed`, type: "task" })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 15);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-display font-extrabold text-foreground">Dashboard Overview</h2>
        <p className="text-muted-foreground mt-1">KingsRetention — All Churches</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Users className="h-5 w-5" />} label="Total Members" value={totalMembers} bg="bg-accent/20" iconColor="text-accent" valueColor="text-accent" />
        <StatCard icon={<UserPlus className="h-5 w-5" />} label="First Timers This Month" value={ftThisMonth} bg="gradient-primary" iconColor="text-primary-foreground" valueColor="text-primary" />
        <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Retention Rate" value={`${retentionRate}%`} bg="bg-success/20" iconColor="text-success" valueColor="text-success" />
        <StatCard icon={<Award className="h-5 w-5" />} label="Active Cell Leaders" value={cellLeaderCount} bg="bg-info/20" iconColor="text-info" valueColor="text-info" />
      </div>

      {/* Group Comparison */}
      <div className="grid md:grid-cols-3 gap-4">
        {groupStats.map(g => (
          <Card key={g.key} className="cursor-pointer hover:border-primary/50 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{g.icon}</span>
                <h3 className="font-display font-bold text-foreground text-sm">{g.name}</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">First Timers</span><span className="font-semibold">{g.ftThisMonth}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Retention</span><span className="font-semibold">{g.retentionRate}%</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Churches</span><span className="font-semibold">{g.churchCount}</span></div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden mt-1">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(g.ftThisMonth / maxFt) * 100}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pipeline + Follow-up Health */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-5">
            <h3 className="font-display font-bold text-foreground mb-4">First Timers Pipeline</h3>
            <div className="space-y-2">
              {funnelData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-28">{d.name}</span>
                  <div className="flex-1 h-6 rounded-lg overflow-hidden bg-secondary">
                    <div className="h-full rounded-lg transition-all" style={{ width: `${members.length ? (d.value / members.length) * 100 : 0}%`, backgroundColor: d.fill }} />
                  </div>
                  <span className="text-sm font-semibold w-10 text-right">{d.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <h3 className="font-display font-bold text-foreground mb-4">Follow-Up Health</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={healthData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {healthData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              {healthData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: DONUT_COLORS[i] }} />
                  <span className="text-muted-foreground">{d.name}: {d.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card>
        <CardContent className="p-5">
          <h3 className="font-display font-bold text-foreground mb-4">Recent Activity</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {activity.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No recent activity</p>}
            {activity.map((a, i) => (
              <div key={i} className="flex items-start gap-3 p-2 rounded-xl hover:bg-secondary/50">
                <div className={`p-1.5 rounded-lg ${a.type === "register" ? "bg-primary/20" : "bg-success/20"}`}>
                  {a.type === "register" ? <UserPlus className="h-3.5 w-3.5 text-primary" /> : <CheckCircle2 className="h-3.5 w-3.5 text-success" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{a.text}</p>
                  <p className="text-xs text-muted-foreground">{new Date(a.time).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ────────────────────────────────────────────
// VARIANT 2: Group Admin
// ────────────────────────────────────────────
function GroupAdminDashboard() {
  const { role, organizationId } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  const groupName = role === "erediauwa_admin" ? "Erediauwa Group" : role === "loveworldcity_admin" ? "LoveworldCity & Environs" : "Youth & Teens Church";
  const groupId = role === "erediauwa_admin" ? GROUP_IDS.erediauwa.id : role === "loveworldcity_admin" ? GROUP_IDS.loveworldcity.id : GROUP_IDS.youth.id;

  useEffect(() => {
    Promise.all([
      supabase.from("members").select("*"),
      supabase.from("follow_up_tasks").select("*"),
      supabase.from("organizations").select("*"),
    ]).then(([mRes, tRes, oRes]) => {
      const allOrgs = oRes.data || [];
      const childIds = allOrgs.filter(o => o.parent_id === groupId).map(o => o.id);
      const scopeIds = [groupId, ...childIds];
      setMembers((mRes.data || []).filter(m => m.organization_id && scopeIds.includes(m.organization_id)));
      setTasks(tRes.data || []);
      setOrgs(allOrgs);
      setLoaded(true);
    });
  }, [groupId]);

  if (!loaded) return <DashboardSkeleton />;

  const ms = monthStart();
  const sw = sixWeeksAgo();
  const totalMembers = members.filter(m => ["Member", "Worker"].includes(m.status)).length;
  const ftThisMonth = members.filter(m => m.status === "First Timer" && m.date_of_first_visit >= ms).length;
  const ftLast6w = members.filter(m => m.date_of_first_visit >= sw).length;
  const retained6w = members.filter(m => m.date_of_first_visit >= sw && ["Member", "Worker"].includes(m.status)).length;
  const retentionRate = ftLast6w > 0 ? Math.round((retained6w / ftLast6w) * 100) : 0;

  const childChurches = orgs.filter(o => o.parent_id === groupId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-display font-extrabold text-foreground">{groupName}</h2>
        <p className="text-muted-foreground mt-1">Group Dashboard</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Users className="h-5 w-5" />} label="Total Members" value={totalMembers} bg="bg-accent/20" iconColor="text-accent" valueColor="text-accent" />
        <StatCard icon={<UserPlus className="h-5 w-5" />} label="First Timers This Month" value={ftThisMonth} bg="gradient-primary" iconColor="text-primary-foreground" valueColor="text-primary" />
        <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Retention Rate" value={`${retentionRate}%`} bg="bg-success/20" iconColor="text-success" valueColor="text-success" />
        <StatCard icon={<Building2 className="h-5 w-5" />} label="Churches" value={childChurches.length} bg="bg-info/20" iconColor="text-info" valueColor="text-info" />
      </div>

      {/* Church breakdown */}
      <h3 className="font-display font-bold text-foreground">Churches Breakdown</h3>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {childChurches.map(church => {
          const cm = members.filter(m => m.organization_id === church.id);
          const cft = cm.filter(m => m.status === "First Timer" && m.date_of_first_visit >= ms).length;
          const cAll = cm.filter(m => m.date_of_first_visit >= sw).length;
          const cRet = cm.filter(m => m.date_of_first_visit >= sw && ["Member", "Worker"].includes(m.status)).length;
          const cRate = cAll > 0 ? Math.round((cRet / cAll) * 100) : 0;
          return (
            <Card key={church.id}>
              <CardContent className="p-5">
                <h4 className="font-display font-bold text-foreground text-sm mb-2">{church.name}</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Members</span><span className="font-semibold">{cm.length}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">First Timers</span><span className="font-semibold">{cft}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Retention</span><span className="font-semibold">{cRate}%</span></div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pipeline */}
      <Card>
        <CardContent className="p-5">
          <h3 className="font-display font-bold text-foreground mb-4">Pipeline</h3>
          <div className="space-y-2">
            {STATUS_ORDER.map((s, i) => {
              const count = members.filter(m => m.status === s).length;
              return (
                <div key={s} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-28">{s}</span>
                  <div className="flex-1 h-6 rounded-lg overflow-hidden bg-secondary">
                    <div className="h-full rounded-lg" style={{ width: `${members.length ? (count / members.length) * 100 : 0}%`, backgroundColor: FUNNEL_COLORS[i] }} />
                  </div>
                  <span className="text-sm font-semibold w-10 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ────────────────────────────────────────────
// VARIANT 3: Church Pastor
// ────────────────────────────────────────────
function ChurchPastorDashboard() {
  const { organizationId, role } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      scopeQuery(supabase.from("members").select("*"), role, organizationId),
      supabase.from("follow_up_tasks").select("*"),
    ]).then(([mRes, tRes]) => {
      setMembers(mRes.data || []);
      setTasks(tRes.data || []);
      setLoaded(true);
    });
  }, [role, organizationId]);

  if (!loaded) return <DashboardSkeleton />;

  const ms = monthStart();
  const today = new Date().toISOString().split("T")[0];
  const totalMembers = members.length;
  const ftThisMonth = members.filter(m => m.status === "First Timer" && m.date_of_first_visit >= ms).length;
  const memberIds = new Set(members.map(m => m.id));
  const myTasks = tasks.filter(t => memberIds.has(t.member_id));
  const overdueTasks = myTasks.filter(t => !t.completed && t.due_date && t.due_date < today).length;
  const fsInProgress = members.filter(m => m.foundation_school_status === "In Progress").length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-display font-extrabold text-foreground">My Church Dashboard</h2>
        <p className="text-muted-foreground mt-1">Pastor's Overview</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Users className="h-5 w-5" />} label="My Church Members" value={totalMembers} bg="bg-accent/20" iconColor="text-accent" valueColor="text-accent" />
        <StatCard icon={<UserPlus className="h-5 w-5" />} label="First Timers This Month" value={ftThisMonth} bg="gradient-primary" iconColor="text-primary-foreground" valueColor="text-primary" />
        <StatCard icon={<AlertTriangle className="h-5 w-5" />} label="Tasks Overdue" value={overdueTasks} bg="bg-destructive/20" iconColor="text-destructive" valueColor="text-destructive" />
        <StatCard icon={<GraduationCap className="h-5 w-5" />} label="Foundation School Active" value={fsInProgress} bg="bg-info/20" iconColor="text-info" valueColor="text-info" />
      </div>

      {/* Pipeline */}
      <Card>
        <CardContent className="p-5">
          <h3 className="font-display font-bold text-foreground mb-4">6-Week Pipeline</h3>
          <div className="space-y-2">
            {STATUS_ORDER.map((s, i) => {
              const count = members.filter(m => m.status === s).length;
              return (
                <div key={s} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-28">{s}</span>
                  <div className="flex-1 h-6 rounded-lg overflow-hidden bg-secondary">
                    <div className="h-full rounded-lg" style={{ width: `${totalMembers ? (count / totalMembers) * 100 : 0}%`, backgroundColor: FUNNEL_COLORS[i] }} />
                  </div>
                  <span className="text-sm font-semibold w-10 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Urgent Tasks */}
      {overdueTasks > 0 && (
        <Card className="border-destructive/30">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <h3 className="font-display font-bold text-destructive">Overdue Tasks ({overdueTasks})</h3>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {myTasks.filter(t => !t.completed && t.due_date && t.due_date < today).slice(0, 10).map(t => {
                const member = members.find(m => m.id === t.member_id);
                return (
                  <div key={t.id} className="flex items-center justify-between p-2 rounded-xl bg-destructive/10">
                    <div>
                      <p className="text-sm font-medium text-foreground">{member?.full_name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{t.action_name} — due {t.due_date}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ────────────────────────────────────────────
// VARIANT 4: Follow-Up Staff
// ────────────────────────────────────────────
function FollowUpDashboard() {
  const { organizationId, role } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      scopeQuery(supabase.from("members").select("*"), role, organizationId),
      supabase.from("follow_up_tasks").select("*"),
    ]).then(([mRes, tRes]) => {
      setMembers(mRes.data || []);
      setTasks(tRes.data || []);
      setLoaded(true);
    });
  }, [role, organizationId]);

  if (!loaded) return <DashboardSkeleton />;

  const today = new Date().toISOString().split("T")[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
  const memberIds = new Set(members.map(m => m.id));
  const myTasks = tasks.filter(t => memberIds.has(t.member_id));

  const ftCount = members.filter(m => ["First Timer", "Second Timer", "New Convert"].includes(m.status)).length;
  const doneThisWeek = myTasks.filter(t => t.completed && t.completed_at && t.completed_at >= weekAgo).length;
  const overdue = myTasks.filter(t => !t.completed && t.due_date && t.due_date < today).length;
  // "Pending verification" - completed but not yet verified (simulated - completed tasks)
  const pendingVerification = myTasks.filter(t => t.completed).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-display font-extrabold text-foreground">Follow-Up Dashboard</h2>
        <p className="text-muted-foreground mt-1">Manage follow-up activities</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Users className="h-5 w-5" />} label="First Timers" value={ftCount} bg="gradient-primary" iconColor="text-primary-foreground" valueColor="text-primary" />
        <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Done This Week" value={doneThisWeek} bg="bg-success/20" iconColor="text-success" valueColor="text-success" />
        <StatCard icon={<ClipboardList className="h-5 w-5" />} label="Pending Verification" value={pendingVerification} bg="bg-warning/20" iconColor="text-warning" valueColor="text-warning" />
        <StatCard icon={<AlertTriangle className="h-5 w-5" />} label="Overdue" value={overdue} bg="bg-destructive/20" iconColor="text-destructive" valueColor="text-destructive" />
      </div>

      {/* Overdue alerts */}
      {overdue > 0 && (
        <Card className="border-destructive/30">
          <CardContent className="p-5">
            <h3 className="font-display font-bold text-destructive mb-3">⚠️ Overdue Tasks</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {myTasks.filter(t => !t.completed && t.due_date && t.due_date < today).map(t => {
                const member = members.find(m => m.id === t.member_id);
                return (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-destructive/10">
                    <div>
                      <p className="text-sm font-medium">{member?.full_name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">Week {t.week_number} — {t.action_name}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent completions */}
      <Card>
        <CardContent className="p-5">
          <h3 className="font-display font-bold text-foreground mb-3">Recently Completed</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {myTasks.filter(t => t.completed).sort((a, b) => new Date(b.completed_at || 0).getTime() - new Date(a.completed_at || 0).getTime()).slice(0, 10).map(t => {
              const member = members.find(m => m.id === t.member_id);
              return (
                <div key={t.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-secondary/50">
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                  <div>
                    <p className="text-sm">{member?.full_name}: {t.action_name}</p>
                    <p className="text-xs text-muted-foreground">{t.completed_at && new Date(t.completed_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>
                  </div>
                </div>
              );
            })}
            {myTasks.filter(t => t.completed).length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No completed tasks yet</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ────────────────────────────────────────────
// VARIANT 5: Cell Leader (WhatsApp-like)
// ────────────────────────────────────────────
function CellLeaderDashboard() {
  const { profile, organizationId, role } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      // Cell leaders see members assigned to them
      const profileId = profile?.id;
      if (!profileId) return;
      const [mRes, tRes] = await Promise.all([
        supabase.from("members").select("*").eq("assigned_follow_up_leader", profileId),
        supabase.from("follow_up_tasks").select("*"),
      ]);
      setMembers(mRes.data || []);
      setTasks(tRes.data || []);
      setLoaded(true);
    }
    load();
  }, [profile?.id]);

  if (!loaded) return <DashboardSkeleton />;

  const today = new Date().toISOString().split("T")[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const memberIds = new Set(members.map(m => m.id));
  const myTasks = tasks.filter(t => memberIds.has(t.member_id));
  const urgentCount = myTasks.filter(t => !t.completed && t.due_date && t.due_date <= today).length;

  // Get current week for each member
  function getMemberWeek(memberId: string) {
    const memberTasks = myTasks.filter(t => t.member_id === memberId);
    if (memberTasks.length === 0) return 1;
    const maxWeek = Math.max(...memberTasks.map(t => t.week_number));
    const allDone = memberTasks.filter(t => t.week_number === maxWeek).every(t => t.completed);
    return allDone ? Math.min(maxWeek + 1, 6) : maxWeek;
  }

  function getStatus(memberId: string): "overdue" | "due" | "ontrack" {
    const mt = myTasks.filter(t => t.member_id === memberId && !t.completed);
    if (mt.some(t => t.due_date && t.due_date < today)) return "overdue";
    if (mt.some(t => t.due_date && t.due_date === today)) return "due";
    return "ontrack";
  }

  const statusDot = { overdue: "🔴", due: "🟡", ontrack: "🟢" };

  return (
    <div className="space-y-4 pb-20">
      {/* Greeting */}
      <div className="pt-2">
        <h2 className="text-2xl font-display font-extrabold text-foreground">{greeting}, {profile?.full_name?.split(" ")[0]} 🙏</h2>
        <p className="text-muted-foreground text-sm">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
      </div>

      {/* Urgent banner */}
      {urgentCount > 0 && (
        <div className="rounded-2xl bg-destructive/15 border border-destructive/30 p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
          <p className="text-sm font-semibold text-destructive">⚠️ {urgentCount} urgent task{urgentCount !== 1 ? "s" : ""} need attention today</p>
        </div>
      )}

      {/* Members */}
      <div className="space-y-3">
        {members.length === 0 && (
          <Card><CardContent className="p-8 text-center text-muted-foreground"><Users className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>No members assigned to you yet</p></CardContent></Card>
        )}
        {members.map(m => {
          const week = getMemberWeek(m.id);
          const status = getStatus(m.id);
          const isExpanded = expandedId === m.id;
          const memberTasks = myTasks.filter(t => t.member_id === m.id).sort((a, b) => a.week_number - b.week_number);

          return (
            <Card key={m.id} className={status === "overdue" ? "border-destructive/40" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : m.id)}>
                  <div className="h-12 w-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg shrink-0">
                    {m.full_name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-lg text-foreground">{m.full_name}</p>
                    <p className="text-sm text-muted-foreground">Week {week} of 6 {statusDot[status]}</p>
                  </div>
                  {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 mt-3">
                  {m.phone_number && (
                    <>
                      <Button size="sm" className="flex-1 bg-success hover:bg-success/90 text-white" onClick={(e) => { e.stopPropagation(); window.open(`tel:${m.phone_number}`); }}>
                        <Phone className="h-4 w-4 mr-1" /> CALL
                      </Button>
                      <Button size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/234${m.phone_number.replace(/^0+/, "").replace(/^\+234/, "")}`); }}>
                        <MessageCircle className="h-4 w-4 mr-1" /> WHATSAPP
                      </Button>
                    </>
                  )}
                </div>

                {/* Expanded task checklist */}
                {isExpanded && (
                  <div className="mt-4 space-y-2 border-t border-border pt-3">
                    {memberTasks.length === 0 && <p className="text-sm text-muted-foreground">No tasks created yet</p>}
                    {memberTasks.map(t => (
                      <label key={t.id} className={`flex items-center gap-3 p-2 rounded-xl ${t.completed ? "bg-success/10" : "hover:bg-secondary/50"} cursor-pointer`}>
                        <input
                          type="checkbox"
                          checked={t.completed || false}
                          disabled={t.completed}
                          onChange={async () => {
                            if (t.completed) return;
                            await supabase.from("follow_up_tasks").update({ completed: true, completed_at: new Date().toISOString() }).eq("id", t.id);
                            setTasks(prev => prev.map(pt => pt.id === t.id ? { ...pt, completed: true, completed_at: new Date().toISOString() } : pt));
                          }}
                          className="h-5 w-5 rounded accent-[hsl(var(--success))]"
                        />
                        <div className="flex-1">
                          <p className={`text-sm ${t.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                            Week {t.week_number}: {t.action_name}
                          </p>
                        </div>
                        {t.completed && <CheckCircle2 className="h-4 w-4 text-success shrink-0" />}
                      </label>
                    ))}
                    <p className="text-xs text-muted-foreground mt-2 italic">Your pastor's team will confirm completed tasks</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// VARIANT 6: Foundation School
// ────────────────────────────────────────────
function FoundationSchoolDashboard() {
  const { organizationId, role } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    scopeQuery(supabase.from("members").select("*"), role, organizationId).then(({ data }) => {
      setMembers(data || []);
      setLoaded(true);
    });
  }, [role, organizationId]);

  if (!loaded) return <DashboardSkeleton />;

  const enrolled = members.filter(m => m.foundation_school_status && m.foundation_school_status !== "Not Started");
  const completed = members.filter(m => m.foundation_school_status === "Completed").length;
  const inProgress = members.filter(m => m.foundation_school_status === "In Progress").length;
  const notStarted = members.filter(m => !m.foundation_school_status || m.foundation_school_status === "Not Started").length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-display font-extrabold text-foreground">Foundation School</h2>
        <p className="text-muted-foreground mt-1">Track student progress</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<GraduationCap className="h-5 w-5" />} label="Total Enrolled" value={enrolled.length} bg="gradient-primary" iconColor="text-primary-foreground" valueColor="text-primary" />
        <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Completed" value={completed} bg="bg-success/20" iconColor="text-success" valueColor="text-success" />
        <StatCard icon={<ClipboardList className="h-5 w-5" />} label="In Progress" value={inProgress} bg="bg-warning/20" iconColor="text-warning" valueColor="text-warning" />
        <StatCard icon={<Users className="h-5 w-5" />} label="Not Started" value={notStarted} bg="bg-secondary" iconColor="text-muted-foreground" valueColor="text-muted-foreground" />
      </div>

      {/* Student list */}
      <Card>
        <CardContent className="p-5">
          <h3 className="font-display font-bold text-foreground mb-4">Students</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {enrolled.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No students enrolled yet</p>}
            {enrolled.map(m => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-secondary/80">
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">{m.full_name?.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{m.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.foundation_school_start ? `Started ${new Date(m.foundation_school_start).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : "No start date"}
                  </p>
                </div>
                <Badge variant="outline" className={m.foundation_school_status === "Completed" ? "bg-success/15 text-success border-success/30" : "bg-warning/15 text-warning border-warning/30"}>
                  {m.foundation_school_status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ────────────────────────────────────────────
// VARIANT 7: Department Leader/Staff
// ────────────────────────────────────────────
function DepartmentDashboard() {
  const { organizationId, role, profile } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    scopeQuery(supabase.from("members").select("*, departments(name)"), role, organizationId).then(({ data }) => {
      setMembers(data || []);
      setLoaded(true);
    });
  }, [role, organizationId]);

  if (!loaded) return <DashboardSkeleton />;

  const ms = monthStart();
  const deptMembers = members.filter(m => m.department_joined);
  const newThisMonth = deptMembers.filter(m => m.created_at && m.created_at >= ms).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-display font-extrabold text-foreground">Department Dashboard</h2>
        <p className="text-muted-foreground mt-1">Manage your department members</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard icon={<Building2 className="h-5 w-5" />} label="Department Members" value={deptMembers.length} bg="bg-accent/20" iconColor="text-accent" valueColor="text-accent" />
        <StatCard icon={<UserPlus className="h-5 w-5" />} label="New This Month" value={newThisMonth} bg="gradient-primary" iconColor="text-primary-foreground" valueColor="text-primary" />
        <StatCard icon={<Users className="h-5 w-5" />} label="Total Church Members" value={members.length} bg="bg-info/20" iconColor="text-info" valueColor="text-info" />
      </div>

      <Card>
        <CardContent className="p-5">
          <h3 className="font-display font-bold text-foreground mb-4">Members</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {deptMembers.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No department members yet</p>}
            {deptMembers.map(m => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-secondary/80">
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">{m.full_name?.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{m.full_name}</p>
                  <p className="text-xs text-muted-foreground">{m.phone_number || "No phone"}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ────────────────────────────────────────────
// MAIN DASHBOARD — Role Router
// ────────────────────────────────────────────
export default function Dashboard() {
  const { role, isLoading } = useAuth();

  if (isLoading) return <DashboardSkeleton />;

  switch (role) {
    case "king_admin":
    case "admin":
      return <KingAdminDashboard />;

    case "erediauwa_admin":
    case "loveworldcity_admin":
    case "youth_teens_admin":
      return <GroupAdminDashboard />;

    case "church_pastor":
    case "pastor":
      return <ChurchPastorDashboard />;

    case "follow_up_team":
      return <FollowUpDashboard />;

    case "cell_leader":
      return <CellLeaderDashboard />;

    case "foundation_school_staff":
    case "foundation_school_leader":
      return <FoundationSchoolDashboard />;

    case "department_head":
    case "department_staff":
      return <DepartmentDashboard />;

    default:
      return <KingAdminDashboard />;
  }
}
