import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Search, Users, UserPlus, FileSpreadsheet } from "lucide-react";

export default function Members() {
  const [members, setMembers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGroup, setFilterGroup] = useState("all");
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const [formData, setFormData] = useState<{
    full_name: string; phone_number: string; email: string; gender: string; age_range: string;
    address: string; location: string; date_of_first_visit: string;
    service_attended: "Sunday Service" | "Midweek Service" | "Special Program" | "Cell Meeting";
    status: "First Timer" | "Second Timer" | "New Convert" | "Member" | "Worker";
  }>({
    full_name: "", phone_number: "", email: "", gender: "", age_range: "",
    address: "", location: "", date_of_first_visit: new Date().toISOString().split("T")[0],
    service_attended: "Sunday Service", status: "Member",
  });

  const fetchMembers = async () => {
    const { data, error } = await supabase.from("members").select("*").order("created_at", { ascending: false });
    if (error) toast.error("Failed to load members");
    else setMembers(data || []);
  };

  useEffect(() => { fetchMembers(); }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from("members").insert([formData]);
      if (error) throw error;
      toast.success("Member registered successfully!");
      setIsRegisterOpen(false);
      fetchMembers();
    } catch (err: any) {
      toast.error(err.message || "Failed to register");
    }
  };

  const groups = [...new Set(members.map(m => m.group_assigned).filter(Boolean))];
  const filtered = members.filter(m => {
    const matchesSearch = m.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || m.phone_number?.includes(searchTerm);
    const matchesGroup = filterGroup === "all" || m.group_assigned === filterGroup;
    return matchesSearch && matchesGroup;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-extrabold text-foreground">Members Directory</h2>
          <p className="text-muted-foreground mt-1">Manage your church's member database</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><UserPlus className="h-4 w-4" />Register Member</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-[rgba(255,255,255,0.07)]">
              <DialogHeader><DialogTitle className="font-display text-xl">Register New Member</DialogTitle></DialogHeader>
              <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2"><Label>Full Name *</Label><Input required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="h-11" /></div>
                <div className="space-y-2"><Label>Phone Number</Label><Input value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} className="h-11" /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="h-11" /></div>
                <div className="space-y-2"><Label>Status</Label>
                  <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v as any})}>
                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="First Timer">First Timer</SelectItem><SelectItem value="Second Timer">Second Timer</SelectItem>
                      <SelectItem value="New Convert">New Convert</SelectItem><SelectItem value="Member">Member</SelectItem><SelectItem value="Worker">Worker</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Gender</Label>
                  <Select value={formData.gender} onValueChange={v => setFormData({...formData, gender: v})}>
                    <SelectTrigger className="h-11"><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Location</Label><Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="h-11" /></div>
                <div className="space-y-2"><Label>Service Attended</Label>
                  <Select value={formData.service_attended} onValueChange={v => setFormData({...formData, service_attended: v as any})}>
                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sunday Service">Sunday Service</SelectItem><SelectItem value="Midweek Service">Midweek Service</SelectItem>
                      <SelectItem value="Special Program">Special Program</SelectItem><SelectItem value="Cell Meeting">Cell Meeting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Date of First Visit</Label><Input type="date" value={formData.date_of_first_visit} onChange={e => setFormData({...formData, date_of_first_visit: e.target.value})} className="h-11" /></div>
                <div className="md:col-span-2 flex justify-end gap-2 mt-4">
                  <Button type="button" variant="outline" onClick={() => setIsRegisterOpen(false)}>Cancel</Button>
                  <Button type="submit">Save Member</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Button variant="outline" className="gap-2" onClick={() => toast.info("Import coming soon!")}><FileSpreadsheet className="h-4 w-4 text-success" />Import</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>All Members ({members.length})</CardTitle>
            <div className="flex gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search..." className="pl-9 h-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              {groups.length > 0 && (
                <Select value={filterGroup} onValueChange={setFilterGroup}>
                  <SelectTrigger className="w-40 h-10"><SelectValue placeholder="All Groups" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Groups</SelectItem>
                    {groups.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground"><Users className="h-12 w-12 mx-auto mb-4 opacity-20" /><p>No members found.</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.07)] text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">Name</th><th className="pb-3 font-medium">Contact</th>
                    <th className="pb-3 font-medium">Status</th><th className="pb-3 font-medium">Location</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filtered.map(m => (
                    <tr key={m.id} className="border-b border-[rgba(255,255,255,0.04)] last:border-0 hover:bg-secondary/50 transition-colors">
                      <td className="py-4 font-medium text-foreground">{m.full_name}</td>
                      <td className="py-4 text-muted-foreground"><div>{m.phone_number || "—"}</div><div className="text-xs">{m.email}</div></td>
                      <td className="py-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        m.status === "First Timer" ? "badge-gold" : m.status === "Worker" ? "bg-success/15 text-success border border-success/30" : "badge-primary"
                      }`}>{m.status}</span></td>
                      <td className="py-4 text-muted-foreground">{m.location || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
