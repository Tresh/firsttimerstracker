import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CheckCircle2, Circle, Search, Users, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function Attendance() {
  const [members, setMembers] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [serviceType, setServiceType] = useState<"Sunday Service" | "Midweek Service" | "Special Program" | "Cell Meeting">("Sunday Service");
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  // Whenever date or service changes, load existing attendance records for that day
  useEffect(() => {
    fetchAttendanceForDate();
  }, [attendanceDate, serviceType]);

  const fetchMembers = async () => {
    const { data, error } = await supabase
      .from("members")
      .select("id, full_name, phone_number, status, location")
      .order("full_name");
      
    if (error) {
      toast.error("Failed to load members");
    } else {
      setMembers(data || []);
    }
  };

  const fetchAttendanceForDate = async () => {
    const { data, error } = await supabase
      .from("attendance")
      .select("member_id")
      .eq("date", attendanceDate)
      .eq("service_type", serviceType);

    if (error) {
      console.error(error);
      return;
    }

    const records: Record<string, boolean> = {};
    if (data) {
      data.forEach(record => {
        records[record.member_id] = true;
      });
    }
    setAttendanceRecords(records);
  };

  const toggleAttendance = (memberId: string) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [memberId]: !prev[memberId]
    }));
  };

  const saveAttendance = async () => {
    setIsSaving(true);
    
    // First, delete existing records for this date/service to avoid duplicates
    await supabase
      .from("attendance")
      .delete()
      .eq("date", attendanceDate)
      .eq("service_type", serviceType);

    // Filter out only the ones marked as true
    const presentMemberIds = Object.keys(attendanceRecords).filter(id => attendanceRecords[id]);
    
    if (presentMemberIds.length === 0) {
      toast.success("Attendance updated (0 present)");
      setIsSaving(false);
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    
    const recordsToInsert = presentMemberIds.map(id => ({
      member_id: id,
      date: attendanceDate,
      service_type: serviceType,
      logged_by: userData.user?.id || null
    }));

    const { error } = await supabase
      .from("attendance")
      .insert(recordsToInsert);

    if (error) {
      toast.error("Failed to save attendance");
      console.error(error);
    } else {
      toast.success(`Successfully recorded ${presentMemberIds.length} present members`);
    }
    
    setIsSaving(false);
  };

  const filteredMembers = members.filter(m => 
    m.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.phone_number?.includes(searchTerm)
  );

  const presentCount = Object.values(attendanceRecords).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-foreground">Live Attendance</h2>
          <p className="text-muted-foreground mt-1">Mark present members for the selected service</p>
        </div>
        
        <Button 
          className="gradient-primary border-0 text-primary-foreground h-12 px-8 shadow-lg hover:scale-105 transition-all text-lg font-semibold"
          onClick={saveAttendance}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : `Save Attendance (${presentCount})`}
        </Button>
      </div>

      <Card className="glass-card border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="space-y-2">
              <label className="text-sm font-medium">Service Type</label>
              <Select value={serviceType} onValueChange={(v: any) => setServiceType(v)}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sunday Service">Sunday Service</SelectItem>
                  <SelectItem value="Midweek Service">Midweek Service</SelectItem>
                  <SelectItem value="Special Program">Special Program</SelectItem>
                  <SelectItem value="Cell Meeting">Cell Meeting</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Input 
                type="date" 
                value={attendanceDate} 
                onChange={(e) => setAttendanceDate(e.target.value)} 
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Search Member</label>
              <div className="relative">
                <Search className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder="Find by name or phone..." 
                  className="pl-10 h-12 rounded-xl"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="bg-muted/30 rounded-2xl p-2 border border-border/50">
            <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
              {filteredMembers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No members found matching your search.</p>
                </div>
              ) : (
                filteredMembers.map((member) => {
                  const isPresent = attendanceRecords[member.id] || false;
                  return (
                    <div 
                      key={member.id}
                      onClick={() => toggleAttendance(member.id)}
                      className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
                        isPresent 
                          ? "bg-success/10 border-success/30 shadow-sm" 
                          : "bg-background border-transparent hover:border-primary/20 hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg shadow-inner ${
                          isPresent ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"
                        }`}>
                          {member.full_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-lg">{member.full_name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              member.status === "First Timer" ? "bg-warning/20 text-warning-foreground" :
                              "bg-primary/10 text-primary"
                            }`}>
                              {member.status}
                            </span>
                            <span className="text-sm text-muted-foreground">{member.phone_number || "No number"}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pl-4">
                        {isPresent ? (
                          <CheckCircle2 className="h-8 w-8 text-success drop-shadow-sm" />
                        ) : (
                          <Circle className="h-8 w-8 text-muted-foreground opacity-30" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}