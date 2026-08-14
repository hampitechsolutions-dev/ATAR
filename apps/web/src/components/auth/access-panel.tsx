'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import {
  ApiError,
  atarApi,
  type RegisterPayload,
  type SupplierDirectoryCompany,
} from '@/lib/atar-api';
import { getDefaultDashboardPath, loadSession } from '@/lib/session';

/**
 * Los tres perfiles de ATAR.
 * - Cliente: compra. Publica solicitudes y recibe cotizaciones.
 * - Empresa: vende. Es la cuenta de la proveedora y administra su equipo.
 * - Vendedor: trabaja dentro de una o varias empresas proveedoras.
 */
const PROFILE_OPTIONS = [
  {
    value: 'BUYER',
    label: 'Cliente',
    tagline: 'Compro insumos',
    summary: 'Publicás lo que necesitás y recibís cotizaciones de varios proveedores.',
    can: [
      'Crear solicitudes de cotización',
      'Comparar propuestas y elegir proveedor',
      'Chatear con cada proveedor',
      'Seguir tus pedidos hasta la entrega',
    ],
  },
  {
    value: 'SUPPLIER',
    label: 'Empresa',
    tagline: 'Vendo y administro mi equipo',
    summary: 'Es la cuenta de tu empresa proveedora. Sos el administrador.',
    can: [
      'Ver todas las solicitudes que recibe la empresa',
      'Asignar y reasignar solicitudes a tus vendedores',
      'Ver métricas y el desempeño del equipo',
      'Acceder al historial comercial de todos los clientes',
    ],
  },
  {
    value: 'SELLER',
    label: 'Vendedor',
    tagline: 'Trabajo para una empresa',
    summary: 'Te sumás al equipo de una empresa que ya está en ATAR.',
    can: [
      'Ver solo las solicitudes que te asignan',
      'Responder, cotizar y negociar con el comprador',
      'Representar a varias empresas con una sola cuenta',
      'Seguir tus propias métricas y clientes',
    ],
    cannot: ['No ves las oportunidades de otros vendedores ni las métricas globales'],
  },
] as const;

type ProfileValue = (typeof PROFILE_OPTIONS)[number]['value'];

type Mode = 'login' | 'register';

function ProfileIcon({ value }: { value: ProfileValue }) {
  const common = {
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 2,
  };

  if (value === 'BUYER') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path d="M6 6h15l-1.5 9h-12z" {...common} />
        <path d="M6 6L5 3H3" {...common} />
        <circle cx="9" cy="20" fill="currentColor" r="1.4" />
        <circle cx="18" cy="20" fill="currentColor" r="1.4" />
      </svg>
    );
  }

  if (value === 'SUPPLIER') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path d="M3 21h18M5 21V8l7-4 7 4v13" {...common} />
        <path d="M9 21v-5h6v5" {...common} />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle cx="9" cy="8" r="3.5" {...common} />
      <path d="M3 20c0-3.2 2.7-5.5 6-5.5s6 2.3 6 5.5" {...common} />
      <path d="M16 5.5a3.5 3.5 0 010 6.5M18 20c0-2.4-.9-4.2-2.4-5.3" {...common} />
    </svg>
  );
}

