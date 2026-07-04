'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { atarApi, type SupplierDirectoryRecord } from '@/lib/atar-api';
import { loadBuyerFavorites, toggleBuyerFavorite } from '@/lib/dashboard-local';
import { useBuyerDashboardData } from '@/lib/dashboard-hooks';
import { mapSupplierToProviderDirectoryItem } from '@/lib/provider-directory';

export default function BuyerFavoritesPage() {
  const { session } = useBuyerDashboardData();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierDirectoryRecord[]>([]);

  useEffect(() => {
    setFavorites(loadBuyerFavorites());
  }, []);

  useEffect(() => {
    if (!session?.accessToken) {
      return;
    }

    const accessToken = session.accessToken;
    let cancelled = false;

    async function loadSuppliers() {
      const response = await atarApi.getSuppliers(accessToken);
      if (!cancelled) {
        setSuppliers(response);
      }
    }

    void loadSuppliers();

    return () => {
      cancelled = true;
    };
  }, [session?.accessToken]);

  const favoriteProviders = useMemo(() => {
    return suppliers
      .map(mapSupplierToProviderDirectoryItem)
      .filter((provider) => favorites.includes(provider.id));
  }, [favorites, suppliers]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Base comercial</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Favoritos</h1>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          Shortlist real de proveedores guardados desde el directorio conectado a la base.
        </p>
      </div>

      {favoriteProviders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-10 text-sm text-slate-500 shadow-sm">
          No tenés proveedores favoritos guardados. Podés agregarlos desde{' '}
          <Link className="font-semibold text-indigo-600 hover:text-indigo-500" href="/dashboard/comprador/proveedores">
            Proveedores
          </Link>
          .
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {favoriteProviders.map((provider) => (
            <article key={provider.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{provider.category}</p>
              <h2 className="mt-2 text-lg font-semibold text-slate-950">{provider.name}</h2>
              <p className="mt-1 text-xs text-slate-500">{provider.city}</p>
              {provider.description ? (
                <p className="mt-3 text-sm leading-7 text-slate-600">{provider.description}</p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                {provider.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-4 grid gap-2">
                <Link
                  className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 px-4 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
                  href={`/productos/${provider.slug}`}
                >
                  Ver ficha
                </Link>
                <button
                  className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  onClick={() => setFavorites(toggleBuyerFavorite(provider.id))}
                  type="button"
                >
                  Quitar de favoritos
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
