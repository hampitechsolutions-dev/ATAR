'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { atarApi, type RequestCatalogCategoryRecord } from '@/lib/atar-api';

type ProductCategory = {
  id: string;
  label: string;
  subtitle: string;
  imageSrc: string;
  imageClassName: string;
};

/* Catálogo de respaldo: se usa si el backend no responde, para conservar la
   presentación de la maqueta. Cuando el API responde, manda el dato real. */
const FALLBACK_CATEGORIES: ProductCategory[] = [
  {
    id: 'tintas',
    label: 'Tintas',
    subtitle: 'Tintas para impresión flexográfica y huecograbado en diferentes sustratos y aplicaciones.',
    imageSrc: '/tintas.png',
    imageClassName: 'object-cover',
  },
  {
    id: 'polimeros',
    label: 'Polímeros',
    subtitle: 'Polipropileno, polietileno y masterbatches de alta calidad para la industria del plástico.',
    imageSrc: '/polimerosweb.png',
    imageClassName: 'object-cover',
  },
  {
    id: 'maquinarias',
    label: 'Maquinarias',
    subtitle: 'Equipos y líneas para procesos de extrusión, impresión, conversión y reciclado.',
    imageSrc: '/maquinariaweb.png',
    imageClassName: 'object-cover',
  },
  {
    id: 'cuerdas-cordones',
    label: 'Cuerdas/Cordones',
    subtitle: 'Cuerdas y cordones de polipropileno para atado, sujeción y aplicaciones industriales.',
    imageSrc: '/cuerdas.png',
    imageClassName: 'object-cover',
  },
  {
    id: 'bolsas',
    label: 'Bolsas',
    subtitle: 'Bolsas de polipropileno y polietileno para múltiples usos: alimentos, agroindustria, retail y más.',
    imageSrc: '/bolsaspp.png',
    imageClassName: 'object-cover',
  },
  {
    id: 'sacos',
    label: 'Sacos',
    subtitle: 'Sacos tejidos y laminados para agroindustria, construcción, químicos y otras aplicaciones.',
    imageSrc: '/sacos.png',
    imageClassName: 'object-cover',
  },
  {
    id: 'big-bags',
    label: 'Big Bags',
    subtitle: 'Contenedores flexibles de gran capacidad para transporte y almacenamiento de sólidos.',
    imageSrc: '/bigbags.png',
    imageClassName: 'object-cover',
  },
  {
    id: 'cintas-cintillas',
    label: 'Cintas/Cintillas',
    subtitle: 'Cintas y cintillas de polipropileno para flejado, cierre y aseguramiento de cargas.',
    imageSrc: '/cintas.png',
    imageClassName: 'object-cover',
  },
  {
    id: 'hilo-pp',
    label: 'Hilo multifilamento de PP',
    subtitle: 'Hilos de polipropileno de alta tenacidad para tejeduría, costura, agricultura y aplicaciones técnicas.',
    imageSrc: '/hilomulti.png',
    imageClassName: 'object-cover',
  },
  {
    id: 'hilo-mallas',
    label: 'Hilo retorcido y Mallas para Arrolladora',
    subtitle: 'Hilos retorcidos y mallas diseñadas para arrolladoras y procesos de empaque agrícola.',
    imageSrc: '/hiloretor.png',
    imageClassName: 'object-cover',
  },
  {
    id: 'telas-tubulares',
    label: 'Telas Tubulares',
    subtitle: 'Telas tubulares de polipropileno para la confección de bolsas, Big Bags y sacos.',
    imageSrc: '/telatubular.png',
    imageClassName: 'object-cover',
  },
  {
    id: 'telas-planas',
    label: 'Telas planas',
    subtitle: 'Telas planas de polipropileno para bolsas, sacos, coberturas y múltiples usos industriales.',
    imageSrc: '/telaplana.png',
    imageClassName: 'object-cover',
  },
];

const MOST_SEARCHED = ['Big Bags', 'Polímeros', 'Maquinarias', 'Bolsas', 'Tintas'];

const HERO_IMAGES = ['/bigbags.png', '/cuerdas.png', '/tintas.png', '/hilomulti.png'];

/* Iconos ------------------------------------------------------------------ */

function CubeIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M3.3 7.3L12 12l8.7-4.7M12 22V12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
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

function ShieldIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function TrendingIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M22 7l-8.5 8.5-5-5L2 17M16 7h6v6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
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

function ArrowIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

/* Beneficios -------------------------------------------------------------- */

type BenefitIconName = 'compare' | 'clock' | 'expert' | 'growth';

