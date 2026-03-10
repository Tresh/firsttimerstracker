import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Circle, ClipboardList, Phone, MessageCircle } from "lucide-react";
import { toast } from "sonner";

const WEEK_TASKS = [
  { week: 1, label: "Welcome Call" },
  { week: 2, label: "Follow-Up Visit" },
  { week: 3, label: "Foundation School" },
  { week: 4, label: "Baptism Counseling" },
  { week: 5, label: "Dept Integration" },
  { week: 6, label: "Membership Confirm" },
];

export default function FollowUpTracker() {
  const [members, setMembers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  const fetchData = async () => {
    const [membersRes, tasksRes] = await Promise.all([
      supabase.from("members").select("id, full_name, date_of_first_visit, phone_number, assigned_follow_up_leader").in("status", ["First Timer", "Second Timer", "New Convert"]).order("date_of_first_visit", { ascending: false }),
      supabase.from("follow_up_tasks").select("*"),
    ]);
    setMembers(membersRes.data || []);
    setTasks(tasksRes.data || []);
  };

  useEffect(() => { fetchData(); }, []);

  const getWeekDone = (memberId: string, week: number) => {
    return tasks.find(t => t.member_id === memberId && t.week_number === week)?.completed || false;
  };

  const completedCount = (memberId: string) => [1,2,3,4,5,6].filter(w => getWeekDone(memberId, w)).length;

  const toggleWeek = async (memberId: string, weekNumber: number, actionName: string) => {
    const existing = tasks.find(t => t.member_id === memberId && t.week_number === weekNumber);
    if (existing) {
      await supabase.from("follow_up_tasks").update({
        completed: !existing.completed,
        completed_at: !existing.completed ? new Date().toISOString() : null,
      }).eq("id", existing.id);
    } else {
      await supabase.from("follow_up_tasks").insert([{
        member_id: memberId, week_number: weekNumber, action_name: actionName,
        completed: true, completed_at: new Date().toISOString(),
      }]);
    }
    // Refetch
    const { data } = await supabase.from("follow_up_tasks").select("*");
    setTasks(data || []);
    toast.success("Updated!");
  };

  const inPipeline = members.length;
  const progressing = members.filter(m => completedCount(m.id) >= 3).length;
  const notStarted = members.filter(m => completedCount(m.id) === 0).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-display font-extrabold text-foreground">Follow-Up Tracker</h2>
        <p className="text-muted-foreground mt-1">{inPipeline} people in the 6-week pipeline</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "In Pipeline", value: inPipeline, color: "text-primary" },
          { label: "Progressing", value: progressing, color: "text-success" },
          { label: "Not Started", value: notStarted, color: "text-warning" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-display font-extrabold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pipeline Cards */}
      {members.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">
          <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-20" /><p>No first timers to track.</p>
        </CardContent></Card>
      ) : members.map((m) => {
        const done = completedCount(m.id);
        const pct = Math.round((done / 6) * 100);
        return (
          <Card key={m.id}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm flex-shrink-0">{m.full_name?.charAt(0)}</div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{m.full_name}</p>
                  <p className="text-xs text-muted-foreground">{m.phone_number || "No phone"}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-display font-bold text-primary">{done}/6</span>
                  <p className="text-xs text-muted-foreground">weeks</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 rounded-full progress-bar-track overflow-hidden mb-3">
                <div className={`h-full rounded-full transition-all duration-500 ${done >= 4 ? "bg-success" : done >= 2 ? "progress-bar-fill" : "bg-warning"}`} style={{ width: `${pct}%` }} />
              </div>

              {/* Interactive Week Buttons */}
              <div className="grid grid-cols-6 gap-1.5 mb-3">
                {WEEK_TASKS.map((wk) => {
                  const isDone = getWeekDone(m.id, wk.week);
                  return (
                    <button key={wk.week} onClick={() => toggleWeek(m.id, wk.week, wk.label)}
                      className={`rounded-xl py-2.5 text-xs font-bold transition-all ${isDone ? "bg-success text-success-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}>
                      W{wk.week}
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <a href={`tel:${m.phone_number}`} className="flex-1 flex items-center justify-center gap-1.5 bg-primary/10 text-primary rounded-xl py-2 text-xs font-medium hover:bg-primary/20 transition-colors">
                  <Phone className="h-3 w-3" /> Call
                </a>
                <a href={`https://wa.me/${(m.phone_number || "").replace(/^0/, "234")}`} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-1.5 bg-success/10 text-success rounded-xl py-2 text-xs font-medium hover:bg-success/20 transition-colors">
                  <MessageCircle className="h-3 w-3" /> WhatsApp
                </a>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
