'use client';

import SupplierDashboardShell from '@/components/dashboard/supplier-dashboard-shell';
import { useSupplierDashboardData } from '@/lib/dashboard-hooks';
import SupplierSettings from './supplier-settings';

/**
 * Configuración de la empresa. La misma vista (pestañas, perfil público,
 * tips) sirve para mobile y escritorio: las grillas se apilan en pantallas chicas.
 */
export default function SupplierSettingsPage() {
  const { session } = useSupplierDashboardData();

  return (
    <SupplierDashboardShell session={session}>
      <SupplierSettings session={session} />
    </SupplierDashboardShell>
  );
}
