'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import CompanyLogo from '@/components/dashboard/company-logo';
import Reveal from '@/components/ui/reveal';
import { isCategoryHidden, withoutHiddenCategories } from '@/lib/hidden-categories';
import { atarApi, type RequestCatalogCategoryRecord, type SupplierDirectoryRecord } from '@/lib/atar-api';
import { getSupplierCategoryLabel } from '@/lib/provider-directory';

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
    imageSrc: '/polimero.png',
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
].filter((category) => !isCategoryHidden(category.label));

const MOST_SEARCHED = withoutHiddenCategories(['Big Bags', 'Polímeros', 'Maquinarias', 'Bolsas', 'Tintas']);

const HERO_IMAGES = ['/bigbags.png', '/cuerdas.png', '/tintas.png', '/hilomulti.png'];

/* Iconos ------------------------------------------------------------------ */

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

/* Familias de productos ---------------------------------------------------- */

type FamilyIconName = 'bag' | 'fabric' | 'spool' | 'molecule' | 'drop' | 'gear';

type ProductFamily = {
  id: string;
  title: string;
  /** Etiqueta corta para los filtros de productos destacados. */
  tab: string;
  icon: FamilyIconName;
  image: string;
  /** Cada ítem abre una solicitud con esa categoría del catálogo preseleccionada. */
  items: { label: string; category: string }[];
  /** Palabras para ubicar productos y búsquedas dentro de la familia. */
  keywords: string[];
};

const ALL_FAMILIES: ProductFamily[] = [
  {
    id: 'envases',
    title: 'Envases y embalajes',
    tab: 'Big Bags y sacos',
    icon: 'bag',
    image: '/bigbags.png',
    items: [
      { label: 'Big Bags', category: 'Big Bags' },
      { label: 'Sacos', category: 'Sacos' },
      { label: 'Bolsas PP', category: 'Bolsas PP' },
    ],
    keywords: ['big bag', 'bolsa', 'saco', 'fibc', 'envase', 'embalaje'],
  },
  {
    id: 'telas',
    title: 'Telas y tejidos',
    tab: 'Telas',
    icon: 'fabric',
    image: '/telaplana.png',
    items: [
      { label: 'Rafia', category: 'Rollos y Telas' },
      { label: 'Telas tubulares', category: 'Telas Tubulares' },
      { label: 'Telas planas', category: 'Telas planas' },
      { label: 'Mallas', category: 'Hilo retorcido y Mallas' },
    ],
    keywords: ['tela', 'rafia', 'tejid', 'malla', 'rollo'],
  },
  {
    id: 'hilos',
    title: 'Hilos y cordones',
    tab: 'Hilos',
    icon: 'spool',
    image: '/hilomulti.png',
    items: [
      { label: 'Hilo multifilamento PP', category: 'Hilo multifilamento de PP' },
      { label: 'Hilo retorcido', category: 'Hilo retorcido y Mallas' },
      { label: 'Cuerdas', category: 'Cuerdas/Cordones' },
      { label: 'Cordones', category: 'Cuerdas/Cordones' },
    ],
    keywords: ['hilo', 'cuerda', 'cordon', 'cordón', 'multifilamento'],
  },
  {
    id: 'materias',
    title: 'Materias primas',
    tab: 'Polímeros',
    icon: 'molecule',
    image: '/polimero.png',
    items: [
      { label: 'Polipropileno', category: 'Polipropileno' },
      { label: 'Polietileno', category: 'Polietileno' },
    ],
    keywords: ['polímero', 'polimero', 'polipropileno', 'polietileno', 'pellet', 'resina', 'masterbatch'],
  },
  {
    id: 'impresion',
    title: 'Impresión y terminación',
    tab: 'Tintas y cintas',
    icon: 'drop',
    image: '/tintas.png',
    items: [
      { label: 'Tintas', category: 'Tintas' },
      { label: 'Cintas', category: 'Cintas/Cintillas' },
      { label: 'Cintillas', category: 'Cintas/Cintillas' },
    ],
    keywords: ['tinta', 'cinta', 'cintilla', 'impres'],
  },
  {
    id: 'maquinaria',
    title: 'Maquinaria',
    tab: 'Maquinaria',
    icon: 'gear',
    image: '/maquinariaweb.png',
    items: [
      { label: 'Equipos', category: 'Maquinarias' },
      { label: 'Líneas de producción', category: 'Maquinarias' },
      { label: 'Accesorios', category: 'Maquinarias' },
    ],
    keywords: ['maquin', 'equipo', 'línea', 'linea', 'extrus', 'telar', 'accesorio', 'repuesto'],
  },
];

