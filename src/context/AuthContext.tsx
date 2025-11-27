import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Session, User } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  display_name?: string;
  avatar_url?: string;
  company_name?: string;
  phone?: string;
  user_role: 'owner' | 'viewer';
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isOwner: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any } | void>;
  signUp: (email: string, password: string, businessName: string, role?: 'owner' | 'viewer') => Promise<{ error: any } | void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any } | void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (error) {
        // Profile doesn't exist yet or table not created - this is okay
        console.warn('Profile not found:', error.message);
        setProfile(null);
        return;
      }
      if (data) setProfile(data as UserProfile);
    } catch (err) {
      console.warn('Failed to load profile:', err);
      setProfile(null);
    }
  };

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        console.log('[Auth] Initializing...');
        const { data: { session } } = await supabase.auth.getSession();
        console.log('[Auth] Session:', session ? 'Found' : 'None');
        if (!mounted) return;
        setSession(session);
        setUser(session?.user || null);
        if (session?.user) {
          console.log('[Auth] Loading profile for user:', session.user.id);
          // Don't block on profile loading
          loadProfile(session.user.id).catch(console.warn);
        }
      } catch (err) {
        console.error('[Auth] Init error:', err);
      } finally {
        console.log('[Auth] Setting loading = false');
        setLoading(false);
      }
    };
    init();
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      console.log('[Auth] State change:', _event, newSession ? 'Has session' : 'No session');
      setSession(newSession);
      setUser(newSession?.user || null);
      if (newSession?.user) {
        loadProfile(newSession.user.id).catch(console.warn);
      } else {
        setProfile(null);
      }
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  const signIn: AuthContextValue['signIn'] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error };
  };

  const signUp: AuthContextValue['signUp'] = async (email, password, businessName, role = 'viewer') => {
    // Send email verification link after signup
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          user_role: role
        },
        emailRedirectTo: window.location.origin + "/"
      }
    });
    if (error) return { error };
    // Do not manually insert profile here; let Supabase trigger or post-verification logic handle it
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword: AuthContextValue['resetPassword'] = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/login' });
    if (error) return { error };
  };

  const isOwner = profile?.user_role === 'owner';

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, isOwner, signIn, signUp, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
