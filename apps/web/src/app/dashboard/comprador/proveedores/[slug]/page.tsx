'use client';

import { useParams } from 'next/navigation';
import SupplierDetail from '@/components/suppliers/supplier-detail';

/**
 * Ficha del proveedor dentro de la plataforma.
 *
 * Es la misma ficha que la publica, pero servida bajo /dashboard: conserva el
 * header, la navegacion y la sesion del comprador. Antes los links del panel
 * mandaban a /productos/[slug], que es la pagina del sitio publico, y sacaban
 * al usuario de la app.
 */
export default function BuyerSupplierDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = typeof params.slug === 'string' ? params.slug : '';

  return <SupplierDetail slug={slug} variant="app" />;
}
