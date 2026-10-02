'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import CompanyLogo from '@/components/dashboard/company-logo';
import ArgentinaMap from '@/components/home/argentina-map';
import Reveal from '@/components/ui/reveal';
import { isCategoryHidden, withoutHiddenCategories } from '@/lib/hidden-categories';
import { atarApi, SUPPLIER_ROLE_LABELS, type SupplierDirectoryRecord, type SupplierRole } from '@/lib/atar-api';

/* Categorías -------------------------------------------------------------- */

/**
 * Familias del filtro. Cada una agrupa etiquetas del catálogo de solicitudes,
 * que es lo que cada proveedor declara en `categories` / `mainProducts`.
 */
const FAMILIES: { id: string; label: string; image: string; catalog: string[]; keywords: string[] }[] = [
  { id: 'bigbags', label: 'Big Bags', image: '/bigbags.png', catalog: ['Big Bags'], keywords: ['big bag', 'fibc'] },
  { id: 'sacos', label: 'Sacos y bolsas PP', image: '/bolsaspp.png', catalog: ['Sacos', 'Bolsas PP'], keywords: ['saco', 'bolsa'] },
  {
    id: 'telas',
    label: 'Telas y rafia',
    image: '/telasweb.png',
    catalog: ['Rollos y Telas', 'Telas Tubulares', 'Telas planas'],
    keywords: ['tela', 'rafia', 'tejid'],
  },
  {
    id: 'hilos',
    label: 'Hilos y cuerdas',
    image: '/hilosweb.png',
    catalog: ['Hilo multifilamento de PP', 'Hilo retorcido y Mallas', 'Cuerdas/Cordones'],
    keywords: ['hilo', 'cuerda', 'cordon', 'malla'],
  },
  { id: 'polimeros', label: 'Polímeros', image: '/polimero.png', catalog: ['Polipropileno', 'Polietileno'], keywords: ['polimero', 'polipropileno', 'polietileno', 'pellet'] },
  { id: 'impresion', label: 'Impresión y terminación', image: '/tintas.png', catalog: ['Tintas', 'Cintas/Cintillas'], keywords: ['tinta', 'cinta', 'impres'] },
  { id: 'maquinaria', label: 'Maquinaria', image: '/maquinariaweb.png', catalog: ['Maquinarias'], keywords: ['maquin', 'equipo', 'extrus', 'telar'] },
  { id: 'medida', label: 'A medida', image: '/amedida.png', catalog: ['A medida'], keywords: ['a medida'] },
].filter((family) => !isCategoryHidden(family.label));

const FREQUENT_SEARCHES = withoutHiddenCategories(['Big Bags', 'Telas', 'Rafia', 'Polímeros', 'Maquinaria']);

type SortKey = 'relevance' | 'name' | 'leadTime';

const PAGE_SIZE = 9;

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

function supplierProducts(supplier: SupplierDirectoryRecord) {
  return Array.from(new Set([...supplier.categories, ...supplier.mainProducts]));
}

function supplierFamilies(supplier: SupplierDirectoryRecord) {
  const products = supplierProducts(supplier).map(normalize);
  const text = products.join(' ');
  return FAMILIES.filter(
    (family) =>
      family.catalog.some((label) => products.includes(normalize(label))) ||
      family.keywords.some((keyword) => text.includes(keyword)),
  );
}

function supplierLocation(supplier: SupplierDirectoryRecord) {
  return [supplier.city, supplier.country].filter(Boolean).join(', ');
}

/* Iconos ------------------------------------------------------------------ */

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

function ArrowIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function ChevronIcon({ className = 'h-4 w-4', direction = 'down' }: { className?: string; direction?: 'down' | 'right' | 'up' }) {
  const d = direction === 'down' ? 'M6 9l6 6 6-6' : direction === 'up' ? 'M6 15l6-6 6 6' : 'M9 6l6 6-6 6';
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d={d} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
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

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
      <svg aria-hidden="true" className="h-3.5 w-3.5" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="#1f5bff" />
        <path d="M7.5 12.3l3 3 6-6" fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
      </svg>
      Proveedor verificado
    </span>
  );
}

