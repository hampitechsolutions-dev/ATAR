'use client';

import Link from 'next/link';
import CompanyLogo from '@/components/dashboard/company-logo';
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
    <div className="space-y-5">
      <header>
        <h1 className="text-[26px] font-bold leading-tight tracking-[-0.03em] text-slate-950 lg:text-[30px]">Favoritos</h1>
        <p className="mt-1 text-[13px] text-slate-500 lg:text-sm">Los proveedores que guardaste para tener a mano.</p>
      </header>

      {/* Una sola superficie con filas, igual que el directorio de proveedores. */}
      <section className="overflow-hidden rounded-[16px] border border-slate-300 bg-white">
        {favoriteProviders.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-slate-500">
            Todavía no guardaste proveedores. Podés agregarlos con el corazón desde{' '}
            <Link className="font-semibold hover:underline" href="/dashboard/comprador/proveedores">
              <span className="text-[#1f5bff]">Proveedores</span>
            </Link>
            .
          </p>
        ) : (
          <ul className="divide-y divide-slate-200">
            {favoriteProviders.map((provider) => (
              <li key={provider.id} className="even:bg-[#eef1f7] last:rounded-b-[inherit] flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:gap-6">
                <div className="flex min-w-0 flex-1 gap-4">
                  <CompanyLogo
                    className="h-14 w-14"
                    logoUrl={provider.logoUrl}
                    name={provider.name}
                    rounded="rounded-[12px]"
                    textClassName="text-[15px]"
                    tone="bg-[#eef3ff] text-[#1f5bff]"
                  />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-[16px] font-bold tracking-[-0.02em] text-slate-950 sm:text-[17px]">
                      <Link className="hover:underline" href={`/dashboard/comprador/proveedores/${provider.slug}`}>
                        {provider.name}
                      </Link>
                    </h2>
                    <p className="mt-0.5 text-[12px] text-slate-500">{[provider.city, provider.category].filter(Boolean).join(' · ')}</p>
                    {provider.description ? <p className="mt-1.5 line-clamp-2 max-w-[760px] text-[13px] leading-5 text-slate-600">{provider.description}</p> : null}
                    {(provider.mainProducts ?? []).length > 0 ? (
                      <p className="mt-1.5 truncate text-[12px] font-medium text-slate-700">{(provider.mainProducts ?? []).slice(0, 4).join(' · ')}</p>
                    ) : null}
                  </div>
                </div>
                <div className="grid shrink-0 grid-cols-2 gap-2.5 lg:flex">
                  <button
                    className="flex h-10 items-center justify-center rounded-[10px] border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    onClick={() => setFavorites(toggleBuyerFavorite(provider.id))}
                    type="button"
                  >
                    Quitar
                  </button>
                  <Link
                    className="flex h-10 items-center justify-center rounded-[10px] bg-[#1f5bff] px-4 text-sm font-semibold transition hover:bg-[#194ee6]"
                    href={`/dashboard/comprador/proveedores/${provider.slug}`}
                  >
                    <span className="text-white">Ver ficha</span>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
