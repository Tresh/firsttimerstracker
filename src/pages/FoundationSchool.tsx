import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, CheckCircle2, Clock } from "lucide-react";

export default function FoundationSchool() {
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase.from("members").select("id, full_name, phone_number, started_foundation_school, date_of_first_visit").order("full_name");
      setStudents(data || []);
    }
    fetch();
  }, []);

  const enrolled = students.filter(s => s.started_foundation_school);
  const notEnrolled = students.filter(s => !s.started_foundation_school);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-display font-extrabold text-foreground">Foundation School</h2>
        <p className="text-muted-foreground mt-1">Track foundation school enrollment</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="bg-success/20 p-3 rounded-xl"><CheckCircle2 className="h-6 w-6 text-success" /></div>
            <div>
              <p className="text-3xl font-display font-extrabold text-success">{enrolled.length}</p>
              <p className="text-sm text-muted-foreground">Enrolled</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="bg-warning/20 p-3 rounded-xl"><Clock className="h-6 w-6 text-warning" /></div>
            <div>
              <p className="text-3xl font-display font-extrabold text-warning">{notEnrolled.length}</p>
              <p className="text-sm text-muted-foreground">Not Enrolled</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-5">
          <h3 className="font-display font-bold text-foreground mb-4">All Members</h3>
          {students.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground"><GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-20" /><p>No members found.</p></div>
          ) : (
            <div className="space-y-2">
              {students.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold">{s.full_name.charAt(0)}</div>
                    <div>
                      <p className="font-medium text-sm text-foreground">{s.full_name}</p>
                      <p className="text-xs text-muted-foreground">{s.phone_number || "No phone"}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    s.started_foundation_school ? "bg-success/15 text-success border border-success/30" : "badge-gold"
                  }`}>
                    {s.started_foundation_school ? "Enrolled" : "Not Started"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