/* Página ------------------------------------------------------------------ */

// globals.css fija `a { color: inherit }` fuera de las capas de Tailwind: en
// los <Link> el color del texto va en un <span> hijo.
const primaryCta =
  'inline-flex h-12 items-center justify-center gap-2 rounded-[10px] bg-[#1f5bff] px-6 text-sm font-semibold shadow-[0_14px_36px_rgba(31,91,255,0.35)] transition hover:-translate-y-0.5 hover:bg-[#194ee6]';

export default function ProveedoresPage() {
  const [suppliers, setSuppliers] = useState<SupplierDirectoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [families, setFamilies] = useState<string[]>([]);
  const [location, setLocation] = useState('all');
  const [roles, setRoles] = useState<SupplierRole[]>([]);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [sort, setSort] = useState<SortKey>('relevance');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [categoriesOpen, setCategoriesOpen] = useState(true);
  // En mobile el panel de filtros arranca plegado para no tapar los resultados.
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSuppliers() {
      try {
        const response = await atarApi.getMarketplaceSuppliers();
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
  }, []);

  // Opciones y conteos de los filtros, siempre sobre la base cargada.
  const familyCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const supplier of suppliers) {
      for (const family of supplierFamilies(supplier)) {
        counts.set(family.id, (counts.get(family.id) ?? 0) + 1);
      }
    }
    return counts;
  }, [suppliers]);
  const cities = useMemo(() => {
    const counts = new Map<string, number>();
    for (const supplier of suppliers) {
      if (supplier.city) {
        counts.set(supplier.city, (counts.get(supplier.city) ?? 0) + 1);
      }
    }
    return Array.from(counts, ([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [suppliers]);
  const roleOptions = useMemo(
    () => (Object.keys(SUPPLIER_ROLE_LABELS) as SupplierRole[]).map((role) => ({ role, count: suppliers.filter((s) => s.supplierRole === role).length })),
    [suppliers],
  );
  const certificationOptions = useMemo(
    () => Array.from(new Set(suppliers.flatMap((supplier) => supplier.certifications))).sort(),
    [suppliers],
  );
  const verifiedCount = suppliers.filter((supplier) => supplier.isVerified).length;

  const filteredSuppliers = useMemo(() => {
    const query = normalize(search);
    const result = suppliers.filter((supplier) => {
      const ownFamilies = supplierFamilies(supplier);
      if (families.length > 0 && !ownFamilies.some((family) => families.includes(family.id))) {
        return false;
      }
      if (location !== 'all' && supplier.city !== location) {
        return false;
      }
      if (roles.length > 0 && (!supplier.supplierRole || !roles.includes(supplier.supplierRole))) {
        return false;
      }
      if (verifiedOnly && !supplier.isVerified) {
        return false;
      }
      if (certifications.length > 0 && !certifications.some((cert) => supplier.certifications.includes(cert))) {
        return false;
      }
      if (!query) {
        return true;
      }
      return normalize(
        [
          supplier.name,
          supplierLocation(supplier),
          supplier.description ?? '',
          supplier.about ?? '',
          ...supplierProducts(supplier),
          ...ownFamilies.map((family) => family.label),
        ].join(' '),
      ).includes(query);
    });

    return [...result].sort((left, right) => {
      if (sort === 'name') {
        return left.name.localeCompare(right.name);
      }
      if (sort === 'leadTime') {
        return (left.leadTimeDays ?? Number.POSITIVE_INFINITY) - (right.leadTimeDays ?? Number.POSITIVE_INFINITY);
      }
      // Relevancia: verificados primero, después los que cubren más rubros.
      return Number(right.isVerified) - Number(left.isVerified) || supplierProducts(right).length - supplierProducts(left).length;
    });
  }, [certifications, families, location, roles, search, sort, suppliers, verifiedOnly]);

  const visibleSuppliers = filteredSuppliers.slice(0, visibleCount);
  const featuredSuppliers = useMemo(
    () => [...suppliers].sort((a, b) => Number(b.isVerified) - Number(a.isVerified)).slice(0, 4),
    [suppliers],
  );
  const hasFilters =
    Boolean(search) || families.length > 0 || location !== 'all' || roles.length > 0 || verifiedOnly || certifications.length > 0;

  function resetPaging() {
    setVisibleCount(PAGE_SIZE);
  }

  function clearFilters() {
    setSearch('');
    setFamilies([]);
    setLocation('all');
    setRoles([]);
    setVerifiedOnly(false);
    setCertifications([]);
    resetPaging();
  }

  function scrollToDirectory() {
    document.getElementById('directorio')?.scrollIntoView({ behavior: 'smooth' });
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetPaging();
    scrollToDirectory();
  }

  function selectCity(city: string) {
    setLocation(city);
    resetPaging();
    scrollToDirectory();
  }

  function toggle<T>(list: T[], value: T) {
    return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
  }

  return (
    <main className="min-h-screen bg-white text-slate-950">
      {/* ==================== HERO ==================== */}
      <section className="relative isolate overflow-hidden bg-[#eef3fc]">
        <div className="absolute inset-y-0 right-0 w-full lg:w-[64%]">
          <Image alt="" className="animate-hero-zoom object-cover object-[65%_center]" fill priority sizes="(min-width:1024px) 64vw, 100vw" src="/heroatarweb.png" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#f3f6fd_0%,#f3f6fd_34%,rgba(243,246,253,0.85)_46%,rgba(243,246,253,0.2)_62%,rgba(243,246,253,0)_74%)]" />
        <div className="absolute inset-0 bg-white/75 lg:hidden" />

        <div className="relative z-10 mx-auto flex min-h-[520px] w-full max-w-[1440px] items-center px-6 py-16 lg:min-h-[600px] lg:px-12">
          <div className="max-w-[620px]">
            <p className="animate-fade-up text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-700">
              Proveedores de la industria de la rafia
            </p>
            <h1 className="animate-fade-up mt-4 text-[2.6rem] font-bold leading-[1.04] tracking-[-0.04em] text-[#0b1530] [animation-delay:100ms] sm:text-[3.4rem] xl:text-[3.9rem]">
              Las empresas que hacen posible <br className="hidden sm:block" />
              <span className="text-[#1f5bff] sm:whitespace-nowrap">esta industria.</span>
            </h1>
            <p className="animate-fade-up mt-5 max-w-[520px] text-[17px] leading-7 text-slate-600 [animation-delay:200ms]">
              Conectá con fabricantes, distribuidores y proveedores verificados de rafia, Big Bags, sacos, telas, hilos,
              maquinaria y más.
            </p>

            <form
              className="animate-fade-up mt-8 flex items-center gap-2 rounded-[14px] border border-slate-200 bg-white p-2 shadow-[0_18px_40px_rgba(15,23,42,0.08)] [animation-delay:300ms]"
              onSubmit={handleSearch}
              role="search"
            >
              <span className="pl-2 text-slate-400">
                <SearchIcon />
              </span>
              <input
                aria-label="Buscar proveedores"
                className="h-11 min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                onChange={(event) => {
                  setSearch(event.target.value);
                  resetPaging();
                }}
                placeholder="Buscá empresas, productos o ubicaciones..."
                type="search"
                value={search}
              />
              <button className="h-11 shrink-0 rounded-[10px] bg-[#1f5bff] px-6 text-sm font-semibold text-white transition hover:bg-[#194ee6]" type="submit">
                Buscar
              </button>
            </form>

            <div className="animate-fade-up mt-4 flex flex-wrap items-center gap-2 text-[13px] text-slate-600 [animation-delay:400ms]">
              <span>Búsquedas frecuentes:</span>
              {FREQUENT_SEARCHES.map((term) => (
                <button
                  key={term}
                  className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[12px] font-medium text-slate-700 transition hover:border-[#1f5bff]/50 hover:text-[#1f5bff]"
                  onClick={() => {
                    setSearch(term);
                    resetPaging();
                    scrollToDirectory();
                  }}
                  type="button"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== DIRECTORIO ==================== */}
      <section className="scroll-mt-20 bg-white" id="directorio">
        <div className="mx-auto w-full max-w-[1440px] px-6 py-14 lg:px-12 lg:py-16">
          <Reveal className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Proveedores</p>
              <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-slate-950 sm:text-[2.3rem]">
                Encontrá el socio ideal para tu industria.
              </h2>
            </div>
            {verifiedCount > 0 ? (
              <p className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <span className="text-[#1f5bff]">
                  <UsersIcon />
                </span>
                {verifiedCount} {verifiedCount === 1 ? 'empresa verificada' : 'empresas verificadas'}
              </p>
            ) : null}
          </Reveal>

          <div className="mt-8 grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
            {/* Filtros */}
            <aside className="h-fit rounded-[14px] border border-slate-200 bg-[#f7f9fd] p-5 lg:sticky lg:top-24">
              <button
                aria-expanded={mobileFiltersOpen}
                className="flex w-full items-center justify-between text-[16px] font-bold text-slate-950 lg:pointer-events-none"
                onClick={() => setMobileFiltersOpen((current) => !current)}
                type="button"
              >
                <span>
                  Filtros
                  {hasFilters ? <span className="ml-2 rounded-full bg-[#1f5bff] px-2 py-0.5 text-[11px] font-semibold text-white">activos</span> : null}
                </span>
                <span className="lg:hidden">
                  <ChevronIcon direction={mobileFiltersOpen ? 'up' : 'down'} />
                </span>
              </button>

              <div className={mobileFiltersOpen ? 'block' : 'hidden lg:block'}>
              <FilterGroup
                open={categoriesOpen}
                onToggle={() => setCategoriesOpen((current) => !current)}
                title="Categorías de productos"
              >
                {FAMILIES.map((family) => (
                  <Checkbox
                    key={family.id}
                    checked={families.includes(family.id)}
                    count={familyCounts.get(family.id) ?? 0}
                    label={family.label}
                    onChange={() => {
                      setFamilies((current) => toggle(current, family.id));
                      resetPaging();
                    }}
                  />
                ))}
              </FilterGroup>

              <FilterGroup title="Ubicación">
                <div className="relative">
                  <select
                    className="h-10 w-full appearance-none rounded-[10px] border border-slate-200 bg-white px-3 pr-9 text-[13px] text-slate-700 outline-none transition focus:border-[#1f5bff]"
                    onChange={(event) => {
                      setLocation(event.target.value);
                      resetPaging();
                    }}
                    value={location}
                  >
                    <option value="all">Todas las ubicaciones</option>
                    {cities.map((city) => (
                      <option key={city.name} value={city.name}>
                        {city.name} ({city.count})
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                    <ChevronIcon />
                  </span>
                </div>
              </FilterGroup>

              <FilterGroup title="Tipo de empresa">
                {roleOptions.map((option) => (
                  <Checkbox
                    key={option.role}
                    checked={roles.includes(option.role)}
                    count={option.count}
                    label={SUPPLIER_ROLE_LABELS[option.role]}
                    onChange={() => {
                      setRoles((current) => toggle(current, option.role));
                      resetPaging();
                    }}
                  />
                ))}
              </FilterGroup>

              <FilterGroup title="Certificaciones">
                <Checkbox
                  checked={verifiedOnly}
                  count={verifiedCount}
                  label="Proveedor verificado"
                  onChange={() => {
                    setVerifiedOnly((current) => !current);
                    resetPaging();
                  }}
                />
                {certificationOptions.map((cert) => (
                  <Checkbox
                    key={cert}
                    checked={certifications.includes(cert)}
                    count={suppliers.filter((supplier) => supplier.certifications.includes(cert)).length}
                    label={cert}
                    onChange={() => {
                      setCertifications((current) => toggle(current, cert));
                      resetPaging();
                    }}
                  />
                ))}
              </FilterGroup>

              <button
                className="mt-5 text-[13px] font-semibold text-[#1f5bff] underline-offset-2 hover:underline disabled:cursor-default disabled:text-slate-400 disabled:no-underline"
                disabled={!hasFilters}
                onClick={clearFilters}
                type="button"
              >
                Limpiar filtros
              </button>
              </div>
            </aside>

            {/* Resultados */}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-600">
                  <span className="text-[18px] font-bold text-slate-950">{loading ? '—' : filteredSuppliers.length}</span>{' '}
                  {filteredSuppliers.length === 1 ? 'proveedor encontrado' : 'proveedores encontrados'}
                </p>
                <label className="flex items-center gap-2 text-[13px] text-slate-600">
                  Ordenar por:
                  <span className="relative">
                    <select
                      className="h-9 appearance-none rounded-[10px] border border-slate-200 bg-white pl-3 pr-9 text-[13px] text-slate-800 outline-none focus:border-[#1f5bff]"
                      onChange={(event) => setSort(event.target.value as SortKey)}
                      value={sort}
                    >
                      <option value="relevance">Relevancia</option>
                      <option value="name">Nombre (A-Z)</option>
                      <option value="leadTime">Menor tiempo de entrega</option>
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                      <ChevronIcon />
                    </span>
                  </span>
                </label>
              </div>

              {error ? (
                <div className="mt-4 rounded-[12px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">{error}</div>
              ) : null}

              {loading ? (
                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="h-[400px] animate-pulse rounded-[14px] bg-slate-100" />
                  ))}
                </div>
              ) : filteredSuppliers.length === 0 ? (
                <div className="mt-5 rounded-[14px] border border-dashed border-slate-300 bg-slate-50 px-5 py-14 text-center text-sm text-slate-500">
                  No hay proveedores que coincidan con los filtros.{' '}
                  <button className="font-semibold text-[#1f5bff] hover:underline" onClick={clearFilters} type="button">
                    Limpiar filtros
                  </button>
                </div>
              ) : (
                <>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {visibleSuppliers.map((supplier, index) => (
                      <Reveal key={supplier.id} className="h-full" delay={(index % 3) * 80}>
                        <SupplierCard supplier={supplier} />
                      </Reveal>
                    ))}
                  </div>
                  {visibleCount < filteredSuppliers.length ? (
                    <div className="mt-8 flex justify-center">
                      <button
                        className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-[#1f5bff]/40 bg-white px-6 text-sm font-semibold text-[#1f5bff] transition hover:bg-[#f3f6ff]"
                        onClick={() => setVisibleCount((current) => current + PAGE_SIZE)}
                        type="button"
                      >
                        Cargar más proveedores ({filteredSuppliers.length - visibleCount})
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== ASESORAMIENTO ==================== */}
      <section className="relative isolate overflow-hidden bg-[#0b1530] text-white">
        <div className="absolute inset-y-0 right-0 w-full lg:w-[60%]">
          <Image alt="" className="object-cover object-[12%_center]" fill sizes="(min-width:1024px) 60vw, 100vw" src="/heroatarweb.png" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#0b1530_0%,#0b1530_38%,rgba(11,21,48,0.7)_54%,rgba(11,21,48,0.1)_78%)]" />
        <div className="absolute inset-0 bg-[#0b1530]/60 lg:hidden" />
        <Reveal className="relative z-10 mx-auto w-full max-w-[1440px] px-6 py-14 lg:px-12 lg:py-16">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">¿No encontrás el proveedor que buscás?</p>
          <h2 className="mt-4 max-w-[640px] text-3xl font-bold leading-[1.1] tracking-[-0.03em] sm:text-[2.5rem]">
            Contanos tu necesidad y te conectamos con las empresas indicadas.
          </h2>
          <p className="mt-4 max-w-[500px] text-base leading-7 text-white/75">
            Nuestro equipo te ayuda a encontrar los proveedores ideales según tus requerimientos.
          </p>
          <Link className={`${primaryCta} mt-7`} href="/dashboard/comprador/solicitudes/nueva">
            <span className="inline-flex items-center gap-2 text-white">
              Solicitar cotización
              <ArrowIcon />
            </span>
          </Link>
        </Reveal>
      </section>

      {/* ==================== UBICACIÓN + DESTACADOS ==================== */}
      <section className="bg-[#f5f7fc]">
        <div className="mx-auto grid w-full max-w-[1440px] gap-10 px-6 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:px-12 lg:py-16">
          <Reveal>
            <h2 className="text-2xl font-bold tracking-[-0.03em] text-slate-950 sm:text-[1.9rem]">Proveedores por ubicación</h2>
            <p className="mt-1.5 text-sm text-slate-500">Encontrá empresas en tu región.</p>
            <div className="mt-6 grid grid-cols-1 items-center gap-6 sm:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
              <div className="mx-auto h-[360px] w-full max-w-[300px] sm:h-[400px]">
                <ArgentinaMap className="h-full w-full" cities={cities} onSelect={selectCity} selected={location === 'all' ? undefined : location} />
              </div>
              <div className="rounded-[14px] border border-slate-200 bg-white p-2">
                {cities.length === 0 ? (
                  <p className="px-3 py-4 text-sm text-slate-500">{loading ? 'Cargando…' : 'Sin ubicaciones cargadas.'}</p>
                ) : (
                  cities.map((city) => (
                    <button
                      key={city.name}
                      className="flex w-full items-center justify-between gap-3 rounded-[10px] px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-[#f3f6ff] hover:text-[#1f5bff]"
                      onClick={() => selectCity(city.name)}
                      type="button"
                    >
                      <span className="flex items-center gap-2.5">
                        <span className="text-[#1f5bff]">
                          <PinIcon />
                        </span>
                        {city.name} <span className="text-slate-400">({city.count})</span>
                      </span>
                      <ChevronIcon direction="right" />
                    </button>
                  ))
                )}
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold tracking-[-0.03em] text-slate-950 sm:text-[1.9rem]">Proveedores destacados</h2>
                <p className="mt-1.5 text-sm text-slate-500">Conocé algunas de las empresas más activas de la plataforma.</p>
              </div>
              <button className="inline-flex items-center gap-2 text-sm font-semibold text-[#1f5bff]" onClick={scrollToDirectory} type="button">
                Ver todos los proveedores
                <ArrowIcon />
              </button>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {featuredSuppliers.map((supplier) => {
                const family = supplierFamilies(supplier)[0];
                return (
                  <Link
                    key={supplier.id}
                    className="group overflow-hidden rounded-[12px] border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
                    href={`/productos/${supplier.slug}`}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                      <Image
                        alt=""
                        className="object-cover transition duration-500 group-hover:scale-105"
                        fill
                        sizes="(min-width:640px) 12vw, 45vw"
                        src={family?.image ?? '/maquinariaweb.png'}
                      />
                    </div>
                    <div className="p-3">
                      <p className="truncate text-[14px] font-bold text-slate-950">{supplier.name}</p>
                      <p className="mt-0.5 flex items-center gap-1 truncate text-[12px] text-slate-500">
                        <PinIcon className="h-3.5 w-3.5 shrink-0" />
                        {supplierLocation(supplier)}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {supplierProducts(supplier)
                          .slice(0, 2)
                          .map((product) => (
                            <span key={product} className="rounded-md bg-[#eef3ff] px-1.5 py-0.5 text-[10px] text-slate-600">
                              {product}
                            </span>
                          ))}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ==================== CTA PROVEEDORES ==================== */}
      <section className="relative isolate overflow-hidden bg-[#0b1530] text-white">
        <Image alt="" className="object-cover object-center opacity-40" fill sizes="100vw" src="/maquinariaweb.png" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#0b1530_0%,rgba(11,21,48,0.85)_45%,rgba(11,21,48,0.55)_100%)]" />
        <Reveal className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-6 py-14 lg:flex-row lg:items-center lg:justify-between lg:px-12 lg:py-16">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">Sumate a la red de proveedores</p>
            <h2 className="mt-3 text-3xl font-bold leading-[1.1] tracking-[-0.03em] sm:text-[2.5rem]">Mostrá tus productos a una industria real.</h2>
            <p className="mt-3 text-base text-white/75">Recibí solicitudes de cotización, conectá con nuevos clientes y hacé crecer tu negocio.</p>
          </div>
          <Link
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-[10px] bg-white px-6 text-sm font-semibold transition hover:-translate-y-0.5"
            href="/acceso"
          >
            <span className="inline-flex items-center gap-2 text-[#1f5bff]">
              Quiero ser proveedor
              <ArrowIcon />
            </span>
          </Link>
        </Reveal>
      </section>
    </main>
  );
}

/* Subcomponentes ---------------------------------------------------------- */

function FilterGroup({
  title,
  children,
  open = true,
  onToggle,
}: {
  title: string;
  children: ReactNode;
  open?: boolean;
  onToggle?: () => void;
}) {
  return (
    <div className="mt-5 border-t border-slate-200 pt-4 first-of-type:border-t-0">
      {onToggle ? (
        <button className="flex w-full items-center justify-between text-[13px] font-semibold text-slate-900" onClick={onToggle} type="button">
          {title}
          <ChevronIcon direction={open ? 'up' : 'down'} />
        </button>
      ) : (
        <p className="text-[13px] font-semibold text-slate-900">{title}</p>
      )}
      {open ? <div className="mt-3 space-y-2">{children}</div> : null}
    </div>
  );
}

function Checkbox({ checked, label, count, onChange }: { checked: boolean; label: string; count: number; onChange: () => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-slate-700">
      <input
        checked={checked}
        className="h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 accent-[#1f5bff]"
        onChange={onChange}
        type="checkbox"
      />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className="text-[12px] text-slate-400">({count})</span>
    </label>
  );
}

function SupplierCard({ supplier }: { supplier: SupplierDirectoryRecord }) {
  const family = supplierFamilies(supplier)[0];
  const products = supplierProducts(supplier).slice(0, 3);
  const summary = supplier.about ?? supplier.description;
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[14px] border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-[#1f5bff]/40 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
      <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
        <Image
          alt=""
          className="object-cover transition duration-500 group-hover:scale-105"
          fill
          sizes="(min-width:1280px) 22vw, (min-width:640px) 45vw, 90vw"
          src={family?.image ?? '/maquinariaweb.png'}
        />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-3">
          <CompanyLogo
            className="h-11 w-11"
            logoUrl={supplier.logoUrl}
            name={supplier.name}
            rounded="rounded-[10px]"
            textClassName="text-[13px]"
            tone="bg-[#eef3ff] text-[#1f5bff]"
          />
          <div className="min-w-0">
            <h3 className="truncate text-[16px] font-bold text-slate-950">{supplier.name}</h3>
            {supplier.isVerified ? <VerifiedBadge /> : null}
          </div>
        </div>
        {summary ? <p className="mt-3 line-clamp-2 text-[13px] leading-5 text-slate-600">{summary}</p> : null}
        {products.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {products.map((product) => (
              <span key={product} className="rounded-md border border-slate-200 px-2 py-0.5 text-[11px] text-slate-600">
                {product}
              </span>
            ))}
          </div>
        ) : null}
        <p className="mt-3 flex items-center gap-1.5 text-[12px] text-slate-500">
          <PinIcon className="h-3.5 w-3.5" />
          {supplierLocation(supplier)}
        </p>
        <div className="mt-auto pt-4">
          <Link
            className="flex h-10 items-center justify-center gap-1.5 rounded-[10px] border border-[#1f5bff]/40 text-[13px] font-semibold transition hover:bg-[#f3f6ff]"
            href={`/productos/${supplier.slug}`}
          >
            <span className="inline-flex items-center gap-1.5 text-[#1f5bff]">
              Ver perfil
              <ArrowIcon className="h-3.5 w-3.5" />
            </span>
          </Link>
        </div>
      </div>
    </article>
  );
}