function BenefitIcon({ name, className = 'h-5 w-5' }: { name: BenefitIconName; className?: string }) {
  const paths: Record<BenefitIconName, React.ReactNode> = {
    compare: <path d="M3 6h13M3 12h9M3 18h13M17 9l3-3-3-3M21 18l-3-3-3 3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />,
    clock: <path d="M12 22a10 10 0 110-20 10 10 0 010 20zM12 6v6l4 2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />,
    expert: <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM19 8v6M22 11h-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />,
    growth: <path d="M22 7l-8.5 8.5-5-5L2 17M16 7h6v6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />,
  };

  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      {paths[name]}
    </svg>
  );
}

const BENEFITS: { icon: BenefitIconName; title: string; text: string }[] = [
  { icon: 'compare', title: 'Compará propuestas', text: 'Recibí y compará cotizaciones fácilmente.' },
  { icon: 'clock', title: 'Ahorra tiempo', text: 'Encontrá todo lo que necesitás en un solo lugar.' },
  { icon: 'expert', title: 'Conectá con expertos', text: 'Proveedores verificados y especialistas en cada rubro.' },
  { icon: 'growth', title: 'Impulsá tu negocio', text: 'Mejores insumos, mejores resultados.' },
];

/* Página ------------------------------------------------------------------ */

