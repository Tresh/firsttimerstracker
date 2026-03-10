import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { UserPlus, MoreVertical, Search, Users, AlertTriangle, Eye, EyeOff, ShieldCheck, Phone, KeyRound, FlaskConical, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type RoleOption = {
  label: string;
  value: string;
  level: "group" | "church" | "cell" | "department" | "top";
};

const roleOptions: RoleOption[] = [
  { label: "👑 King Admin", value: "king_admin", level: "top" },
  { label: "👑 Admin", value: "admin", level: "top" },
  { label: "🏛 Erediauwa Admin", value: "erediauwa_admin", level: "group" },
  { label: "🏛 LoveworldCity Admin", value: "loveworldcity_admin", level: "group" },
  { label: "🏛 Youth & Teens Admin", value: "youth_teens_admin", level: "group" },
  { label: "⛪ Church Pastor", value: "church_pastor", level: "church" },
  { label: "🏛 Pastor", value: "pastor", level: "group" },
  { label: "👥 Cell Leader", value: "cell_leader", level: "cell" },
  { label: "📋 Reception Team", value: "reception_team", level: "church" },
  { label: "📞 Follow-Up Staff", value: "follow_up_team", level: "church" },
  { label: "📖 Foundation School Staff", value: "foundation_school_staff", level: "church" },
  { label: "📖 Foundation School Leader", value: "foundation_school_leader", level: "church" },
  { label: "🏢 Department Head", value: "department_head", level: "department" },
  { label: "🏢 Department Staff", value: "department_staff", level: "department" },
];

const roleBadgeColors: Record<string, string> = {
  king_admin: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  admin: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  erediauwa_admin: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  loveworldcity_admin: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  youth_teens_admin: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  church_pastor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  pastor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  reception_team: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  cell_leader: "bg-green-500/20 text-green-400 border-green-500/30",
  follow_up_team: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  department_head: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  department_staff: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  foundation_school_staff: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  foundation_school_leader: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
};

const roleLabels: Record<string, string> = {
  king_admin: "👑 King Admin",
  admin: "👑 Admin",
  erediauwa_admin: "🏛 Erediauwa Admin",
  loveworldcity_admin: "🏛 LoveworldCity Admin",
  youth_teens_admin: "🏛 Youth & Teens Admin",
  church_pastor: "⛪ Church Pastor",
  pastor: "🏛 Pastor",
  reception_team: "📋 Reception Team",
  cell_leader: "👥 Cell Leader",
  follow_up_team: "📞 Follow-Up Staff",
  department_head: "🏢 Department Head",
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
  must_change_password: boolean | null;
  role: string | null;
  org_name: string | null;
  is_banned?: boolean;
};

function getRoleLevel(roleValue: string): string {
  return roleOptions.find(r => r.value === roleValue)?.level || "top";
}

export default function AdminUsers() {
  const { toast } = useToast();
  const { isKingAdmin, isGroupAdmin, organizationId } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [churchFilter, setChurchFilter] = useState("all");

  // Create form
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedChurch, setSelectedChurch] = useState("");
  const [cellGroup, setCellGroup] = useState("");
  const [department, setDepartment] = useState("");

  // Edit Role dialog
  const [editRoleOpen, setEditRoleOpen] = useState(false);
  const [editStaff, setEditStaff] = useState<StaffMember | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editGroup, setEditGroup] = useState("");
  const [editChurch, setEditChurch] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Reset Password dialog
  const [resetPwOpen, setResetPwOpen] = useState(false);
  const [resetStaff, setResetStaff] = useState<StaffMember | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Deactivate dialog
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivateStaff, setDeactivateStaff] = useState<StaffMember | null>(null);
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  // Test accounts
  const [testCreateOpen, setTestCreateOpen] = useState(false);
  const [testDeleteOpen, setTestDeleteOpen] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testProgress, setTestProgress] = useState("");

  const groups = useMemo(() => orgs.filter(o => o.level === "group"), [orgs]);
  const allChurches = useMemo(() => orgs.filter(o => o.level === "church"), [orgs]);
  const getChurches = (groupId: string) => groupId ? allChurches.filter(c => c.parent_id === groupId) : allChurches;
  const churches = useMemo(() => getChurches(selectedGroup), [allChurches, selectedGroup]);
  const editChurches = useMemo(() => getChurches(editGroup), [allChurches, editGroup]);

  const roleLevel = getRoleLevel(selectedRole);
  const showGroup = roleLevel === "group";
  const showChurch = ["church", "cell", "department"].includes(roleLevel);
  const showCell = roleLevel === "cell";
  const showDept = roleLevel === "department";

  const editRoleLevel = getRoleLevel(editRole);
  const editShowGroup = editRoleLevel === "group";
  const editShowChurch = ["church", "cell", "department"].includes(editRoleLevel);

  useEffect(() => {
    Promise.all([loadOrgs(), loadStaff()]).finally(() => setPageLoading(false));
  }, []);

  async function loadOrgs() {
    const { data } = await supabase.from("organizations").select("*").order("name");
    if (data) setOrgs(data as Org[]);
  }

  async function loadStaff() {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, user_id, full_name, phone_number, organization_id, role_title, must_change_password");
    const { data: roles } = await supabase.from("user_roles").select("user_id, role");
    const { data: orgData } = await supabase.from("organizations").select("id, name");

    if (!profiles) return;

    const roleMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);
    const orgMap = new Map(orgData?.map(o => [o.id, o.name]) || []);

    const list: StaffMember[] = profiles.map(p => ({
      ...p,
      role: roleMap.get(p.user_id) || null,
      org_name: p.organization_id ? orgMap.get(p.organization_id) || null : null,
    }));
    setStaffList(list);
  }

  // Scoping + filtering
  const filteredStaff = useMemo(() => {
    let list = staffList.filter(s => s.role);

    // Scope by admin level
    if (isKingAdmin) {
      // sees all
    } else if (isGroupAdmin && organizationId) {
      const childIds = orgs.filter(o => o.parent_id === organizationId).map(o => o.id);
      const scopeIds = [organizationId, ...childIds];
      list = list.filter(s => s.organization_id && scopeIds.includes(s.organization_id));
    } else if (organizationId) {
      list = list.filter(s => s.organization_id === organizationId);
    }

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s =>
        s.full_name.toLowerCase().includes(q) ||
        (s.phone_number && s.phone_number.includes(q)) ||
        (s.role && roleLabels[s.role]?.toLowerCase().includes(q))
      );
    }

    // Role filter
    if (roleFilter !== "all") {
      list = list.filter(s => s.role === roleFilter);
    }

    // Church filter
    if (churchFilter !== "all") {
      list = list.filter(s => s.organization_id === churchFilter);
    }

    return list;
  }, [staffList, isKingAdmin, isGroupAdmin, organizationId, orgs, searchQuery, roleFilter, churchFilter]);

  // Stats
  const stats = useMemo(() => {
    const withRoles = staffList.filter(s => s.role);
    return {
      total: withRoles.length,
      cellLeaders: withRoles.filter(s => s.role === "cell_leader").length,
      followUp: withRoles.filter(s => s.role === "follow_up_team").length,
      pending: withRoles.filter(s => s.must_change_password).length,
    };
  }, [staffList]);

  // ─── Create Staff ───
  async function handleSubmit() {
    if (!fullName || !email || !password || !selectedRole) {
      toast({ title: "Missing fields", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    if (password.length < 8) {
      toast({ title: "Weak password", description: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const orgId = showChurch || showCell || showDept ? selectedChurch : showGroup ? selectedGroup : null;
      const roleTitle = roleOptions.find(r => r.value === selectedRole)?.label || selectedRole;

      const res = await supabase.functions.invoke("create-staff-user", {
        body: { email, password, full_name: fullName, phone_number: phone || null, organization_id: orgId || null, role: selectedRole, role_title: roleTitle },
      });
      if (res.error || res.data?.error) throw new Error(res.data?.error || res.error?.message || "Failed to create user");

      toast({ title: "✅ Account created", description: `${fullName} can now log in.` });
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
    setFullName(""); setEmail(""); setPassword(""); setPhone("");
    setSelectedRole(""); setSelectedGroup(""); setSelectedChurch("");
    setCellGroup(""); setDepartment(""); setShowPassword(false);
  }

  // ─── Edit Role ───
  function openEditRole(staff: StaffMember) {
    setEditStaff(staff);
    setEditRole(staff.role || "");
    setEditGroup("");
    setEditChurch(staff.organization_id || "");
    setEditRoleOpen(true);
  }

  async function handleEditRole() {
    if (!editStaff || !editRole) return;
    setEditLoading(true);
    try {
      const roleTitle = roleOptions.find(r => r.value === editRole)?.label || editRole;
      const orgId = editShowChurch ? editChurch : editShowGroup ? editGroup : null;

      const res = await supabase.functions.invoke("manage-staff-user", {
        body: { action: "update_role", user_id: editStaff.user_id, role: editRole, role_title: roleTitle, organization_id: orgId },
      });
      if (res.error || res.data?.error) throw new Error(res.data?.error || res.error?.message);

      toast({ title: "✅ Role updated", description: `Role updated for ${editStaff.full_name}` });
      setEditRoleOpen(false);
      loadStaff();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setEditLoading(false);
    }
  }

  // ─── Reset Password ───
  function openResetPw(staff: StaffMember) {
    setResetStaff(staff);
    setResetPassword("");
    setShowResetPassword(false);
    setResetPwOpen(true);
  }

  async function handleResetPw() {
    if (!resetStaff || !resetPassword) return;
    if (resetPassword.length < 8) {
      toast({ title: "Weak password", description: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    setResetLoading(true);
    try {
      const res = await supabase.functions.invoke("manage-staff-user", {
        body: { action: "reset_password", user_id: resetStaff.user_id, password: resetPassword },
      });
      if (res.error || res.data?.error) throw new Error(res.data?.error || res.error?.message);

      toast({ title: "✅ Password reset", description: `Password reset for ${resetStaff.full_name}` });
      setResetPwOpen(false);
      loadStaff();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setResetLoading(false);
    }
  }

  // ─── Deactivate / Reactivate ───
  function openDeactivate(staff: StaffMember) {
    setDeactivateStaff(staff);
    setDeactivateOpen(true);
  }

  async function handleToggleActivation() {
    if (!deactivateStaff) return;
    setDeactivateLoading(true);
    const isBanned = deactivateStaff.is_banned;
    try {
      const res = await supabase.functions.invoke("manage-staff-user", {
        body: { action: isBanned ? "reactivate" : "deactivate", user_id: deactivateStaff.user_id },
      });
      if (res.error || res.data?.error) throw new Error(res.data?.error || res.error?.message);

      const msg = isBanned ? "reactivated" : "deactivated";
      toast({ title: "✅ Done", description: `${deactivateStaff.full_name} has been ${msg}` });
      setDeactivateOpen(false);
      setStaffList(prev => prev.map(s => s.id === deactivateStaff!.id ? { ...s, is_banned: !isBanned } : s));
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setDeactivateLoading(false);
    }
  }

  // ─── Test Accounts ───
  async function handleCreateTestAccounts() {
    setTestLoading(true);
    setTestProgress("Creating 7 test accounts...");
    try {
      const res = await supabase.functions.invoke("manage-test-accounts", {
        body: { action: "create" },
      });
      if (res.error || res.data?.error) throw new Error(res.data?.error || res.error?.message);

      const results = res.data?.results || [];
      const successCount = results.filter((r: any) => r.success).length;
      const failures = results.filter((r: any) => !r.success);

      if (failures.length > 0) {
        toast({
          title: `✅ ${successCount} of 7 test accounts created`,
          description: `Failed: ${failures.map((f: any) => `${f.email}: ${f.error}`).join(", ")}`,
          variant: successCount > 0 ? "default" : "destructive",
        });
      } else {
        toast({ title: "✅ 7 test accounts created!", description: "Password for all: Test1234!" });
      }
      setTestCreateOpen(false);
      loadStaff();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setTestLoading(false);
      setTestProgress("");
    }
  }

  async function handleDeleteTestAccounts() {
    setTestLoading(true);
    setTestProgress("Deleting test accounts...");
    try {
      const res = await supabase.functions.invoke("manage-test-accounts", {
        body: { action: "delete" },
      });
      if (res.error || res.data?.error) throw new Error(res.data?.error || res.error?.message);

      toast({ title: "✅ Test accounts deleted", description: `${res.data?.deleted || 0} accounts removed` });
      setTestDeleteOpen(false);
      loadStaff();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setTestLoading(false);
      setTestProgress("");
    }
  }

  if (pageLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "Total Staff", value: stats.total, icon: Users, color: "text-primary" },
    { label: "Cell Leaders", value: stats.cellLeaders, icon: Users, color: "text-green-400" },
    { label: "Follow-Up Staff", value: stats.followUp, icon: Phone, color: "text-cyan-400" },
    { label: "Pending Activation", value: stats.pending, icon: KeyRound, color: "text-amber-400" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage all staff accounts and roles</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" /> Add Staff Member
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl bg-secondary flex items-center justify-center ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or phone..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Roles" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {roleOptions.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={churchFilter} onValueChange={setChurchFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Churches" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Churches</SelectItem>
            {allChurches.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Staff list */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {filteredStaff.map(staff => (
          <Card key={staff.id} className={staff.is_banned ? "opacity-50" : ""}>
            <CardContent className="p-4 flex items-start gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                {staff.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{staff.full_name}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {staff.role && (
                    <Badge variant="outline" className={`text-[10px] ${roleBadgeColors[staff.role] || ""}`}>
                      {roleLabels[staff.role] || staff.role}
                    </Badge>
                  )}
                  {staff.must_change_password && (
                    <Badge variant="outline" className="text-[10px] bg-amber-500/20 text-amber-400 border-amber-500/30">
                      Must change password
                    </Badge>
                  )}
                  {staff.is_banned && (
                    <Badge variant="outline" className="text-[10px] bg-destructive/20 text-destructive border-destructive/30">
                      Inactive
                    </Badge>
                  )}
                </div>
                {staff.org_name && <p className="text-xs text-muted-foreground mt-1 truncate">{staff.org_name}</p>}
                {staff.phone_number && <p className="text-xs text-muted-foreground truncate">{staff.phone_number}</p>}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openEditRole(staff)}>Edit Role</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openResetPw(staff)}>Reset Password</DropdownMenuItem>
                  <DropdownMenuItem className={staff.is_banned ? "text-green-500" : "text-destructive"} onClick={() => openDeactivate(staff)}>
                    {staff.is_banned ? "Reactivate" : "Deactivate"}
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

      {/* ─── Add Staff Dialog ─── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Staff Member</DialogTitle>
            <DialogDescription>Create a new staff account. They'll be prompted to change their password on first login.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Personal Info</p>
            <div><Label>Full Name *</Label><Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g. Pastor John Doe" /></div>
            <div><Label>Email *</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="john@example.com" /></div>
            <div><Label>Phone Number</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+234..." /></div>
            <div>
              <Label>Temporary Password * (min 8 characters)</Label>
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 8 characters" className="pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">Role Assignment</p>
            <div>
              <Label>Role *</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>{roleOptions.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {showGroup && (
              <div><Label>Group</Label>
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                  <SelectTrigger><SelectValue placeholder="Select group" /></SelectTrigger>
                  <SelectContent>{groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            {showChurch && (
              <div><Label>Church/Assembly</Label>
                <Select value={selectedChurch} onValueChange={setSelectedChurch}>
                  <SelectTrigger><SelectValue placeholder="Select church" /></SelectTrigger>
                  <SelectContent>{churches.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            {showCell && <div><Label>Cell Group Name</Label><Input value={cellGroup} onChange={e => setCellGroup(e.target.value)} placeholder="Cell group name" /></div>}
            {showDept && <div><Label>Department Name</Label><Input value={department} onChange={e => setDepartment(e.target.value)} placeholder="Department name" /></div>}
            <Button onClick={handleSubmit} disabled={loading} className="w-full">{loading ? "Creating..." : "Create Staff Account"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Role Dialog ─── */}
      <Dialog open={editRoleOpen} onOpenChange={setEditRoleOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              {editStaff && <>Changing role for <strong>{editStaff.full_name}</strong><br />Current: {roleLabels[editStaff.role || ""] || editStaff.role}</>}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>New Role</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>{roleOptions.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {editShowGroup && (
              <div><Label>Group</Label>
                <Select value={editGroup} onValueChange={setEditGroup}>
                  <SelectTrigger><SelectValue placeholder="Select group" /></SelectTrigger>
                  <SelectContent>{groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            {editShowChurch && (
              <div><Label>Church/Assembly</Label>
                <Select value={editChurch} onValueChange={setEditChurch}>
                  <SelectTrigger><SelectValue placeholder="Select church" /></SelectTrigger>
                  <SelectContent>{editChurches.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <Button onClick={handleEditRole} disabled={editLoading} className="w-full">{editLoading ? "Saving..." : "Save Changes"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Reset Password Dialog ─── */}
      <Dialog open={resetPwOpen} onOpenChange={setResetPwOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>Set a new temporary password for {resetStaff?.full_name}. They'll be prompted to change it on next login.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>New Temporary Password</Label>
              <div className="relative">
                <Input type={showResetPassword ? "text" : "password"} value={resetPassword} onChange={e => setResetPassword(e.target.value)} placeholder="Min 8 characters" className="pr-10" />
                <button type="button" onClick={() => setShowResetPassword(!showResetPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showResetPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button variant="destructive" onClick={handleResetPw} disabled={resetLoading} className="w-full">{resetLoading ? "Resetting..." : "Reset Password"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Deactivate / Reactivate Dialog ─── */}
      <Dialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {deactivateStaff?.is_banned ? (
                <><ShieldCheck className="h-5 w-5 text-green-500" /> Reactivate User</>
              ) : (
                <><AlertTriangle className="h-5 w-5 text-destructive" /> Deactivate User</>
              )}
            </DialogTitle>
            <DialogDescription>
              {deactivateStaff?.is_banned
                ? <>This will allow <strong>{deactivateStaff?.full_name}</strong> to log in again.</>
                : <>This will prevent <strong>{deactivateStaff?.full_name}</strong> from logging in immediately.</>
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeactivateOpen(false)}>Cancel</Button>
            {deactivateStaff?.is_banned ? (
              <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleToggleActivation} disabled={deactivateLoading}>
                {deactivateLoading ? "Reactivating..." : "Reactivate Account"}
              </Button>
            ) : (
              <Button variant="destructive" onClick={handleToggleActivation} disabled={deactivateLoading}>
                {deactivateLoading ? "Deactivating..." : "Deactivate Account"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
