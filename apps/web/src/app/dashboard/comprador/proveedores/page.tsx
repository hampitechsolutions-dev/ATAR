'use client';

import { useMemo, useState } from 'react';
import DashboardSidebar from '@/components/dashboard/dashboard-sidebar';
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
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[0.2fr_0.8fr] lg:px-10">
        <DashboardSidebar role="buyer" session={session} />

        <section className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Sourcing industrial</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Proveedores
            </h1>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Busca proveedores del directorio y guardalos en favoritos para seguimiento
              comercial.
            </p>
            <div className="mt-6 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
              <input
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-400"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nombre, ciudad, tag o descripcion"
                value={search}
              />
              <select
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-400"
                onChange={(event) => setCategory(event.target.value)}
                value={category}
              >
                <option value="Todas">Todas las categorias</option>
                {supplierCategories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {loading ? (
              <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-8 text-sm text-slate-500 shadow-sm md:col-span-2 xl:col-span-3">
                Cargando modulo de proveedores...
              </div>
            ) : filteredProviders.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white px-6 py-10 text-sm text-slate-500 shadow-sm md:col-span-2 xl:col-span-3">
                No encontramos proveedores con ese criterio.
              </div>
            ) : (
              filteredProviders.map((provider) => {
                const isFavorite = favorites.includes(provider.id);

                return (
                  <article
                    key={provider.id}
                    className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                          {provider.category}
                        </p>
                        <h2 className="mt-2 text-xl font-semibold text-slate-950">
                          {provider.name}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">{provider.city}</p>
                      </div>
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
                        {provider.rating}
                      </span>
                    </div>

                    <p className="mt-4 text-sm leading-7 text-slate-600">
                      {provider.description}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {provider.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="mt-5 flex gap-3">
                      <button
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                          isFavorite
                            ? 'bg-violet-100 text-violet-800'
                            : 'border border-violet-200 text-violet-700 hover:bg-violet-50'
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
        </section>
      </div>
    </main>
  );
}
