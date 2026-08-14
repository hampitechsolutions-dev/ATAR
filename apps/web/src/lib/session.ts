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

// Roles que trabajan del lado vendedor. El vendedor (SELLER) opera dentro de
// una empresa proveedora: entra al mismo dashboard, con permisos acotados.
const SUPPLIER_SIDE_ROLES: MembershipRole[] = ['SUPPLIER', 'SELLER'];
const BUYER_SIDE_ROLES: MembershipRole[] = ['BUYER'];

export function isSupplierSideUser(user: AuthUser): boolean {
  return user.memberships.some(
    (membership) =>
      SUPPLIER_SIDE_ROLES.includes(membership.role) ||
      membership.company.type === 'SUPPLIER' ||
      membership.company.type === 'HYBRID',
  );
}

export function isBuyerSideUser(user: AuthUser): boolean {
  return user.memberships.some(
    (membership) =>
      BUYER_SIDE_ROLES.includes(membership.role) ||
      membership.company.type === 'BUYER' ||
      membership.company.type === 'HYBRID',
  );
}

/**
 * Un usuario puede entrar a un dashboard si tiene alguna membresia de ese lado
 * del marketplace, no solo si su rol principal coincide exactamente.
 */
export function canAccessDashboard(user: AuthUser, side: MembershipRole): boolean {
  if (user.memberships.some((membership) => membership.role === 'ADMIN')) {
    return true;
  }

  if (side === 'SUPPLIER' || side === 'SELLER') {
    return isSupplierSideUser(user);
  }

  if (side === 'BUYER') {
    return isBuyerSideUser(user);
  }

  return true;
}

export function getDefaultDashboardPath(user: AuthUser): string {
  const role = getPrimaryMembershipRole(user);
  if (role === 'SUPPLIER' || role === 'SELLER') {
    return '/dashboard/proveedor';
  }

  // Sin rol claro, decide el tipo de empresa (un vendedor sin membresia BUYER
  // nunca deberia caer en el dashboard de compras).
  if (role !== 'BUYER' && isSupplierSideUser(user) && !isBuyerSideUser(user)) {
    return '/dashboard/proveedor';
  }

  return '/dashboard/comprador';
}