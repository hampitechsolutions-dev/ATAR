'use client';

import { useParams } from 'next/navigation';
import SupplierDetail from '@/components/suppliers/supplier-detail';

/** Ficha publica del proveedor (sitio abierto, sin sesion obligatoria). */
export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = typeof params.slug === 'string' ? params.slug : '';

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-4 py-8 text-slate-950 lg:px-8">
      <div className="mx-auto w-full max-w-[1400px]">
        <SupplierDetail slug={slug} variant="public" />
      </div>
    </main>
  );
}
