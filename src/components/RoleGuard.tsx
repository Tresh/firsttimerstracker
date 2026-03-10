import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KingsRetentionLogo } from "@/components/KingsRetentionLogo";
import { ShieldX } from "lucide-react";

type RoleGuardProps = {
  allowedRoles: string[];
  children: React.ReactNode;
};

const roleLabels: Record<string, string> = {
  king_admin: "👑 King Admin",
  admin: "👑 Admin",
  erediauwa_admin: "🏛 Erediauwa Admin",
  loveworldcity_admin: "🏛 LoveworldCity Admin",
  youth_teens_admin: "🏛 Youth & Teens Admin",
  church_pastor: "⛪ Church Pastor",
  pastor: "🏛 Group Leader",
  reception_team: "📋 Welcome Team",
  cell_leader: "👥 Cell Leader",
  follow_up_team: "📞 Follow-Up Team",
  department_head: "🏢 Department Leader",
  department_staff: "🏢 Department Staff",
  foundation_school_staff: "📖 Foundation School Staff",
  foundation_school_leader: "📖 Foundation School Leader",
};

export default function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { role, isLoading } = useAuth();
  const navigate = useNavigate();

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

  if (role && allowedRoles.includes(role)) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      <ShieldX className="h-20 w-20 text-destructive mb-6 opacity-80" />
      <h1 className="text-2xl font-display font-bold text-foreground mb-2">Access Restricted</h1>
      <p className="text-muted-foreground max-w-md mb-4">
        You don't have permission to view this page. Please contact your administrator if you think this is a mistake.
      </p>
      {role && (
        <Badge variant="outline" className="mb-6 text-sm px-3 py-1">
          Your role: {roleLabels[role] || role}
        </Badge>
      )}
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
        <Button onClick={() => navigate("/dashboard")}>Go to My Dashboard</Button>
      </div>
      <div className="mt-12 opacity-50">
        <KingsRetentionLogo size="sm" />
      </div>
    </div>
  );
}
