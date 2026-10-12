import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { loginEmail } from '@/lib/login-id';
import type { Profile } from '@/types/db';

export type SignInResult = { ok: true; needsMfa: boolean } | { ok: false; error: string };

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  permissions: Set<string>;
  isLoading: boolean;
  /** Set when the signed-in user has a verified TOTP factor and has not passed it this session. */
  needsMfa: boolean;
  signIn: (identifier: string, password: string) => Promise<SignInResult>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  can: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const PROFILE_CACHE = 'kk-profile';

/** Last profile seen on this device, so a page reload during an internet outage keeps the user signed in. */
function cachedProfile(userId: string): { profile: Profile; permissions: Set<string> } | null {
  try {
    const cached = JSON.parse(localStorage.getItem(PROFILE_CACHE) ?? 'null') as { profile: Profile; permissions: string[] } | null;
    return cached?.profile.id === userId ? { profile: cached.profile, permissions: new Set(cached.permissions) } : null;
  } catch {
    return null;
  }
}

async function loadProfile(userId: string): Promise<{ profile: Profile | null; permissions: Set<string> }> {
  const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) return cachedProfile(userId) ?? { profile: null, permissions: new Set() };
  if (!profile) return { profile: null, permissions: new Set() };
  const { data: perms } = await supabase.from('role_permissions').select('permission').eq('role', profile.role);
  const permissions = (perms ?? []).map((p) => p.permission as string);
  try {
    localStorage.setItem(PROFILE_CACHE, JSON.stringify({ profile, permissions }));
  } catch {
    // ignore
  }
  return { profile: profile as Profile, permissions: new Set(permissions) };
}

/** Removes this user's cached data from a shared computer. Unsaved exam answers are kept. */
function clearDeviceCache() {
  try {
    for (const key of Object.keys(localStorage)) {
      if (key === PROFILE_CACHE || key.startsWith('kk-exam-paper-') || key.startsWith('kk-exam-flags-')) localStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
}

async function mfaPending(): Promise<boolean> {
  // Reads the session token locally, so it works offline
  const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  return !!data && data.nextLevel === 'aal2' && data.currentLevel !== 'aal2';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [needsMfa, setNeedsMfa] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const applySession = useCallback(async (next: Session | null) => {
    setSession(next);
    if (!next) {
      setProfile(null);
      setPermissions(new Set());
      setNeedsMfa(false);
      return;
    }
    const [loaded, pending] = await Promise.all([loadProfile(next.user.id), mfaPending()]);
    setProfile(loaded.profile);
    setPermissions(loaded.permissions);
    setNeedsMfa(pending);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      await applySession(data.session);
      setIsLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, next) => {
      // Defer: Supabase warns against awaiting other auth calls inside this callback
      if (event === 'SIGNED_OUT' || event === 'SIGNED_IN' || event === 'MFA_CHALLENGE_VERIFIED' || event === 'USER_UPDATED') {
        setTimeout(() => void applySession(next), 0);
      } else {
        setSession(next);
      }
    });
    return () => listener.subscription.unsubscribe();
  }, [applySession]);

  const signIn = useCallback(async (identifier: string, password: string): Promise<SignInResult> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail(identifier), password });
    if (error || !data.session) {
      const message = error?.message.includes('banned')
        ? 'This account has been deactivated. Contact the school office.'
        : 'The login details are not correct.';
      return { ok: false, error: message };
    }
    const loaded = await loadProfile(data.session.user.id);
    if (!loaded.profile || !loaded.profile.is_active) {
      await supabase.auth.signOut();
      return { ok: false, error: 'This account has been deactivated. Contact the school office.' };
    }
    await applySession(data.session);
    return { ok: true, needsMfa: await mfaPending() };
  }, [applySession]);

  const signOut = useCallback(async () => {
    clearDeviceCache();
    await supabase.auth.signOut();
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    await applySession(data.session);
  }, [applySession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      permissions,
      isLoading,
      needsMfa,
      signIn,
      signOut,
      refreshProfile,
      can: (permission) => permissions.has(permission),
    }),
    [session, profile, permissions, isLoading, needsMfa, signIn, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
