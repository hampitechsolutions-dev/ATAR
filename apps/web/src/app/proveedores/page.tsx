'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { atarApi, type SupplierDirectoryRecord } from '@/lib/atar-api';
import { mapSupplierToProviderDirectoryItem, type ProviderDirectoryItem } from '@/lib/provider-directory';

function getMonogram(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const raw = words.length > 1 ? words.slice(0, 2).map((word) => word[0]).join('') : name.slice(0, 2);
  return raw.toUpperCase();
}

const AVATAR_COLORS = [
  'bg-slate-900',
  'bg-indigo-600',
  'bg-emerald-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-sky-600',
  'bg-violet-600',
  'bg-slate-800',
];

function avatarColor(name: string) {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

/* Iconos ------------------------------------------------------------------ */

function BuildingIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M3 21h18M6 21V5a2 2 0 012-2h5a2 2 0 012 2v16M15 21V9h3a2 2 0 012 2v10" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M9 7h2M9 11h2M9 15h2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function UsersIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M16 3.13A4 4 0 0116 11" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function ClockIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M12 22a10 10 0 110-20 10 10 0 010 20zM12 6v6l4 2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function ActivityIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M6 20V10M12 20V4M18 20v-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function SearchIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M21 21l-4.3-4.3M11 19a8 8 0 100-16 8 8 0 000 16z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function PinIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M12 21s7-5.4 7-11a7 7 0 10-14 0c0 5.6 7 11 7 11z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M12 12a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function SlidersIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function ArrowIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function ChevronLeftIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function ChevronRightIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function RefreshIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M21 12a9 9 0 11-3-6.7L21 8M21 3v5h-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

/* Stats ------------------------------------------------------------------- */

function StatCell({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-5 lg:px-6">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
        {icon}
      </span>
      <div>
        <p className="text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
        <p className="mt-0.5 text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

/* Paginación -------------------------------------------------------------- */

function getPageNumbers(current: number, total: number): (number | 'gap')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages: (number | 'gap')[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) {
    pages.push('gap');
  }
  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }
  if (end < total - 1) {
    pages.push('gap');
  }
  pages.push(total);

  return pages;
}

/* Página ------------------------------------------------------------------ */

const PAGE_SIZE_OPTIONS = [12, 24, 48];

export default function ProveedoresPage() {
  const [suppliers, setSuppliers] = useState<SupplierDirectoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [location, setLocation] = useState('all');
  const [pageSize, setPageSize] = useState(12);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;

    async function loadSuppliers() {
      try {
        setLoading(true);
        setError(null);
        const response = await atarApi.getMarketplaceSuppliers();
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
  }, []);

  const providerItems = useMemo(() => suppliers.map(mapSupplierToProviderDirectoryItem), [suppliers]);

  // Opciones de filtro derivadas de los datos reales.
  const categoryOptions = useMemo(
    () => Array.from(new Set(providerItems.map((item) => item.category))).sort(),
    [providerItems],
  );
  const locationOptions = useMemo(
    () => Array.from(new Set(providerItems.map((item) => item.city).filter(Boolean))).sort(),
    [providerItems],
  );

  const filteredSuppliers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return providerItems.filter((supplier) => {
      if (category !== 'all' && supplier.category !== category) {
        return false;
      }
      if (location !== 'all' && supplier.city !== location) {
        return false;
      }
      if (!query) {
        return true;
      }

      return [supplier.name, supplier.city, supplier.category, supplier.description, supplier.tags.join(' ')]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [providerItems, search, category, location]);

  // Reinicia la paginación cuando cambian filtros o el tamaño de página.
  useEffect(() => {
    setPage(1);
  }, [search, category, location, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredSuppliers.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const rangeStart = filteredSuppliers.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, filteredSuppliers.length);
  const visibleSuppliers = filteredSuppliers.slice((safePage - 1) * pageSize, safePage * pageSize);

  // Métricas de la barra superior, calculadas sobre la base cargada.
  const totalSuppliers = suppliers.length;
  const industrialCount = suppliers.filter((item) => item.companyType === 'SUPPLIER').length;
  const verifiedPct =
    totalSuppliers === 0
      ? 0
      : Math.round(
          (suppliers.filter((item) => item.tags.length > 0 || item.leadTimeDays !== null).length /
            totalSuppliers) *
            100,
        );
  const withCodeCount = suppliers.filter((item) => Boolean(item.genericCode)).length;

  return (
    <main className="min-h-screen bg-white text-slate-950">
      {/* HERO */}
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(59,91,255,0.12),_transparent_45%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
        <div className="mx-auto w-full max-w-7xl px-6 py-12 lg:px-10 lg:py-16">
          <div className="grid gap-10 lg:grid-cols-[0.48fr_0.52fr] lg:items-center">
            <div className="space-y-7">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">
                Para compradores industriales
              </p>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Proveedores reales de la red <span className="text-indigo-600">ATAR</span>
              </h1>
              <p className="max-w-xl text-lg leading-8 text-slate-600">
                Este directorio se construye directamente desde la base activa de empresas proveedoras registradas.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
                  href="/acceso"
                >
                  <SearchIcon className="h-4 w-4" />
                  Solicitar cotización
                  <ArrowIcon />
                </Link>
                <Link
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  href="/como-funciona"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white">
                    <svg aria-hidden="true" className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                  Ver cómo funciona
                </Link>
              </div>
            </div>

            <div className="relative h-[320px] w-full sm:h-[380px] lg:h-[420px]">
              <Image
                alt="Proveedores ATAR"
                className="object-contain object-right"
                fill
                priority
                sizes="(min-width: 1024px) 52vw, 100vw"
                src="/proveedores.png"
              />
            </div>
          </div>

          {/* STATS */}
          <div className="mt-12 grid grid-cols-1 divide-y divide-slate-200 rounded-[1.5rem] border border-slate-200 bg-white shadow-sm sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
            <StatCell icon={<BuildingIcon />} value={totalSuppliers} label="Proveedores activos" />
            <StatCell icon={<UsersIcon />} value={industrialCount} label="Proveedores industriales" />
            <StatCell icon={<ClockIcon />} value={`${verifiedPct}%`} label="Empresas verificadas" />
            <StatCell icon={<ActivityIcon />} value={withCodeCount} label="Con código genérico" />
          </div>
        </div>
      </section>

      {/* DIRECTORIO */}
      <section className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto w-full max-w-7xl px-6 py-14 lg:px-10">
          {/* Buscador + filtros */}
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:bg-white"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por nombre, rubro, producto o ubicación"
                  value={search}
                />
              </div>

              <select
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-400"
                onChange={(event) => setCategory(event.target.value)}
                value={category}
              >
                <option value="all">Todas las categorías</option>
                {categoryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              <select
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-400"
                onChange={(event) => setLocation(event.target.value)}
                value={location}
              >
                <option value="all">Todas las ubicaciones</option>
                {locationOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              <button
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                onClick={() => {
                  setSearch('');
                  setCategory('all');
                  setLocation('all');
                }}
                type="button"
              >
                <SlidersIcon />
                Más filtros
              </button>
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {/* Grid de tarjetas */}
          {loading ? (
            <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white px-5 py-14 text-center text-sm text-slate-500 shadow-sm">
              Cargando proveedores...
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="mt-6 rounded-[1.5rem] border border-dashed border-slate-300 bg-white px-5 py-14 text-center text-sm text-slate-500 shadow-sm">
              No hay proveedores que coincidan con la búsqueda.
            </div>
          ) : (
            <>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {visibleSuppliers.map((supplier) => (
                  <ProviderCard key={supplier.id} supplier={supplier} />
                ))}
              </div>

              {/* Cargar más */}
              {safePage < totalPages ? (
                <div className="mt-8 flex justify-center">
                  <button
                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
                    type="button"
                  >
                    <RefreshIcon />
                    Cargar más proveedores
                  </button>
                </div>
              ) : null}

              {/* Paginación */}
              <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 text-sm text-slate-500 lg:flex-row">
                <p>
                  Mostrando {rangeStart}-{rangeEnd} de {filteredSuppliers.length} proveedores
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    aria-label="Página anterior"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={safePage === 1}
                    onClick={() => setPage((current) => Math.max(current - 1, 1))}
                    type="button"
                  >
                    <ChevronLeftIcon />
                  </button>

                  {getPageNumbers(safePage, totalPages).map((item, index) =>
                    item === 'gap' ? (
                      <span key={`gap-${index}`} className="px-1.5 text-slate-400">
                        …
                      </span>
                    ) : (
                      <button
                        key={item}
                        className={`flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm font-medium transition ${
                          item === safePage
                            ? 'border-indigo-600 bg-indigo-600 text-white'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                        onClick={() => setPage(item)}
                        type="button"
                      >
                        {item}
                      </button>
                    ),
                  )}

                  <button
                    aria-label="Página siguiente"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={safePage === totalPages}
                    onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
                    type="button"
                  >
                    <ChevronRightIcon />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span>Mostrar</span>
                  <select
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 outline-none transition focus:border-indigo-400"
                    onChange={(event) => setPageSize(Number(event.target.value))}
                    value={pageSize}
                  >
                    {PAGE_SIZE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option} por página
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

/* Tarjeta de proveedor ---------------------------------------------------- */

function ProviderCard({ supplier }: { supplier: ProviderDirectoryItem }) {
  const visibleTags = supplier.tags.slice(0, 3);
  const extraTags = supplier.tags.length - visibleTags.length;
  const isHybrid = supplier.companyType === 'HYBRID';

  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${avatarColor(
            supplier.name,
          )}`}
        >
          {getMonogram(supplier.name)}
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${
            isHybrid ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {supplier.category}
        </span>
      </div>

      <h3 className="mt-4 text-base font-semibold tracking-tight text-slate-950">{supplier.name}</h3>
      <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
        <PinIcon />
        {supplier.city}
      </p>

      {supplier.description ? (
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{supplier.description}</p>
      ) : null}

      {supplier.tags.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {visibleTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600"
            >
              {tag}
            </span>
          ))}
          {extraTags > 0 ? (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
              +{extraTags}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="mt-auto flex items-end justify-between border-t border-slate-100 pt-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">Lead time</p>
          <p className="mt-0.5 text-sm font-semibold text-slate-950">
            {typeof supplier.leadTimeDays === 'number' ? `${supplier.leadTimeDays} días` : 'No informado'}
          </p>
        </div>
        <Link
          className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 transition hover:text-indigo-500"
          href={`/productos/${supplier.slug}`}
        >
          Ver ficha
          <ArrowIcon />
        </Link>
      </div>
    </article>
  );
}
