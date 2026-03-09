import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export default function Settings() { 
  const { signOut } = useAuth();
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>
      
      <div className="pt-6 border-t">
        <h3 className="text-lg font-medium text-destructive mb-4">Danger Zone</h3>
        <Button variant="destructive" onClick={signOut}>
          Sign Out
        </Button>
      </div>
    </div>
  ) 
}