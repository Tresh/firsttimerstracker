import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { Outlet } from "react-router-dom"
import { KingsRetentionLogo } from "@/components/KingsRetentionLogo"
import { Bell } from "lucide-react"

export default function Layout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between gap-4 glass-navbar sticky top-0 z-40 px-4 lg:px-6">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="-ml-2 text-muted-foreground hover:text-foreground" />
              <div className="hidden sm:block">
                <KingsRetentionLogo size="sm" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="h-9 w-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                <Bell className="h-4 w-4" />
              </button>
            </div>
          </header>
          <main className="flex-1 p-4 lg:p-8 overflow-auto">
            <div className="max-w-[1200px] mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
