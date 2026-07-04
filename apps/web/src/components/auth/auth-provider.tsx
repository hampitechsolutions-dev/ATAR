'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { atarApi, type AuthResponse, type AuthUser } from '@/lib/atar-api';
import {
  authResponseToSession,
  clearSession,
  getDefaultDashboardPath,
  getPrimaryMembershipRole,
  isHybridUser,
  loadSession,
  saveSession,
  type WebSession,
} from '@/lib/session';
import { disableWebPush, enableWebPush } from '@/lib/push-notifications';

type AuthContextValue = {
  session: WebSession | null;
  user: AuthUser | null;
  isHydrated: boolean;
  isAuthenticated: boolean;
  role: ReturnType<typeof getPrimaryMembershipRole>;
  isHybrid: boolean;
  signIn: (response: AuthResponse) => void;
  signOut: () => void;
  refreshSession: () => Promise<WebSession | null>;
  getDefaultPath: () => string;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<WebSession | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const stored = loadSession();
    setSession(stored);
    setIsHydrated(true);
  }, []);

  const signOut = useCallback(() => {
    if (session?.accessToken) {
      void disableWebPush(session.accessToken);
    }
    clearSession();
    setSession(null);
  }, [session?.accessToken]);

  const signIn = useCallback((response: AuthResponse) => {
    const nextSession = authResponseToSession(response);
    saveSession(nextSession);
    setSession(nextSession);
  }, []);

  const refreshSession = useCallback(async () => {
    const currentSession = loadSession();
    if (!currentSession) {
      setSession(null);
      return null;
    }

    try {
      const user = await atarApi.me(currentSession.accessToken);
      const nextSession = {
        accessToken: currentSession.accessToken,
        user,
      };
      saveSession(nextSession);
      setSession(nextSession);
      return nextSession;
    } catch {
      clearSession();
      setSession(null);
      return null;
    }
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const role = session ? getPrimaryMembershipRole(session.user) : null;
    return {
      session,
      user: session?.user ?? null,
      isHydrated,
      isAuthenticated: Boolean(session),
      role,
      isHybrid: session ? isHybridUser(session.user) : false,
      signIn,
      signOut,
      refreshSession,
      getDefaultPath: () => (session ? getDefaultDashboardPath(session.user) : '/acceso'),
    };
  }, [isHydrated, refreshSession, session, signIn, signOut]);

  useEffect(() => {
    if (!session?.accessToken) {
      return;
    }

    void enableWebPush(session.accessToken);
  }, [session?.accessToken]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider.');
  }

  return context;
}
