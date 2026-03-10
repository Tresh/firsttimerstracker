import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
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

const queryClient = new QueryClient();

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
            <Route element={<ProtectedRoute />}>
              <Route path="/welcome-desk" element={<WelcomeDesk />} />
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/first-timers" element={<FirstTimers />} />
                <Route path="/members" element={<Members />} />
                <Route path="/follow-up" element={<FollowUpTracker />} />
                <Route path="/foundation-school" element={<FoundationSchool />} />
                <Route path="/attendance" element={<Attendance />} />
                <Route path="/emp" element={<EmpTracker />} />
                <Route path="/leaders" element={<Leaders />} />
                <Route path="/departments" element={<Departments />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/global" element={<GlobalCommand />} />
                <Route path="/import" element={<ImportData />} />
                <Route path="/settings" element={<Settings />} />
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
