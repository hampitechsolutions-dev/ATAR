'use client';

import { useEffect, useState } from 'react';
import DashboardSidebar from '@/components/dashboard/dashboard-sidebar';
import { useSupplierDashboardData } from '@/lib/dashboard-hooks';
import {
  loadSupplierSettings,
  saveSupplierSettings,
  type SupplierSettings,
} from '@/lib/dashboard-local';
import { getPrimaryCompanyName } from '@/lib/session';

const currencyOptions = ['ARS', 'USD', 'BRL', 'EUR'];

export default function SupplierSettingsPage() {
  const { session, loading } = useSupplierDashboardData();
  const [settings, setSettings] = useState<SupplierSettings>({
    notificationsEnabled: true,
    autoRefreshEnabled: true,
    preferredCurrency: 'ARS',
  });
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setSettings(loadSupplierSettings());
  }, []);

  function updateSettings(patch: Partial<SupplierSettings>) {
    setSettings((current) => ({
      ...current,
      ...patch,
    }));
    setMessage(null);
  }

  function handleSave() {
    saveSupplierSettings(settings);
    setMessage('Configuracion guardada en este navegador.');
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[0.22fr_0.78fr] lg:px-10">
        <DashboardSidebar role="supplier" session={session} />

        <section className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Preferencias del proveedor</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Configuracion
            </h1>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Ajusta como operas en ATAR mientras se prepara el modulo completo de perfil
              y automatizaciones.
            </p>
          </div>

          {message ? (
            <div className="rounded-[1.5rem] bg-emerald-100 px-5 py-4 text-sm text-emerald-800">
              {message}
            </div>
          ) : null}

          <div className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-950">Preferencias operativas</h2>
              <p className="mt-1 text-sm text-slate-500">
                Estas opciones se guardan localmente para este equipo.
              </p>

              <div className="mt-6 space-y-4">
                <label className="flex items-start justify-between gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      Recibir alertas comerciales
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Mantiene visibles recordatorios sobre nuevas oportunidades y pedidos.
                    </p>
                  </div>
                  <input
                    checked={settings.notificationsEnabled}
                    className="mt-1 h-5 w-5 rounded border-slate-300 text-slate-950 focus:ring-slate-400"
                    onChange={(event) =>
                      updateSettings({ notificationsEnabled: event.target.checked })
                    }
                    type="checkbox"
                  />
                </label>

                <label className="flex items-start justify-between gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      Refresco automatico del dashboard
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Reserva la preferencia para proximas integraciones en vivo.
                    </p>
                  </div>
                  <input
                    checked={settings.autoRefreshEnabled}
                    className="mt-1 h-5 w-5 rounded border-slate-300 text-slate-950 focus:ring-slate-400"
                    onChange={(event) =>
                      updateSettings({ autoRefreshEnabled: event.target.checked })
                    }
                    type="checkbox"
                  />
                </label>

                <label className="block rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <span className="text-sm font-semibold text-slate-950">Moneda preferida</span>
                  <p className="mt-1 text-sm text-slate-600">
                    Se usa como referencia para futuras cotizaciones y reportes.
                  </p>
                  <select
                    className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-400"
                    onChange={(event) =>
                      updateSettings({ preferredCurrency: event.target.value })
                    }
                    value={settings.preferredCurrency}
                  >
                    {currencyOptions.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  onClick={handleSave}
                  type="button"
                >
                  Guardar configuracion
                </button>
                <button
                  className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  onClick={() => {
                    const nextSettings = loadSupplierSettings();
                    setSettings(nextSettings);
                    setMessage('Configuracion recargada desde el navegador.');
                  }}
                  type="button"
                >
                  Recuperar guardado
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[2rem] bg-[#07111f] p-6 text-white shadow-2xl shadow-slate-300/30">
                <p className="text-sm text-slate-400">Perfil activo</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  {loading || !session ? 'Cargando perfil...' : getPrimaryCompanyName(session.user)}
                </h2>
                <p className="mt-2 text-sm text-slate-300">
                  {session?.user.email ?? 'Sin email disponible'}
                </p>
                <div className="mt-6 grid gap-3">
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Notificaciones
                    </p>
                    <p className="mt-2 text-sm font-semibold text-white">
                      {settings.notificationsEnabled ? 'Activadas' : 'Pausadas'}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Moneda base
                    </p>
                    <p className="mt-2 text-sm font-semibold text-white">
                      {settings.preferredCurrency}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-950">Siguiente etapa sugerida</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Este modulo ya permite gestionar preferencias basicas. El siguiente paso
                  natural es conectar estas opciones con reglas reales de notificacion, perfil
                  comercial y automatizacion de cotizaciones.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
