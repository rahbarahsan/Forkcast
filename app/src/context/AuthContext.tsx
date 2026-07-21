import type { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { isSupabaseConfigured, supabase } from '../lib/supabase';

interface AuthResult {
  error: string | null;
  /** True when sign-up succeeded but the address still needs confirming. */
  needsEmailConfirmation?: boolean;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  /** True until the stored session has been restored, to avoid a sign-in flash. */
  initializing: boolean;
  isGuest: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  initializing: true,
  isGuest: true,
  signIn: async () => ({ error: 'Auth is not configured' }),
  signUp: async () => ({ error: 'Auth is not configured' }),
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setInitializing(false);
      return;
    }

    let active = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active) setSession(data.session);
      })
      .finally(() => {
        if (active) setInitializing(false);
      });

    // Fires on sign-in, sign-out, and silent token refreshes.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextType>(() => {
    const guard = (): AuthResult | null =>
      isSupabaseConfigured
        ? null
        : { error: 'Sign-in is unavailable because Supabase is not configured.' };

    return {
      session,
      user: session?.user ?? null,
      initializing,
      isGuest: !session,

      signIn: async (email, password) => {
        const blocked = guard();
        if (blocked) return blocked;

        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        return { error: error?.message ?? null };
      },

      signUp: async (email, password) => {
        const blocked = guard();
        if (blocked) return blocked;

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (error) return { error: error.message };

        // With "Confirm email" enabled, signUp returns a user but no session.
        return {
          error: null,
          needsEmailConfirmation: Boolean(data.user) && !data.session,
        };
      },

      signOut: async () => {
        if (isSupabaseConfigured) await supabase.auth.signOut();
        setSession(null);
      },
    };
  }, [session, initializing]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
