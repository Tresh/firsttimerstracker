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
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import {
  GraduationCap, CheckCircle2, Clock, Users, BookOpen,
  Award, Search, UserPlus, Lock, QrCode, AlertTriangle, X,
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
  is_manual_override?: boolean;
};

// ─── Class code → short label ────────────────────────────────
const classLabels: Record<string, string> = {
  FS1: "FS1", FS2: "FS2", FS3: "FS3", FS4A: "FS4A", FS4B: "FS4B",
  FS5: "FS5", FS6: "FS6", FS7: "FS7", FSEXAM: "EXAM",
};

const DAY_MAP: Record<string, number> = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
const DAY_LABEL: Record<string, string> = { sunday: "Sunday", monday: "Monday" };

// ─── Main component ─────────────────────────────────────────
export default function FoundationSchool() {
  const { role, profile, organizationId } = useAuth();

  const isStaff = role === "foundation_school_staff";
  const isLeader = role === "foundation_school_leader";
  const isAdmin =
    role === "king_admin" || role === "admin" ||
    role === "erediauwa_admin" || role === "loveworldcity_admin" ||
    role === "youth_teens_admin" || role === "church_pastor" || role === "pastor";

  if (isStaff) return <StaffView profileId={profile?.id ?? null} organizationId={organizationId} canOverrideLock={false} />;
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
// VIEW A — FS STAFF: Mark Attendance with QR + Day Locking
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function StaffView({ profileId, organizationId, canOverrideLock }: { profileId: string | null; organizationId: string | null; canOverrideLock: boolean }) {
  const [classes, setClasses] = useState<FSClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<FSClass | null>(null);
  const [students, setStudents] = useState<FSMember[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
  const [examScores, setExamScores] = useState<Record<string, number | "">>({});

  // QR session state
  const [qrMode, setQrMode] = useState<"choose" | "qr" | "manual">("choose");
  const [activeSession, setActiveSession] = useState<any>(null);
  const [scanCount, setScanCount] = useState(0);
  const [scannedStudents, setScannedStudents] = useState<string[]>([]);
  const [manualReason, setManualReason] = useState("");

  // Day lock override
  const [overrideDialog, setOverrideDialog] = useState(false);

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

  // Load attendance for selected class + reset mode
  useEffect(() => {
    if (!selectedClass) return;
    setQrMode("choose");
    setActiveSession(null);
    setScanCount(0);
    setScannedStudents([]);
    setManualReason("");

    supabase.from("foundation_school_attendance").select("id, class_id, member_id, attended, is_manual_override")
      .eq("class_id", selectedClass.id)
      .then(({ data }) => {
        const map: Record<string, AttendanceRecord> = {};
        (data || []).forEach((r: any) => { map[r.member_id] = r; });
        setAttendance(map);
      });
    setExamScores({});
    if (selectedClass.is_exam) {
      students.forEach(s => {
        if (s.fs_exam_score !== null) setExamScores(prev => ({ ...prev, [s.id]: s.fs_exam_score! }));
      });
    }

    // Check for existing active session
    supabase.from("fs_qr_sessions").select("*").eq("class_id", selectedClass.id).eq("is_active", true).limit(1).single()
      .then(({ data }) => {
        if (data) {
          setActiveSession(data);
          setQrMode("qr");
        }
      });
  }, [selectedClass, students]);

  // Poll scan count when QR session is active
  useEffect(() => {
    if (!activeSession) return;
    const poll = setInterval(async () => {
      const { data, count } = await supabase.from("fs_qr_scans").select("id, members(full_name)", { count: "exact" })
        .eq("session_id", activeSession.id);
      setScanCount(count || 0);
      setScannedStudents((data || []).map((d: any) => d.members?.full_name || "Unknown"));
    }, 5000);
    // Initial fetch
    supabase.from("fs_qr_scans").select("id, members(full_name)", { count: "exact" })
      .eq("session_id", activeSession.id).then(({ data, count }) => {
        setScanCount(count || 0);
        setScannedStudents((data || []).map((d: any) => d.members?.full_name || "Unknown"));
      });
    return () => clearInterval(poll);
  }, [activeSession]);

  // Day locking
  const todayDay = new Date().getDay();
  const isClassDay = selectedClass?.scheduled_day ? DAY_MAP[selectedClass.scheduled_day] === todayDay : true;
  const isLocked = !isClassDay && !canOverrideLock;

  const handleGenerateQR = async () => {
    if (!selectedClass || !profileId) return;
    const qrCode = crypto.randomUUID();
    const { data, error } = await supabase.from("fs_qr_sessions").insert([{
      class_id: selectedClass.id,
      generated_by: profileId,
      qr_code: qrCode,
      organization_id: organizationId,
      is_active: true,
    }]).select().single();
    if (error) { toast.error(error.message); return; }
    setActiveSession(data);
    setQrMode("qr");
    toast.success("QR session started!");
  };

  const handleOverrideAndGenerate = async () => {
    // Flag the override
    if (profileId) {
      await supabase.from("activity_flags").insert([{
        flagged_user_id: profileId,
        flag_type: "outside_hours",
        description: `Opened ${selectedClass?.class_code} attendance outside scheduled day (${selectedClass?.scheduled_day})`,
        severity: "medium",
      }]);
    }
    setOverrideDialog(false);
    await handleGenerateQR();
  };

  const handleCloseSession = async () => {
    if (!activeSession) return;
    await supabase.from("fs_qr_sessions").update({ is_active: false, closed_at: new Date().toISOString() }).eq("id", activeSession.id);
    // Refresh attendance
    if (selectedClass) {
      const { data } = await supabase.from("foundation_school_attendance").select("id, class_id, member_id, attended, is_manual_override")
        .eq("class_id", selectedClass.id);
      const map: Record<string, AttendanceRecord> = {};
      (data || []).forEach((r: any) => { map[r.member_id] = r; });
      setAttendance(map);
    }
    setActiveSession(null);
    setQrMode("choose");
    toast.success(`Session closed! ${scanCount} students scanned.`);
  };

  const toggleAttendance = async (memberId: string, attended: boolean) => {
    if (!selectedClass || !profileId) return;
    const isManual = qrMode === "manual";
    const { data, error } = await supabase.from("foundation_school_attendance").upsert({
      class_id: selectedClass.id,
      member_id: memberId,
      attended,
      marked_by: profileId,
      marked_at: new Date().toISOString(),
      is_manual_override: isManual,
    }, { onConflict: "class_id,member_id" }).select("id, class_id, member_id, attended, is_manual_override").single();

    if (error) { toast.error(error.message); return; }
    setAttendance(prev => ({ ...prev, [memberId]: data as AttendanceRecord }));
  };

  const markAllPresent = async () => {
    if (!selectedClass || !profileId) return;
    const isManual = qrMode === "manual";
    const rows = students.map(s => ({
      class_id: selectedClass.id,
      member_id: s.id,
      attended: true,
      marked_by: profileId,
      marked_at: new Date().toISOString(),
      is_manual_override: isManual,
    }));
    const { error } = await supabase.from("foundation_school_attendance").upsert(rows, { onConflict: "class_id,member_id" });
    if (error) { toast.error(error.message); return; }
    const { data } = await supabase.from("foundation_school_attendance").select("id, class_id, member_id, attended, is_manual_override").eq("class_id", selectedClass.id);
    const map: Record<string, AttendanceRecord> = {};
    (data || []).forEach((r: any) => { map[r.member_id] = r; });
    setAttendance(map);

    if (isManual) {
      await supabase.from("activity_flags").insert([{
        flagged_user_id: profileId,
        flag_type: "bulk_marking",
        description: `Bulk marked all ${students.length} students present for ${selectedClass.class_code} (manual override)`,
        severity: "high",
      }]);
    }
    toast.success("All students marked present ✓");
  };

  const saveExamScore = async (memberId: string, score: number) => {
    const passed = score >= 50;
    await supabase.from("members").update({ fs_exam_score: score, fs_exam_passed: passed } as any).eq("id", memberId);
    setStudents(prev => prev.map(s => s.id === memberId ? { ...s, fs_exam_score: score, fs_exam_passed: passed } : s));
    toast.success(passed ? "✅ Passed!" : "❌ Did not pass");
  };

  const presentCount = students.filter(s => attendance[s.id]?.attended).length;
  const qrUrl = activeSession ? `https://cebz1retention.site/fs-scan?token=${activeSession.qr_code}` : "";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-display font-extrabold text-foreground">📖 Foundation School</h2>
        <p className="text-muted-foreground mt-1">Mark class attendance</p>
      </div>

      {/* Class selector — horizontal scroll */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {classes.map(c => {
          const classDay = c.scheduled_day ? DAY_MAP[c.scheduled_day] === todayDay : true;
          return (
            <button
              key={c.id}
              onClick={() => setSelectedClass(c)}
              className={`flex-shrink-0 px-4 py-3 rounded-xl text-left transition-all border relative ${
                selectedClass?.id === c.id
                  ? "bg-primary/15 border-primary/40 text-primary"
                  : "bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-primary/20"
              }`}
            >
              <p className="text-sm font-bold">{classLabels[c.class_code] || c.class_code}</p>
              <p className="text-xs mt-0.5 max-w-[120px] truncate">{c.class_title}</p>
              {!classDay && <Lock className="h-3 w-3 absolute top-2 right-2 text-warning" />}
            </button>
          );
        })}
      </div>

      {selectedClass && (
        <>
          {/* Day lock check */}
          {isLocked ? (
            <Card className="border-warning/30">
              <CardContent className="p-6 text-center space-y-3">
                <Lock className="h-12 w-12 text-warning mx-auto" />
                <h3 className="font-display font-bold text-foreground text-lg">🔒 Class Locked</h3>
                <p className="text-muted-foreground">
                  This class is scheduled for <span className="font-bold text-foreground">{DAY_LABEL[selectedClass.scheduled_day || ""] || selectedClass.scheduled_day}</span>. Come back then to open attendance.
                </p>
                <Button variant="outline" size="sm" disabled className="opacity-50">
                  <QrCode className="h-4 w-4 mr-2" /> Generate QR Code
                </Button>
              </CardContent>
            </Card>
          ) : qrMode === "choose" ? (
            /* Choose mode */
            <Card>
              <CardContent className="p-6 space-y-4 text-center">
                {!isClassDay && canOverrideLock && (
                  <div className="bg-warning/10 border border-warning/30 rounded-xl p-3 text-sm text-warning font-medium">
                    ⚠️ This class is scheduled for {DAY_LABEL[selectedClass.scheduled_day || ""] || selectedClass.scheduled_day}. Opening will be flagged.
                  </div>
                )}
                <Button
                  className="w-full h-14 text-base font-bold gap-2"
                  onClick={() => {
                    if (!isClassDay && canOverrideLock) {
                      setOverrideDialog(true);
                    } else {
                      handleGenerateQR();
                    }
                  }}
                >
                  <QrCode className="h-5 w-5" /> 📱 Generate QR Code for This Class
                </Button>
                <button
                  className="text-sm text-muted-foreground underline hover:text-foreground transition-colors"
                  onClick={() => setQrMode("manual")}
                >
                  Mark Manually (requires reason)
                </button>
              </CardContent>
            </Card>
          ) : qrMode === "qr" && activeSession ? (
            /* QR Mode — show QR + live counter */
            <div className="space-y-4">
              <Card>
                <CardContent className="p-6 text-center space-y-4">
                  <h3 className="font-display font-bold text-foreground text-lg">
                    {classLabels[selectedClass.class_code]} — {selectedClass.class_title}
                  </h3>
                  <div className="flex justify-center">
                    <div className="bg-white p-4 rounded-2xl">
                      <QRCodeSVG value={qrUrl} size={220} />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground break-all">{qrUrl}</p>

                  <div className="flex items-center justify-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-success" />
                    </span>
                    <span className="text-success font-bold text-lg">{scanCount} students scanned</span>
                  </div>

                  <Button variant="destructive" className="w-full h-12 text-base font-bold" onClick={handleCloseSession}>
                    Close Session
                  </Button>
                </CardContent>
              </Card>

              {/* Live scanned students */}
              {scannedStudents.length > 0 && (
                <Card>
                  <CardContent className="p-4 space-y-2">
                    <h4 className="font-semibold text-foreground text-sm">Scanned Students</h4>
                    {scannedStudents.map((name, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-success/10">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        <span className="text-sm text-foreground">{name}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          ) : qrMode === "manual" ? (
            /* Manual Mode */
            <div className="space-y-4">
              <Card className="border-warning/30">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-warning" />
                    <p className="font-semibold text-warning text-sm">Manual Override Mode</p>
                  </div>
                  <Textarea
                    placeholder="Why are you marking manually? (required)"
                    value={manualReason}
                    onChange={e => setManualReason(e.target.value)}
                    className="min-h-[60px]"
                  />
                  {!manualReason.trim() && (
                    <p className="text-xs text-destructive">Please provide a reason before marking attendance.</p>
                  )}
                </CardContent>
              </Card>

              {manualReason.trim() && (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      <span className="text-success font-bold">{presentCount}</span> of {students.length} present
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setQrMode("choose"); setManualReason(""); }}>Cancel</Button>
                      <Button size="sm" variant="outline" onClick={markAllPresent} className="gap-2">
                        <CheckCircle2 className="h-4 w-4" /> Mark All Present
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {students.map(s => {
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
                              <Switch checked={isPresent} onCheckedChange={(checked) => toggleAttendance(s.id, checked)} />
                            </div>
                            {selectedClass.is_exam && (
                              <div className="flex items-center gap-3 mt-3 pl-[52px]">
                                <Input type="number" min={0} max={100} placeholder="Score" className="w-24 h-9"
                                  value={examScores[s.id] ?? s.fs_exam_score ?? ""}
                                  onChange={e => setExamScores(prev => ({ ...prev, [s.id]: e.target.value === "" ? "" : Number(e.target.value) }))}
                                />
                                <Button size="sm" variant="outline" onClick={() => {
                                  const v = examScores[s.id];
                                  if (v === "" || v === undefined) return;
                                  saveExamScore(s.id, Number(v));
                                }}>Save</Button>
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
          ) : null}
        </>
      )}

      {/* Override confirmation dialog */}
      <Dialog open={overrideDialog} onOpenChange={setOverrideDialog}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" /> Override Day Lock
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Open attendance outside the scheduled day? This will be flagged in the activity log.
          </p>
          <div className="flex gap-3 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => setOverrideDialog(false)}>Cancel</Button>
            <Button variant="destructive" className="flex-1" onClick={handleOverrideAndGenerate}>Open Anyway</Button>
          </div>
        </DialogContent>
      </Dialog>
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
    const { data: classData } = await supabase.from("foundation_school_classes").select("*").order("class_number");
    setClasses((classData || []) as FSClass[]);

    let q = supabase.from("members").select("id, full_name, phone_number, organization_id, fs_enrolled, fs_classes_completed, fs_exam_score, fs_exam_passed, fs_graduated, fs_graduation_date, status").order("full_name");
    q = scopeQuery(q, role as any, organizationId);
    const { data: memberData } = await q;
    const all = (memberData || []) as FSMember[];
    setEnrolled(all.filter(m => m.fs_enrolled));
    setUnenrolled(all.filter(m => !m.fs_enrolled));

    const { data: attData } = await supabase.from("foundation_school_attendance").select("class_id, member_id, attended, is_manual_override").eq("attended", true);
    setAllAttendance(attData || []);
  }, [role, organizationId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalEnrolled = enrolled.length;
  const avgCompleted = totalEnrolled > 0 ? Math.round(enrolled.reduce((sum, m) => sum + (m.fs_classes_completed || 0), 0) / totalEnrolled) : 0;
  const examPassed = enrolled.filter(m => m.fs_exam_passed).length;
  const graduated = enrolled.filter(m => m.fs_graduated).length;
  const pendingGrad = enrolled.filter(m => m.fs_exam_passed && !m.fs_graduated).length;

  const memberAttMap: Record<string, Set<string>> = {};
  const memberManualMap: Record<string, Set<string>> = {};
  allAttendance.forEach((a: any) => {
    if (!memberAttMap[a.member_id]) memberAttMap[a.member_id] = new Set();
    memberAttMap[a.member_id].add(a.class_id);
    if (a.is_manual_override) {
      if (!memberManualMap[a.member_id]) memberManualMap[a.member_id] = new Set();
      memberManualMap[a.member_id].add(a.class_id);
    }
  });

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
    await supabase.from("follow_up_tasks").update({ status: "done", completed_at: new Date().toISOString() }).eq("member_id", student.id).eq("task_key", "week6_status_upgrade").eq("status", "pending");
    toast.success(`🎓 ${student.full_name} has graduated from Foundation School!`);
    fetchData();
  };

  const filteredEnrolled = enrolled.filter(m => m.full_name.toLowerCase().includes(searchStudent.toLowerCase()));
  const filteredUnenrolled = unenrolled.filter(m => m.full_name.toLowerCase().includes(searchEnroll.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-display font-extrabold text-foreground">
          📖 Foundation School {showEnroll ? "" : "— Zone Overview"}
        </h2>
        <p className="text-muted-foreground mt-1">Track enrollment, attendance & graduation</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <FSStatCard icon={<Users className="h-5 w-5 text-primary" />} label="Enrolled" value={totalEnrolled} color="primary" />
        <FSStatCard icon={<BookOpen className="h-5 w-5 text-info" />} label="Avg Classes" value={avgCompleted} color="info" />
        <FSStatCard icon={<CheckCircle2 className="h-5 w-5 text-success" />} label="Exam Passed" value={examPassed} color="success" />
        <FSStatCard icon={<GraduationCap className="h-5 w-5 text-accent" />} label="Graduated" value={graduated} color="accent" />
        <FSStatCard icon={<Clock className="h-5 w-5 text-warning" />} label="Pending Grad" value={pendingGrad} color="warning" />
      </div>

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
              <Input placeholder="Search members to enroll..." className="pl-9 h-10" value={searchEnroll} onChange={e => setSearchEnroll(e.target.value)} />
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

      <Card>
        <CardContent className="p-5 space-y-4">
          <h3 className="font-display font-bold text-foreground">Student Progress</h3>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search students..." className="pl-9 h-10" value={searchStudent} onChange={e => setSearchStudent(e.target.value)} />
          </div>
          <div className="space-y-2">
            {filteredEnrolled.length === 0 ? (
              <p className="text-center py-8 text-sm text-muted-foreground">No enrolled students found</p>
            ) : filteredEnrolled.map(s => {
              const attended = memberAttMap[s.id] || new Set();
              const manualClasses = memberManualMap[s.id] || new Set();
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
                  <div className="pl-[52px] space-y-1.5">
                    <div className="flex gap-1">
                      {classes.map(c => {
                        const isAttended = attended.has(c.id);
                        const isManual = manualClasses.has(c.id);
                        return (
                          <div
                            key={c.id}
                            title={`${c.class_code}: ${isAttended ? (isManual ? "Manual Override" : "Attended") : "Not yet"}`}
                            className={`h-2.5 w-2.5 rounded-full ${isAttended ? (isManual ? "bg-warning" : "bg-success") : "bg-muted"}`}
                          />
                        );
                      })}
                    </div>
                    <Progress value={progressPct} className="h-1.5" />
                    {manualClasses.size > 0 && (
                      <p className="text-xs text-warning font-medium">⚠️ {manualClasses.size} manual override{manualClasses.size > 1 ? "s" : ""}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

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
function FSStatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
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
