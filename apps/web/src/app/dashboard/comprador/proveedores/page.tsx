'use client';

import Image from 'next/image';
import Link from 'next/link';
import CompanyLogo from '@/components/dashboard/company-logo';
import { useEffect, useMemo, useState } from 'react';
import { atarApi, type CompanyType, type SupplierDirectoryRecord } from '@/lib/atar-api';
import { loadBuyerFavorites, toggleBuyerFavorite } from '@/lib/dashboard-local';
import { LoadingState } from '@/components/ui/spinner';
import { useBuyerDashboardData } from '@/lib/dashboard-hooks';
import { getSupplierCategoryLabel } from '@/lib/provider-directory';
import { FALLBACK_REQUEST_CATEGORIES } from '@/lib/request-catalog-fallback';

type SortKey = 'relevance' | 'name' | 'leadTime' | 'minimumOrder';

// Foto de portada de la tarjeta: la de la primera categoría del proveedor que
// tenga imagen en el catálogo de solicitudes.
function supplierCover(supplier: SupplierDirectoryRecord) {
  // "A medida" es genérica: solo se usa si no hay otra categoría con foto.
  const labels = [...(supplier.categories ?? []), ...(supplier.mainProducts ?? [])].sort(
    (left, right) => Number(left === 'A medida') - Number(right === 'A medida'),
  );
  for (const label of labels) {
    const match = FALLBACK_REQUEST_CATEGORIES.find((category) => category.label === label);
    if (match?.imageSrc) {
      return match.imageSrc;
    }
  }
  return '/maquinariaweb.png';
}

