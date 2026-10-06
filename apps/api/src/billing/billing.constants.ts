import { MembershipRole } from '@prisma/client';

/**
 * Roles que administran una empresa (dueño/gerente). Son los destinatarios de
 * las notificaciones de facturación: un vendedor (SELLER) no gestiona el cobro.
 */
export const BILLING_MANAGER_ROLES: MembershipRole[] = [
  MembershipRole.ADMIN,
  MembershipRole.SUPPLIER,
  MembershipRole.BUYER,
];

/** La facturación de la empresa vive en el panel del proveedor (el pagador). */
export const BILLING_COMPANY_HREF = '/dashboard/proveedor/facturacion';

/** Días antes del vencimiento en los que se avisa "por vencer". */
export const BILLING_DUE_SOON_DAYS = 3;
