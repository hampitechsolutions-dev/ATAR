'use client';

import Image from 'next/image';
import Link from 'next/link';
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
  'h-11 cursor-pointer appearance-none rounded-[10px] border border-slate-300 bg-white bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20viewBox%3D%270%200%2024%2024%27%20fill%3D%27none%27%20stroke%3D%27%2364748b%27%20stroke-width%3D%272%27%3E%3Cpath%20d%3D%27M6%209l6%206%206-6%27/%3E%3C/svg%3E")] bg-[length:16px] bg-[right_12px_center] bg-no-repeat pl-4 pr-10 text-[13px] font-medium text-slate-800 outline-none transition focus:border-[#1f5bff]';

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
      <header>
        <h1 className="text-[26px] font-bold leading-tight tracking-[-0.03em] text-slate-950 lg:text-[30px]">Proveedores</h1>
        <p className="mt-1 text-[13px] text-slate-500 lg:text-sm">Empresas de la industria de la rafia registradas en ATAR.</p>
      </header>

      {/* ==================== FILTROS ==================== */}
      <section className="grid grid-cols-2 items-center gap-2.5 sm:flex sm:flex-wrap sm:gap-3">
        <label className="relative col-span-2 sm:min-w-[240px] sm:flex-1 lg:max-w-[440px]">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <SearchIcon />
          </span>
          <input
            className="h-11 w-full rounded-[10px] border border-slate-300 bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#1f5bff] focus:ring-4 focus:ring-[#1f5bff]/10"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre, ciudad o descripción..."
            type="search"
            value={search}
          />
        </label>

        <select aria-label="Tipo de empresa" className={`${selectClass} w-full sm:w-auto sm:min-w-[170px]`} onChange={(event) => setCompanyType(event.target.value)} value={companyType}>
          <option value="ALL">Todos los tipos</option>
          {companyTypeOptions.map((option) => (
            <option key={option} value={option}>
              {getSupplierCategoryLabel(option)}
            </option>
          ))}
        </select>

        <select aria-label="Categoría" className={`${selectClass} w-full sm:w-auto sm:min-w-[170px]`} onChange={(event) => setCategory(event.target.value)} value={category}>
          <option value="ALL">Todas las categorías</option>
          {categoryOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <label className="inline-flex h-11 cursor-pointer items-center gap-2.5 rounded-[10px] border border-slate-300 bg-white px-3.5 text-[13px] font-medium text-slate-800">
          <input
            checked={verifiedOnly}
            className="h-4 w-4 accent-[#1f5bff]"
            onChange={(event) => setVerifiedOnly(event.target.checked)}
            type="checkbox"
          />
          Solo verificados
        </label>

        <div className="flex items-center justify-end gap-3 sm:ml-auto">
          <p className="hidden text-[13px] text-slate-600 lg:block">
            {isLoading ? '…' : filteredSuppliers.length}{' '}
            {filteredSuppliers.length === 1 ? 'proveedor encontrado' : 'proveedores encontrados'}
          </p>
          <select aria-label="Ordenar" className={`${selectClass} w-full sm:w-auto sm:min-w-[170px]`} onChange={(event) => setSort(event.target.value as SortKey)} value={sort}>
            <option value="relevance">Más relevantes</option>
            <option value="name">Nombre (A-Z)</option>
            <option value="leadTime">Menor tiempo de entrega</option>
            <option value="minimumOrder">Menor pedido mínimo</option>
          </select>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-100 px-5 py-4 text-sm text-rose-700">{error}</div>
      ) : null}

      {/* ==================== LISTA ==================== */}
      {/* Una sola superficie con filas, en vez de una tarjeta por proveedor. */}
      <section className="overflow-hidden rounded-[16px] border border-slate-300 bg-white">
        {isLoading ? (
          <div className="px-5 py-8">
            <LoadingState label="Cargando proveedores..." />
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-slate-500">No encontramos proveedores con ese criterio.</p>
        ) : (
          <ul className="divide-y divide-slate-200">
            {filteredSuppliers.map((supplier) => {
              const isFavorite = favorites.includes(supplier.id);
              const products = supplierProducts(supplier).slice(0, 3);
              const location = [supplier.city, supplier.country].filter(Boolean).join(', ');
              const summary = supplier.about ?? supplier.description;
              const firstCategory = supplier.categories?.[0];
              const facts = [
                typeof supplier.leadTimeDays === 'number' ? `Entrega en ${supplier.leadTimeDays} días` : null,
                typeof supplier.minimumOrder === 'number' ? `Mínimo ${supplier.minimumOrder.toLocaleString('es-AR')}` : null,
              ].filter(Boolean);

              return (
                <li key={supplier.id} className="even:bg-[#eef1f7] last:rounded-b-[inherit] flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:gap-6">
                  <div className="flex min-w-0 flex-1 gap-4">
                    <Link className="relative h-[76px] w-[76px] shrink-0 overflow-hidden rounded-[12px] bg-slate-100 sm:h-[92px] sm:w-[124px]" href={`/dashboard/comprador/proveedores/${supplier.slug}`}>
                      <Image alt="" className="object-cover" fill sizes="124px" src={supplierCover(supplier)} />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2 lg:justify-start">
                        <h2 className="flex min-w-0 items-center gap-1.5 text-[16px] font-bold tracking-[-0.02em] text-slate-950 sm:text-[17px]">
                          <Link className="truncate hover:underline" href={`/dashboard/comprador/proveedores/${supplier.slug}`}>
                            {supplier.name}
                          </Link>
                          {supplier.isVerified ? <VerifiedMark /> : null}
                        </h2>
                        <button
                          aria-label={isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                          aria-pressed={isFavorite}
                          className={`-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition hover:bg-slate-100 ${
                            isFavorite ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'
                          }`}
                          onClick={() => setFavorites(toggleBuyerFavorite(supplier.id))}
                          title={isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                          type="button"
                        >
                          <HeartIcon filled={isFavorite} />
                        </button>
                      </div>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-slate-500">
                        {location ? (
                          <span className="inline-flex items-center gap-1">
                            <PinIcon />
                            {location}
                          </span>
                        ) : null}
                        {facts.map((fact) => (
                          <span key={fact}>{fact}</span>
                        ))}
                      </p>
                      {summary ? <p className="mt-1.5 line-clamp-2 max-w-[760px] text-[13px] leading-5 text-slate-600">{summary}</p> : null}
                      {products.length > 0 ? <p className="mt-1.5 truncate text-[12px] font-medium text-slate-700">{products.join(' · ')}</p> : null}
                    </div>
                  </div>

                  <div className="grid shrink-0 grid-cols-[0.8fr_1.2fr] gap-2.5 lg:flex">
                    <Link
                      className="flex h-10 items-center justify-center rounded-[10px] border border-[#1f5bff]/50 px-4 text-sm font-semibold transition hover:bg-[#f3f6ff]"
                      href={`/dashboard/comprador/proveedores/${supplier.slug}`}
                    >
                      <span className="text-[#1f5bff]">Ver ficha</span>
                    </Link>
                    <Link
                      className="flex h-10 items-center justify-center rounded-[10px] bg-[#1f5bff] px-4 text-sm font-semibold transition hover:bg-[#194ee6]"
                      href={`/dashboard/comprador/solicitudes/nueva${firstCategory ? `?category=${encodeURIComponent(firstCategory)}` : ''}`}
                    >
                      <span className="whitespace-nowrap text-white">Solicitar cotización</span>
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
