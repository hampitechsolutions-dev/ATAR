'use client';

import { useEffect, useMemo, useState } from 'react';
import SupplierDashboardShell from '@/components/dashboard/supplier-dashboard-shell';
import { useSupplierDashboardData } from '@/lib/dashboard-hooks';
import {
  loadSupplierSettings,
  saveSupplierSettings,
  type SupplierSettings,
} from '@/lib/dashboard-local';
import { getPrimaryCompanyName, getPrimaryCompanyType } from '@/lib/session';

const currencyOptions = ['ARS', 'USD', 'BRL', 'EUR'];

export default function SupplierSettingsPage() {
  const { session, myQuotes, loading } = useSupplierDashboardData();
  const [settings, setSettings] = useState<SupplierSettings>({
    notificationsEnabled: true,
    autoRefreshEnabled: true,
    preferredCurrency: 'ARS',
  });
  const [message, setMessage] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    setSettings(loadSupplierSettings());
  }, []);

  // Datos reales de la empresa para el perfil mobile.
  const profile = useMemo(() => {
    const awarded = myQuotes.filter((quote) => quote.status === 'AWARDED');
    const clients = new Set(
      myQuotes.map((quote) => quote.request?.buyerCompany?.name).filter(Boolean) as string[],
    );
    const acceptance = myQuotes.length === 0 ? 0 : Math.round((awarded.length / myQuotes.length) * 100);
    const tier =
      acceptance >= 75 || awarded.length >= 10
        ? 'Platinum'
        : acceptance >= 50 || awarded.length >= 5
          ? 'Oro'
          : acceptance >= 25
            ? 'Plata'
            : 'Inicial';

    return { awardedCount: awarded.length, clientsCount: clients.size, quotesCount: myQuotes.length, tier };
  }, [myQuotes]);

  const companyName = session ? getPrimaryCompanyName(session.user) : 'Mi empresa';
  const companyType = session ? getPrimaryCompanyType(session.user) : null;
  const companyTypeLabel =
    companyType === 'HYBRID' ? 'Empresa híbrida' : companyType === 'SUPPLIER' ? 'Proveedor industrial' : 'Empresa';
  const primaryCompany =
    session?.user.memberships.find((membership) => membership.isPrimary)?.company ??
    session?.user.memberships[0]?.company ??
    null;
  const location = [primaryCompany?.city, primaryCompany?.country].filter(Boolean).join(', ');
  const companyInitials =
    companyName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase() || 'AT';

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
    <SupplierDashboardShell session={session}>
      {/* ==================== VISTA MOBILE ==================== */}
      <div className="lg:hidden pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Mi empresa</h1>

        {message ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        ) : null}

        {/* Tarjeta de empresa */}
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-lg font-bold text-white">
              {companyInitials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-lg font-bold tracking-tight text-slate-950">
                {loading && !session ? 'Cargando...' : companyName}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
                  <svg aria-hidden="true" className="h-3 w-3" fill="none" viewBox="0 0 24 24">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                  Verificado
                </span>
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-600">
                  Nivel {profile.tier}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sobre la empresa */}
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-slate-950">Sobre la empresa</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {companyTypeLabel}
            {location ? ` con base en ${location}` : ''}. Empresa activa en la red ATAR con{' '}
            {profile.quotesCount} cotizaciones enviadas.
          </p>
          {session?.user.email ? (
            <p className="mt-2 text-xs text-slate-400">{session.user.email}</p>
          ) : null}
        </div>

        {/* Stats reales */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { value: profile.clientsCount, label: 'Clientes activos' },
            { value: profile.quotesCount, label: 'Cotizaciones' },
            { value: profile.awardedCount, label: 'Adjudicadas' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-sm">
              <p className="text-xl font-bold tracking-tight text-slate-950">{stat.value}</p>
              <p className="mt-0.5 text-[11px] leading-4 text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Editar perfil */}
        <button
          type="button"
          onClick={() => setShowEdit((open) => !open)}
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
            <path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4 12.5-12.5z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
          {showEdit ? 'Cerrar edición' : 'Editar perfil'}
        </button>

        {/* Preferencias editables (datos reales locales) */}
        {showEdit ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-bold text-slate-950">Preferencias</p>
            <div className="mt-3 space-y-3">
              <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <span className="text-sm font-medium text-slate-700">Alertas comerciales</span>
                <input
                  checked={settings.notificationsEnabled}
                  className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-400"
                  onChange={(event) => updateSettings({ notificationsEnabled: event.target.checked })}
                  type="checkbox"
                />
              </label>
              <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <span className="text-sm font-medium text-slate-700">Refresco automático</span>
                <input
                  checked={settings.autoRefreshEnabled}
                  className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-400"
                  onChange={(event) => updateSettings({ autoRefreshEnabled: event.target.checked })}
                  type="checkbox"
                />
              </label>
              <label className="block rounded-xl border border-slate-200 bg-slate-50 p-3">
                <span className="text-sm font-medium text-slate-700">Moneda preferida</span>
                <select
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
                  onChange={(event) => updateSettings({ preferredCurrency: event.target.value })}
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
            <button
              type="button"
              onClick={handleSave}
              className="mt-4 flex h-11 w-full items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Guardar cambios
            </button>
          </div>
        ) : null}
      </div>

      {/* ==================== VISTA DESKTOP ==================== */}
      <section className="hidden space-y-6 lg:block">
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

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_0.85fr]">
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
    </SupplierDashboardShell>
  );
}
