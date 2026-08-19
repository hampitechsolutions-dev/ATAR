'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  atarApi,
  type ConversationRecord,
  type InboxQuery,
  type QuoteRecord,
  type RequestAssignmentRecord,
  type RequestRecord,
  type SupplierMetricsRecord,
  type TeamMemberRecord,
} from '@/lib/atar-api';
import {
  canAccessDashboard,
  clearSession,
  getDefaultDashboardPath,
  loadSession,
  saveSession,
  type WebSession,
} from '@/lib/session';

export type SupplierWorkspaceCounters = {
  openRequestsCount: number;
  myQuotesCount: number;
  activeOrdersCount: number;
  unreadMessagesCount: number;
  unreadNotificationsCount: number;
};

export const SUPPLIER_COUNTERS_REFRESH_EVENT = 'atar:supplier-counters-refresh';

type SupplierWorkspaceCounterOptions = {
  accessToken?: string;
  openRequests?: RequestRecord[];
  myQuotes?: QuoteRecord[];
};

function resolveDashboardRedirect(user: WebSession['user'], allowedRole: 'BUYER' | 'SUPPLIER') {
  // Mismo criterio que AuthGuard: se evalua el lado del marketplace, asi un
  // vendedor (SELLER) puede trabajar en el dashboard de proveedor.
  if (canAccessDashboard(user, allowedRole)) {
    return null;
  }

  return getDefaultDashboardPath(user);
}

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

    const user = await atarApi.me(storedSession.accessToken);

    const nextSession = {
      accessToken: storedSession.accessToken,
      user,
    };

    saveSession(nextSession);
    setSession(nextSession);

    const redirectPath = resolveDashboardRedirect(user, 'BUYER');
    if (redirectPath) {
      router.replace(redirectPath);
      return nextSession;
    }

    const buyerRequests = await atarApi.getBuyerRequests(storedSession.accessToken);
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

    const user = await atarApi.me(storedSession.accessToken);

    const nextSession = {
      accessToken: storedSession.accessToken,
      user,
    };

    saveSession(nextSession);
    setSession(nextSession);
    const redirectPath = resolveDashboardRedirect(user, 'SUPPLIER');
    if (redirectPath) {
      router.replace(redirectPath);
      return nextSession;
    }

    const [requests, quotes] = await Promise.all([
      atarApi.getOpenRequests(storedSession.accessToken),
      atarApi.getSupplierQuotes(storedSession.accessToken),
    ]);
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

/**
 * Bandeja comercial del proveedor: oportunidades con estado y vendedor
 * asignado. El backend ya filtra segun el rol (el vendedor solo ve su cartera).
 */
export function useSupplierInbox(query?: InboxQuery) {
  const router = useRouter();
  const [session, setSession] = useState<WebSession | null>(null);
  const [assignments, setAssignments] = useState<RequestAssignmentRecord[]>([]);
  const [team, setTeam] = useState<TeamMemberRecord[]>([]);
  const [metrics, setMetrics] = useState<SupplierMetricsRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryKey = JSON.stringify(query ?? {});

  const refresh = useCallback(async () => {
    const storedSession = loadSession();
    if (!storedSession) {
      router.replace('/acceso');
      return null;
    }

    const user = await atarApi.me(storedSession.accessToken);
    const nextSession = { accessToken: storedSession.accessToken, user };
    saveSession(nextSession);
    setSession(nextSession);

    const parsedQuery = JSON.parse(queryKey) as InboxQuery;
    const [inbox, metricsResult] = await Promise.all([
      atarApi.getSupplierInbox(parsedQuery, storedSession.accessToken),
      atarApi.getSupplierMetrics(storedSession.accessToken),
    ]);

    setAssignments(inbox);
    setMetrics(metricsResult);

    // El equipo solo existe para gerentes; un vendedor recibe 403 y sigue.
    try {
      setTeam(await atarApi.getSupplierTeam(storedSession.accessToken));
    } catch {
      setTeam([]);
    }

    return nextSession;
  }, [queryKey, router]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        setLoading(true);
        setError(null);
        await refresh();
      } catch (bootstrapError) {
        if (!cancelled) {
          setError(
            bootstrapError instanceof Error
              ? bootstrapError.message
              : 'No se pudo cargar la bandeja comercial.',
          );
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
  }, [refresh]);

  return { session, assignments, team, metrics, loading, error, refresh };
}

export function useSupplierWorkspaceCounters({
  accessToken,
  openRequests,
  myQuotes,
}: SupplierWorkspaceCounterOptions) {
  const [counters, setCounters] = useState<SupplierWorkspaceCounters>({
    openRequestsCount: openRequests?.length ?? 0,
    myQuotesCount: myQuotes?.length ?? 0,
    activeOrdersCount:
      myQuotes?.filter((quote) => quote.request?.order).length ?? 0,
    unreadMessagesCount: 0,
    unreadNotificationsCount: 0,
  });

  useEffect(() => {
    setCounters((current) => ({
      ...current,
      openRequestsCount: openRequests?.length ?? current.openRequestsCount,
      myQuotesCount: myQuotes?.length ?? current.myQuotesCount,
      activeOrdersCount:
        myQuotes?.filter((quote) => quote.request?.order).length ?? current.activeOrdersCount,
    }));
  }, [myQuotes, openRequests]);

  const refreshCounters = useCallback(async () => {
    if (!accessToken) {
      return;
    }

    const token = accessToken;
    const requestsPromise = openRequests
      ? Promise.resolve(openRequests)
      : atarApi.getOpenRequests(token);
    const quotesPromise = myQuotes
      ? Promise.resolve(myQuotes)
      : atarApi.getSupplierQuotes(token);

    try {
      const [requests, quotes, conversations, notifications] = await Promise.all([
        requestsPromise,
        quotesPromise,
        atarApi.getConversations(undefined, token),
        atarApi.getNotifications({ limit: 1 }, token),
      ]);

      setCounters({
        openRequestsCount: requests.length,
        myQuotesCount: quotes.length,
        activeOrdersCount: quotes.filter((quote) => quote.request?.order).length,
        unreadMessagesCount: sumUnreadMessages(conversations),
        unreadNotificationsCount: notifications.unreadCount,
      });
    } catch {
      setCounters((current) => ({
        ...current,
        openRequestsCount: openRequests?.length ?? current.openRequestsCount,
        myQuotesCount: myQuotes?.length ?? current.myQuotesCount,
        activeOrdersCount:
          myQuotes?.filter((quote) => quote.request?.order).length ?? current.activeOrdersCount,
      }));
    }
  }, [accessToken, myQuotes, openRequests]);

  useEffect(() => {
    void refreshCounters();
  }, [refreshCounters]);

  useEffect(() => {
    function handleRefresh() {
      void refreshCounters();
    }

    window.addEventListener(SUPPLIER_COUNTERS_REFRESH_EVENT, handleRefresh);
    return () => {
      window.removeEventListener(SUPPLIER_COUNTERS_REFRESH_EVENT, handleRefresh);
    };
  }, [refreshCounters]);

  return counters;
}

function sumUnreadMessages(conversations: ConversationRecord[]) {
  return conversations.reduce((total, conversation) => total + conversation.unreadCount, 0);
}
