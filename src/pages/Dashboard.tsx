import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { UserPlus, Users, Award, Building2, GraduationCap, ClipboardList, Calendar } from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState({
    firstTimers: 0,
    members: 0,
    leaders: 0,
    departments: 0,
    foundationSchool: 0,
  });

  const [pipelineStats, setPipelineStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    completionRate: 0,
  });

  useEffect(() => {
    async function fetchDashboardStats() {
      // Fetching all stats in parallel
      const [
        ftRes,
        membersRes,
        leadersRes,
        deptRes,
        fsRes,
        tasksRes,
      ] = await Promise.all([
        supabase.from("members").select("id", { count: "exact", head: true }).eq("status", "First Timer"),
        supabase.from("members").select("id", { count: "exact", head: true }),
        supabase.from("user_roles").select("id", { count: "exact", head: true }).in("role", ["pastor", "cell_leader", "follow_up_team"]),
        supabase.from("departments").select("id", { count: "exact", head: true }),
        supabase.from("follow_up_tasks").select("id", { count: "exact", head: true }).eq("action_name", "Foundation School Registration").eq("completed", true),
        supabase.from("follow_up_tasks").select("id, completed"),
      ]);

      setStats({
        firstTimers: ftRes.count || 0,
        members: membersRes.count || 0,
        leaders: leadersRes.count || 0,
        departments: deptRes.count || 0,
        foundationSchool: fsRes.count || 0,
      });

      if (tasksRes.data) {
        const total = tasksRes.data.length;
        const completed = tasksRes.data.filter(t => t.completed).length;
        setPipelineStats({
          totalTasks: total,
          completedTasks: completed,
          completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        });
      }
    }

    fetchDashboardStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-display font-bold text-foreground">Dashboard Overview</h2>
      </div>

      {/* Figures Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard icon={<UserPlus />} title="First Timers" value={stats.firstTimers} color="bg-primary text-primary-foreground" />
        <StatCard icon={<Users />} title="Total Members" value={stats.members} color="bg-accent text-accent-foreground" />
        <StatCard icon={<Award />} title="Leaders" value={stats.leaders} color="bg-success text-success-foreground" />
        <StatCard icon={<Building2 />} title="Departments" value={stats.departments} color="bg-warning text-warning-foreground" />
        <StatCard icon={<GraduationCap />} title="Foundation School" value={stats.foundationSchool} color="bg-secondary text-secondary-foreground" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* 6-Week Pipeline Tracker */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <ClipboardList className="h-5 w-5" />
            </div>
            <CardTitle>6-Week Program Tracker</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-medium text-muted-foreground">Overall Completion Rate</span>
                <span className="text-2xl font-bold gradient-text">{pipelineStats.completionRate}%</span>
              </div>
              <Progress value={pipelineStats.completionRate} className="h-3" />
              <p className="text-sm text-muted-foreground mt-2">
                {pipelineStats.completedTasks} out of {pipelineStats.totalTasks} follow-up tasks completed.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Live Attendance Report Placeholder */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="p-2 bg-success/10 rounded-lg text-success">
              <Calendar className="h-5 w-5" />
            </div>
            <CardTitle>Recent Attendance Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Showing statistics from the latest Sunday and Midweek services.
              </p>
              <div className="p-4 border rounded-xl bg-muted/30">
                <div className="flex justify-between mb-1">
                  <span className="font-semibold text-foreground">Last Sunday Service</span>
                  <span className="text-primary font-bold">142 Present</span>
                </div>
                <div className="text-xs text-muted-foreground">Including 12 First Timers</div>
              </div>
              <div className="p-4 border rounded-xl bg-muted/30">
                <div className="flex justify-between mb-1">
                  <span className="font-semibold text-foreground">Last Midweek Service</span>
                  <span className="text-primary font-bold">85 Present</span>
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

function StatCard({ icon, title, value, color }: { icon: React.ReactNode, title: string, value: number, color: string }) {
  return (
    <Card className="glass-card border-0 shadow-sm hover:-translate-y-1 transition-transform duration-300">
      <CardContent className="p-5 flex flex-col items-center text-center">
        <div className={`p-3 rounded-full mb-3 ${color}`}>
          {icon}
        </div>
        <h3 className="text-2xl font-bold">{value}</h3>
        <p className="text-xs text-muted-foreground mt-1">{title}</p>
      </CardContent>
    </Card>
  );
}
