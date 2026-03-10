import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { scopeQuery } from "@/utils/scopeQuery";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  GraduationCap, CheckCircle2, Clock, Users, BookOpen,
  Award, Search, UserPlus, ChevronRight,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────
type FSClass = {
  id: string;
  class_number: number;
  class_code: string;
  class_title: string;
  class_description: string | null;
  is_exam: boolean;
  scheduled_day: string | null;
};

type FSMember = {
  id: string;
  full_name: string;
  phone_number: string | null;
  organization_id: string | null;
  fs_enrolled: boolean;
  fs_classes_completed: number;
  fs_exam_score: number | null;
  fs_exam_passed: boolean;
  fs_graduated: boolean;
  fs_graduation_date: string | null;
  status: string;
};

type AttendanceRecord = {
  id: string;
  class_id: string;
  member_id: string;
  attended: boolean;
};

// ─── Class code → short label ────────────────────────────────
const classLabels: Record<string, string> = {
  FS1: "FS1", FS2: "FS2", FS3: "FS3", FS4A: "FS4A", FS4B: "FS4B",
  FS5: "FS5", FS6: "FS6", FS7: "FS7", FSEXAM: "EXAM",
};

// ─── Main component ─────────────────────────────────────────
export default function FoundationSchool() {
  const { role, profile, organizationId } = useAuth();

  const isStaff = role === "foundation_school_staff";
  const isLeader = role === "foundation_school_leader";
  const isAdmin =
    role === "king_admin" || role === "admin" ||
    role === "erediauwa_admin" || role === "loveworldcity_admin" ||
    role === "youth_teens_admin" || role === "church_pastor" || role === "pastor";

  if (isStaff) return <StaffView profileId={profile?.id ?? null} />;
  if (isLeader) return <LeaderView role={role} organizationId={organizationId} profileId={profile?.id ?? null} showEnroll={false} />;
  if (isAdmin) return <LeaderView role={role} organizationId={organizationId} profileId={profile?.id ?? null} showEnroll />;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <GraduationCap className="h-16 w-16 text-muted-foreground mb-4 opacity-30" />
      <p className="text-muted-foreground">No Foundation School view for your role.</p>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// VIEW A — FS STAFF: Mark Attendance
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function StaffView({ profileId }: { profileId: string | null }) {
  const [classes, setClasses] = useState<FSClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<FSClass | null>(null);
  const [students, setStudents] = useState<FSMember[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
  const [examScores, setExamScores] = useState<Record<string, number | "">>({});

  // Load classes
  useEffect(() => {
    supabase.from("foundation_school_classes").select("*").order("class_number").then(({ data }) => {
      const c = (data || []) as FSClass[];
      setClasses(c);
      if (c.length > 0) setSelectedClass(c[0]);
    });
  }, []);

  // Load enrolled students
  useEffect(() => {
    supabase.from("members").select("id, full_name, phone_number, organization_id, fs_enrolled, fs_classes_completed, fs_exam_score, fs_exam_passed, fs_graduated, fs_graduation_date, status")
      .eq("fs_enrolled", true).order("full_name")
      .then(({ data }) => setStudents((data || []) as FSMember[]));
  }, []);

  // Load attendance for selected class
  useEffect(() => {
    if (!selectedClass) return;
    supabase.from("foundation_school_attendance").select("id, class_id, member_id, attended")
      .eq("class_id", selectedClass.id)
      .then(({ data }) => {
        const map: Record<string, AttendanceRecord> = {};
        (data || []).forEach((r: any) => { map[r.member_id] = r; });
        setAttendance(map);
      });
    // Reset exam scores
    setExamScores({});
    if (selectedClass.is_exam) {
      students.forEach(s => {
        if (s.fs_exam_score !== null) setExamScores(prev => ({ ...prev, [s.id]: s.fs_exam_score! }));
      });
    }
  }, [selectedClass, students]);

  const toggleAttendance = async (memberId: string, attended: boolean) => {
    if (!selectedClass || !profileId) return;
    const { data, error } = await supabase.from("foundation_school_attendance").upsert({
      class_id: selectedClass.id,
      member_id: memberId,
      attended,
      marked_by: profileId,
      marked_at: new Date().toISOString(),
    }, { onConflict: "class_id,member_id" }).select("id, class_id, member_id, attended").single();

    if (error) { toast.error(error.message); return; }
    setAttendance(prev => ({ ...prev, [memberId]: data as AttendanceRecord }));
  };

  const markAllPresent = async () => {
    if (!selectedClass || !profileId) return;
    const rows = students.map(s => ({
      class_id: selectedClass.id,
      member_id: s.id,
      attended: true,
      marked_by: profileId,
      marked_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from("foundation_school_attendance").upsert(rows, { onConflict: "class_id,member_id" });
    if (error) { toast.error(error.message); return; }
    // Refresh
    const { data } = await supabase.from("foundation_school_attendance").select("id, class_id, member_id, attended").eq("class_id", selectedClass.id);
    const map: Record<string, AttendanceRecord> = {};
    (data || []).forEach((r: any) => { map[r.member_id] = r; });
    setAttendance(map);
    toast.success("All students marked present ✓");
  };

  const saveExamScore = async (memberId: string, score: number) => {
    const passed = score >= 50;
    await supabase.from("members").update({ fs_exam_score: score, fs_exam_passed: passed } as any).eq("id", memberId);
    setStudents(prev => prev.map(s => s.id === memberId ? { ...s, fs_exam_score: score, fs_exam_passed: passed } : s));
    toast.success(passed ? "✅ Passed!" : "❌ Did not pass");
  };

  const presentCount = students.filter(s => attendance[s.id]?.attended).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-display font-extrabold text-foreground">📖 Foundation School</h2>
        <p className="text-muted-foreground mt-1">Mark class attendance</p>
      </div>

      {/* Class selector — horizontal scroll */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {classes.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedClass(c)}
            className={`flex-shrink-0 px-4 py-3 rounded-xl text-left transition-all border ${
              selectedClass?.id === c.id
                ? "bg-primary/15 border-primary/40 text-primary"
                : "bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-primary/20"
            }`}
          >
            <p className="text-sm font-bold">{classLabels[c.class_code] || c.class_code}</p>
            <p className="text-xs mt-0.5 max-w-[120px] truncate">{c.class_title}</p>
          </button>
        ))}
      </div>

      {selectedClass && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              <span className="text-success font-bold">{presentCount}</span> of {students.length} present
            </p>
            <Button size="sm" variant="outline" onClick={markAllPresent} className="gap-2">
              <CheckCircle2 className="h-4 w-4" /> Mark All Present
            </Button>
          </div>

          <div className="space-y-2">
            {students.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No enrolled students found.</p>
                </CardContent>
              </Card>
            ) : students.map(s => {
              const isPresent = attendance[s.id]?.attended || false;
              return (
                <Card key={s.id}>
                  <CardContent className="p-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm flex-shrink-0">
                        {s.full_name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-[15px]">{s.full_name}</p>
                        <p className="text-xs text-muted-foreground">{s.phone_number || "No phone"}</p>
                      </div>
                      <Switch
                        checked={isPresent}
                        onCheckedChange={(checked) => toggleAttendance(s.id, checked)}
                      />
                    </div>

                    {/* Exam fields */}
                    {selectedClass.is_exam && (
                      <div className="flex items-center gap-3 mt-3 pl-[52px]">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          placeholder="Score"
                          className="w-24 h-9"
                          value={examScores[s.id] ?? s.fs_exam_score ?? ""}
                          onChange={e => setExamScores(prev => ({ ...prev, [s.id]: e.target.value === "" ? "" : Number(e.target.value) }))}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const v = examScores[s.id];
                            if (v === "" || v === undefined) return;
                            saveExamScore(s.id, Number(v));
                          }}
                        >
                          Save
                        </Button>
                        {s.fs_exam_score !== null && (
                          <Badge className={s.fs_exam_passed ? "bg-success/15 text-success border-success/30" : "bg-destructive/15 text-destructive border-destructive/30"}>
                            {s.fs_exam_passed ? "Pass ✅" : "Fail ❌"}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// VIEW B & C — LEADER / ADMIN: Oversight Dashboard
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function LeaderView({
  role, organizationId, profileId, showEnroll,
}: {
  role: string | null;
  organizationId: string | null;
  profileId: string | null;
  showEnroll: boolean;
}) {
  const [classes, setClasses] = useState<FSClass[]>([]);
  const [enrolled, setEnrolled] = useState<FSMember[]>([]);
  const [unenrolled, setUnenrolled] = useState<FSMember[]>([]);
  const [allAttendance, setAllAttendance] = useState<any[]>([]);
  const [searchEnroll, setSearchEnroll] = useState("");
  const [searchStudent, setSearchStudent] = useState("");

  const fetchData = useCallback(async () => {
    // Classes
    const { data: classData } = await supabase.from("foundation_school_classes").select("*").order("class_number");
    setClasses((classData || []) as FSClass[]);

    // All members (scoped)
    let q = supabase.from("members").select("id, full_name, phone_number, organization_id, fs_enrolled, fs_classes_completed, fs_exam_score, fs_exam_passed, fs_graduated, fs_graduation_date, status").order("full_name");
    q = scopeQuery(q, role as any, organizationId);
    const { data: memberData } = await q;
    const all = (memberData || []) as FSMember[];
    setEnrolled(all.filter(m => m.fs_enrolled));
    setUnenrolled(all.filter(m => !m.fs_enrolled));

    // All attendance records
    const { data: attData } = await supabase.from("foundation_school_attendance").select("class_id, member_id, attended").eq("attended", true);
    setAllAttendance(attData || []);
  }, [role, organizationId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Stats
  const totalEnrolled = enrolled.length;
  const avgCompleted = totalEnrolled > 0 ? Math.round(enrolled.reduce((sum, m) => sum + (m.fs_classes_completed || 0), 0) / totalEnrolled) : 0;
  const examPassed = enrolled.filter(m => m.fs_exam_passed).length;
  const graduated = enrolled.filter(m => m.fs_graduated).length;
  const pendingGrad = enrolled.filter(m => m.fs_exam_passed && !m.fs_graduated).length;

  // Per-member attendance map: memberId -> set of class_ids attended
  const memberAttMap: Record<string, Set<string>> = {};
  allAttendance.forEach((a: any) => {
    if (!memberAttMap[a.member_id]) memberAttMap[a.member_id] = new Set();
    memberAttMap[a.member_id].add(a.class_id);
  });

  // Class attendance counts
  const classAttCounts: Record<string, number> = {};
  allAttendance.forEach((a: any) => {
    classAttCounts[a.class_id] = (classAttCounts[a.class_id] || 0) + 1;
  });

  const enrollMember = async (memberId: string) => {
    await supabase.from("members").update({ fs_enrolled: true, fs_enrolled_date: new Date().toISOString().split("T")[0] } as any).eq("id", memberId);
    toast.success("Student enrolled ✓");
    fetchData();
  };

  const enrollAllFirstTimers = async () => {
    const fts = unenrolled.filter(m => m.status === "First Timer");
    if (fts.length === 0) { toast.info("No first timers to enroll"); return; }
    for (const ft of fts) {
      await supabase.from("members").update({ fs_enrolled: true, fs_enrolled_date: new Date().toISOString().split("T")[0] } as any).eq("id", ft.id);
    }
    toast.success(`✅ ${fts.length} first timers enrolled!`);
    fetchData();
  };

  const graduateStudent = async (student: FSMember) => {
    await supabase.from("members").update({ fs_graduated: true, fs_graduation_date: new Date().toISOString().split("T")[0] } as any).eq("id", student.id);
    // Mark graduation follow-up task as done
    await supabase.from("follow_up_tasks").update({ status: "done", completed_at: new Date().toISOString() }).eq("member_id", student.id).eq("task_key", "week6_status_upgrade").eq("status", "pending");
    toast.success(`🎓 ${student.full_name} has graduated from Foundation School!`);
    fetchData();
  };

  const filteredEnrolled = enrolled.filter(m =>
    m.full_name.toLowerCase().includes(searchStudent.toLowerCase())
  );

  const filteredUnenrolled = unenrolled.filter(m =>
    m.full_name.toLowerCase().includes(searchEnroll.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-display font-extrabold text-foreground">
          📖 Foundation School {showEnroll ? "" : "— Zone Overview"}
        </h2>
        <p className="text-muted-foreground mt-1">Track enrollment, attendance & graduation</p>
      </div>

      {/* TOP STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard icon={<Users className="h-5 w-5 text-primary" />} label="Enrolled" value={totalEnrolled} color="primary" />
        <StatCard icon={<BookOpen className="h-5 w-5 text-info" />} label="Avg Classes" value={avgCompleted} color="info" />
        <StatCard icon={<CheckCircle2 className="h-5 w-5 text-success" />} label="Exam Passed" value={examPassed} color="success" />
        <StatCard icon={<GraduationCap className="h-5 w-5 text-accent" />} label="Graduated" value={graduated} color="accent" />
        <StatCard icon={<Clock className="h-5 w-5 text-warning" />} label="Pending Grad" value={pendingGrad} color="warning" />
      </div>

      {/* ENROLL STUDENTS — Admin only */}
      {showEnroll && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-foreground">Enroll Students</h3>
                <p className="text-xs text-muted-foreground">{enrolled.length} enrolled, {unenrolled.length} pending</p>
              </div>
              <Button size="sm" onClick={enrollAllFirstTimers} className="gap-2">
                <UserPlus className="h-4 w-4" /> Enroll All First Timers
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members to enroll..."
                className="pl-9 h-10"
                value={searchEnroll}
                onChange={e => setSearchEnroll(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
              {filteredUnenrolled.length === 0 ? (
                <p className="text-center py-4 text-sm text-muted-foreground">No unenrolled members found</p>
              ) : filteredUnenrolled.slice(0, 50).map(m => (
                <div key={m.id} className="flex items-center justify-between p-2.5 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">{m.full_name.charAt(0)}</div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{m.full_name}</p>
                      <p className="text-xs text-muted-foreground">{m.status}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => enrollMember(m.id)} className="gap-1.5 h-8">
                    <UserPlus className="h-3.5 w-3.5" /> Enroll
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* STUDENT PROGRESS TABLE */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h3 className="font-display font-bold text-foreground">Student Progress</h3>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              className="pl-9 h-10"
              value={searchStudent}
              onChange={e => setSearchStudent(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            {filteredEnrolled.length === 0 ? (
              <p className="text-center py-8 text-sm text-muted-foreground">No enrolled students found</p>
            ) : filteredEnrolled.map(s => {
              const attended = memberAttMap[s.id] || new Set();
              const attCount = attended.size;
              const progressPct = Math.round((attCount / Math.max(classes.length, 1)) * 100);

              return (
                <div key={s.id} className="p-3.5 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm flex-shrink-0">
                      {s.full_name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground">{s.full_name}</p>
                      <p className="text-xs text-muted-foreground">{attCount}/{classes.length} classes</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.fs_exam_score !== null && (
                        <Badge variant="outline" className={s.fs_exam_passed ? "text-success border-success/30" : "text-destructive border-destructive/30"}>
                          {s.fs_exam_score}% {s.fs_exam_passed ? "✅" : "❌"}
                        </Badge>
                      )}
                      {s.fs_graduated ? (
                        <Badge className="bg-accent/15 text-accent border border-accent/30">🎓 Graduated</Badge>
                      ) : s.fs_exam_passed ? (
                        <Button size="sm" onClick={() => graduateStudent(s)} className="h-7 text-xs gap-1">
                          <Award className="h-3.5 w-3.5" /> Graduate
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  {/* Class dots + progress bar */}
                  <div className="pl-[52px] space-y-1.5">
                    <div className="flex gap-1">
                      {classes.map(c => (
                        <div
                          key={c.id}
                          title={`${c.class_code}: ${attended.has(c.id) ? "Attended" : "Not yet"}`}
                          className={`h-2.5 w-2.5 rounded-full ${attended.has(c.id) ? "bg-success" : "bg-muted"}`}
                        />
                      ))}
                    </div>
                    <Progress value={progressPct} className="h-1.5" />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* CLASS BREAKDOWN */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <h3 className="font-display font-bold text-foreground">Class Breakdown</h3>
          {classes.map(c => {
            const count = classAttCounts[c.id] || 0;
            const pct = totalEnrolled > 0 ? Math.round((count / totalEnrolled) * 100) : 0;
            return (
              <div key={c.id} className="flex items-center gap-3">
                <div className="w-14 text-xs font-bold text-primary">{classLabels[c.class_code] || c.class_code}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-foreground truncate max-w-[180px]">{c.class_title}</p>
                    <p className="text-xs text-muted-foreground">{count} ({pct}%)</p>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────
function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`bg-${color}/20 p-2.5 rounded-xl`}>{icon}</div>
        <div>
          <p className={`text-2xl font-display font-extrabold text-${color}`}>{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
