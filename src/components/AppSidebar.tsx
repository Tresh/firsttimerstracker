import { 
  LayoutDashboard, Users, UserPlus, ListTodo, Calendar, 
  Award, Building2, BarChart3, Import, Settings, GraduationCap, LogOut,
  Globe, ClipboardList, MonitorSmartphone, ShieldCheck
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { KingsRetentionLogo } from "@/components/KingsRetentionLogo"
import { useAuth, type AppRole } from "@/contexts/AuthContext"

type NavItem = { title: string; url: string; icon: any };

const adminNav: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Welcome Desk", url: "/welcome-desk", icon: ClipboardList },
  { title: "First Timers", url: "/first-timers", icon: UserPlus },
  { title: "Members", url: "/members", icon: Users },
  { title: "Follow Up", url: "/follow-up", icon: ListTodo },
  { title: "Foundation School", url: "/foundation-school", icon: GraduationCap },
  { title: "Attendance", url: "/attendance", icon: Calendar },
  { title: "EMP Tracker", url: "/emp", icon: MonitorSmartphone },
  { title: "Leaders", url: "/leaders", icon: Award },
  { title: "Departments", url: "/departments", icon: Building2 },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Global Command", url: "/global", icon: Globe },
  { title: "User Management", url: "/admin/users", icon: ShieldCheck },
  { title: "Import Data", url: "/import", icon: Import },
  { title: "Settings", url: "/settings", icon: Settings },
];

const pastorNav: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "First Timers", url: "/first-timers", icon: UserPlus },
  { title: "Members", url: "/members", icon: Users },
  { title: "Follow Up", url: "/follow-up", icon: ListTodo },
  { title: "Foundation School", url: "/foundation-school", icon: GraduationCap },
  { title: "Attendance", url: "/attendance", icon: Calendar },
  { title: "EMP Tracker", url: "/emp", icon: MonitorSmartphone },
  { title: "Leaders", url: "/leaders", icon: Award },
  { title: "Departments", url: "/departments", icon: Building2 },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
];

const cellLeaderNav: NavItem[] = [
  { title: "My Members", url: "/members", icon: Users },
  { title: "Follow Up Tasks", url: "/follow-up", icon: ListTodo },
  { title: "Attendance", url: "/attendance", icon: Calendar },
  { title: "EMP Tracker", url: "/emp", icon: MonitorSmartphone },
];

const receptionNav: NavItem[] = [
  { title: "Welcome Desk", url: "/welcome-desk", icon: ClipboardList },
  { title: "Today's Registrations", url: "/first-timers", icon: UserPlus },
];

const deptHeadNav: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "My Department", url: "/departments", icon: Building2 },
  { title: "Members", url: "/members", icon: Users },
  { title: "Attendance", url: "/attendance", icon: Calendar },
];

function getNavItems(role: AppRole | null): NavItem[] {
  if (!role) return adminNav;
  if (role === "king_admin" || role === "admin") return adminNav;
  if (role === "erediauwa_admin" || role === "loveworldcity_admin" || role === "youth_teens_admin") return adminNav;
  if (role === "church_pastor" || role === "pastor") return pastorNav;
  if (role === "reception_team") return receptionNav;
  if (role === "cell_leader" || role === "follow_up_team") return cellLeaderNav;
  if (role === "department_head") return deptHeadNav;
  return adminNav;
}

const roleLabels: Record<string, string> = {
  king_admin: "👑 King Admin",
  admin: "👑 King Admin",
  erediauwa_admin: "🏛 Erediauwa Admin",
  loveworldcity_admin: "🏛 LoveworldCity Admin",
  youth_teens_admin: "🏛 Youth & Teens Admin",
  church_pastor: "⛪ Church Pastor",
  pastor: "⛪ Church Pastor",
  reception_team: "📋 Welcome Team",
  cell_leader: "👥 Cell Leader",
  follow_up_team: "📞 Follow-Up Team",
  department_head: "🏢 Department Head",
};

export function AppSidebar() {
  const { state } = useSidebar()
  const collapsed = state === "collapsed"
  const location = useLocation()
  const { signOut, role, profile } = useAuth()
  const items = getNavItems(role);
  
  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarContent className="py-4">
        <div className="px-4 mb-4">
          <KingsRetentionLogo size="sm" showText={!collapsed} />
        </div>

        {/* Role badge */}
        {!collapsed && role && (
          <div className="px-4 mb-4">
            <div className="rounded-xl bg-primary/10 border border-primary/20 px-3 py-2.5">
              <p className="text-xs font-semibold text-primary truncate">{roleLabels[role] || role}</p>
              {profile?.full_name && (
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">{profile.full_name}</p>
              )}
            </div>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/50 uppercase text-[10px] tracking-widest font-semibold px-4">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <NavLink 
                        to={item.url} 
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                          isActive 
                            ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-[3px] border-primary" 
                            : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground border-l-[3px] border-transparent"
                        }`}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto px-3 pt-4 border-t border-sidebar-border">
          <button 
            onClick={signOut}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all w-full"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </SidebarContent>
    </Sidebar>
  )
}
