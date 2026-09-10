'use client';

import Link from 'next/link';
import CompanyLogo from '@/components/dashboard/company-logo';
import { useEffect, useMemo, useState } from 'react';
import {
  atarApi,
  SUPPLIER_ROLE_LABELS,
  type SupplierRole,
  type SupplierDirectoryRecord,
} from '@/lib/atar-api';
import { loadBuyerFavorites, toggleBuyerFavorite } from '@/lib/dashboard-local';
import { LoadingState } from '@/components/ui/spinner';
import { useBuyerDashboardData } from '@/lib/dashboard-hooks';
import { mapSupplierToProviderDirectoryItem } from '@/lib/provider-directory';

export default function BuyerProvidersPage() {
  const { session, loading: dashboardLoading } = useBuyerDashboardData();
  const [search, setSearch] = useState('');
  const [companyType, setCompanyType] = useState<string>('ALL');
  const [category, setCategory] = useState<string>('ALL');
  const [role, setRole] = useState<string>('ALL');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => loadBuyerFavorites());
  const [suppliers, setSuppliers] = useState<SupplierDirectoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.accessToken) {
      return;
    }

    const accessToken = session.accessToken;
    let cancelled = false;

    async function loadSuppliers() {
      try {
        setLoading(true);
        setError(null);
        const response = await atarApi.getSuppliers(accessToken);
        if (!cancelled) {
          setSuppliers(response);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : 'No se pudieron cargar los proveedores.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadSuppliers();

    return () => {
      cancelled = true;
    };
  }, [session?.accessToken]);

  const companyTypeOptions = useMemo(() => {
    return ['ALL', ...new Set(suppliers.map((item) => item.companyType))];
  }, [suppliers]);

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    for (const supplier of suppliers) {
      for (const cat of supplier.categories ?? []) {
        if (cat.trim()) set.add(cat.trim());
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'es'));
  }, [suppliers]);

  const roleOptions = useMemo(() => {
    const set = new Set<SupplierRole>();
    for (const supplier of suppliers) {
      if (supplier.supplierRole) set.add(supplier.supplierRole);
    }
    return [...set];
  }, [suppliers]);

  // Se filtra sobre el registro completo del proveedor (tiene categorias,
  // certificaciones, rol comercial, verificacion y lead time) y recien despues
  // se mapea para la tarjeta. Antes solo se podia filtrar por nombre/ciudad.
  const filteredProviders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return suppliers
      .filter((supplier) => {
        const matchesType = companyType === 'ALL' || supplier.companyType === companyType;
        const matchesCategory = category === 'ALL' || (supplier.categories ?? []).includes(category);
        const matchesRole = role === 'ALL' || supplier.supplierRole === role;
        const matchesVerified = !verifiedOnly || supplier.isVerified;
        const matchesSearch =
          query.length === 0 ||
          supplier.name.toLowerCase().includes(query) ||
          (supplier.city ?? '').toLowerCase().includes(query) ||
          (supplier.description ?? '').toLowerCase().includes(query) ||
          (supplier.tags ?? []).some((tag) => tag.toLowerCase().includes(query)) ||
          (supplier.categories ?? []).some((cat) => cat.toLowerCase().includes(query)) ||
          (supplier.mainProducts ?? []).some((p) => p.toLowerCase().includes(query)) ||
          (supplier.certifications ?? []).some((c) => c.toLowerCase().includes(query));

        return matchesType && matchesCategory && matchesRole && matchesVerified && matchesSearch;
      })
      .map(mapSupplierToProviderDirectoryItem);
  }, [companyType, category, role, verifiedOnly, suppliers, search]);

  return (
    <div className="space-y-6">
      <section className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="relative z-10 max-w-[660px]">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-600">Sourcing industrial</p>
          <h1 className="mt-2 text-[34px] font-semibold leading-none tracking-[-0.03em] text-slate-950 sm:text-[40px]">
            Proveedores
          </h1>
          <p className="mt-3 max-w-[520px] text-sm leading-6 text-slate-500">
            Directorio real de empresas registradas en ATAR, sin duplicados y tomado desde la base activa.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_260px]">
            <input
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-indigo-400 focus:bg-white"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre, ciudad o descripción"
              value={search}
            />

            <select
              className="h-[52px] w-full cursor-pointer rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-950 outline-none transition focus:border-indigo-400 focus:bg-white"
              onChange={(event) => setCompanyType(event.target.value)}
              value={companyType}
            >
              <option value="ALL">Todos los tipos</option>
              {companyTypeOptions
                .filter((option) => option !== 'ALL')
                .map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
            </select>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            {categoryOptions.length > 0 ? (
              <select
                className="h-10 cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-3 text-[13px] font-medium text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white"
                onChange={(event) => setCategory(event.target.value)}
                value={category}
              >
                <option value="ALL">Todas las categorías</option>
                {categoryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : null}

            {roleOptions.length > 0 ? (
              <select
                className="h-10 cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-3 text-[13px] font-medium text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white"
                onChange={(event) => setRole(event.target.value)}
                value={role}
              >
                <option value="ALL">Cualquier rol</option>
                {roleOptions.map((option) => (
                  <option key={option} value={option}>
                    {SUPPLIER_ROLE_LABELS[option]}
                  </option>
                ))}
              </select>
            ) : null}

            <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-[13px] font-medium text-slate-700 transition hover:border-slate-300">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(event) => setVerifiedOnly(event.target.checked)}
                className="h-4 w-4 accent-[#4f46ff]"
              />
              Solo verificados
            </label>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {dashboardLoading || loading ? (
          <div className="rounded-[20px] border border-slate-200 bg-white px-5 py-6 shadow-sm sm:col-span-2 xl:col-span-3">
            <LoadingState label="Cargando módulo de proveedores..." />
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
                className="flex flex-col rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-start gap-4">
                  <CompanyLogo
                    className="h-16 w-16"
                    logoUrl={provider.logoUrl}
                    name={provider.name}
                    rounded="rounded-full"
                    textClassName="text-base tracking-tight"
                    tone="bg-gradient-to-br from-white to-[#f4f5ff] text-indigo-600 border border-slate-200"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-600">
                      {provider.category}
                    </p>

                    <h2 className="mt-1 truncate text-xl font-bold tracking-[-0.02em] text-slate-950">
                      {provider.name}
                    </h2>

                    <p className="mt-1.5 text-sm text-slate-500">{provider.city}</p>

                    {provider.description ? (
                      <p className="mt-2.5 line-clamp-2 min-h-[42px] text-sm leading-6 text-slate-600">
                        {provider.description}
                      </p>
                    ) : null}
                  </div>
                </div>

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

                <div className="mt-5 grid gap-2.5">
                  <Link
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-semibold text-white transition hover:bg-indigo-500"
                    href={`/dashboard/comprador/proveedores/${provider.slug}`}
                  >
                    Ver ficha
                  </Link>

                  <button
                    className={`flex h-11 w-full items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition ${
                      isFavorite
                        ? 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        : 'border-indigo-200 bg-white text-indigo-600 hover:bg-indigo-50'
                    }`}
                    onClick={() => setFavorites(toggleBuyerFavorite(provider.id))}
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
