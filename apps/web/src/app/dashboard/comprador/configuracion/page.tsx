'use client';

import { useEffect, useState } from 'react';
import { useBuyerDashboardData } from '@/lib/dashboard-hooks';
import { getPrimaryCompanyName } from '@/lib/session';

type BuyerSettings = {
  notificationsEnabled: boolean;
  compactView: boolean;
  preferredCategory: string;
};

const SETTINGS_KEY = 'atar:buyer:settings';
const defaultSettings: BuyerSettings = {
  notificationsEnabled: true,
  compactView: false,
  preferredCategory: 'Big Bags',
};

function loadBuyerSettings() {
  if (typeof window === 'undefined') {
    return defaultSettings;
  }

  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

function saveBuyerSettings(settings: BuyerSettings) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export default function BuyerSettingsPage() {
  const { session, loading } = useBuyerDashboardData();
  const [settings, setSettings] = useState<BuyerSettings>(defaultSettings);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setSettings(loadBuyerSettings());
  }, []);

  function updateSettings(patch: Partial<BuyerSettings>) {
    setSettings((current) => ({ ...current, ...patch }));
    setMessage(null);
  }

  function handleSave() {
    saveBuyerSettings(settings);
    setMessage('Configuración guardada en este navegador.');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Configuración</h1>
        <p className="mt-1 text-sm text-slate-500">Ajustá tus preferencias de uso para ATAR</p>
      </div>

      {message ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Preferencias</h2>
          <div className="mt-5 space-y-4">
            <label className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="text-sm font-semibold text-slate-950">Recibir notificaciones</p>
                <p className="mt-1 text-sm text-slate-600">Mantiene alertas visibles sobre cotizaciones y pedidos.</p>
              </div>
              <input checked={settings.notificationsEnabled} onChange={(event) => updateSettings({ notificationsEnabled: event.target.checked })} type="checkbox" />
            </label>

            <label className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="text-sm font-semibold text-slate-950">Vista compacta</p>
                <p className="mt-1 text-sm text-slate-600">Reduce espacios y densidad visual en el dashboard.</p>
              </div>
              <input checked={settings.compactView} onChange={(event) => updateSettings({ compactView: event.target.checked })} type="checkbox" />
            </label>

            <label className="block rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <span className="text-sm font-semibold text-slate-950">Categoría preferida</span>
              <select
                className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                onChange={(event) => updateSettings({ preferredCategory: event.target.value })}
                value={settings.preferredCategory}
              >
                {['Big Bags', 'Polipropileno', 'Laminados', 'Rafia', 'Film Stretch'].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button
            className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(79,70,229,0.25)] hover:bg-indigo-500"
            onClick={handleSave}
            type="button"
          >
            Guardar configuración
          </button>
        </section>

        <section className="rounded-2xl bg-[#0b1220] p-6 text-white shadow-[0_22px_60px_rgba(2,6,23,0.22)]">
          <p className="text-sm text-slate-400">Perfil comprador</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {loading || !session ? 'Cargando perfil...' : getPrimaryCompanyName(session.user)}
          </h2>
          <p className="mt-2 text-sm text-slate-300">{session?.user.email ?? 'Sin email disponible'}</p>

          <div className="mt-6 space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Notificaciones</p>
              <p className="mt-2 text-sm font-semibold text-white">
                {settings.notificationsEnabled ? 'Activadas' : 'Pausadas'}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Categoría</p>
              <p className="mt-2 text-sm font-semibold text-white">{settings.preferredCategory}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
