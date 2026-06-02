'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import DashboardSidebar from '@/components/dashboard/dashboard-sidebar';
import { useBuyerDashboardData } from '@/lib/dashboard-hooks';
import { loadBuyerFavorites, toggleBuyerFavorite } from '@/lib/dashboard-local';
import { providerDirectory } from '@/lib/provider-directory';

export default function BuyerFavoritesPage() {
  const { session } = useBuyerDashboardData();
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    setFavorites(loadBuyerFavorites());
  }, []);

  const favoriteProviders = useMemo(() => {
    return providerDirectory.filter((provider) => favorites.includes(provider.id));
  }, [favorites]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[0.2fr_0.8fr] lg:px-10">
        <DashboardSidebar role="buyer" session={session} />

        <section className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Base comercial</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Favoritos
            </h1>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Mantiene un shortlist de proveedores priorizados para futuras compras o
              comparaciones.
            </p>
          </div>

          {favoriteProviders.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white px-6 py-10 text-sm text-slate-500 shadow-sm">
              No tienes proveedores favoritos guardados. Puedes agregarlos desde{' '}
              <Link className="font-semibold text-violet-700" href="/dashboard/comprador/proveedores">
                Proveedores
              </Link>
              .
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {favoriteProviders.map((provider) => (
                <article
                  key={provider.id}
                  className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    {provider.category}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-950">
                    {provider.name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">{provider.city}</p>
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
                  <button
                    className="mt-5 rounded-full bg-violet-100 px-4 py-2 text-sm font-semibold text-violet-800"
                    onClick={() => setFavorites(toggleBuyerFavorite(provider.id))}
                    type="button"
                  >
                    Quitar de favoritos
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