const FAMILIES = ALL_FAMILIES.filter((family) => !isCategoryHidden(family.tab));

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function familyFor(text: string) {
  const haystack = normalize(text);
  return FAMILIES.find((family) => family.keywords.some((keyword) => haystack.includes(normalize(keyword)))) ?? null;
}

function familyMatches(family: ProductFamily, query: string) {
  const needle = normalize(query.trim());
  if (!needle) {
    return true;
  }
  return normalize([family.title, ...family.items.map((item) => item.label), ...family.keywords].join(' ')).includes(needle);
}

/** Solicitud nueva, con la categoría del catálogo preseleccionada si se conoce. */
function newRequestHref(category?: string) {
  return `/dashboard/comprador/solicitudes/nueva${category ? `?category=${encodeURIComponent(category)}` : ''}`;
}

/* Productos destacados ------------------------------------------------------ */

type FeaturedProduct = {
  id: string;
  name: string;
  supplier: SupplierDirectoryRecord;
  family: ProductFamily | null;
  image: string;
  /** Categoría del catálogo de solicitudes que mejor le corresponde. */
  category?: string;
};

/**
 * No hay un catálogo de productos publicado: los destacados salen de los
 * productos principales que declara cada proveedor en su ficha. Se intercalan
 * proveedores para que la primera fila no sea toda de la misma empresa.
 */
function buildFeaturedProducts(suppliers: SupplierDirectoryRecord[]): FeaturedProduct[] {
  const perSupplier = suppliers.map((supplier) => {
    const names = (supplier.mainProducts.length > 0 ? supplier.mainProducts : supplier.tags).slice(0, 4);
    return names.map((name) => {
      const family = familyFor(name) ?? familyFor(supplier.tags.join(' '));
      const product = normalize(name);
      // Coincidencia por la primera palabra significativa (evita que "a" o
      // "de" emparejen cualquier categoría).
      const catalogMatch = FALLBACK_CATEGORIES.find((category) => {
        const label = normalize(category.label);
        const labelWord = label.split(/[ /]/)[0];
        const productWord = product.split(' ').find((word) => word.length >= 4) ?? '';
        return (labelWord.length >= 4 && product.includes(labelWord)) || (productWord && label.includes(productWord));
      });
      const image = product.includes('medida') ? '/amedida.png' : catalogMatch?.imageSrc ?? family?.image ?? '/logoatar.png';
      return {
        id: `${supplier.id}-${name}`,
        name,
        supplier,
        family,
        image,
        category: family?.items.find((item) => normalize(name).includes(normalize(item.label).split(' ')[0]))?.category ?? family?.items[0]?.category,
      };
    });
  });

  const merged: FeaturedProduct[] = [];
  const longest = Math.max(0, ...perSupplier.map((list) => list.length));
  for (let index = 0; index < longest; index += 1) {
    for (const list of perSupplier) {
      if (list[index]) {
        merged.push(list[index]);
      }
    }
  }
  return merged;
}

function FamilyIcon({ name, className = 'h-6 w-6' }: { name: FamilyIconName; className?: string }) {
  const s = { stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  const paths: Record<FamilyIconName, React.ReactNode> = {
    bag: (
      <>
        <path d="M5 8h14l-1 13H6L5 8z" {...s} />
        <path d="M9 8V6a3 3 0 016 0v2" {...s} />
      </>
    ),
    fabric: (
      <>
        <circle cx="9" cy="12" r="6" {...s} />
        <circle cx="9" cy="12" r="2" {...s} />
        <path d="M9 6h9a3 3 0 013 3v6a3 3 0 01-3 3H9" {...s} />
      </>
    ),
    spool: (
      <>
        <path d="M6 3h12M6 21h12M8 3v18M16 3v18" {...s} />
        <path d="M8 7h8M8 11h8M8 15h8" {...s} />
      </>
    ),
    molecule: (
      <>
        <circle cx="12" cy="5" r="2.2" {...s} />
        <circle cx="5.5" cy="17" r="2.2" {...s} />
        <circle cx="18.5" cy="17" r="2.2" {...s} />
        <path d="M11 7l-4.5 8M13 7l4.5 8M7.7 17h8.6" {...s} />
      </>
    ),
    drop: <path d="M12 3s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z" {...s} />,
    gear: (
      <>
        <circle cx="12" cy="12" r="3" {...s} />
        <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z" {...s} />
      </>
    ),
  };
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24">
      {paths[name]}
    </svg>
  );
}

