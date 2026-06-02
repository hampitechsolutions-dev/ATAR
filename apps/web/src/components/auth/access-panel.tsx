'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { atarApi, type RegisterPayload } from '@/lib/atar-api';

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
    if (isHydrated && isAuthenticated) {
      router.replace(getDefaultPath());
    }
  }, [getDefaultPath, isAuthenticated, isHydrated, router]);

  function updateField<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const response =
        mode === 'login'
          ? await atarApi.login({ email: form.email, password: form.password })
          : await atarApi.register({
              email: form.email,
              password: form.password,
              firstName: form.firstName,
              lastName: form.lastName,
              companyName: form.companyName,
              role: form.role,
              companyType,
            });

      signIn(response);
      setMessage('Sesion iniciada correctamente. Redirigiendo...');
      router.push(getDefaultPath());
      router.refresh();
    } catch (submissionError) {
      const fallback = mode === 'login' ? 'No se pudo iniciar sesion.' : 'No se pudo crear la cuenta.';
      setError(submissionError instanceof Error ? submissionError.message : fallback);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 text-white shadow-2xl shadow-slate-950/40">
      <div className="flex items-center justify-between gap-3 rounded-[1.5rem] border border-white/10 bg-white/5 p-2">
        <button
          className={`flex-1 rounded-[1.1rem] px-4 py-3 text-sm font-semibold transition ${
            mode === 'login' ? 'bg-white text-slate-950' : 'text-slate-300'
          }`}
          onClick={() => setMode('login')}
          type="button"
        >
          Iniciar sesion
        </button>
        <button
          className={`flex-1 rounded-[1.1rem] px-4 py-3 text-sm font-semibold transition ${
            mode === 'register' ? 'bg-white text-slate-950' : 'text-slate-300'
          }`}
          onClick={() => setMode('register')}
          type="button"
        >
          Crear cuenta
        </button>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        {mode === 'register' ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="text-slate-300">Nombre</span>
              <input
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-sky-400"
                onChange={(event) => updateField('firstName', event.target.value)}
                placeholder="Juan"
                required
                value={form.firstName}
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="text-slate-300">Apellido</span>
              <input
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-sky-400"
                onChange={(event) => updateField('lastName', event.target.value)}
                placeholder="Perez"
                required
                value={form.lastName}
              />
            </label>
            <label className="space-y-2 text-sm sm:col-span-2">
              <span className="text-slate-300">Empresa</span>
              <input
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-sky-400"
                onChange={(event) => updateField('companyName', event.target.value)}
                placeholder="Mi empresa industrial"
                required
                value={form.companyName}
              />
            </label>
            <label className="space-y-2 text-sm sm:col-span-2">
              <span className="text-slate-300">Perfil principal</span>
              <select
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-sky-400"
                onChange={(event) => updateField('role', event.target.value as RegisterPayload['role'])}
                value={form.role}
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}

        <label className="space-y-2 text-sm">
          <span className="text-slate-300">Email</span>
          <input
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-sky-400"
            onChange={(event) => updateField('email', event.target.value)}
            placeholder="correo@empresa.com"
            required
            type="email"
            value={form.email}
          />
        </label>

        <label className="space-y-2 text-sm">
          <span className="text-slate-300">Contrasena</span>
          <input
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-sky-400"
            minLength={8}
            onChange={(event) => updateField('password', event.target.value)}
            placeholder="Minimo 8 caracteres"
            required
            type="password"
            value={form.password}
          />
        </label>

        {error ? <p className="rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}
        {message ? <p className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{message}</p> : null}

        <button
          className="w-full rounded-full bg-gradient-to-r from-sky-500 to-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting
            ? 'Procesando...'
            : mode === 'login'
              ? 'Ingresar a mi cuenta'
              : 'Crear cuenta y continuar'}
        </button>
      </form>
    </div>
  );
}
