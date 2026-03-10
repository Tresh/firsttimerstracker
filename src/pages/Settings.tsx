import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, User, Shield } from "lucide-react";

export default function Settings() { 
  const { signOut, user } = useAuth();
  
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-display font-extrabold text-foreground">Settings</h2>
        <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
      </div>
      
      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="gradient-primary p-2.5 rounded-xl">
              <User className="h-5 w-5 text-primary-foreground" />
            </div>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 rounded-xl bg-secondary">
                <span className="text-sm text-muted-foreground">Email</span>
                <span className="text-sm font-medium text-foreground">{user?.email || "—"}</span>
              </div>
              <div className="flex justify-between items-center p-4 rounded-xl bg-secondary">
                <span className="text-sm text-muted-foreground">Name</span>
                <span className="text-sm font-medium text-foreground">{user?.user_metadata?.full_name || "—"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="bg-destructive/20 p-2.5 rounded-xl">
              <Shield className="h-5 w-5 text-destructive" />
            </div>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Sign out of your account. You can always sign back in.</p>
            <Button variant="destructive" onClick={signOut} className="gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