function VerifiedIcon() {
  return (
    <svg aria-label="Proveedor verificado" className="h-4 w-4 shrink-0 text-[#1f5bff]" role="img" viewBox="0 0 24 24">
      <path d="M12 2l2.4 1.8 3-.2.9 2.9 2.5 1.7-1 2.8 1 2.8-2.5 1.7-.9 2.9-3-.2L12 22l-2.4-1.8-3 .2-.9-2.9-2.5-1.7 1-2.8-1-2.8 2.5-1.7.9-2.9 3 .2L12 2z" fill="currentColor" />
      <path d="M8.5 12.2l2.3 2.3 4.7-4.7" fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function ExternalIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

// globals.css fija `a { color: inherit }` fuera de las capas de Tailwind: en
// los <Link> el color del texto va en un <span> hijo.
const primaryCta =
  'inline-flex h-12 items-center justify-center gap-2 rounded-[10px] bg-[#1f5bff] px-6 text-sm font-semibold shadow-[0_14px_36px_rgba(31,91,255,0.35)] transition hover:-translate-y-0.5 hover:bg-[#194ee6]';

/* Página ------------------------------------------------------------------ */

/* El buscador del header y las categorías de la home llegan con ?q=. El
   fallback renderiza la página completa sin filtro, así el HTML estático no
   queda vacío mientras se leen los parámetros. */
export default function ProductosPage() {
  return (
    <Suspense fallback={<ProductosContent initialQuery="" />}>
      <ProductosWithQuery />
    </Suspense>
  );
}

function ProductosWithQuery() {
  const searchParams = useSearchParams();
  const query = searchParams?.get('q') ?? '';
  return <ProductosContent key={query} initialQuery={query} />;
}

function ProductosContent({ initialQuery }: { initialQuery: string }) {
  // El fallback arranca vacio a proposito: si se usa como estado inicial, la
  // pantalla pinta el catalogo hardcodeado y despues lo reemplaza por el de la
  // base, y se ve el parpadeo. Solo se usa si la API falla o viene vacia.
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [supplierCount, setSupplierCount] = useState<number | null>(null);
  const [suppliers, setSuppliers] = useState<SupplierDirectoryRecord[]>([]);
  const [suppliersLoaded, setSuppliersLoaded] = useState(false);
  const [search, setSearch] = useState(initialQuery);
  const [productFamily, setProductFamily] = useState('all');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [catalog, stats, directory] = await Promise.allSettled([
        atarApi.getRequestCategories(),
        atarApi.getMarketplaceStats(),
        atarApi.getMarketplaceSuppliers(),
      ]);
      if (cancelled) {
        return;
      }
      setCategories(
        catalog.status === 'fulfilled' && catalog.value.length > 0 ? catalog.value.map(mapCategory) : FALLBACK_CATEGORIES,
      );
      if (stats.status === 'fulfilled') {
        setSupplierCount(stats.value.suppliersCount);
      }
      // Verificados primero: son los que se muestran como destacados.
      setSuppliers(
        directory.status === 'fulfilled'
          ? [...directory.value].sort((left, right) => Number(right.isVerified) - Number(left.isVerified))
          : [],
      );
      setSuppliersLoaded(true);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const products = useMemo(() => buildFeaturedProducts(suppliers), [suppliers]);
  const visibleFamilies = useMemo(() => FAMILIES.filter((family) => familyMatches(family, search)), [search]);
  const visibleProducts = useMemo(() => {
    const needle = normalize(search.trim());
    return products
      .filter((product) => productFamily === 'all' || product.family?.id === productFamily)
      .filter(
        (product) =>
          !needle ||
          normalize([product.name, product.supplier.name, product.family?.title ?? '', ...product.supplier.tags].join(' ')).includes(needle),
      )
      .slice(0, 12);
  }, [productFamily, products, search]);
  const featuredSuppliers = suppliers.slice(0, 5);

  const supplierLabel = supplierCount === null ? '1200+' : `${supplierCount}+`;
  const supplierBadge = supplierCount === null ? '+1200' : `+${supplierCount}`;

  function showFamilyProducts(familyId: string) {
    setProductFamily(familyId);
    document.getElementById('destacados')?.scrollIntoView({ behavior: 'smooth' });
  }

  function showAllFamilies() {
    setSearch('');
    setProductFamily('all');
  }

  return (
    <main className="min-h-screen bg-white text-slate-950">
      {/* ==================== HERO ==================== */}
      <section className="relative isolate overflow-hidden bg-[#070b17] text-white">
        <Image alt="" className="animate-hero-zoom object-cover object-center" fill priority sizes="100vw" src="/hero-industria.png" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#070b17_0%,rgba(7,11,23,0.94)_38%,rgba(7,11,23,0.78)_70%,rgba(7,11,23,0.6)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(7,11,23,0.75)_0%,transparent_35%)]" />

        <div className="relative z-10 mx-auto w-full max-w-[1440px] px-6 py-16 lg:px-12 lg:py-20">
          <div className="grid items-center gap-12 lg:grid-cols-[0.52fr_0.48fr] lg:gap-16">
            <div>
              <p className="animate-fade-up text-[11px] font-semibold uppercase tracking-[0.32em] text-[#4f7bff]">
                Productos y soluciones
              </p>
              <h1 className="animate-fade-up mt-5 text-[2.4rem] [animation-delay:100ms] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-5xl lg:text-[3.5rem]">
                Todo lo que tu empresa necesita,{' '}
                <span className="text-[#4f7bff]">en un solo lugar.</span>
              </h1>
              <p className="animate-fade-up mt-6 max-w-xl text-lg leading-8 text-white/70 [animation-delay:200ms]">
                Explorá nuestras categorías y conectá con proveedores especializados en cada solución
                industrial.
              </p>

              <div className="animate-fade-up relative mt-8 max-w-xl [animation-delay:300ms]">
                <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                <input
                  className="w-full rounded-full border border-white/20 bg-white/10 py-3.5 pl-12 pr-4 text-sm text-white outline-none backdrop-blur-sm transition placeholder:text-white/45 focus:border-[#4f7bff] focus:bg-white/15"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar productos, aplicaciones o industrias..."
                  value={search}
                />
              </div>

              <div className="animate-fade-up mt-5 flex flex-wrap items-center gap-2 text-sm text-white/50 [animation-delay:400ms]">
                <span className="font-medium">Más buscados:</span>
                {MOST_SEARCHED.map((term) => (
                  <button
                    key={term}
                    className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium text-white/70 transition hover:border-white/45 hover:text-white"
                    onClick={() => setSearch(term)}
                    type="button"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>

            {/* Collage: las fotos entran escalonadas y flotan suave. */}
            <div className="relative">
              <div className="grid grid-cols-2 grid-rows-2 gap-3">
                <div className="animate-fade-up group relative row-span-2 h-full min-h-[300px] overflow-hidden rounded-2xl [animation-delay:250ms] bg-white/5 ring-1 ring-white/10">
                  <Image alt="" className="object-cover transition duration-700 group-hover:scale-110" fill sizes="(min-width:1024px) 26vw, 50vw" src={HERO_IMAGES[0]} />
                </div>
                <div className="animate-fade-up group relative h-36 overflow-hidden rounded-2xl [animation-delay:400ms] bg-white/5 ring-1 ring-white/10 sm:h-40">
                  <Image alt="" className="object-cover transition duration-700 group-hover:scale-110" fill sizes="(min-width:1024px) 26vw, 50vw" src={HERO_IMAGES[1]} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="animate-fade-up group relative overflow-hidden rounded-2xl [animation-delay:550ms] bg-white/5 ring-1 ring-white/10">
                    <Image alt="" className="object-cover transition duration-700 group-hover:scale-110" fill sizes="13vw" src={HERO_IMAGES[2]} />
                  </div>
                  <div className="animate-fade-up group relative overflow-hidden rounded-2xl [animation-delay:700ms] bg-white/5 ring-1 ring-white/10">
                    <Image alt="" className="object-cover transition duration-700 group-hover:scale-110" fill sizes="13vw" src={HERO_IMAGES[3]} />
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2">
              <div className="animate-badge-in flex items-center gap-3 rounded-2xl border border-white/15 bg-[#0a0f1e] px-5 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2f6bff]/15 text-[#4f7bff]">
                  <UsersIcon />
                </span>
                <div>
                  <p className="text-base font-semibold text-white">{supplierBadge}</p>
                  <p className="text-xs text-white/50">Proveedores activos</p>
                </div>
              </div>
              </div>
            </div>
          </div>

          {/* Los numeros, en la misma fila que usa la home. */}
          <div className="mt-20 flex flex-wrap gap-x-12 gap-y-5 lg:mt-16">
            {[
              { icon: <CubeIcon className="h-5 w-5" />, v: `${categories.length}+`, l: 'categorías de productos' },
              { icon: <UsersIcon className="h-5 w-5" />, v: supplierLabel, l: 'proveedores especializados' },
              { icon: <ShieldIcon className="h-5 w-5" />, v: 'Verificados', l: 'calidad y confianza' },
              { icon: <TrendingIcon className="h-5 w-5" />, v: 'Actualizado', l: 'nuevos productos cada semana' },
            ].map((item, index) => (
              <div key={item.l} className="animate-fade-up flex items-center gap-2.5" style={{ animationDelay: `${600 + index * 100}ms` }}>
                <span className="text-[#4f7bff]">{item.icon}</span>
                <p className="text-sm text-white/75">
                  <span className="font-semibold text-white">{item.v}</span> {item.l}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== FAMILIAS ==================== */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-[1440px] px-6 py-16 lg:px-12 lg:py-20">
          <Reveal className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Categorías</p>
              <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-slate-950 sm:text-[2.4rem]">
                Explorá por familias de productos.
              </h2>
            </div>
            <button className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[#1f5bff]" onClick={showAllFamilies} type="button">
              Ver todas las categorías
              <ArrowIcon />
            </button>
          </Reveal>

          {visibleFamilies.length === 0 ? (
            <div className="mt-10 rounded-[14px] border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center text-sm text-slate-500">
              No hay familias que coincidan con “{search}”.
            </div>
          ) : (
            <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
              {visibleFamilies.map((family, index) => (
                <Reveal key={family.id} className="h-full" delay={index * 70}>
                  <FamilyCard family={family} onSelect={() => showFamilyProducts(family.id)} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ==================== PRODUCTOS DESTACADOS ==================== */}
      <section className="scroll-mt-24 bg-[#f5f7fc]" id="destacados">
        <div className="mx-auto w-full max-w-[1440px] px-6 py-16 lg:px-12 lg:py-20">
          <Reveal className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-[-0.03em] text-slate-950 sm:text-[2.2rem]">Productos destacados</h2>
              <p className="mt-2 text-[15px] text-slate-500">Explorá algunos de los productos más buscados de la industria.</p>
            </div>
            <Link className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold" href="/proveedores">
              <span className="inline-flex items-center gap-2 text-[#1f5bff]">
                Ver todos los proveedores
                <ArrowIcon />
              </span>
            </Link>
          </Reveal>

          <div className="mt-8 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <FilterTab active={productFamily === 'all'} onClick={() => setProductFamily('all')}>
              Todos
            </FilterTab>
            {FAMILIES.map((family) => (
              <FilterTab key={family.id} active={productFamily === family.id} onClick={() => setProductFamily(family.id)}>
                {family.tab}
              </FilterTab>
            ))}
          </div>

          {!suppliersLoaded ? (
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-[330px] animate-pulse rounded-[14px] bg-white" />
              ))}
            </div>
          ) : visibleProducts.length === 0 ? (
            <div className="mt-6 rounded-[14px] border border-dashed border-slate-300 bg-white px-5 py-12 text-center text-sm text-slate-500">
              Todavía no hay productos publicados en esta familia.{' '}
              <Link className="font-semibold" href={newRequestHref()}>
                <span className="text-[#1f5bff]">Pedí una cotización igual</span>
              </Link>{' '}
              y te conectamos con proveedores.
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
              {visibleProducts.map((product, index) => (
                <Reveal key={product.id} className="h-full" delay={index * 60}>
                  <ProductCard product={product} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ==================== ASESORAMIENTO ==================== */}
      <section className="relative isolate overflow-hidden bg-[#0b1530] text-white">
        <div className="absolute inset-y-0 right-0 w-full lg:w-[62%]">
          <Image alt="" className="object-cover object-[15%_center]" fill sizes="(min-width:1024px) 62vw, 100vw" src="/heroatarweb.png" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#0b1530_0%,#0b1530_36%,rgba(11,21,48,0.7)_52%,rgba(11,21,48,0.15)_75%)]" />
        <div className="absolute inset-0 bg-[#0b1530]/60 lg:hidden" />
        <Reveal className="relative z-10 mx-auto w-full max-w-[1440px] px-6 py-16 lg:px-12 lg:py-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">¿No sabés exactamente qué producto necesitás?</p>
          <h2 className="mt-4 max-w-[620px] text-3xl font-bold leading-[1.1] tracking-[-0.03em] sm:text-[2.6rem]">
            Contanos tu necesidad y encontramos la mejor solución.
          </h2>
          <p className="mt-4 max-w-[520px] text-base leading-7 text-white/75">
            Nuestro equipo te ayuda a encontrar los productos y proveedores ideales para tu proceso de producción.
          </p>
          <Link className={`${primaryCta} mt-8`} href={newRequestHref()}>
            <span className="inline-flex items-center gap-2 text-white">
              Iniciar cotización
              <ArrowIcon />
            </span>
          </Link>
        </Reveal>
      </section>

      {/* ==================== EMPRESAS ==================== */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-[1440px] px-6 py-16 lg:px-12 lg:py-20">
          <Reveal className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-[-0.03em] text-slate-950 sm:text-[2.2rem]">Empresas que producen para esta industria</h2>
              <p className="mt-2 text-[15px] text-slate-500">Conocé algunas de las empresas verificadas que ofrecen estos productos.</p>
            </div>
            <Link className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold" href="/proveedores">
              <span className="inline-flex items-center gap-2 text-[#1f5bff]">
                Ver todos los proveedores
                <ArrowIcon />
              </span>
            </Link>
          </Reveal>

          {!suppliersLoaded ? (
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-[150px] animate-pulse rounded-[14px] bg-slate-100" />
              ))}
            </div>
          ) : featuredSuppliers.length === 0 ? (
            <div className="mt-10 rounded-[14px] border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center text-sm text-slate-500">
              Pronto vas a ver acá a las empresas de la red.
            </div>
          ) : (
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {featuredSuppliers.map((supplier, index) => (
                <Reveal key={supplier.id} className="h-full" delay={index * 70}>
                  <SupplierCard supplier={supplier} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ==================== CTA FINAL ==================== */}
      <section className="relative isolate overflow-hidden bg-[#0b1530] text-white">
        <Image alt="" className="object-cover object-center opacity-45" fill sizes="100vw" src="/telaplana.png" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#0b1530_0%,rgba(11,21,48,0.85)_45%,rgba(11,21,48,0.55)_100%)]" />
        <Reveal className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-6 py-16 lg:flex-row lg:items-center lg:justify-between lg:px-12 lg:py-20">
          <div>
            <p className="text-base font-medium text-white/80">¿Ya sabés qué necesitás?</p>
            <h2 className="mt-3 max-w-[760px] text-3xl font-bold leading-[1.1] tracking-[-0.03em] sm:text-[2.6rem]">
              Pedí cotizaciones a proveedores especializados en la industria de la rafia.
            </h2>
            <p className="mt-4 text-base text-white/75">Compará opciones, precios y condiciones de empresas verificadas.</p>
          </div>
          <Link className={`${primaryCta} h-14 shrink-0 px-8 text-base`} href={newRequestHref()}>
            <span className="inline-flex items-center gap-2 text-white">
              Iniciar cotización
              <ArrowIcon />
            </span>
          </Link>
        </Reveal>
      </section>
    </main>
  );
}

/* Subcomponentes ---------------------------------------------------------- */

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
      className={`shrink-0 rounded-[10px] px-4 py-2 text-sm font-medium transition ${
        active
          ? 'bg-[#1f5bff] text-white shadow-[0_8px_20px_rgba(31,91,255,0.25)]'
          : 'border border-slate-200 bg-white text-slate-700 hover:border-[#1f5bff]/40 hover:text-slate-950'
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function FamilyCard({ family, onSelect }: { family: ProductFamily; onSelect: () => void }) {
  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-[14px] border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-[#1f5bff]/40 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <Image
          alt={family.title}
          className="object-cover transition duration-500 group-hover:scale-105"
          fill
          sizes="(min-width:1280px) 16vw, (min-width:640px) 45vw, 90vw"
          src={family.image}
        />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <span className="text-[#1f5bff]">
          <FamilyIcon name={family.icon} />
        </span>
        <h3 className="mt-3 text-[17px] font-bold leading-6 tracking-[-0.01em] text-slate-950">{family.title}</h3>
        <ul className="mt-3 space-y-1.5">
          {family.items.map((item) => (
            <li key={item.label}>
              <Link className="text-[13px] transition hover:underline" href={newRequestHref(item.category)}>
                <span className="text-slate-500 hover:text-[#1f5bff]">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
        <button
          aria-label={`Ver productos de ${family.title}`}
          className="mt-auto flex h-8 w-8 items-center justify-center self-end rounded-full pt-0 text-[#1f5bff] transition hover:bg-[#eef2ff] group-hover:translate-x-0.5"
          onClick={onSelect}
          type="button"
        >
          <ArrowIcon />
        </button>
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: FeaturedProduct }) {
  const location = [product.supplier.city, product.supplier.country].filter(Boolean).join(', ');
  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-[14px] border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <Image
          alt={product.name}
          className="object-cover transition duration-500 group-hover:scale-105"
          fill
          sizes="(min-width:1280px) 16vw, (min-width:768px) 33vw, 50vw"
          src={product.image}
        />
      </div>
      <div className="flex flex-1 flex-col p-3.5">
        <p className="line-clamp-2 text-[14px] font-bold leading-5 text-slate-950">{product.name}</p>
        <p className="mt-0.5 truncate text-[12px] text-slate-500">
          {[product.family?.title, location].filter(Boolean).join(' · ')}
        </p>
        <Link className="mt-3 flex min-w-0 items-center gap-1.5" href={`/productos/${product.supplier.slug}`}>
          <span className="truncate text-[13px] font-medium text-slate-800 hover:underline">{product.supplier.name}</span>
          {product.supplier.isVerified ? <VerifiedIcon /> : null}
        </Link>
        {typeof product.supplier.minimumOrder === 'number' ? (
          <span className="mt-2 self-start rounded-md bg-[#eef3ff] px-2 py-1 text-[11px] font-medium text-slate-600">
            Mín. {product.supplier.minimumOrder.toLocaleString('es-AR')}
          </span>
        ) : null}
        <div className="mt-auto pt-3">
          <Link
            className="flex h-9 items-center justify-center gap-1.5 rounded-[8px] border border-[#1f5bff]/40 text-[12px] font-semibold transition hover:bg-[#f3f6ff]"
            href={newRequestHref(product.category)}
          >
            <span className="inline-flex items-center gap-1.5 text-[#1f5bff]">
              Solicitar cotización
              <ArrowIcon className="h-3.5 w-3.5" />
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function SupplierCard({ supplier }: { supplier: SupplierDirectoryRecord }) {
  const subtitle = supplier.mainProducts[0] ?? getSupplierCategoryLabel(supplier.companyType);
  const tags = Array.from(new Set([...supplier.mainProducts, ...supplier.tags])).slice(0, 3);
  return (
    <Link
      className="group relative flex h-full flex-col rounded-[14px] border border-slate-200 bg-white p-4 transition duration-300 hover:-translate-y-1 hover:border-[#1f5bff]/40 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
      href={`/productos/${supplier.slug}`}
    >
      <span className="absolute right-3 top-3 text-slate-400 transition group-hover:text-[#1f5bff]">
        <ExternalIcon />
      </span>
      <div className="flex items-center gap-3 pr-6">
        <CompanyLogo
          className="h-11 w-11"
          logoUrl={supplier.logoUrl}
          name={supplier.name}
          rounded="rounded-[10px]"
          textClassName="text-[13px]"
          tone="bg-[#eef3ff] text-[#1f5bff]"
        />
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[15px] font-bold text-slate-950">
            <span className="truncate">{supplier.name}</span>
            {supplier.isVerified ? <VerifiedIcon /> : null}
          </p>
          <p className="truncate text-[12px] text-slate-500">{subtitle}</p>
        </div>
      </div>
      {tags.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span key={tag} className="rounded-md border border-slate-200 px-2 py-0.5 text-[11px] text-slate-600">
              {tag}
            </span>
          ))}
        </div>
      ) : null}
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
