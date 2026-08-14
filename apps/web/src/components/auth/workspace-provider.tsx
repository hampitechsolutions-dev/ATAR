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
import { useAuth } from '@/components/auth/auth-provider';
import {
  atarApi,
  getActiveCompanyId,
  setActiveCompanyId,
  type WorkspaceRecord,
} from '@/lib/atar-api';

/**
 * Empresa activa del usuario.
 *
 * Un vendedor puede representar a varias proveedoras (Plasticos Argentinos,
 * Envapack, Industrial SA). Al cambiar de empresa cambia toda su bandeja:
 * solicitudes, cotizaciones, mensajes y metricas. El id viaja en cada llamada
 * a la API como `x-company-id`.
 */
type WorkspaceContextValue = {
  workspaces: WorkspaceRecord[];
  activeWorkspace: WorkspaceRecord | null;
  activeCompanyId: string | null;
  loading: boolean;
  /** Gerente o dueño de la empresa activa: ve todo y puede asignar. */
  isManager: boolean;
  /** Vendedor: solo ve su cartera. */
  isSeller: boolean;
  hasMultipleWorkspaces: boolean;
  selectWorkspace: (companyId: string) => void;
  refreshWorkspaces: () => Promise<void>;
};

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { session, isHydrated } = useAuth();
  const [workspaces, setWorkspaces] = useState<WorkspaceRecord[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setActiveId(getActiveCompanyId());
  }, []);

  const loadWorkspaces = useCallback(async () => {
    if (!session?.accessToken) {
      setWorkspaces([]);
      return;
    }

    try {
      setLoading(true);
      const items = await atarApi.getWorkspaces(session.accessToken);
      setWorkspaces(items);

      // Si la empresa guardada ya no aplica, se toma la principal.
      const stored = getActiveCompanyId();
      const valid = stored && items.some((item) => item.companyId === stored);
      const fallback = items.find((item) => item.isPrimary)?.companyId ?? items[0]?.companyId ?? null;
      const next = valid ? stored : fallback;

      if (next !== stored) {
        setActiveCompanyId(next);
      }

      setActiveId(next);
    } catch {
      setWorkspaces([]);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    void loadWorkspaces();
  }, [isHydrated, loadWorkspaces]);

  const selectWorkspace = useCallback((companyId: string) => {
    setActiveCompanyId(companyId);
    setActiveId(companyId);
    // El contexto comercial cambia por completo: se recargan los datos de la
    // pantalla actual con la empresa nueva.
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }, []);

  const value = useMemo<WorkspaceContextValue>(() => {
    const activeWorkspace =
      workspaces.find((item) => item.companyId === activeId) ??
      workspaces.find((item) => item.isPrimary) ??
      workspaces[0] ??
      null;

    return {
      workspaces,
      activeWorkspace,
      activeCompanyId: activeWorkspace?.companyId ?? null,
      loading,
      isManager: activeWorkspace?.isManager ?? true,
      isSeller: Boolean(activeWorkspace?.isSeller && !activeWorkspace?.isManager),
      hasMultipleWorkspaces: workspaces.length > 1,
      selectWorkspace,
      refreshWorkspaces: loadWorkspaces,
    };
  }, [activeId, loadWorkspaces, loading, selectWorkspace, workspaces]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace debe usarse dentro de WorkspaceProvider.');
  }

  return context;
}
