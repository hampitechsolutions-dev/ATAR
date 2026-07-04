'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { atarApi, type QuoteRecord, type RequestRecord } from '@/lib/atar-api';
import {
  clearSession,
  getPrimaryMembershipRole,
  isHybridUser,
  loadSession,
  saveSession,
  type WebSession,
} from '@/lib/session';

export function useBuyerDashboardData() {
  const router = useRouter();
  const [session, setSession] = useState<WebSession | null>(null);
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const storedSession = loadSession();
    if (!storedSession) {
      router.replace('/acceso');
      return null;
    }

    if (getPrimaryMembershipRole(storedSession.user) !== 'BUYER' && !isHybridUser(storedSession.user)) {
      router.replace('/dashboard/proveedor');
      return null;
    }

    const [user, buyerRequests] = await Promise.all([
      atarApi.me(storedSession.accessToken),
      atarApi.getBuyerRequests(storedSession.accessToken),
    ]);

    const nextSession = {
      accessToken: storedSession.accessToken,
      user,
    };

    saveSession(nextSession);
    setSession(nextSession);
    setRequests(buyerRequests);
    return nextSession;
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        setLoading(true);
        setError(null);
        await refresh();
      } catch (bootstrapError) {
        clearSession();
        if (!cancelled) {
          setError(
            bootstrapError instanceof Error
              ? bootstrapError.message
              : 'No se pudo cargar el dashboard comprador.',
          );
          router.replace('/acceso');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [refresh, router]);

  return {
    session,
    requests,
    loading,
    error,
    setError,
    refresh,
  };
}

export function useSupplierDashboardData() {
  const router = useRouter();
  const [session, setSession] = useState<WebSession | null>(null);
  const [openRequests, setOpenRequests] = useState<RequestRecord[]>([]);
  const [myQuotes, setMyQuotes] = useState<QuoteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const storedSession = loadSession();
    if (!storedSession) {
      router.replace('/acceso');
      return null;
    }

    if (getPrimaryMembershipRole(storedSession.user) !== 'SUPPLIER' && !isHybridUser(storedSession.user)) {
      router.replace('/dashboard/comprador');
      return null;
    }

    const [user, requests, quotes] = await Promise.all([
      atarApi.me(storedSession.accessToken),
      atarApi.getOpenRequests(storedSession.accessToken),
      atarApi.getSupplierQuotes(storedSession.accessToken),
    ]);

    const nextSession = {
      accessToken: storedSession.accessToken,
      user,
    };

    saveSession(nextSession);
    setSession(nextSession);
    setOpenRequests(requests);
    setMyQuotes(quotes);
    return nextSession;
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        setLoading(true);
        setError(null);
        await refresh();
      } catch (bootstrapError) {
        clearSession();
        if (!cancelled) {
          setError(
            bootstrapError instanceof Error
              ? bootstrapError.message
              : 'No se pudo cargar el dashboard proveedor.',
          );
          router.replace('/acceso');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [refresh, router]);

  return {
    session,
    openRequests,
    myQuotes,
    loading,
    error,
    setError,
    refresh,
  };
}
