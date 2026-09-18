import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { isSupabaseConfigured } from '@/config/env';
import { AuthContext } from '@/hooks/auth-context';
import { getSupabaseClient } from '@/services/supabase';
import { authRedirectTo } from '@/utils/auth';

async function loadIsAdmin(user: User | null) {
  if (!user) return false;
  const supabase = getSupabaseClient();
  if (!supabase) return false;
  const { data } = await supabase.from('admins').select('user_id').eq('user_id', user.id).maybeSingle();
  return Boolean(data);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminReady, setAdminReady] = useState(!isSupabaseConfigured());
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured());

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    let active = true;
    const userIdRef = { current: null as string | null };

    void supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      const nextUser = data.session?.user ?? null;
      userIdRef.current = nextUser?.id ?? null;
      setSession(data.session);
      setUser(nextUser);
      setIsAdmin(await loadIsAdmin(nextUser));
      setAdminReady(true);
      setIsLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      const nextUser = nextSession?.user ?? null;
      setSession(nextSession);
      setUser(nextUser);

      if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') return;

      if (!nextUser) {
        userIdRef.current = null;
        setIsAdmin(false);
        setAdminReady(true);
        return;
      }

      // Tab focus / session recover fires SIGNED_IN for the same user.
      // Reloading the admin flag would unmount /admin/books/new and wipe the form.
      if (nextUser.id === userIdRef.current) return;

      userIdRef.current = nextUser.id;
      setAdminReady(false);
      void loadIsAdmin(nextUser).then((admin) => {
        if (!active) return;
        setIsAdmin(admin);
        setAdminReady(true);
      });
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase is not configured');

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase is not configured');

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { emailRedirectTo: authRedirectTo() },
    });
    if (error) throw error;
    return { needsConfirmation: !data.session };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase is not configured');

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: authRedirectTo() },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setIsAdmin(false);
    setAdminReady(true);
  }, []);

  const value = useMemo(
    () => ({
      user,
      session,
      isLoading,
      isAdmin,
      adminReady,
      isConfigured: isSupabaseConfigured(),
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
    }),
    [adminReady, isAdmin, isLoading, session, signIn, signInWithGoogle, signOut, signUp, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
