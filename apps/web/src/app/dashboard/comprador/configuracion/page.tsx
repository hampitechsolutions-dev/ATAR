'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { atarApi } from '@/lib/atar-api';
import { useBuyerDashboardData } from '@/lib/dashboard-hooks';
import { getPrimaryCompanyName, getUserFullName } from '@/lib/session';

type BuyerSettings = {
  notificationsEnabled: boolean;
  compactView: boolean;
  preferredCategory: string;
};

const SETTINGS_KEY = 'atar:buyer:settings';
const defaultSettings: BuyerSettings = {
  notificationsEnabled: true,
  compactView: false,
  preferredCategory: '',
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

const card = 'rounded-[18px] bg-white p-5 shadow-[0_6px_20px_rgba(15,23,42,0.05)] ring-1 ring-slate-200/70';

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return (
    <button
      aria-checked={checked}
      aria-label={label}
      className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? 'bg-indigo-600' : 'bg-slate-300'}`}
      onClick={() => onChange(!checked)}
      role="switch"
      type="button"
    >
      <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  );
}

function SectionIcon({ path }: { path: string }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
        <path d={path} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      </svg>
    </span>
  );
}

export default function BuyerSettingsPage() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { session, loading } = useBuyerDashboardData();
  const [settings, setSettings] = useState<BuyerSettings>(defaultSettings);
  const [message, setMessage] = useState<string | null>(null);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);

  useEffect(() => {
    setSettings(loadBuyerSettings());
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        const response = await atarApi.getRequestCategories();
        if (cancelled) {
          return;
        }

        const options = response.map((item) => item.label);
        setCategoryOptions(options);
        setSettings((current) => ({
          ...current,
          preferredCategory:
            current.preferredCategory || options[0] || '',
        }));
      } catch {
        if (!cancelled) {
          setCategoryOptions([]);
        }
      }
    }

    void loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  function updateSettings(patch: Partial<BuyerSettings>) {
    setSettings((current) => ({ ...current, ...patch }));
    setMessage(null);
  }

  function handleSave() {
    saveBuyerSettings(settings);
    setMessage('Configuración guardada en este navegador.');
  }

  const companyName = session ? getPrimaryCompanyName(session.user) : '';
  const userName = session ? getUserFullName(session.user) : '';
  const initials =
    companyName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase() || 'AT';

  return (
    <div className="mx-auto max-w-[1100px] pb-4">
      <h1 className="text-[26px] font-bold leading-tight tracking-[-0.03em] text-slate-950 lg:text-[30px]">Configuración</h1>
      <p className="mt-1 text-[13px] text-slate-500 lg:text-sm">Tu cuenta y tus preferencias de uso en ATAR.</p>

      {message ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>
      ) : null}

      <div className="mt-5 grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-5">
        {/* Perfil */}
        <div className="space-y-4">
          <section className="overflow-hidden rounded-[18px] bg-[linear-gradient(135deg,#1f3fd6_0%,#4f46e5_60%,#6d5cf5_100%)] p-5 text-white shadow-[0_14px_36px_rgba(79,70,229,0.28)]">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-lg font-bold">{initials}</span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">Perfil comprador</p>
                <p className="mt-0.5 truncate text-[19px] font-bold leading-6">{loading || !session ? 'Cargando…' : companyName}</p>
              </div>
            </div>
            <dl className="mt-5 space-y-2.5 border-t border-white/15 pt-4 text-[13px]">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-white/70">Usuario</dt>
                <dd className="truncate font-semibold">{userName || '—'}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-white/70">Email</dt>
                <dd className="truncate font-semibold">{session?.user.email ?? '—'}</dd>
              </div>
            </dl>
          </section>

          <section className={`${card} p-2`}>
            {[
              { href: '/dashboard/comprador/notificaciones', label: 'Notificaciones', path: 'M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0' },
              { href: '/dashboard/comprador/favoritos', label: 'Proveedores guardados', path: 'M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1.1L12 21.3l7.8-7.8 1-1.1a5.5 5.5 0 000-7.8z' },
              { href: '/contacto', label: 'Ayuda y contacto', path: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z' },
            ].map((item) => (
              <Link key={item.href} className="flex items-center gap-3 rounded-[12px] px-3 py-3 transition hover:bg-slate-50" href={item.href}>
                <span className="text-indigo-600">
                  <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <path d={item.path} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                  </svg>
                </span>
                <span className="flex-1 text-[14px] font-medium text-slate-800">{item.label}</span>
                <svg aria-hidden="true" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24">
                  <path d="M9 18l6-6-6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </Link>
            ))}
            <button
              className="flex w-full items-center gap-3 rounded-[12px] px-3 py-3 text-left transition hover:bg-rose-50"
              onClick={() => {
                signOut();
                router.push('/acceso');
              }}
              type="button"
            >
              <span className="text-rose-500">
                <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                </svg>
              </span>
              <span className="flex-1 text-[14px] font-medium text-rose-600">Cerrar sesión</span>
            </button>
          </section>
        </div>

        {/* Preferencias */}
        <section className={card}>
          <div className="flex items-center gap-3">
            <SectionIcon path="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />
            <div>
              <h2 className="text-[17px] font-bold text-slate-950">Preferencias</h2>
              <p className="text-[12px] text-slate-500">Se guardan en este navegador.</p>
            </div>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            <div className="flex items-center justify-between gap-4 py-4">
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-slate-950">Recibir notificaciones</p>
                <p className="mt-0.5 text-[13px] leading-5 text-slate-500">Alertas sobre cotizaciones y pedidos.</p>
              </div>
              <Toggle checked={settings.notificationsEnabled} label="Recibir notificaciones" onChange={(value) => updateSettings({ notificationsEnabled: value })} />
            </div>

            <div className="flex items-center justify-between gap-4 py-4">
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-slate-950">Vista compacta</p>
                <p className="mt-0.5 text-[13px] leading-5 text-slate-500">Reduce espacios y densidad visual en el panel.</p>
              </div>
              <Toggle checked={settings.compactView} label="Vista compacta" onChange={(value) => updateSettings({ compactView: value })} />
            </div>

            <label className="block py-4">
              <span className="text-[14px] font-semibold text-slate-950">Categoría preferida</span>
              <span className="mt-0.5 block text-[13px] leading-5 text-slate-500">La categoría que más cotizás.</span>
              <span className="relative mt-3 block">
                <select
                  className="h-11 w-full appearance-none rounded-[12px] border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-900 outline-none transition focus:border-indigo-400"
                  onChange={(event) => updateSettings({ preferredCategory: event.target.value })}
                  value={settings.preferredCategory}
                >
                  <option value="">Sin preferencia</option>
                  {categoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <svg aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" fill="none" viewBox="0 0 24 24">
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </span>
            </label>
          </div>

          <button
            className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-[12px] bg-indigo-600 px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(79,70,229,0.28)] transition hover:bg-indigo-500 lg:w-auto"
            onClick={handleSave}
            type="button"
          >
            Guardar configuración
          </button>
        </section>
      </div>
    </div>
  );
}
