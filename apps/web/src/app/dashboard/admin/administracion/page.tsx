'use client';

import Link from 'next/link';
import AdminShell from '@/components/dashboard/admin-shell';

const SECTIONS = [
  {
    href: '/dashboard/admin/facturacion',
    title: 'Facturación',
    description: 'Cerrá períodos, generá y emití liquidaciones, validá pagos y exportá reportes.',
  },
  {
    href: '/dashboard/admin/proveedores',
    title: 'Proveedores',
    description: 'Ranking de proveedoras por comisión generada y detalle de sus transacciones.',
  },
  {
    href: '/dashboard/admin/compradores',
    title: 'Compradores',
    description: 'Ranking de compradoras por volumen y detalle de sus operaciones.',
  },
];

export default function AdminHomePage() {
  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-indigo-300">Administración</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Panel de ATAR</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-white/70">
            Herramientas internas para operar el marketplace. Este panel es exclusivo de los administradores de ATAR.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-white/25 hover:bg-white/10"
            >
              <p className="text-base font-semibold text-white">{section.title}</p>
              <p className="mt-2 text-sm leading-6 text-white/65">{section.description}</p>
            </Link>
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-base font-semibold text-white">Administradores de ATAR</h2>
          <p className="mt-2 text-sm leading-6 text-white/65">
            El rol de administrador da acceso a este panel y no se puede elegir al registrarse: se asigna fuera de banda
            por seguridad. Para dar de alta o promover un administrador, desde el servidor (carpeta{' '}
            <code className="rounded bg-black/30 px-1.5 py-0.5 text-[12px] text-white/80">apps/api</code>):
          </p>
          <pre className="mt-3 overflow-x-auto rounded-xl bg-black/40 px-4 py-3 text-[12px] text-white/80">
            npm run prisma:grant-admin -- email@atar.com &quot;Contraseña&quot; &quot;Nombre&quot; &quot;Apellido&quot;
          </pre>
          <p className="mt-2 text-xs text-white/50">
            Si el usuario ya existe, lo promueve; si no, lo crea. Es idempotente.
          </p>
        </div>
      </div>
    </AdminShell>
  );
}
