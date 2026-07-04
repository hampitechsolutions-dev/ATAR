import type { AuthResponse, AuthUser, CompanyType, MembershipRole } from './atar-api';

export const SESSION_STORAGE_KEY = 'atar.session';

export type WebSession = {
  accessToken: string;
  user: AuthUser;
};

export function saveSession(session: WebSession) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function loadSession(): WebSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as WebSession;
  } catch {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

export function clearSession() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

export function authResponseToSession(response: AuthResponse): WebSession {
  return {
    accessToken: response.accessToken,
    user: response.user,
  };
}

export function getPrimaryMembershipRole(user: AuthUser): MembershipRole | null {
  return user.memberships.find((membership) => membership.isPrimary)?.role ?? user.memberships[0]?.role ?? null;
}

export function getPrimaryCompanyName(user: AuthUser): string {
  return user.memberships.find((membership) => membership.isPrimary)?.company.name ?? user.memberships[0]?.company.name ?? 'Mi empresa';
}

export function getPrimaryCompanyType(user: AuthUser): CompanyType | null {
  return (
    user.memberships.find((membership) => membership.isPrimary)?.company.type ??
    user.memberships[0]?.company.type ??
    null
  );
}

// Una empresa HYBRID compra materia prima y vende productos: puede operar como
// comprador y proveedor a la vez.
export function isHybridUser(user: AuthUser): boolean {
  return user.memberships.some((membership) => membership.company.type === 'HYBRID');
}

export function getDefaultDashboardPath(user: AuthUser): string {
  const role = getPrimaryMembershipRole(user);
  if (role === 'SUPPLIER') {
    return '/dashboard/proveedor';
  }

  return '/dashboard/comprador';
}