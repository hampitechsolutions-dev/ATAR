'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardHero,
  DashboardShell,
  dashboardGhostButtonClassName,
} from '@/components/dashboard/dashboard-ui';
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
    <DashboardShell role="buyer" session={session}>
      <DashboardHero
        description="Mantiene una shortlist comercial de proveedores priorizados para futuras licitaciones, comparaciones y seguimiento."
        eyebrow="Base comercial"
        title={
          <>
            Favoritos y <span className="text-indigo-600">shortlist</span>
          </>
        }
      />

      {favoriteProviders.length === 0 ? (
        <DashboardEmptyState
          description="No tienes proveedores favoritos guardados. Puedes agregarlos desde Proveedores."
          title="Sin favoritos guardados"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {favoriteProviders.map((provider) => (
            <DashboardCard key={provider.id}>
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
                className={`mt-5 ${dashboardGhostButtonClassName}`}
                onClick={() => setFavorites(toggleBuyerFavorite(provider.id))}
                type="button"
              >
                Quitar de favoritos
              </button>
            </DashboardCard>
          ))}
        </div>
      )}

      {favoriteProviders.length === 0 ? (
        <div className="text-sm text-slate-500">
          <Link className="font-semibold text-indigo-700" href="/dashboard/comprador/proveedores">
            Ir a proveedores
          </Link>
        </div>
      ) : null}
    </DashboardShell>
  );
}
