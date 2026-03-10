import { 
  LayoutDashboard, Users, UserPlus, ListTodo, Calendar, 
  Award, Building2, BarChart3, Import, Settings, GraduationCap, LogOut
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
import { useAuth } from "@/contexts/AuthContext"

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "First Timers", url: "/first-timers", icon: UserPlus },
  { title: "Members", url: "/members", icon: Users },
  { title: "Follow Up", url: "/follow-up", icon: ListTodo },
  { title: "Foundation School", url: "/foundation-school", icon: GraduationCap },
  { title: "Attendance", url: "/attendance", icon: Calendar },
  { title: "Leaders", url: "/leaders", icon: Award },
  { title: "Departments", url: "/departments", icon: Building2 },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Import Data", url: "/import", icon: Import },
  { title: "Settings", url: "/settings", icon: Settings },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const collapsed = state === "collapsed"
  const location = useLocation()
  const { signOut } = useAuth()
  
  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarContent className="py-4">
        <div className="px-4 mb-6">
          <KingsRetentionLogo size="sm" showText={!collapsed} />
        </div>
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
