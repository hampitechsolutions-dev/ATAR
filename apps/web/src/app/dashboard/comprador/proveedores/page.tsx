'use client';

import { useMemo, useState } from 'react';
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardHero,
  DashboardShell,
  dashboardGhostButtonClassName,
  dashboardInputClassName,
} from '@/components/dashboard/dashboard-ui';
import { useBuyerDashboardData } from '@/lib/dashboard-hooks';
import { loadBuyerFavorites, toggleBuyerFavorite } from '@/lib/dashboard-local';
import {
  providerDirectory,
  supplierCategories,
  type ProviderDirectoryItem,
} from '@/lib/provider-directory';
import { productCatalog } from '@/lib/product-catalog';

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

  const featuredProduct = productCatalog[0];

  return (
    <DashboardShell role="buyer" session={session}>
      <DashboardHero
        description="Busca fabricantes y distribuidores del directorio interno con la misma identidad visual del ecosistema ATAR y arma una shortlist comercial reutilizable."
        eyebrow="Sourcing industrial"
        title={
          <>
            Proveedores y <span className="text-indigo-600">red verificada</span>
          </>
        }
      />

      <DashboardCard>
        <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
          <input
            className={dashboardInputClassName}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre, ciudad, tag o descripcion"
            value={search}
          />
          <select
            className={dashboardInputClassName}
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
      </DashboardCard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="md:col-span-2 xl:col-span-3">
            <DashboardEmptyState
              description="Estamos cargando el directorio."
              title="Cargando modulo de proveedores..."
            />
          </div>
        ) : filteredProviders.length === 0 ? (
          <div className="md:col-span-2 xl:col-span-3">
            <DashboardEmptyState
              description="No encontramos proveedores con ese criterio."
              title="Sin resultados"
            />
          </div>
        ) : (
          filteredProviders.map((provider) => {
            const isFavorite = favorites.includes(provider.id);

            return (
              <DashboardCard key={provider.id}>
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

                <div className="mt-5 flex flex-wrap gap-3">
                  <a
                    className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    href={`/productos/${featuredProduct.slug}`}
                  >
                    Ver producto
                  </a>
                  <button
                    className={
                      isFavorite
                        ? 'inline-flex items-center justify-center rounded-full bg-indigo-100 px-5 py-3 text-sm font-semibold text-indigo-800 transition hover:bg-indigo-200'
                        : dashboardGhostButtonClassName
                    }
                    onClick={() => handleToggleFavorite(provider)}
                    type="button"
                  >
                    {isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                  </button>
                </div>
              </DashboardCard>
            );
          })
        )}
      </div>
    </DashboardShell>
  );
}
