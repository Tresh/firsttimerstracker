import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Search, UserPlus, FileSpreadsheet, Phone, MessageCircle, Calendar, MapPin } from "lucide-react";

const WEEK_TASKS = [
  { week: 1, tasks: ["Welcome Call", "WhatsApp Welcome", "Cell Group Invitation"] },
  { week: 2, tasks: ["Follow-Up Call", "Cell Meeting Attendance Check"] },
  { week: 3, tasks: ["Foundation School Registration", "Personal Visit"] },
  { week: 4, tasks: ["Baptism Counseling", "Water Baptism"] },
  { week: 5, tasks: ["Department Integration", "Spiritual Gift Assessment"] },
  { week: 6, tasks: ["Membership Confirmation", "Certificate Presentation"] },
];

const statusColors: Record<string, string> = {
  "First Timer": "badge-gold",
  "Second Timer": "badge-primary",
  "New Convert": "bg-purple-500/15 text-purple-400 border border-purple-500/30",
  "Member": "bg-success/15 text-success border border-success/30",
  "Worker": "bg-info/15 text-info border border-info/30",
};

export default function FirstTimers() {
  const [members, setMembers] = useState<any[]>([]);
  const [followUpTasks, setFollowUpTasks] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);

  const [formData, setFormData] = useState({
    full_name: "", phone_number: "", email: "", gender: "", age_range: "",
    address: "", location: "", date_of_first_visit: new Date().toISOString().split("T")[0],
    service_attended: "Sunday Service" as "Sunday Service" | "Midweek Service" | "Special Program" | "Cell Meeting",
    invited_by_name: "", group_assigned: "",
  });

  const fetchData = async () => {
    const [membersRes, tasksRes] = await Promise.all([
      supabase.from("members").select("*").in("status", ["First Timer", "Second Timer", "New Convert"]).order("date_of_first_visit", { ascending: false }),
      supabase.from("follow_up_tasks").select("*"),
    ]);
    setMembers(membersRes.data || []);
    setFollowUpTasks(tasksRes.data || []);
  };

  useEffect(() => { fetchData(); }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from("members").insert([{ ...formData, status: "First Timer" }]);
      if (error) throw error;
      toast.success("First Timer registered!");
      setIsRegisterOpen(false);
      fetchData();
      setFormData({ full_name: "", phone_number: "", email: "", gender: "", age_range: "", address: "", location: "", date_of_first_visit: new Date().toISOString().split("T")[0], service_attended: "Sunday Service", invited_by_name: "", group_assigned: "" });
    } catch (err: any) { toast.error(err.message); }
  };

  const getWeekProgress = (memberId: string) => {
    return [1, 2, 3, 4, 5, 6].map(w => {
      const task = followUpTasks.find(t => t.member_id === memberId && t.week_number === w);
      return task?.completed || false;
    });
  };

  const completedWeeks = (memberId: string) => getWeekProgress(memberId).filter(Boolean).length;

  const filtered = members.filter(m =>
    m.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || m.phone_number?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-extrabold text-foreground">First Timers</h2>
          <p className="text-muted-foreground mt-1">{filtered.length} visitors in pipeline</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><UserPlus className="h-4 w-4" />Register</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-[rgba(255,255,255,0.07)]">
              <DialogHeader><DialogTitle className="font-display text-xl">Register First Timer</DialogTitle></DialogHeader>
              <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2"><Label>Full Name *</Label><Input required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="h-11" /></div>
                <div className="space-y-2"><Label>Phone *</Label><Input value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} className="h-11" /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="h-11" /></div>
                <div className="space-y-2"><Label>Gender</Label>
                  <Select value={formData.gender} onValueChange={v => setFormData({...formData, gender: v})}>
                    <SelectTrigger className="h-11"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Age Range</Label>
                  <Select value={formData.age_range} onValueChange={v => setFormData({...formData, age_range: v})}>
                    <SelectTrigger className="h-11"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Under 18">Under 18</SelectItem><SelectItem value="18-25">18-25</SelectItem>
                      <SelectItem value="26-35">26-35</SelectItem><SelectItem value="36-45">36-45</SelectItem><SelectItem value="46+">46+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Service</Label>
                  <Select value={formData.service_attended} onValueChange={v => setFormData({...formData, service_attended: v as any})}>
                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sunday Service">Sunday Service</SelectItem><SelectItem value="Midweek Service">Midweek Service</SelectItem><SelectItem value="Special Program">Special Program</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-full space-y-2"><Label>Address</Label><Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="h-11" /></div>
                <div className="space-y-2"><Label>Location/Area</Label><Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="h-11" /></div>
                <div className="space-y-2"><Label>Invited By</Label><Input value={formData.invited_by_name} onChange={e => setFormData({...formData, invited_by_name: e.target.value})} className="h-11" /></div>
                <div className="space-y-2"><Label>Date of First Visit</Label><Input type="date" value={formData.date_of_first_visit} onChange={e => setFormData({...formData, date_of_first_visit: e.target.value})} className="h-11" /></div>
                <div className="space-y-2"><Label>Group Assigned</Label><Input value={formData.group_assigned} onChange={e => setFormData({...formData, group_assigned: e.target.value})} className="h-11" /></div>
                <div className="col-span-full flex justify-end gap-2 mt-4">
                  <Button type="button" variant="outline" onClick={() => setIsRegisterOpen(false)}>Cancel</Button>
                  <Button type="submit">Register</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Button variant="outline" className="gap-2" onClick={() => toast.info("Excel import coming soon!")}><FileSpreadsheet className="h-4 w-4 text-success" />Import</Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by name or phone..." className="pl-9 h-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      {/* First Timer Cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card><CardContent className="p-12 text-center text-muted-foreground"><UserPlus className="h-12 w-12 mx-auto mb-4 opacity-20" /><p>No first timers found.</p></CardContent></Card>
        ) : filtered.map((m) => {
          const progress = getWeekProgress(m.id);
          const done = progress.filter(Boolean).length;
          return (
            <Card key={m.id} className="cursor-pointer" onClick={() => setSelectedMember(m)}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm flex-shrink-0">{m.full_name?.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-foreground">{m.full_name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[m.status] || "badge-primary"}`}>{m.status}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{m.phone_number || "No phone"} • {new Date(m.date_of_first_visit).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>6-Week Follow-Up</span>
                    <span className="font-medium text-primary">{done}/6 weeks</span>
                  </div>
                  <div className="h-1.5 rounded-full progress-bar-track overflow-hidden">
                    <div className="h-full rounded-full progress-bar-fill" style={{ width: `${(done / 6) * 100}%` }} />
                  </div>
                </div>
                {m.location && <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1"><MapPin className="h-3 w-3" />{m.location}</p>}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Member Profile Modal */}
      <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-[rgba(255,255,255,0.07)]">
          {selectedMember && (
            <>
              <DialogHeader><DialogTitle className="font-display text-xl">Member Profile</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-2xl">{selectedMember.full_name?.charAt(0)}</div>
                  <div>
                    <h3 className="text-xl font-display font-bold text-foreground">{selectedMember.full_name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[selectedMember.status] || "badge-primary"}`}>{selectedMember.status}</span>
                    <p className="text-sm text-muted-foreground mt-1">{selectedMember.phone_number}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    ["📅 First Visit", selectedMember.date_of_first_visit],
                    ["⛪ Service", selectedMember.service_attended],
                    ["📍 Location", selectedMember.location],
                    ["👤 Invited By", selectedMember.invited_by_name],
                    ["🏘 Group", selectedMember.group_assigned],
                    ["🎂 Age", selectedMember.age_range],
                    ["📧 Email", selectedMember.email],
                    ["🚻 Gender", selectedMember.gender],
                  ].map(([k, v]) => (
                    <div key={k as string} className="bg-secondary rounded-xl p-3">
                      <p className="text-xs text-muted-foreground">{k}</p>
                      <p className="font-medium text-foreground">{(v as string) || "—"}</p>
                    </div>
                  ))}
                </div>

                {/* 6-Week Follow-Up Progress */}
                <div className="bg-primary/5 border border-primary/10 rounded-xl p-4">
                  <h4 className="font-display font-bold text-foreground mb-3">6-Week Follow-Up Progress</h4>
                  {WEEK_TASKS.map((wk, wi) => {
                    const progress = getWeekProgress(selectedMember.id);
                    const done = progress[wi];
                    return (
                      <div key={wi} className="mb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${done ? "bg-success text-success-foreground" : "bg-secondary text-muted-foreground"}`}>{wi + 1}</span>
                          <span className="text-sm font-medium text-foreground">Week {wi + 1}</span>
                          {done && <span className="text-success text-xs font-semibold">✓ Complete</span>}
                        </div>
                        <div className="ml-8 space-y-1">
                          {wk.tasks.map((t, ti) => (
                            <div key={ti} className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className={done ? "text-success" : "text-muted-foreground/30"}>●</span>{t}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <a href={`tel:${selectedMember.phone_number}`} className="flex-1">
                    <Button variant="outline" className="w-full gap-2"><Phone className="h-4 w-4" />Call</Button>
                  </a>
                  <a href={`https://wa.me/${(selectedMember.phone_number || "").replace(/^0/, "234")}`} target="_blank" rel="noreferrer" className="flex-1">
                    <Button variant="outline" className="w-full gap-2 text-success border-success/30 hover:bg-success/10"><MessageCircle className="h-4 w-4" />WhatsApp</Button>
                  </a>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
