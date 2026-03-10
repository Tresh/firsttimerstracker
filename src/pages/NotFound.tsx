import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { KingsRetentionLogo } from "@/components/KingsRetentionLogo";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  useEffect(() => { console.error("404:", location.pathname); }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-6">
      <KingsRetentionLogo size="lg" />
      <h1 className="text-7xl font-display font-extrabold gradient-gold">404</h1>
      <p className="text-xl text-muted-foreground">Page not found</p>
      <Link to="/">
        <Button variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" />Return Home</Button>
      </Link>
    </div>
  );
};

export default NotFound;
