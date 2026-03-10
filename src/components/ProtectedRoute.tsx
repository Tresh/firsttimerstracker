import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const roleRedirectMap: Record<string, string> = {
  king_admin: "/dashboard",
  admin: "/dashboard",
  erediauwa_admin: "/dashboard",
  loveworldcity_admin: "/dashboard",
  youth_teens_admin: "/dashboard",
  church_pastor: "/dashboard",
  pastor: "/dashboard",
  reception_team: "/welcome-desk",
  cell_leader: "/follow-up",
  follow_up_team: "/follow-up",
  foundation_school_staff: "/foundation-school",
  foundation_school_leader: "/foundation-school",
  department_head: "/departments",
  department_staff: "/departments",
};

export const ProtectedRoute = () => {
  const { session, isLoading, role, profile } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <img src="/kingsretention-logo.svg" alt="KingsRetention" className="h-16 w-16 rounded-2xl animate-pulse" />
          <p className="text-muted-foreground font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  // Check must_change_password
  if ((profile as any)?.must_change_password === true) {
    return <Navigate to="/change-password" replace />;
  }

  // Role-based default redirect
  if (location.pathname === "/auth" || location.pathname === "/") {
    const defaultRoute = role ? (roleRedirectMap[role] || "/dashboard") : "/dashboard";
    return <Navigate to={defaultRoute} replace />;
  }

  return <Outlet />;
};
