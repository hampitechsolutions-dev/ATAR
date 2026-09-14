'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getDefaultDashboardPath, loadSession } from '@/lib/session';

/**
 * Si el usuario ya tiene sesión, la landing no aporta: lo llevamos directo a
 * su dashboard (comprador o proveedor según su rol). Esto responde el pedido de
 * QA de "en mobile ir directo al dashboard" y aplica en todos los tamaños para
 * un usuario logueado. Es un redirect del lado del cliente (la sesión vive en
 * el navegador); la landing sigue siendo pública para quien no inició sesión.
 */
export default function LandingAuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    const session = loadSession();
    if (session?.user) {
      router.replace(getDefaultDashboardPath(session.user));
    }
  }, [router]);

  return null;
}
