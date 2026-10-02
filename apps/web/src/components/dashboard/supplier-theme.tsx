'use client';

import { useWorkspace } from '@/components/auth/workspace-provider';

/**
 * Tema del panel de ventas según quién entra:
 * - Vendedor: verde (`.theme-supplier`).
 * - Empresa proveedora (quien la administra): violeta, su identidad de siempre
 *   (`.theme-company` pisa los verdes con la escala violeta).
 *
 * `contents` no agrega caja: solo aporta las variables de color.
 */
export default function SupplierTheme({ children }: { children: React.ReactNode }) {
  const { isSeller } = useWorkspace();
  return <div className={`theme-supplier contents ${isSeller ? '' : 'theme-company'}`}>{children}</div>;
}
