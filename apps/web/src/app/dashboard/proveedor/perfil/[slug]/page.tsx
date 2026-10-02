'use client';

import { useParams } from 'next/navigation';
import SupplierDashboardShell from '@/components/dashboard/supplier-dashboard-shell';
import SupplierDetail from '@/components/suppliers/supplier-detail';
import { useSupplierDashboardData } from '@/lib/dashboard-hooks';

/**
 * Vista previa de la ficha pública dentro del panel del proveedor. Antes el
 * botón "Ver mi perfil público" abría /productos/[slug], que es el sitio web
 * abierto, y sacaba al usuario de la app.
 */
export default function SupplierProfilePreviewPage() {
  const params = useParams<{ slug: string }>();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const { session } = useSupplierDashboardData();

  return (
    <SupplierDashboardShell session={session}>
      <SupplierDetail slug={slug} variant="preview" />
    </SupplierDashboardShell>
  );
}
