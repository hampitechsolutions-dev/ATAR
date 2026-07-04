'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { useBuyerDashboardData } from '@/lib/dashboard-hooks';
import { loadBuyerFavorites, toggleBuyerFavorite } from '@/lib/dashboard-local';
import {
  providerDirectory,
  supplierCategories,
  type ProviderDirectoryItem,
} from '@/lib/provider-directory';

type IconName = 'search' | 'grid' | 'chevron' | 'pin' | 'eye' | 'arrow' | 'heart';

function Icon({ name, className = 'h-4 w-4', filled = false }: { name: IconName; className?: string; filled?: boolean }) {
  if (name === 'search') {
    return (
      <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
        <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="M11 19a8 8 0 100-16 8 8 0 000 16z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }

  if (name === 'grid') {
    return (
      <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1.6" stroke="currentColor" strokeWidth="2" />
        <rect x="14" y="3" width="7" height="7" rx="1.6" stroke="currentColor" strokeWidth="2" />
        <rect x="3" y="14" width="7" height="7" rx="1.6" stroke="currentColor" strokeWidth="2" />
        <rect x="14" y="14" width="7" height="7" rx="1.6" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }

  if (name === 'chevron') {
    return (
      <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }

  if (name === 'pin') {
    return (
      <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
        <path d="M12 21s-6.5-5.8-6.5-10.5a6.5 6.5 0 1113 0C18.5 15.2 12 21 12 21z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <circle cx="12" cy="10.5" r="2.4" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }

  if (name === 'eye') {
    return (
      <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }

  if (name === 'arrow') {
    return (
      <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
        <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className={className} fill={filled ? 'currentColor' : 'none'} viewBox="0 0 24 24">
      <path d="M12 21s-7-4.35-7-10a4 4 0 017-2.65A4 4 0 0119 11c0 5.65-7 10-7 10z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function getMonogram(name: string) {
  const cleaned = name.replace(/\bS\.?\s*A\.?\b/gi, '').trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  const raw = words.length > 1 ? words.slice(0, 2).map((word) => word[0]).join('') : cleaned.slice(0, 2);
  return raw.toUpperCase();
}

export default function BuyerProvidersPage() {
  const { loading } = useBuyerDashboardData();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('Todas');
  const [favorites, setFavorites] = useState<string[]>(() => loadBuyerFavorites());

  const filteredProviders = useMemo(() => {
    return providerDirectory.filter((provider) => {
      const matchesCategory = category === 'Todas' || provider.category === category;
      const query = search.trim().toLowerCase();
      const matchesSearch =
        query.length === 0 ||
        provider.name.toLowerCase().includes(query) ||
        provider.city.toLowerCase().includes(query) ||
        provider.description.toLowerCase().includes(query) ||
        provider.tags.some((tag) => tag.toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    });
  }, [category, search]);

  function handleToggleFavorite(provider: ProviderDirectoryItem) {
    setFavorites(toggleBuyerFavorite(provider.id));
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)] lg:p-8">
        <div className="pointer-events-none absolute -right-6 top-0 hidden h-full w-[44%] xl:block">
          <Image alt="" className="object-contain object-right" fill sizes="640px" src="/herodashc.png" />
        </div>

        <div className="relative z-10 max-w-[660px]">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-600">Sourcing industrial</p>
          <h1 className="mt-2 text-[34px] font-semibold leading-none tracking-[-0.03em] text-slate-950 sm:text-[40px]">
            Proveedores
          </h1>
          <p className="mt-3 max-w-[520px] text-sm leading-6 text-slate-500">
            Descubrí y conectá con proveedores confiables para tu cadena de suministro.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_260px]">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-[#f6f7fb] px-4 py-3.5 transition focus-within:border-indigo-400 focus-within:bg-white">
              <Icon name="search" className="h-4 w-4 text-slate-400" />
              <input
                className="w-full bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nombre, ciudad, tag o descripción"
                value={search}
              />
            </div>

            <div className="relative flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-[#f6f7fb] px-4 transition focus-within:border-indigo-400 focus-within:bg-white">
              <Icon name="grid" className="h-4 w-4 shrink-0 text-indigo-500" />
              <select
                className="h-[52px] w-full cursor-pointer appearance-none bg-transparent pr-6 text-sm font-medium text-slate-950 outline-none"
                onChange={(event) => setCategory(event.target.value)}
                value={category}
              >
                <option value="Todas">Todas las categorías</option>
                {supplierCategories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <Icon name="chevron" className="pointer-events-none absolute right-4 h-4 w-4 text-slate-400" />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="rounded-[20px] border border-slate-200 bg-white px-5 py-6 text-sm text-slate-500 shadow-sm sm:col-span-2 xl:col-span-3">
            Cargando módulo de proveedores...
          </div>
        ) : filteredProviders.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-slate-300 bg-white px-5 py-12 text-center text-sm text-slate-500 shadow-sm sm:col-span-2 xl:col-span-3">
            No encontramos proveedores con ese criterio.
          </div>
        ) : (
          filteredProviders.map((provider) => {
            const isFavorite = favorites.includes(provider.id);

            return (
              <article
                key={provider.id}
                className="flex flex-col rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_44px_rgba(15,23,42,0.10)]"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-gradient-to-br from-white to-[#f4f5ff] text-base font-extrabold tracking-tight text-indigo-600 shadow-[0_8px_20px_rgba(79,70,229,0.10)]">
                    {getMonogram(provider.name)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 truncate text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-600">
                        {provider.category}
                      </p>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
                        <span className="text-amber-500">★</span>
                        {provider.rating}
                      </span>
                    </div>

                    <h2 className="mt-1 truncate text-xl font-bold tracking-[-0.02em] text-slate-950">{provider.name}</h2>

                    <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-500">
                      <Icon name="pin" className="h-4 w-4 shrink-0 text-slate-400" />
                      <span className="truncate">{provider.city}</span>
                    </p>

                    <p className="mt-2.5 line-clamp-2 min-h-[42px] text-sm leading-6 text-slate-600">
                      {provider.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {provider.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-5 space-y-2.5">
                  <button
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(79,70,229,0.28)] transition hover:bg-indigo-500"
                    type="button"
                  >
                    <Icon name="eye" className="h-4 w-4" />
                    Ver perfil del proveedor
                    <Icon name="arrow" className="h-4 w-4" />
                  </button>

                  <button
                    className={`flex h-11 w-full items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition ${
                      isFavorite
                        ? 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        : 'border-indigo-200 bg-white text-indigo-600 hover:bg-indigo-50'
                    }`}
                    onClick={() => handleToggleFavorite(provider)}
                    type="button"
                  >
                    <Icon name="heart" className="h-4 w-4" filled={isFavorite} />
                    {isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
