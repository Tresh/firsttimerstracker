import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Award, Trophy } from "lucide-react";

export default function Leaders() {
  const [leaders, setLeaders] = useState<any[]>([]);

  useEffect(() => {
    async function fetchLeaders() {
      const [profilesRes, rolesRes, memberDataRes, tasksRes] = await Promise.all([
        supabase.from("profiles").select("id, full_name, user_id"),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("members").select("assigned_follow_up_leader").not("assigned_follow_up_leader", "is", null),
        supabase.from("follow_up_tasks").select("assigned_to, completed"),
      ]);

      const profiles = profilesRes.data || [];
      const roles = rolesRes.data || [];
      const memberData = memberDataRes.data || [];
      const tasksData = tasksRes.data || [];

      const roleMap: Record<string, string> = {};
      roles.forEach(r => { roleMap[r.user_id] = r.role; });

      const countMap: Record<string, number> = {};
      memberData.forEach(m => { countMap[m.assigned_follow_up_leader!] = (countMap[m.assigned_follow_up_leader!] || 0) + 1; });

      // Follow-up completion rate per leader
      const taskMap: Record<string, { total: number; completed: number }> = {};
      tasksData.forEach(t => {
        if (t.assigned_to) {
          if (!taskMap[t.assigned_to]) taskMap[t.assigned_to] = { total: 0, completed: 0 };
          taskMap[t.assigned_to].total++;
          if (t.completed) taskMap[t.assigned_to].completed++;
        }
      });

      const merged = profiles
        .filter(p => roleMap[p.id] || countMap[p.id])
        .map(p => ({
          ...p,
          role: roleMap[p.id] || "leader",
          membersAssigned: countMap[p.id] || 0,
          followUpRate: taskMap[p.id] ? Math.round((taskMap[p.id].completed / taskMap[p.id].total) * 100) : 0,
          totalTasks: taskMap[p.id]?.total || 0,
          completedTasks: taskMap[p.id]?.completed || 0,
        }))
        .sort((a, b) => b.membersAssigned - a.membersAssigned);

      setLeaders(merged);
    }
    fetchLeaders();
  }, []);

  const badges: Record<number, string> = { 0: "🔥 Top Soul Winner", 1: "⭐ Best Retention", 2: "💎 Most Active" };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-display font-extrabold text-foreground">Leader Leaderboard</h2>
        <p className="text-muted-foreground mt-1">Gamified soul-winning & retention rankings</p>
      </div>

      {leaders.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">
          <Award className="h-12 w-12 mx-auto mb-4 opacity-20" /><p>No leaders registered yet.</p>
        </CardContent></Card>
      ) : leaders.map((l, i) => (
        <Card key={l.id} className={i === 0 ? "gold-glow" : ""}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                i === 0 ? "bg-accent/20 text-accent" : i === 1 ? "bg-secondary text-muted-foreground" : "bg-secondary text-muted-foreground"
              }`}>
                {i < 3 ? <Trophy className="h-5 w-5" /> : i + 1}
              </div>
              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                {l.full_name?.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
              </div>
              <div className="flex-1">
                <p className="font-bold text-foreground">{l.full_name}</p>
                <p className="text-xs text-muted-foreground capitalize">{l.role?.replace("_", " ")}</p>
              </div>
              {i < 3 && <span className="badge-gold px-2 py-1 rounded-full text-xs font-bold">{badges[i]}</span>}
            </div>

            <div className="grid grid-cols-3 gap-3 mb-3">
              {[
                ["Assigned", l.membersAssigned],
                ["Completed", l.completedTasks],
                ["Rate", `${l.followUpRate}%`],
              ].map(([k, v]) => (
                <div key={k as string} className="text-center bg-secondary rounded-xl p-2">
                  <p className="text-lg font-display font-extrabold text-foreground">{v}</p>
                  <p className="text-xs text-muted-foreground">{k}</p>
                </div>
              ))}
            </div>

            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Follow-Up Rate</span>
                <span className="font-medium">{l.followUpRate}%</span>
              </div>
              <div className="h-2 rounded-full progress-bar-track overflow-hidden">
                <div className={`h-full rounded-full ${l.followUpRate >= 80 ? "bg-success" : "progress-bar-fill"}`} style={{ width: `${l.followUpRate}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
