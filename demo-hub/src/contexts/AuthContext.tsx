import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logAuthEvent } from '@/services/authEvents';
import type { User, Session } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

// Safe profile type that excludes security answer hashes (never sent to client)
type SafeProfile = Omit<Database['public']['Tables']['profiles']['Row'], 'security_answer_hash' | 'security_answer_hash_2'>;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: SafeProfile | null;
  roles: AppRole[];
  isAdmin: boolean;
  needsSecuritySetup: boolean;
  needsPasswordReset: boolean;
  clearSecuritySetup: () => void;
  clearPasswordReset: () => void;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<SafeProfile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);

  const fetchProfileAndRoles = async (userId: string) => {
    const [profileRes, rolesRes] = await Promise.all([
      supabase.from('profiles').select('id, user_id, display_name, avatar_url, user_type, force_password_reset, force_security_setup, security_question, security_question_2, temp_password_expires_at, created_at, updated_at').eq('user_id', userId).maybeSingle(),
      supabase.from('user_roles').select('role').eq('user_id', userId),
    ]);
    if (profileRes.data) setProfile(profileRes.data);
    if (rolesRes.data) setRoles(rolesRes.data.map((r) => r.role));
  };

  useEffect(() => {
    let isMounted = true;

    // Listener for ONGOING auth changes (does NOT control isLoading)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => fetchProfileAndRoles(session.user.id), 0);
      } else {
        setProfile(null);
        setRoles([]);
      }
    });

    // INITIAL load — controls isLoading, waits for everything before resolving
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfileAndRoles(session.user.id);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    const currentUser = user;
    await supabase.auth.signOut();
    if (currentUser) {
      logAuthEvent('logout', currentUser.email || '', currentUser.id);
    }
    setProfile(null);
    setRoles([]);
  };

  const hasRole = (role: AppRole) => roles.includes(role);
  const isAdmin = hasRole('admin');
  const needsSecuritySetup = !!user && !!profile && (!profile.security_question || !profile.security_question_2) && profile.force_security_setup;
  const needsPasswordReset = !!user && !!profile && profile.force_password_reset;
  const clearPasswordReset = () => {
    if (profile) setProfile({ ...profile, force_password_reset: false });
  };
  const clearSecuritySetup = () => {
    if (profile) {
      setProfile({ ...profile, force_security_setup: false, security_question: 'set' });
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, profile, roles, isAdmin, needsSecuritySetup, needsPasswordReset, clearSecuritySetup, clearPasswordReset, signIn, signUp, signOut, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