export default function AccessPanel() {
  const router = useRouter();
  const { isHydrated, isAuthenticated, signIn, getDefaultPath } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
    email: '',
    password: '',
    role: 'BUYER' as ProfileValue,
    hybrid: false,
    companyId: '',
  });
  const [companySearch, setCompanySearch] = useState('');
  const [companies, setCompanies] = useState<SupplierDirectoryCompany[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  const isSeller = form.role === 'SELLER';

  const companyType = useMemo<RegisterPayload['companyType']>(() => {
    if (form.hybrid) {
      return 'HYBRID';
    }
    return form.role === 'SUPPLIER' ? 'SUPPLIER' : 'BUYER';
  }, [form.hybrid, form.role]);

  const selectedProfile = PROFILE_OPTIONS.find((option) => option.value === form.role) ?? PROFILE_OPTIONS[0];

  // Empresas disponibles para el vendedor. Se busca con debounce simple.
  useEffect(() => {
    if (mode !== 'register' || !isSeller) {
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      try {
        setLoadingCompanies(true);
        const result = await atarApi.getSupplierDirectory(companySearch);
        if (!cancelled) {
          setCompanies(result);
        }
      } catch {
        if (!cancelled) {
          setCompanies([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingCompanies(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [companySearch, isSeller, mode]);

  useEffect(() => {
    // Solo redirigimos si hay una sesión realmente guardada. Si un dashboard
    // limpió la sesión (p. ej. por un token viejo) el estado en memoria puede
    // quedar desincronizado; sin este chequeo se produciría un loop /acceso ⇄ dashboard.
    if (isHydrated && isAuthenticated && !isTransitioning && loadSession()) {
      router.replace(getDefaultPath());
    }
  }, [getDefaultPath, isAuthenticated, isHydrated, isTransitioning, router]);

  useEffect(() => {
    if (!isTransitioning) {
      return;
    }

    setTransitionProgress(0);

    let currentProgress = 0;
    const intervalId = window.setInterval(() => {
      currentProgress += Math.floor(Math.random() * 10) + 6;
      if (currentProgress >= 100) {
        currentProgress = 100;
        window.clearInterval(intervalId);
      }

      setTransitionProgress(currentProgress);
    }, 70);

    return () => window.clearInterval(intervalId);
  }, [isTransitioning]);

  function updateField<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function useDemoCredentials(role: RegisterPayload['role']) {
    setMode('login');
    setError(null);
    setMessage(
      role === 'SUPPLIER'
        ? 'Ingresa con una cuenta proveedora real registrada en la plataforma.'
        : 'Ingresa con una cuenta compradora real registrada en la plataforma.',
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const email = form.email.trim().toLowerCase();
      const password = form.password.trim();

      if (mode === 'register' && isSeller && !form.companyId) {
        throw new Error('Elegí la empresa para la que vas a vender.');
      }

      const response =
        mode === 'login'
          ? await atarApi.login({ email, password })
          : await atarApi.register({
              email,
              password,
              firstName: form.firstName,
              lastName: form.lastName,
              role: form.role,
              ...(isSeller
                ? { companyId: form.companyId }
                : { companyName: form.companyName, companyType }),
            });
      const destination = getDefaultDashboardPath(response.user);

      setIsTransitioning(true);
      signIn(response);
      setMessage('Sesion iniciada correctamente. Preparando tu dashboard...');
      await new Promise((resolve) => window.setTimeout(resolve, 1400));
      router.replace(destination);
    } catch (submissionError) {
      setIsTransitioning(false);
      setTransitionProgress(0);
      const fallback = mode === 'login' ? 'No se pudo iniciar sesion.' : 'No se pudo crear la cuenta.';
      if (submissionError instanceof ApiError && submissionError.status === 401) {
        setError('Credenciales invalidas. Revisá email y contraseña.');
      } else {
        setError(submissionError instanceof Error ? submissionError.message : fallback);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {/* El alta usa mas ancho para que el formulario completo entre sin scroll. */}
      <div
        className={`mx-auto w-full ${mode === 'register' ? 'max-w-[760px]' : 'max-w-[420px]'}`}
      >
        <div className="flex flex-col items-center text-center">
          <h1 className="text-xl font-semibold tracking-tight text-slate-950">
            {mode === 'login' ? 'Bienvenido nuevamente' : 'Creá tu cuenta'}
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            {mode === 'login'
              ? 'Ingresá a tu cuenta para continuar.'
              : 'Completá tus datos para continuar.'}
          </p>
        </div>

        {/* El perfil solo se elige al crear la cuenta: al ingresar ya viene dado
            por las membresias del usuario. */}
        <div className={`mt-4 ${mode === 'register' ? '' : 'hidden'}`}>
          <p className="text-xs font-semibold text-slate-700">¿Qué perfil necesitás?</p>

          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {PROFILE_OPTIONS.map((option) => {
              const isActive = form.role === option.value;

              return (
                <button
                  className={`rounded-2xl border px-3 py-2.5 text-left transition ${
                    isActive
                      ? 'border-indigo-500 bg-indigo-50 shadow-[0_12px_30px_rgba(79,70,229,0.10)]'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                  key={option.value}
                  onClick={() => updateField('role', option.value)}
                  type="button"
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                      isActive ? 'bg-indigo-600/10 text-indigo-600' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <ProfileIcon value={option.value} />
                  </span>
                  <span
                    className={`mt-2 block text-sm font-semibold ${
                      isActive ? 'text-indigo-700' : 'text-slate-950'
                    }`}
                  >
                    {option.label}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-4 text-slate-500">
                    {option.tagline}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Diferencias entre perfiles */}
          <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
            <p className="text-[12px] font-semibold text-slate-950">
              {selectedProfile.label}: {selectedProfile.summary}
            </p>
            <ul className="mt-2 grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
              {selectedProfile.can.map((item) => (
                <li className="flex items-start gap-2 text-[11px] leading-4 text-slate-600" key={item}>
                  <svg aria-hidden="true" className="mt-0.5 h-3 w-3 shrink-0 text-indigo-600" fill="none" viewBox="0 0 24 24">
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                  </svg>
                  {item}
                </li>
              ))}
              {'cannot' in selectedProfile
                ? selectedProfile.cannot.map((item) => (
                    <li className="flex items-start gap-2 text-[11px] leading-4 text-slate-400" key={item}>
                      <svg aria-hidden="true" className="mt-0.5 h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
                      </svg>
                      {item}
                    </li>
                  ))
                : null}
            </ul>
          </div>
        </div>

        <form className="mt-3 space-y-3" onSubmit={handleSubmit}>
          {mode === 'register' ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-2 text-xs font-semibold text-slate-700">
                <span>Nombre</span>
                <input
                  className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-indigo-500"
                  onChange={(event) => updateField('firstName', event.target.value)}
                  placeholder="Juan"
                  required
                  value={form.firstName}
                />
              </label>
              <label className="space-y-2 text-xs font-semibold text-slate-700">
                <span>Apellido</span>
                <input
                  className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-indigo-500"
                  onChange={(event) => updateField('lastName', event.target.value)}
                  placeholder="Pérez"
                  required
                  value={form.lastName}
                />
              </label>
              {isSeller ? (
                <div className="space-y-2 sm:col-span-2">
                  <p className="text-xs font-semibold text-slate-700">
                    ¿Para qué empresa vas a vender?
                  </p>
                  <input
                    className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-indigo-500"
                    onChange={(event) => setCompanySearch(event.target.value)}
                    placeholder="Buscá tu empresa por nombre"
                    value={companySearch}
                  />

                  <div className="max-h-44 space-y-1.5 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5">
                    {loadingCompanies ? (
                      <p className="px-3 py-4 text-center text-[11px] text-slate-500">Buscando...</p>
                    ) : companies.length === 0 ? (
                      <p className="px-3 py-4 text-center text-[11px] leading-4 text-slate-500">
                        No encontramos empresas con ese nombre. Tu empresa tiene que estar registrada
                        en ATAR antes de que te sumes al equipo.
                      </p>
                    ) : (
                      companies.map((company) => {
                        const isSelected = form.companyId === company.id;

                        return (
                          <button
                            className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition ${
                              isSelected ? 'bg-indigo-50' : 'hover:bg-slate-50'
                            }`}
                            key={company.id}
                            onClick={() => updateField('companyId', company.id)}
                            type="button"
                          >
                            <span
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${
                                isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {company.name.slice(0, 2).toUpperCase()}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-xs font-semibold text-slate-950">
                                {company.name}
                              </span>
                              <span className="block truncate text-[10px] text-slate-500">
                                {[company.city, company.country].filter(Boolean).join(', ')}
                              </span>
                            </span>
                            {isSelected ? (
                              <svg aria-hidden="true" className="h-4 w-4 shrink-0 text-indigo-600" fill="none" viewBox="0 0 24 24">
                                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                              </svg>
                            ) : null}
                          </button>
                        );
                      })
                    )}
                  </div>

                  <p className="rounded-xl bg-amber-50 px-3 py-2 text-[11px] leading-4 text-amber-800">
                    El administrador de la empresa tiene que aprobarte antes de que puedas recibir
                    solicitudes asignadas.
                  </p>
                </div>
              ) : (
                <label className="space-y-2 text-xs font-semibold text-slate-700 sm:col-span-2">
                  <span>{form.role === 'SUPPLIER' ? 'Nombre de tu empresa' : 'Empresa'}</span>
                  <input
                    className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-indigo-500"
                    onChange={(event) => updateField('companyName', event.target.value)}
                    placeholder="Mi empresa industrial"
                    required
                    value={form.companyName}
                  />
                </label>
              )}

              {/* El vendedor no crea empresa, asi que no elige tipo. */}
              <button
                aria-pressed={form.hybrid}
                className={`flex items-start gap-3 rounded-2xl border px-3 py-2.5 text-left transition sm:col-span-2 ${
                  isSeller ? 'hidden' : ''
                } ${
                  form.hybrid ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
                onClick={() => updateField('hybrid', !form.hybrid)}
                type="button"
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                    form.hybrid ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white text-transparent'
                  }`}
                >
                  <svg aria-hidden="true" className="h-3 w-3" fill="none" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                  </svg>
                </span>
                <span>
                  <span className="block text-sm font-semibold text-slate-950">Mi empresa compra y vende</span>
                  <span className="mt-0.5 block text-[11px] font-medium leading-4 text-slate-500">
                    Comprás materia prima e insumos, y también vendés productos. Vas a poder alternar entre comprar y vender.
                  </span>
                </span>
              </button>
            </div>
          ) : null}

          <div className={mode === 'register' ? 'grid gap-3 sm:grid-cols-2' : 'space-y-3'}>
          <label className="space-y-2 text-xs font-semibold text-slate-700">
            <span>Email</span>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M4 4h16v16H4z"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                  <path
                    d="M22 6l-10 7L2 6"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <input
                className="h-10 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-950 outline-none transition focus:border-indigo-500"
                onChange={(event) => updateField('email', event.target.value)}
                placeholder="ejemplo@empresa.com"
                required
                type="email"
                value={form.email}
              />
            </div>
          </label>

          <label className="space-y-2 text-xs font-semibold text-slate-700">
            <span>Contraseña</span>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M7 11V7a5 5 0 0110 0v4"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                  <path
                    d="M6 11h12v10H6z"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <input
                className="h-10 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-10 text-sm text-slate-950 outline-none transition focus:border-indigo-500"
                minLength={8}
                onChange={(event) => updateField('password', event.target.value)}
                placeholder={mode === 'login' ? '••••••••' : 'Mínimo 8 caracteres'}
                required
                type={showPassword ? 'text' : 'password'}
                value={form.password}
              />
              <button
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute inset-y-0 right-2 flex items-center rounded-xl px-2 text-slate-400 transition hover:text-slate-600"
                onClick={() => setShowPassword((current) => !current)}
                type="button"
              >
                <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                  <path
                    d="M12 15a3 3 0 100-6 3 3 0 000 6z"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
              </button>
            </div>
          </label>
          </div>

          {mode === 'login' ? (
            <div className="flex justify-end">
              <a className="text-xs font-semibold text-indigo-600 hover:text-indigo-500" href="#">
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          ) : null}

          {error ? (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </p>
          ) : null}

          {/* En el alta las dos acciones van en una fila para ganar alto. */}
          <div className={mode === 'register' ? 'grid gap-3 sm:grid-cols-2' : 'space-y-3'}>
          <button
            className="flex h-10 w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting
              ? 'Procesando...'
              : mode === 'login'
                ? 'Ingresar'
                : `Crear cuenta de ${selectedProfile.label.toLowerCase()}`}
            <span aria-hidden="true">→</span>
          </button>

          {mode === 'login' ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                className="flex h-9 w-full items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                onClick={() => useDemoCredentials('BUYER')}
                type="button"
              >
                Ayuda comprador
              </button>
              <button
                className="flex h-9 w-full items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                onClick={() => useDemoCredentials('SUPPLIER')}
                type="button"
              >
                Ayuda proveedor
              </button>
            </div>
          ) : null}

          <div className={`relative py-1.5 ${mode === 'register' ? 'hidden' : ''}`}>
            <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-slate-200" />
            <div className="relative mx-auto flex h-4 w-4 items-center justify-center rounded-full border border-slate-200 bg-white">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
            </div>
          </div>

          <button
            className="flex h-10 w-full items-center justify-center gap-3 rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            onClick={() => setMode((current) => (current === 'login' ? 'register' : 'login'))}
            type="button"
          >
            {mode === 'login' ? 'Crear cuenta' : 'Ya tengo cuenta'}
            <span aria-hidden="true">→</span>
          </button>
          </div>
        </form>

        <p className="mt-3 text-center text-[11px] text-slate-500">
          Al continuar, aceptás nuestros{' '}
          <a className="font-semibold text-indigo-600 hover:text-indigo-500" href="#">
            Términos y Condiciones
          </a>
        </p>
      </div>

      {isTransitioning ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-hidden bg-[#0a0e1f]">
          {/* Fondo: gradiente limpio + glow sutil */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_36%,rgba(91,75,255,0.20),transparent_62%),linear-gradient(180deg,#0b1020_0%,#070a16_100%)]" />
          <div className="pointer-events-none absolute left-1/2 top-[36%] h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#5b4bff]/25 blur-[130px]" />

          <div className="relative flex w-full max-w-[400px] flex-col items-center px-8 text-center text-white">
            {/* Logo con anillo giratorio */}
            <div className="relative flex h-24 w-24 items-center justify-center">
              <span className="absolute inset-0 animate-spin rounded-full border-2 border-white/10 border-t-[#8c82ff] [animation-duration:0.9s]" />
              <span className="absolute inset-[7px] rounded-full bg-white/[0.04] backdrop-blur-sm" />
              <Image
                alt="ATAR"
                className="relative drop-shadow-[0_0_18px_rgba(91,75,255,0.75)]"
                height={46}
                priority
                src="/logoatar.png"
                width={46}
              />
            </div>

            <h2 className="mt-8 text-2xl font-semibold tracking-tight">
              Ingresando a <span className="text-[#8c82ff]">ATAR</span>
            </h2>
            <p className="mt-2 text-sm text-slate-400">Preparando tu espacio de trabajo…</p>

            {/* Barra de progreso limpia */}
            <div className="mt-8 h-1 w-full max-w-[220px] overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#5b4bff] to-[#8c82ff] transition-[width] duration-200 ease-out"
                style={{ width: `${transitionProgress}%` }}
              />
            </div>
            <p className="mt-3 text-[11px] font-medium tracking-[0.2em] text-slate-500">{transitionProgress}%</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
