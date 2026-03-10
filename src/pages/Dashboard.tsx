import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, Users, Award, Building2, GraduationCap, ClipboardList, Calendar, TrendingUp, AlertTriangle, MapPin } from "lucide-react";

export default function Dashboard() {
  const [members, setMembers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function fetch() {
      const [membersRes, tasksRes] = await Promise.all([
        supabase.from("members").select("*").order("date_of_first_visit", { ascending: false }),
        supabase.from("follow_up_tasks").select("*"),
      ]);
      setMembers(membersRes.data || []);
      setTasks(tasksRes.data || []);
      setLoaded(true);
    }
    fetch();
  }, []);

  const firstTimers = members.filter(m => ["First Timer", "Second Timer"].includes(m.status));
  const retained = members.filter(m => ["Member", "Worker"].includes(m.status));
  const retentionRate = members.length ? Math.round((retained.length / members.length) * 100) : 0;
  const completedTasks = tasks.filter(t => t.completed).length;
  const recentFirstTimers = members.filter(m => m.status === "First Timer").slice(0, 5);

  // Notifications / Alerts
  const noLeader = members.filter(m => ["First Timer", "Second Timer"].includes(m.status) && !m.assigned_follow_up_leader);
  const notifications: string[] = [
    ...noLeader.map(m => `${m.full_name} has no assigned follow-up leader`),
  ];

  // Location aggregation
  const locationGroups: Record<string, number> = {};
  members.forEach(m => {
    const loc = (m.location || "").trim();
    if (loc) locationGroups[loc] = (locationGroups[loc] || 0) + 1;
  });

  const statusColors: Record<string, string> = {
    "First Timer": "badge-gold",
    "Second Timer": "badge-primary",
    "New Convert": "bg-purple-500/15 text-purple-400 border border-purple-500/30",
    "Member": "bg-success/15 text-success border border-success/30",
    "Worker": "bg-info/15 text-info border border-info/30",
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-display font-extrabold text-foreground">Dashboard Overview</h2>
        <p className="text-muted-foreground mt-1">KingsRetention — Week of {new Date().toLocaleDateString("en-GB", { month: "long", day: "numeric", year: "numeric" })}</p>
      </div>

      {/* Alerts */}
      {notifications.length > 0 && (
        <div className="rounded-2xl bg-warning/10 border border-warning/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <span className="font-semibold text-warning text-sm">Alerts ({notifications.length})</span>
          </div>
          <div className="space-y-1.5">
            {notifications.slice(0, 3).map((n, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-warning/80">
                <span className="mt-0.5 flex-shrink-0">⚠️</span>
                <span>{n}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: <UserPlus className="h-5 w-5" />, label: "First Timers", value: firstTimers.length, bg: "gradient-primary", iconColor: "text-primary-foreground", valueColor: "text-primary", trend: "+12%" },
          { icon: <Users className="h-5 w-5" />, label: "Total Members", value: members.length, bg: "bg-accent/20", iconColor: "text-accent", valueColor: "text-accent", trend: "+8%" },
          { icon: <TrendingUp className="h-5 w-5" />, label: "Retention Rate", value: `${retentionRate}%`, bg: "bg-success/20", iconColor: "text-success", valueColor: "text-success", trend: "+5%" },
          { icon: <ClipboardList className="h-5 w-5" />, label: "Follow-Ups Done", value: completedTasks, bg: "bg-info/20", iconColor: "text-info", valueColor: "text-info" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className={`${s.bg} p-2.5 rounded-xl w-fit mb-3`}>
                <span className={s.iconColor}>{s.icon}</span>
              </div>
              <p className={`text-3xl font-display font-extrabold ${s.valueColor}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              {s.trend && <p className="text-xs text-success font-semibold mt-1">▲ {s.trend} this month</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Retention Progress */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold text-foreground">Retention Progress</h3>
            <span className="text-2xl font-display font-extrabold text-primary">{retentionRate}%</span>
          </div>
          <div className="h-3 rounded-full progress-bar-track overflow-hidden">
            <div className="h-full rounded-full progress-bar-fill transition-all duration-1000" style={{ width: `${retentionRate}%` }} />
          </div>
          <p className="text-sm text-muted-foreground mt-2">{retained.length} of {members.length} visitors are now active members</p>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent First Timers */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="gradient-primary p-2.5 rounded-xl"><UserPlus className="h-4 w-4 text-primary-foreground" /></div>
              <div>
                <h3 className="font-display font-bold text-foreground">Recent First Timers</h3>
                <p className="text-xs text-muted-foreground">Newest visitors</p>
              </div>
            </div>
            <div className="space-y-2">
              {recentFirstTimers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No first timers yet.</p>
              ) : recentFirstTimers.map((m) => (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
                  <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm">{m.full_name?.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{m.full_name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(m.date_of_first_visit).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[m.status] || "badge-primary"}`}>{m.status}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Member Locations */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-success/20 p-2.5 rounded-xl"><MapPin className="h-4 w-4 text-success" /></div>
              <div>
                <h3 className="font-display font-bold text-foreground">Member Locations</h3>
                <p className="text-xs text-muted-foreground">Where our members are</p>
              </div>
            </div>
            <div className="space-y-3">
              {Object.entries(locationGroups).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([loc, count]) => (
                <div key={loc} className="flex items-center gap-3">
                  <span className="text-sm text-foreground flex-1 truncate">{loc}</span>
                  <div className="w-24 h-1.5 rounded-full progress-bar-track overflow-hidden">
                    <div className="h-full rounded-full bg-success" style={{ width: `${(count / members.length) * 100}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground w-16 text-right">{count} {count === 1 ? "person" : "people"}</span>
                </div>
              ))}
              {Object.keys(locationGroups).length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No location data yet.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
