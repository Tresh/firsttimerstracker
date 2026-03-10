import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import RoleGuard from "./components/RoleGuard";
import Layout from "./components/Layout";
import LandingPage from "./pages/LandingPage";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import FirstTimers from "./pages/FirstTimers";
import Members from "./pages/Members";
import FollowUpTracker from "./pages/FollowUpTracker";
import FoundationSchool from "./pages/FoundationSchool";
import Attendance from "./pages/Attendance";
import Leaders from "./pages/Leaders";
import Departments from "./pages/Departments";
import Analytics from "./pages/Analytics";
import ImportData from "./pages/ImportData";
import Settings from "./pages/Settings";
import GlobalCommand from "./pages/GlobalCommand";
import NotFound from "./pages/NotFound";
import EmpTracker from "./pages/EmpTracker";
import WelcomeDesk from "./pages/WelcomeDesk";
import AttendanceScan from "./pages/AttendanceScan";
import AdminUsers from "./pages/AdminUsers";
import ChangePassword from "./pages/ChangePassword";
import CallCenter from "./pages/CallCenter";

const queryClient = new QueryClient();

const ADMIN_ALL = ["king_admin", "admin", "erediauwa_admin", "loveworldcity_admin", "youth_teens_admin"];
const PASTORS = ["church_pastor", "pastor"];
const ADMIN_PASTOR = [...ADMIN_ALL, ...PASTORS];

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/attend" element={<AttendanceScan />} />
            <Route path="/change-password" element={<ChangePassword />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/welcome-desk" element={
                <RoleGuard allowedRoles={["reception_team", "king_admin", "admin"]}>
                  <WelcomeDesk />
                </RoleGuard>
              } />
              <Route element={<Layout />}>
                <Route path="/dashboard" element={
                  <RoleGuard allowedRoles={[...ADMIN_PASTOR, "follow_up_team"]}>
                    <Dashboard />
                  </RoleGuard>
                } />
                <Route path="/first-timers" element={
                  <RoleGuard allowedRoles={[...ADMIN_PASTOR, "reception_team", "follow_up_team"]}>
                    <FirstTimers />
                  </RoleGuard>
                } />
                <Route path="/members" element={
                  <RoleGuard allowedRoles={[...ADMIN_PASTOR, "cell_leader", "follow_up_team", "department_head", "department_staff"]}>
                    <Members />
                  </RoleGuard>
                } />
                <Route path="/follow-up" element={
                  <RoleGuard allowedRoles={[...ADMIN_PASTOR, "cell_leader", "follow_up_team"]}>
                    <FollowUpTracker />
                  </RoleGuard>
                } />
                <Route path="/foundation-school" element={
                  <RoleGuard allowedRoles={[...ADMIN_PASTOR, "foundation_school_staff", "foundation_school_leader"]}>
                    <FoundationSchool />
                  </RoleGuard>
                } />
                <Route path="/call-center" element={
                  <RoleGuard allowedRoles={[...ADMIN_PASTOR, "follow_up_team", "cell_leader"]}>
                    <CallCenter />
                  </RoleGuard>
                } />
                <Route path="/attendance" element={
                  <RoleGuard allowedRoles={[...ADMIN_PASTOR, "cell_leader"]}>
                    <Attendance />
                  </RoleGuard>
                } />
                <Route path="/emp" element={
                  <RoleGuard allowedRoles={[...ADMIN_PASTOR, "cell_leader", "follow_up_team"]}>
                    <EmpTracker />
                  </RoleGuard>
                } />
                <Route path="/leaders" element={
                  <RoleGuard allowedRoles={ADMIN_PASTOR}>
                    <Leaders />
                  </RoleGuard>
                } />
                <Route path="/departments" element={
                  <RoleGuard allowedRoles={[...ADMIN_PASTOR, "department_head", "department_staff"]}>
                    <Departments />
                  </RoleGuard>
                } />
                <Route path="/analytics" element={
                  <RoleGuard allowedRoles={ADMIN_PASTOR}>
                    <Analytics />
                  </RoleGuard>
                } />
                <Route path="/global" element={
                  <RoleGuard allowedRoles={["king_admin", "admin"]}>
                    <GlobalCommand />
                  </RoleGuard>
                } />
                <Route path="/import" element={
                  <RoleGuard allowedRoles={ADMIN_PASTOR}>
                    <ImportData />
                  </RoleGuard>
                } />
                <Route path="/admin/users" element={
                  <RoleGuard allowedRoles={ADMIN_PASTOR}>
                    <AdminUsers />
                  </RoleGuard>
                } />
                <Route path="/settings" element={
                  <RoleGuard allowedRoles={["king_admin", "admin"]}>
                    <Settings />
                  </RoleGuard>
                } />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
