import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, MoreVertical, Search, Users } from "lucide-react";

type RoleOption = {
  label: string;
  value: string;
  level: "group" | "church" | "cell" | "department" | "top";
};

const roleOptions: RoleOption[] = [
  { label: "👑 Zonal Pastor", value: "zonal_pastor", level: "top" },
  { label: "🏛 Group Leader", value: "pastor", level: "group" },
  { label: "🏛 Group Admin/Staff (Erediauwa)", value: "erediauwa_admin", level: "group" },
  { label: "🏛 Group Admin/Staff (LoveworldCity)", value: "loveworldcity_admin", level: "group" },
  { label: "🏛 Group Admin/Staff (Youth & Teens)", value: "youth_teens_admin", level: "group" },
  { label: "⛪ Church Pastor", value: "church_pastor", level: "church" },
  { label: "👥 Cell Leader", value: "cell_leader", level: "cell" },
  { label: "📋 First Timer Staff", value: "reception_team", level: "church" },
  { label: "📞 Follow-Up Staff", value: "follow_up_team", level: "church" },
  { label: "📖 Foundation School Staff", value: "foundation_school_staff", level: "church" },
  { label: "📖 Foundation School Leader", value: "foundation_school_leader", level: "church" },
  { label: "🏢 Department Leader", value: "department_head", level: "department" },
  { label: "🏢 Department Staff", value: "department_staff", level: "department" },
];

// Map UI-only values to actual DB enum values
const roleToDbRole: Record<string, string> = {
  zonal_pastor: "church_pastor",
};

const roleBadgeColors: Record<string, string> = {
  king_admin: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  admin: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  erediauwa_admin: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  loveworldcity_admin: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  youth_teens_admin: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  church_pastor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  pastor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  reception_team: "bg-green-500/20 text-green-400 border-green-500/30",
  cell_leader: "bg-teal-500/20 text-teal-400 border-teal-500/30",
  follow_up_team: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  department_head: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  department_staff: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  foundation_school_staff: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  foundation_school_leader: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
};

const roleLabels: Record<string, string> = {
  king_admin: "👑 King Admin",
  admin: "👑 Admin",
  erediauwa_admin: "🏛 Erediauwa Admin",
  loveworldcity_admin: "🏛 LoveworldCity Admin",
  youth_teens_admin: "🏛 Youth & Teens Admin",
  church_pastor: "⛪ Church Pastor",
  pastor: "🏛 Group Leader",
  reception_team: "📋 First Timer Staff",
  cell_leader: "👥 Cell Leader",
  follow_up_team: "📞 Follow-Up Staff",
  department_head: "🏢 Department Leader",
  department_staff: "🏢 Department Staff",
  foundation_school_staff: "📖 Foundation School Staff",
  foundation_school_leader: "📖 Foundation School Leader",
};

type Org = { id: string; name: string; level: string; parent_id: string | null };
type StaffMember = {
  id: string;
  user_id: string;
  full_name: string;
  phone_number: string | null;
  organization_id: string | null;
  role_title: string | null;
  role: string | null;
  org_name: string | null;
};

