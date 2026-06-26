'use client';

import { useMemo, useState } from 'react';
import { useBuyerDashboardData } from '@/lib/dashboard-hooks';
import { loadBuyerFavorites, toggleBuyerFavorite } from '@/lib/dashboard-local';
import {
  providerDirectory,
  supplierCategories,
  type ProviderDirectoryItem,
} from '@/lib/provider-directory';

export default function BuyerProvidersPage() {
  const { session, loading } = useBuyerDashboardData();
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
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Sourcing industrial</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Proveedores</h1>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          Buscá proveedores del directorio y guardalos en favoritos para seguimiento comercial.
        </p>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <svg aria-hidden="true" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24">
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              <path d="M11 19a8 8 0 100-16 8 8 0 000 16z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
            <input
              className="w-full bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre, ciudad, tag o descripción"
              value={search}
            />
          </div>
          <select
            className="h-[46px] rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-indigo-500"
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
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-6 text-sm text-slate-500 shadow-sm sm:col-span-2 xl:col-span-3">
            Cargando módulo de proveedores...
          </div>
        ) : filteredProviders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-10 text-sm text-slate-500 shadow-sm sm:col-span-2 xl:col-span-3">
            No encontramos proveedores con ese criterio.
          </div>
        ) : (
          filteredProviders.map((provider) => {
            const isFavorite = favorites.includes(provider.id);

            return (
              <article key={provider.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{provider.category}</p>
                    <h2 className="mt-2 truncate text-lg font-semibold text-slate-950">{provider.name}</h2>
                    <p className="mt-1 text-xs text-slate-500">{provider.city}</p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                    ★ {provider.rating}
                  </span>
                </div>

                <p className="mt-3 text-sm leading-7 text-slate-600">{provider.description}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {provider.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-4">
                  <button
                    className={`inline-flex h-10 w-full items-center justify-center rounded-xl px-4 text-sm font-semibold transition ${
                      isFavorite ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50' : 'border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                    }`}
                    onClick={() => handleToggleFavorite(provider)}
                    type="button"
                  >
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
