import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Globe, Users, TrendingUp, MapPin, Trophy, BarChart3, Droplets } from "lucide-react";

export default function GlobalCommand() {
  const [members, setMembers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [cellGroups, setCellGroups] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function fetch() {
      const [mRes, tRes, cRes, pRes] = await Promise.all([
        supabase.from("members").select("*"),
        supabase.from("follow_up_tasks").select("*"),
        supabase.from("cell_groups").select("*"),
        supabase.from("profiles").select("*"),
      ]);
      setMembers(mRes.data || []);
      setTasks(tRes.data || []);
      setCellGroups(cRes.data || []);
      setProfiles(pRes.data || []);
      setLoaded(true);
    }
    fetch();
  }, []);

  const total = members.length;
  const firstTimers = members.filter(m => m.status === "First Timer").length;
  const retained = members.filter(m => ["Member", "Worker"].includes(m.status)).length;
  const retentionRate = total ? Math.round((retained / total) * 100) : 0;
  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const followUpRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Location aggregation
  const locationData: Record<string, number> = {};
  members.forEach(m => {
    const l = (m.location || "").trim();
    if (l) locationData[l] = (locationData[l] || 0) + 1;
  });
  const sortedLocations = Object.entries(locationData).sort((a, b) => b[1] - a[1]);

  // Status breakdown
  const statusData: Record<string, number> = {};
  members.forEach(m => { statusData[m.status] = (statusData[m.status] || 0) + 1; });

  // Leader stats
  const leaderCount: Record<string, number> = {};
  members.forEach(m => {
    if (m.assigned_follow_up_leader) leaderCount[m.assigned_follow_up_leader] = (leaderCount[m.assigned_follow_up_leader] || 0) + 1;
  });
  const topLeaderIds = Object.entries(leaderCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const profileMap: Record<string, string> = {};
  profiles.forEach(p => { profileMap[p.id] = p.full_name; });

  // Cell group stats
  const cellMemberCounts: Record<string, number> = {};
  members.forEach(m => {
    if (m.assigned_cell_group) cellMemberCounts[m.assigned_cell_group] = (cellMemberCounts[m.assigned_cell_group] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-display font-extrabold text-foreground">Global Command Overview</h2>
        <p className="text-muted-foreground mt-1">Week of {new Date().toLocaleDateString("en-GB", { month: "long", day: "numeric" })} • Real-time intelligence</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Members", value: total.toLocaleString(), sub: "Active in database", icon: <Users className="h-4 w-4" />, color: "text-primary", bg: "gradient-primary", iconColor: "text-primary-foreground", trend: 8 },
          { label: "First Timers", value: firstTimers, sub: "Awaiting follow-up", icon: <TrendingUp className="h-4 w-4" />, color: "text-accent", bg: "bg-accent/20", iconColor: "text-accent", trend: 12 },
          { label: "Follow-Up Rate", value: `${followUpRate}%`, sub: `${completedTasks}/${totalTasks} tasks done`, icon: <BarChart3 className="h-4 w-4" />, color: "text-info", bg: "bg-info/20", iconColor: "text-info", trend: 5 },
          { label: "Retention Rate", value: `${retentionRate}%`, sub: `${retained} members retained`, icon: <Globe className="h-4 w-4" />, color: "text-success", bg: "bg-success/20", iconColor: "text-success", trend: 3 },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground font-medium">{s.label}</span>
                <div className={`${s.bg} p-2 rounded-xl`}><span className={s.iconColor}>{s.icon}</span></div>
              </div>
              <p className={`text-3xl font-display font-extrabold ${s.color}`}>{s.value}</p>
              {s.sub && <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>}
              <p className="text-xs text-success font-semibold mt-1 flex items-center gap-1">▲ {s.trend}% vs last week</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Intelligence Map - Locations */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary/20 p-2.5 rounded-xl"><MapPin className="h-4 w-4 text-primary" /></div>
              <div>
                <h3 className="font-display font-bold text-foreground">Zone Intelligence</h3>
                <p className="text-xs text-muted-foreground">{total} members across {sortedLocations.length} zones</p>
              </div>
            </div>
            <div className="space-y-3">
              {sortedLocations.slice(0, 8).map(([loc, count]) => (
                <div key={loc} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">📍</span>
                  <span className="text-sm text-foreground flex-1">{loc}</span>
                  <div className="w-20 h-1.5 rounded-full progress-bar-track overflow-hidden">
                    <div className="h-full rounded-full progress-bar-fill" style={{ width: `${(count / total) * 100}%` }} />
                  </div>
                  <span className="text-xs font-display font-bold text-primary w-8 text-right">{count}</span>
                </div>
              ))}
              {sortedLocations.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No location data.</p>}
            </div>
            {sortedLocations.length > 0 && (
              <div className="mt-4 p-3 bg-success/10 border border-success/20 rounded-xl text-xs text-success">
                💡 {Math.ceil(total / 25)} cell groups recommended based on member density
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leaders of the Week */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-accent/20 p-2.5 rounded-xl"><Trophy className="h-4 w-4 text-accent" /></div>
              <div>
                <h3 className="font-display font-bold text-foreground">Top Leaders</h3>
                <p className="text-xs text-muted-foreground">By members assigned</p>
              </div>
            </div>
            <div className="space-y-2">
              {topLeaderIds.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No leader data yet.</p>
              ) : topLeaderIds.map(([id, count], i) => (
                <div key={id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? "bg-accent/20 text-accent" : "bg-secondary text-muted-foreground border border-[rgba(255,255,255,0.1)]"
                  }`}>{i === 0 ? "🏆" : i + 1}</div>
                  <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
                    {(profileMap[id] || "?").split(" ").map(n => n[0]).slice(0, 2).join("")}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{profileMap[id] || "Unknown"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-display font-extrabold text-primary">{count}</p>
                    <p className="text-xs text-muted-foreground">assigned</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cell Groups */}
      {cellGroups.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <h3 className="font-display font-bold text-foreground mb-4">Cell Group Overview</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {cellGroups.map(cg => (
                <div key={cg.id} className="bg-secondary rounded-xl p-4">
                  <p className="font-semibold text-foreground text-sm">{cg.name}</p>
                  <p className="text-xs text-muted-foreground">{cg.location || "No location"}</p>
                  <p className="text-lg font-display font-extrabold text-primary mt-2">{cellMemberCounts[cg.id] || 0}</p>
                  <p className="text-xs text-muted-foreground">members</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Overview */}
      <Card>
        <CardContent className="p-5">
          <h3 className="font-display font-bold text-foreground mb-4">Member Status Overview</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {Object.entries(statusData).map(([status, count]) => (
              <div key={status} className="bg-secondary rounded-xl p-3 text-center">
                <p className="text-2xl font-display font-extrabold text-foreground">{count}</p>
                <p className="text-xs text-muted-foreground mt-1">{status}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
