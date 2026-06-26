'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { ApiError, atarApi, type RegisterPayload } from '@/lib/atar-api';
import { getDefaultDashboardPath } from '@/lib/session';

const roleOptions = [
  { value: 'BUYER', label: 'Comprador' },
  { value: 'SUPPLIER', label: 'Proveedor' },
] as const;

type Mode = 'login' | 'register';

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
    role: 'BUYER' as RegisterPayload['role'],
  });

  const companyType = useMemo<RegisterPayload['companyType']>(() => {
    return form.role === 'SUPPLIER' ? 'SUPPLIER' : 'BUYER';
  }, [form.role]);

  useEffect(() => {
    if (isHydrated && isAuthenticated && !isTransitioning) {
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
    setMessage(null);
    setForm((current) => ({
      ...current,
      role,
      email: role === 'SUPPLIER' ? 'proveedor.demo@atar.test' : 'comprador.demo@atar.test',
      password: 'Password123',
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const email = form.email.trim().toLowerCase();
      const password = form.password.trim();
      const response =
        mode === 'login'
          ? await atarApi.login({ email, password })
          : await atarApi.register({
              email,
              password,
              firstName: form.firstName,
              lastName: form.lastName,
              companyName: form.companyName,
              role: form.role,
              companyType,
            });
      const destination = getDefaultDashboardPath(response.user);

      setIsTransitioning(true);
      signIn(response);
      setMessage('Sesion iniciada correctamente. Preparando tu dashboard...');
      await new Promise((resolve) => window.setTimeout(resolve, 1400));
      router.replace(destination);
      router.refresh();
    } catch (submissionError) {
      setIsTransitioning(false);
      setTransitionProgress(0);
      const fallback = mode === 'login' ? 'No se pudo iniciar sesion.' : 'No se pudo crear la cuenta.';
      if (submissionError instanceof ApiError && submissionError.status === 401) {
        setError('Credenciales invalidas. Revisá email/contraseña (sin espacios) o usá los accesos demo.');
      } else {
        setError(submissionError instanceof Error ? submissionError.message : fallback);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="w-full max-w-[420px]">
        <div className="flex flex-col items-center text-center">
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
            {mode === 'login' ? 'Bienvenido nuevamente' : 'Creá tu cuenta'}
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            {mode === 'login'
              ? 'Ingresá a tu cuenta para continuar.'
              : 'Completá tus datos para continuar.'}
          </p>
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold text-slate-700">¿Cómo querés ingresar?</p>
          <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5">
            <div className="grid gap-3 sm:grid-cols-2">
              {roleOptions.map((option) => {
                const isActive = form.role === option.value;
                const subtitle = option.value === 'BUYER' ? 'Busco proveedores' : 'Quiero vender';

                return (
                  <button
                    key={option.value}
                    className={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                      isActive
                        ? 'border-indigo-500 bg-indigo-50 shadow-[0_12px_30px_rgba(79,70,229,0.10)]'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                    onClick={() => updateField('role', option.value)}
                    type="button"
                  >
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                        isActive
                          ? 'bg-indigo-600/10 text-indigo-600'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {option.value === 'BUYER' ? (
                        <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <path
                            d="M3 21V7a2 2 0 012-2h14a2 2 0 012 2v14"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                          />
                          <path
                            d="M9 21V9h6v12"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                          />
                        </svg>
                      ) : (
                        <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <path
                            d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                          />
                          <path
                            d="M3.3 7.3L12 12l8.7-4.7"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                          />
                          <path
                            d="M12 22V12"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                          />
                        </svg>
                      )}
                    </div>

                    <div>
                      <p
                        className={`text-sm font-semibold ${
                          isActive ? 'text-indigo-700' : 'text-slate-950'
                        }`}
                      >
                        {option.label}
                      </p>
                      <p className="mt-0.5 text-[11px] leading-4 text-slate-500">{subtitle}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
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
              <label className="space-y-2 text-xs font-semibold text-slate-700 sm:col-span-2">
                <span>Empresa</span>
                <input
                  className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-indigo-500"
                  onChange={(event) => updateField('companyName', event.target.value)}
                  placeholder="Mi empresa industrial"
                  required
                  value={form.companyName}
                />
              </label>
            </div>
          ) : null}

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

          <button
            className="flex h-10 w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting
              ? 'Procesando...'
              : mode === 'login'
                ? `Ingresar como ${form.role === 'SUPPLIER' ? 'proveedor' : 'comprador'}`
                : 'Crear cuenta'}
            <span aria-hidden="true">→</span>
          </button>

          {mode === 'login' ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                className="flex h-9 w-full items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                onClick={() => useDemoCredentials('BUYER')}
                type="button"
              >
                Usar demo comprador
              </button>
              <button
                className="flex h-9 w-full items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                onClick={() => useDemoCredentials('SUPPLIER')}
                type="button"
              >
                Usar demo proveedor
              </button>
            </div>
          ) : null}

          <div className="relative py-1.5">
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
        </form>

        <p className="mt-3 text-center text-[11px] text-slate-500">
          Al continuar, aceptás nuestros{' '}
          <a className="font-semibold text-indigo-600 hover:text-indigo-500" href="#">
            Términos y Condiciones
          </a>
        </p>
      </div>

      {isTransitioning ? (
        <div className="fixed inset-0 z-[120] overflow-hidden bg-[#040612]">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-90"
            style={{ backgroundImage: "url('/acceso.png')" }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(86,74,255,0.28)_0%,rgba(12,17,41,0.7)_32%,rgba(2,6,23,0.92)_68%,rgba(1,3,10,0.98)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(1,3,10,0.72)_0%,rgba(3,6,20,0.3)_38%,rgba(3,6,20,0.74)_100%)]" />
          <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-[42%] rounded-full bg-[#5b4bff]/20 blur-[100px]" />

          <div className="relative flex h-full items-center justify-center px-6">
            <div className="w-full max-w-[540px] text-center text-white">
              <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-[30px] bg-[#5b4bff]/10 shadow-[0_0_90px_rgba(91,75,255,0.42)] backdrop-blur-sm">
                <div className="animate-pulse">
                  <Image
                    alt="ATAR"
                    className="drop-shadow-[0_0_24px_rgba(91,75,255,0.9)]"
                    height={70}
                    priority
                    src="/logoatar.png"
                    width={70}
                  />
                </div>
              </div>

              <h2 className="mt-8 text-[28px] font-medium tracking-tight text-white md:text-[30px]">
                Ingresando a <span className="font-semibold text-[#5b4bff]">ATAR</span>
              </h2>
              <p className="mx-auto mt-4 max-w-[300px] text-sm leading-6 text-slate-300">
                Preparando tu espacio de trabajo
                <br />
                y cargando tus accesos.
              </p>

              <div className="mx-auto mt-10 w-full max-w-[320px]">
                <div className="relative h-[4px] overflow-visible rounded-full bg-white/8 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
                  <div
                    className="relative h-full rounded-full bg-gradient-to-r from-[#4338ff] via-[#5b4bff] to-[#8c82ff] transition-[width] duration-200"
                    style={{ width: `${transitionProgress}%` }}
                  >
                    <div className="absolute right-0 top-1/2 h-3 w-20 -translate-y-1/2 rounded-full bg-[#7a6dff] blur-md" />
                    <div className="absolute right-0 top-1/2 h-1.5 w-10 -translate-y-1/2 rounded-full bg-white/90 blur-[2px]" />
                  </div>
                  <div
                    className="absolute left-0 top-1/2 h-[14px] -translate-y-1/2 rounded-full bg-[#5b4bff]/25 blur-xl transition-[width] duration-200"
                    style={{ width: `${transitionProgress}%` }}
                  />
                </div>
                <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.45em] text-[#6d7bd1]">
                  Cargando {transitionProgress}%
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
