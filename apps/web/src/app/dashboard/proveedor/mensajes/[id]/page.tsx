'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

// Unificado: ya no hay una pantalla de "Chat y seguimiento" aparte. El detalle
// de una conversacion vive en la seccion Mensajes con esa conversacion abierta.
export default function SupplierConversationRedirectPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = typeof params.id === 'string' ? params.id : '';

  useEffect(() => {
    router.replace(id ? `/dashboard/proveedor/mensajes?c=${id}` : '/dashboard/proveedor/mensajes');
  }, [id, router]);

  return (
    <main className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
      Abriendo la conversación...
    </main>
  );
}
