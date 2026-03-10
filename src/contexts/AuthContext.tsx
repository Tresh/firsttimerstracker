import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

export type UserProfile = {
  id: string;
  user_id: string;
  full_name: string;
  phone_number: string | null;
  organization_id: string | null;
  role_title: string | null;
};

export type AppRole =
  | "king_admin"
  | "admin"
  | "erediauwa_admin"
  | "loveworldcity_admin"
  | "youth_teens_admin"
  | "church_pastor"
  | "reception_team"
  | "cell_leader"
  | "follow_up_team"
  | "department_head"
  | "pastor";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  role: AppRole | null;
  organizationId: string | null;
  isLoading: boolean;
  isKingAdmin: boolean;
  isGroupAdmin: boolean;
  isReceptionTeam: boolean;
  isCellLeader: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  role: null,
  organizationId: null,
  isLoading: true,
  isKingAdmin: false,
  isGroupAdmin: false,
  isReceptionTeam: false,
  isCellLeader: false,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfileAndRole = useCallback(async (userId: string) => {
    const [profileRes, roleRes] = await Promise.all([
      supabase.from("profiles").select("id, user_id, full_name, phone_number, organization_id, role_title").eq("user_id", userId).single(),
      supabase.from("user_roles").select("role").eq("user_id", userId).single(),
    ]);
    setProfile(profileRes.data as UserProfile | null);
    setRole((roleRes.data?.role as AppRole) ?? null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) await fetchProfileAndRole(user.id);
  }, [user, fetchProfileAndRole]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfileAndRole(session.user.id).finally(() => setIsLoading(false));
      } else {
        setProfile(null);
        setRole(null);
        setIsLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfileAndRole(session.user.id).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfileAndRole]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const isKingAdmin = role === "king_admin" || role === "admin";
  const isGroupAdmin = role === "erediauwa_admin" || role === "loveworldcity_admin" || role === "youth_teens_admin";
  const isReceptionTeam = role === "reception_team";
  const isCellLeader = role === "cell_leader";
  const organizationId = profile?.organization_id ?? null;

  return (
    <AuthContext.Provider value={{ session, user, profile, role, organizationId, isLoading, isKingAdmin, isGroupAdmin, isReceptionTeam, isCellLeader, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