function supplierProducts(supplier: SupplierDirectoryRecord) {
  return Array.from(new Set([...(supplier.mainProducts ?? []), ...(supplier.categories ?? [])]));
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path d="M21 21l-4.3-4.3M11 19a8 8 0 100-16 8 8 0 000 16z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg aria-hidden="true" className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24">
      <path d="M12 21s7-5.4 7-11a7 7 0 10-14 0c0 5.6 7 11 7 11z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24">
      <path d="M2 6h12v10H2zM14 9h4l4 4v3h-8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
      <circle cx="6" cy="18" r="2" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="18" cy="18" r="2" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
      <path d="M3.3 7.3L12 12l8.7-4.7M12 22V12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill={filled ? 'currentColor' : 'none'} viewBox="0 0 24 24">
      <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function VerifiedMark() {
  return (
    <svg aria-label="Verificado" className="h-4 w-4 shrink-0" role="img" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="#1f5bff" />
      <path d="M7.5 12.3l3 3 6-6" fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
    </svg>
  );
}

const selectClass =
  'h-11 cursor-pointer appearance-none rounded-[10px] border border-slate-200 bg-white bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20viewBox%3D%270%200%2024%2024%27%20fill%3D%27none%27%20stroke%3D%27%2364748b%27%20stroke-width%3D%272%27%3E%3Cpath%20d%3D%27M6%209l6%206%206-6%27/%3E%3C/svg%3E")] bg-[length:16px] bg-[right_12px_center] bg-no-repeat pl-4 pr-10 text-[13px] font-medium text-slate-800 outline-none transition focus:border-[#1f5bff]';

export default function BuyerProvidersPage() {
  const { session, loading: dashboardLoading } = useBuyerDashboardData();
  const [search, setSearch] = useState('');
  const [companyType, setCompanyType] = useState<string>('ALL');
  const [category, setCategory] = useState<string>('ALL');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>('relevance');
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
          setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar los proveedores.');
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

  const companyTypeOptions = useMemo(
    () => Array.from(new Set(suppliers.map((item) => item.companyType))) as CompanyType[],
    [suppliers],
  );

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    for (const supplier of suppliers) {
      for (const cat of supplier.categories ?? []) {
        if (cat.trim()) set.add(cat.trim());
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'es'));
  }, [suppliers]);

  const filteredSuppliers = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = suppliers.filter((supplier) => {
      const matchesType = companyType === 'ALL' || supplier.companyType === companyType;
      const matchesCategory = category === 'ALL' || (supplier.categories ?? []).includes(category);
      const matchesVerified = !verifiedOnly || supplier.isVerified;
      const matchesSearch =
        query.length === 0 ||
        [
          supplier.name,
          supplier.city ?? '',
          supplier.description ?? '',
          supplier.about ?? '',
          ...(supplier.tags ?? []),
          ...(supplier.categories ?? []),
          ...(supplier.mainProducts ?? []),
          ...(supplier.certifications ?? []),
        ]
          .join(' ')
          .toLowerCase()
          .includes(query);

      return matchesType && matchesCategory && matchesVerified && matchesSearch;
    });

    return [...result].sort((left, right) => {
      if (sort === 'name') {
        return left.name.localeCompare(right.name, 'es');
      }
      if (sort === 'leadTime') {
        return (left.leadTimeDays ?? Number.POSITIVE_INFINITY) - (right.leadTimeDays ?? Number.POSITIVE_INFINITY);
      }
      if (sort === 'minimumOrder') {
        return (left.minimumOrder ?? Number.POSITIVE_INFINITY) - (right.minimumOrder ?? Number.POSITIVE_INFINITY);
      }
      // Relevancia: favoritos, después verificados, después los que cubren más rubros.
      return (
        Number(favorites.includes(right.id)) - Number(favorites.includes(left.id)) ||
        Number(right.isVerified) - Number(left.isVerified) ||
        supplierProducts(right).length - supplierProducts(left).length
      );
    });
  }, [category, companyType, favorites, search, sort, suppliers, verifiedOnly]);

  const isLoading = dashboardLoading || loading;

  return (
    <div className="space-y-5">
      {/* ==================== CABECERA ==================== */}
      <section className="relative isolate overflow-hidden rounded-[18px] bg-[#eef3fc]">
        <div className="absolute inset-y-0 right-0 w-full md:w-[68%]">
          <Image alt="" className="object-cover object-[60%_center]" fill priority sizes="(min-width:768px) 68vw, 100vw" src="/heroatarweb.png" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#eef3fc_0%,#eef3fc_30%,rgba(238,243,252,0.85)_42%,rgba(238,243,252,0.15)_62%,rgba(238,243,252,0)_75%)]" />
        <div className="absolute inset-0 bg-white/70 md:hidden" />
        <div className="relative z-10 px-6 py-8 sm:px-8 lg:py-10">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#1f5bff]">Sourcing industrial</p>
          <h1 className="mt-2 text-[38px] font-bold leading-none tracking-[-0.04em] text-slate-950 sm:text-[48px]">Proveedores</h1>
          <p className="mt-3 max-w-[520px] text-[15px] leading-6 text-slate-600">
            Directorio real de empresas de la industria de la rafia, sin duplicados y tomado desde la base activa de ATAR.
          </p>
        </div>
      </section>

      {/* ==================== FILTROS ==================== */}
      <section className="flex flex-wrap items-center gap-3">
        <label className="relative min-w-[240px] flex-1 lg:max-w-[440px]">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <SearchIcon />
          </span>
          <input
            className="h-11 w-full rounded-[10px] border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#1f5bff] focus:ring-4 focus:ring-[#1f5bff]/10"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre, ciudad o descripción..."
            type="search"
            value={search}
          />
        </label>

        <select aria-label="Tipo de empresa" className={`${selectClass} min-w-[170px]`} onChange={(event) => setCompanyType(event.target.value)} value={companyType}>
          <option value="ALL">Todos los tipos</option>
          {companyTypeOptions.map((option) => (
            <option key={option} value={option}>
              {getSupplierCategoryLabel(option)}
            </option>
          ))}
        </select>

        <select aria-label="Categoría" className={`${selectClass} min-w-[170px]`} onChange={(event) => setCategory(event.target.value)} value={category}>
          <option value="ALL">Todas las categorías</option>
          {categoryOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <label className="inline-flex h-11 cursor-pointer items-center gap-2.5 rounded-[10px] border border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-800 transition hover:border-slate-300">
          <input
            checked={verifiedOnly}
            className="h-4 w-4 accent-[#1f5bff]"
            onChange={(event) => setVerifiedOnly(event.target.checked)}
            type="checkbox"
          />
          Solo verificados
        </label>

        <div className="ml-auto flex items-center gap-3">
          <p className="text-[13px] text-slate-600">
            {isLoading ? '…' : filteredSuppliers.length}{' '}
            {filteredSuppliers.length === 1 ? 'proveedor encontrado' : 'proveedores encontrados'}
          </p>
          <select aria-label="Ordenar" className={`${selectClass} min-w-[170px]`} onChange={(event) => setSort(event.target.value as SortKey)} value={sort}>
            <option value="relevance">Más relevantes</option>
            <option value="name">Nombre (A-Z)</option>
            <option value="leadTime">Menor tiempo de entrega</option>
            <option value="minimumOrder">Menor pedido mínimo</option>
          </select>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">{error}</div>
      ) : null}

      {/* ==================== TARJETAS ==================== */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {isLoading ? (
          <div className="col-span-full rounded-[16px] border border-slate-200 bg-white px-5 py-6 shadow-sm">
            <LoadingState label="Cargando proveedores..." />
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="col-span-full rounded-[16px] border border-dashed border-slate-300 bg-white px-5 py-12 text-center text-sm text-slate-500">
            No encontramos proveedores con ese criterio.
          </div>
        ) : (
          filteredSuppliers.map((supplier) => {
            const isFavorite = favorites.includes(supplier.id);
            const products = supplierProducts(supplier).slice(0, 3);
            const location = [supplier.city, supplier.country].filter(Boolean).join(', ');
            const summary = supplier.about ?? supplier.description;
            const firstCategory = supplier.categories?.[0];

            return (
              <article
                key={supplier.id}
                className="group flex flex-col overflow-hidden rounded-[16px] border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)]"
              >
                <div className="relative aspect-[16/6] overflow-hidden bg-slate-100">
                  <Image
                    alt=""
                    className="object-cover transition duration-500 group-hover:scale-105"
                    fill
                    sizes="(min-width:1536px) 24vw, (min-width:1280px) 32vw, (min-width:640px) 48vw, 95vw"
                    src={supplierCover(supplier)}
                  />
                  <button
                    aria-label={isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                    aria-pressed={isFavorite}
                    className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition hover:bg-white ${
                      isFavorite ? 'text-rose-500' : 'text-slate-500 hover:text-rose-500'
                    }`}
                    onClick={() => setFavorites(toggleBuyerFavorite(supplier.id))}
                    title={isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                    type="button"
                  >
                    <HeartIcon filled={isFavorite} />
                  </button>
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start gap-3">
                    <CompanyLogo
                      className="h-12 w-12"
                      logoUrl={supplier.logoUrl}
                      name={supplier.name}
                      rounded="rounded-[10px]"
                      textClassName="text-[14px]"
                      tone="bg-[#eef3ff] text-[#1f5bff]"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <h2 className="flex min-w-0 items-center gap-1.5 text-[17px] font-bold tracking-[-0.02em] text-slate-950">
                          <span className="truncate">{supplier.name}</span>
                          {supplier.isVerified ? <VerifiedMark /> : null}
                        </h2>
                        {supplier.isVerified ? (
                          <span className="rounded-full bg-[#eef3ff] px-2 py-0.5 text-[11px] font-medium text-[#1f5bff]">Proveedor verificado</span>
                        ) : null}
                      </div>
                      {location ? (
                        <p className="mt-1 flex items-center gap-1 text-[12px] text-slate-500">
                          <PinIcon />
                          {location}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {summary ? <p className="mt-3 line-clamp-2 min-h-[40px] text-[14px] leading-5 text-slate-600">{summary}</p> : null}

                  {products.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {products.map((product) => (
                        <span key={product} className="rounded-full bg-slate-100 px-3 py-1 text-[12px] font-medium text-slate-700">
                          {product}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-slate-500">
                        <TruckIcon />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-slate-900">
                          {typeof supplier.leadTimeDays === 'number' ? `${supplier.leadTimeDays} días` : 'A convenir'}
                        </p>
                        <p className="text-[11px] text-slate-500">Tiempo de entrega</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-slate-500">
                        <BoxIcon />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-slate-900">
                          {typeof supplier.minimumOrder === 'number' ? `Mín. ${supplier.minimumOrder.toLocaleString('es-AR')}` : 'Sin mínimo'}
                        </p>
                        <p className="text-[11px] text-slate-500">Pedido mínimo</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto grid grid-cols-[0.8fr_1.2fr] gap-2.5 pt-4">
                    <Link
                      className="flex h-11 items-center justify-center rounded-[10px] border border-[#1f5bff]/50 text-sm font-semibold transition hover:bg-[#f3f6ff]"
                      href={`/dashboard/comprador/proveedores/${supplier.slug}`}
                    >
                      <span className="text-[#1f5bff]">Ver ficha</span>
                    </Link>
                    <Link
                      className="flex h-11 items-center justify-center rounded-[10px] bg-[#1f5bff] text-sm font-semibold transition hover:bg-[#194ee6]"
                      href={`/dashboard/comprador/solicitudes/nueva${firstCategory ? `?category=${encodeURIComponent(firstCategory)}` : ''}`}
                    >
                      <span className="text-white">Solicitar cotización</span>
                    </Link>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