export default function AdminUsers() {
  const { toast } = useToast();
  const { isKingAdmin, isGroupAdmin, organizationId, role } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedChurch, setSelectedChurch] = useState("");
  const [cellGroup, setCellGroup] = useState("");
  const [department, setDepartment] = useState("");

  const groups = useMemo(() => orgs.filter((o) => o.level === "group"), [orgs]);
  const churches = useMemo(() => {
    const all = orgs.filter((o) => o.level === "church");
    if (selectedGroup) return all.filter((c) => c.parent_id === selectedGroup);
    return all;
  }, [orgs, selectedGroup]);

  const roleLevel = roleOptions.find(r => r.value === selectedRole)?.level || "top";
  const showGroup = ["group"].includes(roleLevel);
  const showChurch = ["church", "cell", "department"].includes(roleLevel);
  const showCell = roleLevel === "cell";
  const showDept = roleLevel === "department";

  useEffect(() => {
    loadOrgs();
    loadStaff();
  }, []);

  async function loadOrgs() {
    const { data } = await supabase.from("organizations").select("*").order("name");
    if (data) setOrgs(data as Org[]);
  }

  async function loadStaff() {
    // Load profiles with their roles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, user_id, full_name, phone_number, organization_id, role_title");

    const { data: roles } = await supabase.from("user_roles").select("user_id, role");

    const { data: orgData } = await supabase.from("organizations").select("id, name");

    if (!profiles) return;

    const roleMap = new Map(roles?.map((r) => [r.user_id, r.role]) || []);
    const orgMap = new Map(orgData?.map((o) => [o.id, o.name]) || []);

    const list: StaffMember[] = profiles.map((p) => ({
      ...p,
      role: roleMap.get(p.user_id) || null,
      org_name: p.organization_id ? orgMap.get(p.organization_id) || null : null,
    }));

    setStaffList(list);
  }

  const filteredStaff = useMemo(() => {
    let list = staffList.filter((s) => s.role); // only show users with roles

    // Scoping
    if (isKingAdmin) {
      // sees all
    } else if (isGroupAdmin && organizationId) {
      // Group admin sees staff in their group's churches
      const groupOrg = orgs.find((o) => o.id === organizationId);
      if (groupOrg) {
        const childIds = orgs.filter((o) => o.parent_id === groupOrg.id).map((o) => o.id);
        const scopeIds = [organizationId, ...childIds];
        list = list.filter((s) => s.organization_id && scopeIds.includes(s.organization_id));
      }
    } else if (organizationId) {
      list = list.filter((s) => s.organization_id === organizationId);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.full_name.toLowerCase().includes(q) ||
          (s.role && roleLabels[s.role]?.toLowerCase().includes(q))
      );
    }

    return list;
  }, [staffList, isKingAdmin, isGroupAdmin, organizationId, orgs, searchQuery]);

  async function handleSubmit() {
    if (!fullName || !email || !password || !selectedRole) {
      toast({ title: "Missing fields", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const orgId = showChurch || showCell || showDept ? selectedChurch : showGroup ? selectedGroup : null;
      const roleTitle = roleOptions.find((r) => r.value === selectedRole)?.label || selectedRole;
      const dbRole = roleToDbRole[selectedRole] || selectedRole;

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await supabase.functions.invoke("create-staff-user", {
        body: {
          email,
          password,
          full_name: fullName,
          phone_number: phone || null,
          organization_id: orgId || null,
          role: dbRole,
          role_title: roleTitle,
        },
      });

      if (res.error || res.data?.error) {
        throw new Error(res.data?.error || res.error?.message || "Failed to create user");
      }

      toast({ title: "Success", description: `Staff account created for ${fullName}` });
      setDialogOpen(false);
      resetForm();
      loadStaff();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFullName("");
    setEmail("");
    setPassword("");
    setPhone("");
    setSelectedRole("");
    setSelectedGroup("");
    setSelectedChurch("");
    setCellGroup("");
    setDepartment("");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredStaff.length} staff member{filteredStaff.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" /> Add Staff Member
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search staff..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Staff list */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {filteredStaff.map((staff) => (
          <Card key={staff.id}>
            <CardContent className="p-4 flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                {staff.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{staff.full_name}</p>
                {staff.role && (
                  <Badge variant="outline" className={`text-[10px] mt-1 ${roleBadgeColors[staff.role] || ""}`}>
                    {roleLabels[staff.role] || staff.role}
                  </Badge>
                )}
                {staff.org_name && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">{staff.org_name}</p>
                )}
                {staff.phone_number && (
                  <p className="text-xs text-muted-foreground truncate">{staff.phone_number}</p>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => toast({ title: "Coming soon", description: "Edit role feature is in development" })}>
                    Edit Role
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast({ title: "Coming soon", description: "Reset password feature is in development" })}>
                    Reset Password
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => toast({ title: "Coming soon", description: "Deactivate feature is in development" })}>
                    Deactivate
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardContent>
          </Card>
        ))}
        {filteredStaff.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No staff members found</p>
          </div>
        )}
      </div>

      {/* Add Staff Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Staff Member</DialogTitle>
            <DialogDescription>Create a new staff account. They can change their password on first login.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Full Name *</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Pastor John Doe" />
            </div>
            <div>
              <Label>Email *</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" />
            </div>
            <div>
              <Label>Temporary Password *</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" />
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234..." />
            </div>
            <div>
              <Label>Role *</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  {roleOptions.map((r, i) => (
                    <SelectItem key={`${r.value}-${i}`} value={`${r.value}__${i}`}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {showGroup && (
              <div>
                <Label>Group</Label>
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                  <SelectTrigger><SelectValue placeholder="Select group" /></SelectTrigger>
                  <SelectContent>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {showChurch && (
              <div>
                <Label>Church/Assembly</Label>
                <Select value={selectedChurch} onValueChange={setSelectedChurch}>
                  <SelectTrigger><SelectValue placeholder="Select church" /></SelectTrigger>
                  <SelectContent>
                    {churches.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {showCell && (
              <div>
                <Label>Cell Group</Label>
                <Input value={cellGroup} onChange={(e) => setCellGroup(e.target.value)} placeholder="Cell group name" />
              </div>
            )}

            {showDept && (
              <div>
                <Label>Department</Label>
                <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Department name" />
              </div>
            )}

            <Button onClick={handleSubmit} disabled={loading} className="w-full">
              {loading ? "Creating..." : "Create Staff Account"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
