import { ForbiddenException } from '@nestjs/common';
import { CompanyType, MembershipRole } from '@prisma/client';
import type { AuthUser } from '../auth/auth-user.interface';

/**
 * Resolucion del "espacio de trabajo activo".
 *
 * Un usuario puede tener membresias en varias empresas (Membership ya es una
 * relacion N a N). Cuando trabaja como vendedor de tres proveedoras distintas,
 * cada request del front manda el header `x-company-id` para indicar con cual
 * esta operando. Si no llega el header se usa la primera membresia compatible,
 * que es el comportamiento historico.
 */

export type WorkspaceSide = 'buyer' | 'supplier';

export type Workspace = {
  companyId: string;
  companyType?: CompanyType;
  roles: MembershipRole[];
  /** ADMIN de plataforma o duenio/gerente de la empresa. Ve y administra todo. */
  isManager: boolean;
  /** Vendedor: solo ve lo que le asignaron. */
  isSeller: boolean;
};

const SUPPLIER_SIDE_ROLES: MembershipRole[] = [
  MembershipRole.SUPPLIER,
  MembershipRole.SELLER,
  MembershipRole.ADMIN,
];

const BUYER_SIDE_ROLES: MembershipRole[] = [MembershipRole.BUYER, MembershipRole.ADMIN];

export function isPlatformAdmin(user: AuthUser) {
  return user.memberships.some((membership) => membership.role === MembershipRole.ADMIN);
}

function membershipsForSide(user: AuthUser, side: WorkspaceSide) {
  const allowedRoles = side === 'supplier' ? SUPPLIER_SIDE_ROLES : BUYER_SIDE_ROLES;

  return user.memberships.filter(
    (membership) =>
      allowedRoles.includes(membership.role) ||
      // Una empresa HYBRID compra y vende: cualquier membresia sirve para los dos lados.
      membership.companyType === CompanyType.HYBRID,
  );
}

/**
 * Devuelve el workspace activo del usuario para un lado del marketplace.
 * Lanza 403 si el usuario no tiene ninguna membresia compatible o si pidio una
 * empresa en la que no participa.
 */
export function resolveWorkspace(
  user: AuthUser,
  side: WorkspaceSide,
  activeCompanyId?: string | null,
  options: { strict?: boolean } = {},
): Workspace {
  const candidates = membershipsForSide(user, side);

  if (candidates.length === 0) {
    throw new ForbiddenException(
      side === 'supplier'
        ? 'La operacion requiere una empresa proveedora.'
        : 'La operacion requiere una empresa compradora.',
    );
  }

  const requestedCompanyId = activeCompanyId?.trim();
  const requested = requestedCompanyId
    ? candidates.filter((membership) => membership.companyId === requestedCompanyId)
    : [];

  // El header `x-company-id` es una preferencia, no un permiso: el front lo
  // manda siempre y puede apuntar a la empresa del otro lado del marketplace
  // (por ejemplo el usuario esta en el panel de comprador con una proveedora
  // activa). En ese caso caemos a la primera membresia valida de este lado.
  // Los endpoints que reciben la empresa explicitamente usan `strict`.
  if (requestedCompanyId && requested.length === 0 && options.strict) {
    throw new ForbiddenException('No tenes acceso a esta empresa.');
  }

  const memberships = requested.length > 0
    ? requested
    : candidates.filter((membership) => membership.companyId === candidates[0].companyId);
  const companyId = memberships[0].companyId;

  const roles = memberships.map((membership) => membership.role);
  const companyType = memberships[0].companyType;
  const isSeller = roles.includes(MembershipRole.SELLER);
  const isManager =
    roles.includes(MembershipRole.ADMIN) ||
    roles.includes(side === 'supplier' ? MembershipRole.SUPPLIER : MembershipRole.BUYER) ||
    // Historicamente una empresa HYBRID opera de los dos lados con una sola
    // membresia; ese usuario sigue siendo el gerente de su empresa.
    (companyType === CompanyType.HYBRID && !isSeller);

  return {
    companyId,
    companyType,
    roles,
    isManager,
    isSeller,
  };
}

export function resolveSupplierWorkspace(
  user: AuthUser,
  activeCompanyId?: string | null,
  options?: { strict?: boolean },
) {
  return resolveWorkspace(user, 'supplier', activeCompanyId, options);
}

export function resolveBuyerWorkspace(
  user: AuthUser,
  activeCompanyId?: string | null,
  options?: { strict?: boolean },
) {
  return resolveWorkspace(user, 'buyer', activeCompanyId, options);
}

/** Compatibilidad con el codigo existente: solo el id de empresa. */
export function resolveCompanyId(
  user: AuthUser,
  role: MembershipRole,
  activeCompanyId?: string | null,
) {
  const side: WorkspaceSide = role === MembershipRole.BUYER ? 'buyer' : 'supplier';
  return resolveWorkspace(user, side, activeCompanyId).companyId;
}

export function resolveOptionalCompanyId(
  user: AuthUser,
  role: MembershipRole,
  activeCompanyId?: string | null,
) {
  try {
    return resolveCompanyId(user, role, activeCompanyId);
  } catch {
    return undefined;
  }
}

/** Acciones de gestion: asignar, reasignar, ver metricas globales, equipo. */
export function assertManager(workspace: Workspace) {
  if (!workspace.isManager) {
    throw new ForbiddenException(
      'Solo el administrador o gerente de la empresa puede realizar esta accion.',
    );
  }

  return workspace;
}

/** Todas las empresas del usuario para un lado, sin elegir una activa. */
export function listWorkspaceCompanyIds(user: AuthUser, side: WorkspaceSide) {
  return Array.from(new Set(membershipsForSide(user, side).map((membership) => membership.companyId)));
}
