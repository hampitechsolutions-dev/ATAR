import AccessPanel from '@/components/auth/access-panel';
import { appConfig } from '@/lib/atar-api';

export default function AccesoPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_25%),linear-gradient(180deg,#030712_0%,#020617_100%)] text-white">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[0.95fr_0.75fr] lg:px-10 lg:py-20">
        <section className="flex flex-col justify-center gap-8">
          <div className="inline-flex w-fit rounded-full border border-violet-400/30 bg-violet-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-violet-200">
            Acceso web conectado a API
          </div>
          <div className="space-y-5">
            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-white sm:text-6xl">
              Entra a ATAR y gestiona pedidos o cotizaciones reales.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-300">
              Esta pantalla ya consume la API del proyecto. Puedes registrarte como comprador
              o proveedor y entrar a tu dashboard correspondiente.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
              <p className="font-semibold text-white">Comprador</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Publica solicitudes y revisa cotizaciones desde el dashboard.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
              <p className="font-semibold text-white">Proveedor</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Consulta oportunidades abiertas y envia propuestas en linea.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
              <p className="font-semibold text-white">API destino</p>
              <p className="mt-2 break-all text-sm leading-6 text-slate-400">{appConfig.apiUrl}</p>
            </div>
          </div>
        </section>

        <section className="flex items-center">
          <AccessPanel />
        </section>
      </div>
    </main>
  );
}