export default function ProductosPage() {
  const [categories, setCategories] = useState<ProductCategory[]>(FALLBACK_CATEGORIES);
  const [supplierCount, setSupplierCount] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [catalog, stats] = await Promise.allSettled([
          atarApi.getRequestCategories(),
          atarApi.getMarketplaceStats(),
        ]);

        if (!cancelled && catalog.status === 'fulfilled' && catalog.value.length > 0) {
          setCategories(catalog.value.map(mapCategory));
        }
        if (!cancelled && stats.status === 'fulfilled') {
          setSupplierCount(stats.value.suppliersCount);
        }
      } catch {
        // Se conserva el catálogo de respaldo.
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

    return categories.filter((category) => {
      if (activeCategory !== 'all' && category.label !== activeCategory) {
        return false;
      }
      if (!query) {
        return true;
      }
      return `${category.label} ${category.subtitle}`.toLowerCase().includes(query);
    });
  }, [categories, search, activeCategory]);

  const supplierLabel = supplierCount === null ? '1200+' : `${supplierCount}+`;
  const supplierBadge = supplierCount === null ? '+1200' : `+${supplierCount}`;

  return (
    <main className="min-h-screen bg-white text-slate-950">
      {/* HERO */}
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(59,91,255,0.10),_transparent_45%),linear-gradient(180deg,#ffffff_0%,#f5f7ff_100%)]">
        <div className="mx-auto w-full max-w-7xl px-6 py-12 lg:px-10 lg:py-16">
          <div className="grid gap-10 lg:grid-cols-[0.5fr_0.5fr] lg:items-center">
            <div className="space-y-6">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">
                Productos y soluciones
              </p>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Todo lo que tu empresa necesita, <span className="text-indigo-600">en un solo lugar</span>
              </h1>
              <p className="max-w-xl text-lg leading-8 text-slate-600">
                Explorá nuestras categorías y conectá con proveedores especializados en cada solución industrial.
              </p>

              <div className="relative max-w-xl">
                <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm shadow-sm outline-none transition focus:border-indigo-400"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar productos, aplicaciones o industrias..."
                  value={search}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                <span className="font-medium">Más buscados:</span>
                {MOST_SEARCHED.map((term) => (
                  <button
                    key={term}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600"
                    onClick={() => setSearch(term)}
                    type="button"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>

            {/* Collage */}
            <div className="relative">
              <div className="grid grid-cols-2 grid-rows-2 gap-3">
                <div className="relative row-span-2 h-full min-h-[300px] overflow-hidden rounded-2xl bg-slate-100 shadow-sm">
                  <Image alt="" className="object-cover" fill sizes="(min-width:1024px) 26vw, 50vw" src={HERO_IMAGES[0]} />
                </div>
                <div className="relative h-36 overflow-hidden rounded-2xl bg-slate-100 shadow-sm sm:h-40">
                  <Image alt="" className="object-cover" fill sizes="(min-width:1024px) 26vw, 50vw" src={HERO_IMAGES[1]} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative overflow-hidden rounded-2xl bg-slate-100 shadow-sm">
                    <Image alt="" className="object-cover" fill sizes="13vw" src={HERO_IMAGES[2]} />
                  </div>
                  <div className="relative overflow-hidden rounded-2xl bg-slate-100 shadow-sm">
                    <Image alt="" className="object-cover" fill sizes="13vw" src={HERO_IMAGES[3]} />
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-slate-100 bg-white px-5 py-3 shadow-lg">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <UsersIcon />
                </span>
                <div>
                  <p className="text-base font-semibold text-slate-950">{supplierBadge}</p>
                  <p className="text-xs text-slate-500">Proveedores activos</p>
                </div>
              </div>
            </div>
          </div>

          {/* STATS */}
          <div className="mt-16 grid grid-cols-1 divide-y divide-slate-200 rounded-[1.5rem] border border-slate-200 bg-white shadow-sm sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
            <StatCell icon={<CubeIcon />} value={`${categories.length}+`} label="Categorías de productos" />
            <StatCell icon={<UsersIcon />} value={supplierLabel} label="Proveedores especializados" />
            <StatCell icon={<ShieldIcon />} value="Verificados" label="Calidad y confianza" />
            <StatCell icon={<TrendingIcon />} value="Actualizado" label="Nuevos productos cada semana" />
          </div>
        </div>
      </section>

      {/* CATEGORÍAS */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-10 lg:py-14">
          {/* Tabs de filtro */}
          <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <FilterTab active={activeCategory === 'all'} onClick={() => setActiveCategory('all')}>
              Todas las categorías
            </FilterTab>
            {categories.map((category) => (
              <FilterTab
                key={category.id}
                active={activeCategory === category.label}
                onClick={() => setActiveCategory(category.label)}
              >
                {category.label}
              </FilterTab>
            ))}
          </div>

          {/* Grid de categorías */}
          {filteredCategories.length === 0 ? (
            <div className="mt-8 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-14 text-center text-sm text-slate-500">
              No hay categorías que coincidan con la búsqueda.
            </div>
          ) : (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {filteredCategories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ¿POR QUÉ USAR ATAR? */}
      <section className="bg-white pb-14">
        <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
          <div className="rounded-[1.75rem] bg-[linear-gradient(180deg,#f5f6ff_0%,#eef1ff_100%)] p-8 lg:p-12">
            <div className="grid gap-8 lg:grid-cols-[0.32fr_0.68fr] lg:items-center">
              <div className="relative mx-auto h-44 w-full max-w-xs">
                <Image alt="" className="object-contain" fill sizes="320px" src="/proveedores.png" />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">
                  ¿Por qué usar ATAR?
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                  Más opciones. Mejores decisiones.
                </h2>

                <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                  {BENEFITS.map((benefit) => (
                    <div key={benefit.title} className="flex gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
                        <BenefitIcon name={benefit.icon} />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-950">{benefit.title}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">{benefit.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

/* Subcomponentes ---------------------------------------------------------- */

function StatCell({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex items-center gap-4 px-5 py-5 lg:px-6">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
        {icon}
      </span>
      <div>
        <p className="text-lg font-semibold tracking-tight text-slate-950">{value}</p>
        <p className="mt-0.5 text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function FilterTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition ${
        active
          ? 'bg-indigo-600 text-white shadow-sm'
          : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function CategoryCard({ category }: { category: ProductCategory }) {
  return (
    <Link
      href="/acceso"
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
    >
      <div className="relative h-40 w-full overflow-hidden bg-slate-100">
        <Image
          alt={category.label}
          className={`transition duration-300 group-hover:scale-105 ${category.imageClassName || 'object-cover'}`}
          fill
          sizes="(min-width:1024px) 22vw, (min-width:640px) 45vw, 90vw"
          src={category.imageSrc}
        />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-semibold tracking-tight text-slate-950">{category.label}</h3>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{category.subtitle}</p>

        <span className="mt-4 flex h-8 w-8 items-center justify-center self-end rounded-full border border-slate-200 text-slate-500 transition group-hover:border-indigo-600 group-hover:bg-indigo-600 group-hover:text-white">
          <ArrowIcon />
        </span>
      </div>
    </Link>
  );
}

function mapCategory(record: RequestCatalogCategoryRecord): ProductCategory {
  const fallback = FALLBACK_CATEGORIES.find((item) => item.label === record.label);

  return {
    id: record.id,
    label: record.label,
    subtitle: record.subtitle ?? fallback?.subtitle ?? '',
    // Prioriza las imágenes locales con nombre de producto sobre las del API.
    imageSrc: fallback?.imageSrc ?? record.imageSrc ?? '/logoatar.png',
    imageClassName: record.imageClassName ?? 'object-cover',
  };
}
