import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Building2, Plus, Users } from "lucide-react";

export default function Departments() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");

  const fetchDepartments = async () => {
    const { data } = await supabase.from("departments").select("*").order("name");
    setDepartments(data || []);
  };

  useEffect(() => { fetchDepartments(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("departments").insert([{ name }]);
    if (error) toast.error("Failed to create department");
    else { toast.success("Department created!"); setName(""); setIsOpen(false); fetchDepartments(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-extrabold text-foreground">Departments</h2>
          <p className="text-muted-foreground mt-1">Manage church departments</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" />Add Department</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-[rgba(255,255,255,0.07)]">
            <DialogHeader><DialogTitle className="font-display">New Department</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div className="space-y-2"><Label>Department Name</Label><Input required value={name} onChange={e => setName(e.target.value)} className="h-11" /></div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {departments.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-4 opacity-20" /><p>No departments yet.</p>
        </CardContent></Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map(d => (
            <Card key={d.id}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="gradient-primary p-3 rounded-xl"><Building2 className="h-5 w-5 text-primary-foreground" /></div>
                <div><p className="font-semibold text-foreground">{d.name}</p><p className="text-xs text-muted-foreground">Created {new Date(d.created_at).toLocaleDateString()}</p></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
