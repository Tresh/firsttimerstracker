import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { scopeQuery } from "@/utils/scopeQuery";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Search, Users, UserPlus, FileSpreadsheet } from "lucide-react";

const statusColors: Record<string, string> = {
  "First Timer": "badge-gold",
  "Second Timer": "badge-primary",
  "New Convert": "bg-purple-500/15 text-purple-400 border border-purple-500/30",
  "Member": "bg-success/15 text-success border border-success/30",
  "Worker": "bg-info/15 text-info border border-info/30",
};

export default function Members() {
  const { role, organizationId } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "", phone_number: "", email: "", gender: "", age_range: "", address: "", location: "",
    date_of_first_visit: new Date().toISOString().split("T")[0],
    service_attended: "Sunday Service" as "Sunday Service" | "Midweek Service" | "Special Program" | "Cell Meeting",
    status: "Member" as "First Timer" | "Second Timer" | "New Convert" | "Member" | "Worker",
  });

  const fetchMembers = useCallback(async () => {
    let query = supabase.from("members").select("*").order("created_at", { ascending: false });
    query = scopeQuery(query, role, organizationId);
    const { data } = await query;
    setMembers(data || []);
  }, [role, organizationId]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("members").insert([formData]);
    if (error) return toast.error(error.message);
    toast.success("Member registered!");
    setIsRegisterOpen(false);
    fetchMembers();
  };

  const statuses = ["All", "First Timer", "Second Timer", "New Convert", "Member", "Worker"];
  const filtered = members.filter(m => {
    const matchSearch = m.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || m.phone_number?.includes(searchTerm) || m.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === "All" || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-extrabold text-foreground">Members</h2>
          <p className="text-muted-foreground mt-1">{filtered.length} records</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
            <DialogTrigger asChild><Button className="gap-2"><UserPlus className="h-4 w-4" />Register</Button></DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-[rgba(255,255,255,0.07)]">
              <DialogHeader><DialogTitle className="font-display text-xl">Register Member</DialogTitle></DialogHeader>
              <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2"><Label>Full Name *</Label><Input required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="h-11" /></div>
                <div className="space-y-2"><Label>Phone</Label><Input value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} className="h-11" /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="h-11" /></div>
                <div className="space-y-2"><Label>Status</Label>
                  <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v as any})}>
                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>{statuses.filter(s => s !== "All").map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Location</Label><Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="h-11" /></div>
                <div className="space-y-2"><Label>Date of First Visit</Label><Input type="date" value={formData.date_of_first_visit} onChange={e => setFormData({...formData, date_of_first_visit: e.target.value})} className="h-11" /></div>
                <div className="col-span-full flex justify-end gap-2 mt-4">
                  <Button type="button" variant="outline" onClick={() => setIsRegisterOpen(false)}>Cancel</Button>
                  <Button type="submit">Save</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Button variant="outline" className="gap-2" onClick={() => toast.info("Coming soon!")}><FileSpreadsheet className="h-4 w-4 text-success" />Import</Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search name, phone, location..." className="pl-9 h-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      {/* Status Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {statuses.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${statusFilter === s ? "gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
            {s}
          </button>
        ))}
      </div>

      {/* Member List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <Card><CardContent className="p-12 text-center text-muted-foreground"><Users className="h-12 w-12 mx-auto mb-4 opacity-20" /><p>No members found.</p></CardContent></Card>
        ) : filtered.map(m => (
          <Card key={m.id}>
            <CardContent className="p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm flex-shrink-0">{m.full_name?.charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm text-foreground">{m.full_name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[m.status] || "badge-primary"}`}>{m.status}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{m.phone_number || "—"} • {m.location || "—"}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
