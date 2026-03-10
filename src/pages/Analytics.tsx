import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, Users, UserPlus, TrendingUp, CheckCircle2, MapPin, GraduationCap } from "lucide-react";

const statusColors: Record<string, string> = {
  "First Timer": "bg-warning",
  "Second Timer": "bg-primary",
  "New Convert": "bg-purple-500",
  "Member": "bg-success",
  "Worker": "bg-info",
};

export default function Analytics() {
  const [members, setMembers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    async function fetch() {
      const [mRes, tRes] = await Promise.all([
        supabase.from("members").select("*"),
        supabase.from("follow_up_tasks").select("*").in("status", ["done", "verified"]),
      ]);
      setMembers(mRes.data || []);
      setTasks(tRes.data || []);
    }
    fetch();
  }, []);

  const total = members.length;
  const retained = members.filter(m => ["Member", "Worker"].includes(m.status)).length;
  const retentionRate = total ? Math.round((retained / total) * 100) : 0;
  const foundationSchool = members.filter(m => m.started_foundation_school).length;
  const inCellGroup = members.filter(m => m.assigned_cell_group).length;
  const inDepartment = members.filter(m => m.department_joined).length;

  // Status breakdown
  const statusData: Record<string, number> = {};
  members.forEach(m => { statusData[m.status] = (statusData[m.status] || 0) + 1; });

  // Location data
  const locationData: Record<string, number> = {};
  members.forEach(m => { const l = (m.location || "").trim(); if (l) locationData[l] = (locationData[l] || 0) + 1; });

  const metrics = [
    { label: "Total First Timers", value: members.filter(m => m.status === "First Timer").length, color: "text-primary" },
    { label: "Total Members", value: total, color: "text-foreground" },
    { label: "Retention Rate", value: `${retentionRate}%`, color: "text-success" },
    { label: "Members Retained", value: retained, color: "text-success" },
    { label: "Visitors Lost", value: total - retained, color: "text-destructive" },
    { label: "Follow-Ups Done", value: tasks.length, color: "text-info" },
    { label: "Foundation School", value: `${total ? Math.round((foundationSchool / total) * 100) : 0}%`, color: "text-purple-400" },
    { label: "In Cell Groups", value: `${total ? Math.round((inCellGroup / total) * 100) : 0}%`, color: "text-accent" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-display font-extrabold text-foreground">Analytics</h2>
        <p className="text-muted-foreground mt-1">Church growth intelligence</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {metrics.map(m => (
          <Card key={m.label}>
            <CardContent className="p-4">
              <p className={`text-2xl font-display font-extrabold ${m.color}`}>{m.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{m.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status Breakdown */}
      <Card>
        <CardContent className="p-5">
          <h3 className="font-display font-bold text-foreground mb-4">Member Status Breakdown</h3>
          {Object.entries(statusData).map(([status, count]) => (
            <div key={status} className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-foreground">{status}</span>
                <span className="font-bold text-foreground">{count} ({total ? Math.round((count / total) * 100) : 0}%)</span>
              </div>
              <div className="h-2 rounded-full progress-bar-track overflow-hidden">
                <div className={`h-full rounded-full ${statusColors[status] || "bg-primary"}`} style={{ width: `${total ? (count / total) * 100 : 0}%` }} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Geographic Distribution */}
      <Card>
        <CardContent className="p-5">
          <h3 className="font-display font-bold text-foreground mb-4">Geographic Distribution</h3>
          {Object.entries(locationData).sort((a, b) => b[1] - a[1]).map(([loc, count]) => (
            <div key={loc} className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{loc}</span>
                <span className="font-bold text-foreground">{count}</span>
              </div>
              <div className="h-2 rounded-full progress-bar-track overflow-hidden">
                <div className="h-full rounded-full bg-success" style={{ width: `${total ? (count / total) * 100 : 0}%` }} />
              </div>
            </div>
          ))}
          {Object.keys(locationData).length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No location data.</p>}
        </CardContent>
      </Card>

      {/* Key Milestones */}
      <Card>
        <CardContent className="p-5">
          <h3 className="font-display font-bold text-foreground mb-4">Key Milestones</h3>
          {[
            { label: "📚 Foundation School", val: foundationSchool, color: "bg-purple-500" },
            { label: "👥 In Cell Group", val: inCellGroup, color: "bg-success" },
            { label: "🏛 In Department", val: inDepartment, color: "bg-warning" },
          ].map(({ label, val, color }) => (
            <div key={label} className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-foreground">{label}</span>
                <span className="font-bold text-foreground">{val}/{total}</span>
              </div>
              <div className="h-2 rounded-full progress-bar-track overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${total ? (val / total) * 100 : 0}%` }} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
