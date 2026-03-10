import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { KingsRetentionLogo } from "@/components/KingsRetentionLogo";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(searchParams.get("mode") === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;
        toast.success("Account created! Check your email to verify your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const redirect = searchParams.get("redirect") || "/dashboard";
        navigate(redirect);
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-background p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 gradient-primary opacity-[0.04]" />
      <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-primary/10 blur-[100px]" />
      <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-accent/10 blur-[100px]" />

      <div className="relative z-10 w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="mb-8">
          <KingsRetentionLogo size="md" />
          <p className="text-xs text-muted-foreground mt-2 ml-[52px]">Track Every Soul. Retain Every Member.</p>
        </div>

        <Card className="border-0 stat-glow">
          <CardHeader>
            <CardTitle className="text-2xl">{isSignUp ? "Create an Account" : "Welcome Back"}</CardTitle>
            <CardDescription>
              {isSignUp ? "Join the KingsRetention platform" : "Sign in to access your dashboard"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" placeholder="Pastor John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} required={isSignUp} className="h-12" />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@church.org" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-12" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-12" />
              </div>
              <Button type="submit" className="w-full h-12 text-base" disabled={isLoading}>
                {isLoading ? "Loading..." : isSignUp ? "Create Account" : "Sign In"}
              </Button>
              <Button type="button" variant="ghost" className="w-full text-muted-foreground" onClick={() => setIsSignUp(!isSignUp)}>
                {isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
