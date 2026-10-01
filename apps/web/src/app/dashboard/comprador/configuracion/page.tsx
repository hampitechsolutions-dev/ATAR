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

  const links = [
    { href: '/dashboard/comprador/notificaciones', label: 'Notificaciones', path: 'M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0' },
    { href: '/dashboard/comprador/favoritos', label: 'Proveedores guardados', path: 'M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1.1L12 21.3l7.8-7.8 1-1.1a5.5 5.5 0 000-7.8z' },
    { href: '/contacto', label: 'Ayuda y contacto', path: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z' },
  ];
  const sectionTitle = 'text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-500';

  // Una sola columna y una sola superficie: secciones separadas por líneas,
  // sin tarjetas ni recuadros dentro de recuadros.
  return (
    <div className="mx-auto max-w-[720px] pb-4">
      <h1 className="text-[26px] font-bold leading-tight tracking-[-0.03em] text-slate-950 lg:text-[30px]">Configuración</h1>

      <div className="mt-5 flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-lg font-bold text-white">{initials}</span>
        <div className="min-w-0">
          <p className="truncate text-[18px] font-bold leading-6 text-slate-950">{loading || !session ? 'Cargando…' : companyName}</p>
          <p className="truncate text-[13px] text-slate-500">
            {[userName, session?.user.email].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>

      {message ? (
        <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>
      ) : null}

      <div className="mt-6 divide-y divide-slate-100 rounded-[16px] border border-slate-200 bg-white px-5">
        <section className="py-5">
          <h2 className={sectionTitle}>Preferencias</h2>
          <div className="mt-1 divide-y divide-slate-100">
            <div className="flex items-center justify-between gap-4 py-3.5">
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-slate-950">Recibir notificaciones</p>
                <p className="mt-0.5 text-[13px] leading-5 text-slate-500">Alertas sobre cotizaciones y pedidos.</p>
              </div>
              <Toggle checked={settings.notificationsEnabled} label="Recibir notificaciones" onChange={(value) => updateSettings({ notificationsEnabled: value })} />
            </div>
            <div className="flex items-center justify-between gap-4 py-3.5">
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-slate-950">Vista compacta</p>
                <p className="mt-0.5 text-[13px] leading-5 text-slate-500">Reduce espacios y densidad visual en el panel.</p>
              </div>
              <Toggle checked={settings.compactView} label="Vista compacta" onChange={(value) => updateSettings({ compactView: value })} />
            </div>
            <label className="flex flex-col gap-2.5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <span className="min-w-0">
                <span className="block text-[14px] font-semibold text-slate-950">Categoría preferida</span>
                <span className="mt-0.5 block text-[13px] leading-5 text-slate-500">La categoría que más cotizás.</span>
              </span>
              <span className="relative block sm:w-[240px]">
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
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[12px] text-slate-500">Las preferencias se guardan en este navegador.</p>
            <button
              className="inline-flex h-11 items-center justify-center rounded-[12px] bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-500"
              onClick={handleSave}
              type="button"
            >
              Guardar configuración
            </button>
          </div>
        </section>

        <section className="py-5">
          <h2 className={sectionTitle}>Mi cuenta</h2>
          <div className="-mx-2 mt-2">
            {links.map((item) => (
              <Link key={item.href} className="flex items-center gap-3 rounded-[10px] px-2 py-3 transition hover:bg-slate-50" href={item.href}>
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
              className="flex w-full items-center gap-3 rounded-[10px] px-2 py-3 text-left transition hover:bg-rose-50"
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
          </div>
        </section>
      </div>
    </div>
  );
}
