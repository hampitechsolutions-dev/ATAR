import { router } from 'expo-router';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { mobileApi, type AuthResponse, type AuthUser } from '@/src/lib/api';
import {
  authResponseToSession,
  clearMobileSession,
  getPrimaryMembershipRole,
  loadMobileSession,
  saveMobileSession,
  type MobileSession,
} from '@/src/lib/session';

type AuthContextValue = {
  session: MobileSession | null;
  user: AuthUser | null;
  isHydrated: boolean;
  role: ReturnType<typeof getPrimaryMembershipRole>;
  signIn: (response: AuthResponse) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<MobileSession | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function MobileAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<MobileSession | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      const stored = await loadMobileSession();
      if (mounted) {
        setSession(stored);
        setIsHydrated(true);
      }
    }

    void hydrate();
    return () => {
      mounted = false;
    };
  }, []);

  const signOut = useCallback(async () => {
    await clearMobileSession();
    setSession(null);
    router.replace('/login');
  }, []);

  const signIn = useCallback(async (response: AuthResponse) => {
    const nextSession = authResponseToSession(response);
    await saveMobileSession(nextSession);
    setSession(nextSession);
    router.replace('/');
  }, []);

  const refreshSession = useCallback(async () => {
    const currentSession = await loadMobileSession();
    if (!currentSession) {
      setSession(null);
      return null;
    }

    try {
      const user = await mobileApi.me(currentSession.accessToken);
      const nextSession = {
        accessToken: currentSession.accessToken,
        user,
      };
      await saveMobileSession(nextSession);
      setSession(nextSession);
      return nextSession;
    } catch {
      await clearMobileSession();
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
      role,
      signIn,
      signOut,
      refreshSession,
    };
  }, [isHydrated, session, signIn, signOut, refreshSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useMobileAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useMobileAuth debe usarse dentro de MobileAuthProvider.');
  }

  return context;
}
