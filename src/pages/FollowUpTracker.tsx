import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, ClipboardList, Users } from "lucide-react";
import { toast } from "sonner";

const WEEKS = [
  { week: 1, action: "Welcome Call / SMS" },
  { week: 2, action: "Follow-Up Visit" },
  { week: 3, action: "Cell Group Invitation" },
  { week: 4, action: "Foundation School Registration" },
  { week: 5, action: "Department Integration" },
  { week: 6, action: "Membership Confirmation" },
];

export default function FollowUpTracker() {
  const [firstTimers, setFirstTimers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      const [membersRes, tasksRes] = await Promise.all([
        supabase.from("members").select("id, full_name, date_of_first_visit, phone_number").eq("status", "First Timer").order("date_of_first_visit", { ascending: false }),
        supabase.from("follow_up_tasks").select("*"),
      ]);
      setFirstTimers(membersRes.data || []);
      setTasks(tasksRes.data || []);
    }
    fetchData();
  }, []);

  const getTaskStatus = (memberId: string, weekNumber: number) => {
    return tasks.find(t => t.member_id === memberId && t.week_number === weekNumber);
  };

  const toggleTask = async (memberId: string, weekNumber: number, actionName: string) => {
    const existing = getTaskStatus(memberId, weekNumber);
    if (existing) {
      const { error } = await supabase.from("follow_up_tasks").update({
        completed: !existing.completed, completed_at: !existing.completed ? new Date().toISOString() : null
      }).eq("id", existing.id);
      if (error) return toast.error("Failed to update");
    } else {
      const { error } = await supabase.from("follow_up_tasks").insert([{
        member_id: memberId, week_number: weekNumber, action_name: actionName, completed: true, completed_at: new Date().toISOString()
      }]);
      if (error) return toast.error("Failed to create task");
    }
    const { data } = await supabase.from("follow_up_tasks").select("*");
    setTasks(data || []);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-display font-extrabold text-foreground">Follow-Up Tracker</h2>
        <p className="text-muted-foreground mt-1">6-week retention pipeline for first timers</p>
      </div>

      {firstTimers.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">
          <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-20" /><p>No first timers to track.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-4">
          {firstTimers.map((ft) => {
            const completed = WEEKS.filter(w => getTaskStatus(ft.id, w.week)?.completed).length;
            const progress = Math.round((completed / WEEKS.length) * 100);
            return (
              <Card key={ft.id}>
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold">{ft.full_name.charAt(0)}</div>
                      <div>
                        <p className="font-semibold text-foreground">{ft.full_name}</p>
                        <p className="text-xs text-muted-foreground">{ft.phone_number || "No phone"} • Visited {new Date(ft.date_of_first_visit).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-24 rounded-full progress-bar-track overflow-hidden">
                        <div className="h-full rounded-full progress-bar-fill" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="text-xs font-display font-bold text-primary">{progress}%</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    {WEEKS.map((w) => {
                      const task = getTaskStatus(ft.id, w.week);
                      const done = task?.completed;
                      return (
                        <button key={w.week} onClick={() => toggleTask(ft.id, w.week, w.action)}
                          className={`p-3 rounded-xl text-left transition-all border text-xs ${
                            done ? "bg-success/10 border-success/30" : "bg-secondary border-transparent hover:border-primary/20"
                          }`}>
                          <div className="flex items-center gap-1.5 mb-1">
                            {done ? <CheckCircle2 className="h-3.5 w-3.5 text-success" /> : <Circle className="h-3.5 w-3.5 text-muted-foreground/30" />}
                            <span className="font-semibold text-muted-foreground">Wk {w.week}</span>
                          </div>
                          <p className={`${done ? "text-success" : "text-muted-foreground"} leading-tight`}>{w.action}</p>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
