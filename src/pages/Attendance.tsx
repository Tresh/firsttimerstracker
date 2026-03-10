import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CheckCircle2, Circle, Search, Users } from "lucide-react";

export default function Attendance() {
  const [members, setMembers] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [serviceType, setServiceType] = useState<"Sunday Service" | "Midweek Service" | "Special Program" | "Cell Meeting">("Sunday Service");
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [serviceId, setServiceId] = useState<string | null>(null);

  useEffect(() => { fetchMembers(); }, []);
  useEffect(() => { fetchOrCreateService(); }, [attendanceDate, serviceType]);

  const fetchMembers = async () => {
    const { data, error } = await supabase.from("members").select("id, full_name, phone_number, status, location").order("full_name");
    if (error) toast.error("Failed to load members");
    else setMembers(data || []);
  };

  const fetchOrCreateService = async () => {
    // Try to find an existing service for this date and type
    const { data: services } = await supabase
      .from("services")
      .select("id")
      .eq("service_date", attendanceDate)
      .eq("service_type", serviceType)
      .limit(1);

    if (services && services.length > 0) {
      setServiceId(services[0].id);
      // Fetch attendance for this service
      const { data } = await supabase.from("attendance").select("member_id").eq("service_id", services[0].id);
      const records: Record<string, boolean> = {};
      data?.forEach(r => { if (r.member_id) records[r.member_id] = true; });
      setAttendanceRecords(records);
    } else {
      setServiceId(null);
      setAttendanceRecords({});
    }
  };

  const toggleAttendance = (memberId: string) => {
    setAttendanceRecords(prev => ({ ...prev, [memberId]: !prev[memberId] }));
  };

  const saveAttendance = async () => {
    setIsSaving(true);
    try {
      let currentServiceId = serviceId;

      // Create service if it doesn't exist
      if (!currentServiceId) {
        const { data: orgData } = await supabase.from("organizations").select("id").limit(1).single();
        const orgId = orgData?.id;
        if (!orgId) { toast.error("No organization found"); setIsSaving(false); return; }

        const validFrom = new Date(attendanceDate + "T06:00:00Z").toISOString();
        const validUntil = new Date(attendanceDate + "T23:59:59Z").toISOString();

        const { data: newService, error: svcErr } = await supabase.from("services").insert({
          organization_id: orgId,
          service_type: serviceType,
          service_date: attendanceDate,
          service_name: `${serviceType} - ${attendanceDate}`,
          valid_from: validFrom,
          valid_until: validUntil,
        }).select("id").single();

        if (svcErr || !newService) { toast.error("Failed to create service"); setIsSaving(false); return; }
        currentServiceId = newService.id;
        setServiceId(currentServiceId);
      }

      // Delete existing attendance for this service
      await supabase.from("attendance").delete().eq("service_id", currentServiceId);

      const presentMemberIds = Object.keys(attendanceRecords).filter(id => attendanceRecords[id]);
      if (presentMemberIds.length === 0) {
        toast.success("Attendance updated (0 present)");
        setIsSaving(false);
        return;
      }

      const { error } = await supabase.from("attendance").insert(
        presentMemberIds.map(id => ({
          member_id: id,
          service_id: currentServiceId!,
          scan_method: "manual",
        }))
      );

      if (error) toast.error("Failed to save attendance");
      else toast.success(`Recorded ${presentMemberIds.length} present members`);
    } catch {
      toast.error("An error occurred");
    }
    setIsSaving(false);
  };

  const filteredMembers = members.filter(m => m.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || m.phone_number?.includes(searchTerm));
  const presentCount = Object.values(attendanceRecords).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-extrabold text-foreground">Live Attendance</h2>
          <p className="text-muted-foreground mt-1">Mark present members for the selected service</p>
        </div>
        <Button onClick={saveAttendance} disabled={isSaving} className="h-12 px-8 text-base">
          {isSaving ? "Saving..." : `Save Attendance (${presentCount})`}
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Service Type</label>
              <Select value={serviceType} onValueChange={(v: any) => setServiceType(v)}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sunday Service">Sunday Service</SelectItem>
                  <SelectItem value="Midweek Service">Midweek Service</SelectItem>
                  <SelectItem value="Special Program">Special Program</SelectItem>
                  <SelectItem value="Cell Meeting">Cell Meeting</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Date</label>
              <Input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} className="h-11" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Search Member</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input placeholder="Find by name or phone..." className="pl-10 h-11" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-secondary/30 p-2 border border-[rgba(255,255,255,0.04)]">
            <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-2">
              {filteredMembers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No members found.</p>
                </div>
              ) : (
                filteredMembers.map((member) => {
                  const isPresent = attendanceRecords[member.id] || false;
                  return (
                    <div key={member.id} onClick={() => toggleAttendance(member.id)}
                      className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all duration-200 border ${
                        isPresent ? "bg-success/10 border-success/30 active-glow" : "bg-card border-transparent hover:border-primary/20"
                      }`}>
                      <div className="flex items-center gap-4">
                        <div className={`h-11 w-11 rounded-full flex items-center justify-center font-bold text-sm ${
                          isPresent ? "bg-success text-success-foreground" : "bg-secondary text-muted-foreground"
                        }`}>{member.full_name.charAt(0)}</div>
                        <div>
                          <p className="font-semibold text-foreground">{member.full_name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              member.status === "First Timer" ? "badge-gold" : "badge-primary"
                            }`}>{member.status}</span>
                            <span className="text-xs text-muted-foreground">{member.phone_number || "No number"}</span>
                          </div>
                        </div>
                      </div>
                      {isPresent ? <CheckCircle2 className="h-7 w-7 text-success" /> : <Circle className="h-7 w-7 text-muted-foreground/30" />}
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
