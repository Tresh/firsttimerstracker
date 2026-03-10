import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Users, Trophy } from "lucide-react";

export default function Leaders() {
  const [leaders, setLeaders] = useState<any[]>([]);

  useEffect(() => {
    async function fetchLeaders() {
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, avatar_url");
      const { data: roles } = await supabase.from("user_roles").select("user_id, role");
      const { data: memberData } = await supabase.from("members").select("assigned_follow_up_leader").not("assigned_follow_up_leader", "is", null);

      if (profiles && roles) {
        const roleMap: Record<string, string> = {};
        roles.forEach(r => { roleMap[r.user_id] = r.role; });

        const countMap: Record<string, number> = {};
        memberData?.forEach(m => { countMap[m.assigned_follow_up_leader!] = (countMap[m.assigned_follow_up_leader!] || 0) + 1; });

        const merged = profiles
          .filter(p => roleMap[p.id])
          .map(p => ({ ...p, role: roleMap[p.id], membersAssigned: countMap[p.id] || 0 }))
          .sort((a, b) => b.membersAssigned - a.membersAssigned);

        setLeaders(merged);
      }
    }
    fetchLeaders();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-display font-extrabold text-foreground">Leaders</h2>
        <p className="text-muted-foreground mt-1">Leaderboard & performance tracking</p>
      </div>

      {leaders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Award className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No leaders registered yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {leaders.map((leader, i) => (
            <Card key={leader.id} className={i === 0 ? "gold-glow" : ""}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center font-display font-extrabold text-lg ${
                  i === 0 ? "bg-accent/20 text-accent" : i === 1 ? "badge-primary" : "bg-secondary text-muted-foreground"
                }`}>
                  {i < 3 ? <Trophy className="h-5 w-5" /> : `#${i + 1}`}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{leader.full_name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{leader.role?.replace("_", " ")}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-display font-extrabold text-primary">{leader.membersAssigned}</p>
                  <p className="text-xs text-muted-foreground">members</p>
                </div>
                {i === 0 && <span className="badge-gold px-3 py-1 rounded-full text-xs font-semibold">🏆 Top Leader</span>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
