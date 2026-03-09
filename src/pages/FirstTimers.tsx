import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Search, UserPlus, Upload, FileSpreadsheet } from "lucide-react";

export default function FirstTimers() {
  const [firstTimers, setFirstTimers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState<{
    full_name: string;
    phone_number: string;
    email: string;
    gender: string;
    age_range: string;
    address: string;
    location: string;
    date_of_first_visit: string;
    service_attended: "Sunday Service" | "Midweek Service" | "Special Program" | "Cell Meeting";
  }>({
    full_name: "",
    phone_number: "",
    email: "",
    gender: "",
    age_range: "",
    address: "",
    location: "",
    date_of_first_visit: new Date().toISOString().split("T")[0],
    service_attended: "Sunday Service",
  });

  const fetchFirstTimers = async () => {
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .eq("status", "First Timer")
      .order("created_at", { ascending: false });
    
    if (error) {
      toast.error("Failed to load first timers");
    } else {
      setFirstTimers(data || []);
    }
  };

  useEffect(() => {
    fetchFirstTimers();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from("members").insert([{
        ...formData,
        status: "First Timer",
      }]);

      if (error) throw error;

      toast.success("First Timer registered successfully!");
      setIsRegisterOpen(false);
      fetchFirstTimers();
      
      // Reset form
      setFormData({
        full_name: "", phone_number: "", email: "", gender: "", age_range: "",
        address: "", location: "", date_of_first_visit: new Date().toISOString().split("T")[0], service_attended: "Sunday Service"
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to register");
    }
  };

  const filteredFirstTimers = firstTimers.filter(ft => 
    ft.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    ft.phone_number?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-display font-bold text-foreground">First Timers</h2>
        
        <div className="flex gap-3 w-full sm:w-auto">
          <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary border-0 text-primary-foreground gap-2">
                <UserPlus className="h-4 w-4" />
                Register First Timer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Register New First Timer</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select value={formData.gender} onValueChange={v => setFormData({...formData, gender: v})}>
                    <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Age Range</Label>
                  <Select value={formData.age_range} onValueChange={v => setFormData({...formData, age_range: v})}>
                    <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Under 18">Under 18</SelectItem>
                      <SelectItem value="18-24">18-24</SelectItem>
                      <SelectItem value="25-34">25-34</SelectItem>
                      <SelectItem value="35-44">35-44</SelectItem>
                      <SelectItem value="45-54">45-54</SelectItem>
                      <SelectItem value="55+">55+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date of First Visit *</Label>
                  <Input type="date" required value={formData.date_of_first_visit} onChange={e => setFormData({...formData, date_of_first_visit: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Service Attended *</Label>
                  <Select value={formData.service_attended} onValueChange={v => setFormData({...formData, service_attended: v as any})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sunday Service">Sunday Service</SelectItem>
                      <SelectItem value="Midweek Service">Midweek Service</SelectItem>
                      <SelectItem value="Special Program">Special Program</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Location / Area</Label>
                  <Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Full Address</Label>
                  <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                </div>
                <div className="md:col-span-2 flex justify-end gap-2 mt-4">
                  <Button type="button" variant="outline" onClick={() => setIsRegisterOpen(false)}>Cancel</Button>
                  <Button type="submit" className="gradient-primary border-0 text-primary-foreground">Save First Timer</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Button variant="outline" className="gap-2" onClick={() => toast.info("Excel import coming soon!")}>
            <FileSpreadsheet className="h-4 w-4 text-success" />
            Import Excel
          </Button>
        </div>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Registered First Timers ({firstTimers.length})</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name or phone..." 
                className="pl-9"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredFirstTimers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No first timers found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium">Contact</th>
                    <th className="pb-3 font-medium">Location</th>
                    <th className="pb-3 font-medium">Service</th>
                    <th className="pb-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredFirstTimers.map((ft) => (
                    <tr key={ft.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="py-4 font-medium">{ft.full_name}</td>
                      <td className="py-4 text-muted-foreground">
                        <div>{ft.phone_number || "—"}</div>
                        <div className="text-xs">{ft.email}</div>
                      </td>
                      <td className="py-4 text-muted-foreground">{ft.location || "—"}</td>
                      <td className="py-4">
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
                          {ft.service_attended}
                        </span>
                      </td>
                      <td className="py-4 text-muted-foreground">
                        {new Date(ft.date_of_first_visit).toLocaleDateString()}
                      </td>
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
