import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Users, Award, Building2, GraduationCap, ClipboardList, Calendar, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState({
    firstTimers: 0, members: 0, leaders: 0, departments: 0, foundationSchool: 0,
  });
  const [pipelineStats, setPipelineStats] = useState({
    totalTasks: 0, completedTasks: 0, completionRate: 0,
  });

  useEffect(() => {
    async function fetchDashboardStats() {
      const [ftRes, membersRes, leadersRes, deptRes, fsRes, tasksRes] = await Promise.all([
        supabase.from("members").select("id", { count: "exact", head: true }).eq("status", "First Timer"),
        supabase.from("members").select("id", { count: "exact", head: true }),
        supabase.from("user_roles").select("id", { count: "exact", head: true }).in("role", ["pastor", "cell_leader", "follow_up_team"]),
        supabase.from("departments").select("id", { count: "exact", head: true }),
        supabase.from("follow_up_tasks").select("id", { count: "exact", head: true }).eq("action_name", "Foundation School Registration").eq("completed", true),
        supabase.from("follow_up_tasks").select("id, completed"),
      ]);

      setStats({
        firstTimers: ftRes.count || 0, members: membersRes.count || 0,
        leaders: leadersRes.count || 0, departments: deptRes.count || 0, foundationSchool: fsRes.count || 0,
      });

      if (tasksRes.data) {
        const total = tasksRes.data.length;
        const completed = tasksRes.data.filter(t => t.completed).length;
        setPipelineStats({ totalTasks: total, completedTasks: completed, completionRate: total > 0 ? Math.round((completed / total) * 100) : 0 });
      }
    }
    fetchDashboardStats();
  }, []);

  const statCards = [
    { icon: <UserPlus className="h-5 w-5" />, title: "First Timers", value: stats.firstTimers, iconBg: "gradient-primary", iconColor: "text-primary-foreground", valueColor: "text-primary" },
    { icon: <Users className="h-5 w-5" />, title: "Total Members", value: stats.members, iconBg: "bg-accent/20", iconColor: "text-accent", valueColor: "text-accent" },
    { icon: <Award className="h-5 w-5" />, title: "Leaders", value: stats.leaders, iconBg: "bg-success/20", iconColor: "text-success", valueColor: "text-success" },
    { icon: <Building2 className="h-5 w-5" />, title: "Departments", value: stats.departments, iconBg: "bg-warning/20", iconColor: "text-warning", valueColor: "text-warning" },
    { icon: <GraduationCap className="h-5 w-5" />, title: "Foundation School", value: stats.foundationSchool, iconBg: "bg-info/20", iconColor: "text-info", valueColor: "text-info" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-display font-extrabold text-foreground">Dashboard</h2>
        <p className="text-muted-foreground mt-1">Overview of your church's growth metrics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((s, i) => (
          <Card key={i} className={`animate-fade-up-delay-${i + 1}`}>
            <CardContent className="p-5 flex flex-col items-center text-center">
              <div className={`${s.iconBg} p-3 rounded-xl mb-3`}>
                <span className={s.iconColor}>{s.icon}</span>
              </div>
              <h3 className={`text-3xl font-display font-extrabold ${s.valueColor}`}>{s.value}</h3>
              <p className="text-xs text-muted-foreground mt-1 font-medium">{s.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pipeline Tracker */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="gradient-primary p-2.5 rounded-xl">
              <ClipboardList className="h-5 w-5 text-primary-foreground" />
            </div>
            <CardTitle>6-Week Program Tracker</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-medium text-muted-foreground">Overall Completion Rate</span>
                <span className="text-3xl font-display font-extrabold gradient-gold">{pipelineStats.completionRate}%</span>
              </div>
              <div className="h-3 rounded-full progress-bar-track overflow-hidden">
                <div className="h-full rounded-full progress-bar-fill transition-all duration-1000" style={{ width: `${pipelineStats.completionRate}%` }} />
              </div>
              <p className="text-sm text-muted-foreground">
                {pipelineStats.completedTasks} out of {pipelineStats.totalTasks} follow-up tasks completed.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Attendance */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="bg-success/20 p-2.5 rounded-xl">
              <Calendar className="h-5 w-5 text-success" />
            </div>
            <CardTitle>Recent Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Latest Sunday and Midweek services.</p>
              <div className="p-4 rounded-xl bg-secondary">
                <div className="flex justify-between mb-1">
                  <span className="font-semibold text-foreground">Last Sunday Service</span>
                  <span className="text-primary font-display font-bold">142 Present</span>
                </div>
                <div className="text-xs text-muted-foreground">Including 12 First Timers</div>
              </div>
              <div className="p-4 rounded-xl bg-secondary">
                <div className="flex justify-between mb-1">
                  <span className="font-semibold text-foreground">Last Midweek Service</span>
                  <span className="text-primary font-display font-bold">85 Present</span>
                </div>
                <div className="text-xs text-muted-foreground">Including 3 First Timers</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
