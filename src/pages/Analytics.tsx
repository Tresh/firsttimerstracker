import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, UserPlus, TrendingUp, CheckCircle2 } from "lucide-react";

export default function Analytics() {
  const [stats, setStats] = useState({ total: 0, firstTimers: 0, retained: 0, followUps: 0, retentionRate: 0 });

  useEffect(() => {
    async function fetch() {
      const [totalRes, ftRes, retainedRes, fuRes] = await Promise.all([
        supabase.from("members").select("id", { count: "exact", head: true }),
        supabase.from("members").select("id", { count: "exact", head: true }).eq("status", "First Timer"),
        supabase.from("members").select("id", { count: "exact", head: true }).in("status", ["Member", "Worker"]),
        supabase.from("follow_up_tasks").select("id", { count: "exact", head: true }).eq("completed", true),
      ]);
      const total = totalRes.count || 0;
      const retained = retainedRes.count || 0;
      setStats({
        total, firstTimers: ftRes.count || 0, retained, followUps: fuRes.count || 0,
        retentionRate: total > 0 ? Math.round((retained / total) * 100) : 0,
      });
    }
    fetch();
  }, []);

  const cards = [
    { icon: <Users className="h-5 w-5" />, title: "Total Members", value: stats.total, color: "text-primary", bg: "gradient-primary", iconColor: "text-primary-foreground" },
    { icon: <UserPlus className="h-5 w-5" />, title: "First Timers", value: stats.firstTimers, color: "text-accent", bg: "bg-accent/20", iconColor: "text-accent" },
    { icon: <TrendingUp className="h-5 w-5" />, title: "Retained", value: stats.retained, color: "text-success", bg: "bg-success/20", iconColor: "text-success" },
    { icon: <CheckCircle2 className="h-5 w-5" />, title: "Follow-Ups Done", value: stats.followUps, color: "text-info", bg: "bg-info/20", iconColor: "text-info" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-display font-extrabold text-foreground">Analytics</h2>
        <p className="text-muted-foreground mt-1">Church growth metrics at a glance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <Card key={i}>
            <CardContent className="p-5 text-center">
              <div className={`${c.bg} p-3 rounded-xl w-fit mx-auto mb-3`}><span className={c.iconColor}>{c.icon}</span></div>
              <p className={`text-3xl font-display font-extrabold ${c.color}`}>{c.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{c.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="gradient-primary p-2.5 rounded-xl"><BarChart3 className="h-5 w-5 text-primary-foreground" /></div>
          <CardTitle>Retention Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">Overall Retention Rate</span>
            <span className="text-4xl font-display font-extrabold gradient-gold">{stats.retentionRate}%</span>
          </div>
          <div className="h-4 rounded-full progress-bar-track overflow-hidden">
            <div className="h-full rounded-full progress-bar-fill transition-all duration-1000" style={{ width: `${stats.retentionRate}%` }} />
          </div>
          <p className="text-sm text-muted-foreground mt-3">{stats.retained} out of {stats.total} members retained as active members or workers.</p>
        </CardContent>
      </Card>
    </div>
  );
}
