import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const ProtectedRoute = () => {
  const { session, isLoading, role } = useAuth();
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

  // Role-based default redirect: reception_team → /welcome-desk, others → /dashboard
  if (location.pathname === "/auth" || location.pathname === "/") {
    const defaultRoute = role === "reception_team" ? "/welcome-desk" : "/dashboard";
    return <Navigate to={defaultRoute} replace />;
  }

  return <Outlet />;
};
