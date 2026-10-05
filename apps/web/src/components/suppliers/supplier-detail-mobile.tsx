'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { SUPPLIER_ROLE_LABELS, type SupplierDirectoryRecord } from '@/lib/atar-api';

/**
 * Ficha del proveedor en mobile: portada, pestañas que siguen el scroll y
 * secciones en una sola página. Solo muestra datos que la empresa cargó; lo
 * que no existe en la ficha (mail, teléfono, capacidad mensual…) no se inventa:
 * el contacto va siempre por el chat interno.
 */

export type Variant = 'app' | 'public' | 'preview';
export type Product = { label: string; imageSrc: string | null };
type SectionKey = 'resumen' | 'productos' | 'ficha' | 'ubicacion';

const TABS: { key: SectionKey; label: string }[] = [
  { key: 'resumen', label: 'Resumen' },
  { key: 'productos', label: 'Productos' },
  { key: 'ficha', label: 'Ficha técnica' },
  { key: 'ubicacion', label: 'Ubicación' },
];

export type IconName =
  | 'back' | 'share' | 'chat' | 'pin' | 'users' | 'calendar' | 'truck' | 'award' | 'check' | 'file' | 'id'
  | 'percent' | 'box' | 'cog' | 'clock' | 'card' | 'shield' | 'send' | 'external';

const ICONS: Record<IconName, ReactNode> = {
  back: <path d="M15 18l-6-6 6-6" />,
  share: (
    <>
      <circle cx="18" cy="5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="19" r="2.5" />
      <path d="M8.2 10.9l7.6-4.6M8.2 13.1l7.6 4.6" />
    </>
  ),
  chat: <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />,
  pin: (
    <>
      <path d="M12 21s7-5.4 7-11a7 7 0 10-14 0c0 5.6 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  users: <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M16 3.13A4 4 0 0116 11" />,
  calendar: (
    <>
      <rect height="16" rx="2" width="18" x="3" y="5" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </>
  ),
  truck: (
    <>
      <path d="M2 6h12v10H2zM14 9h4l4 4v3h-8" />
      <circle cx="6" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
    </>
  ),
  award: (
    <>
      <circle cx="12" cy="9" r="6" />
      <path d="M8.5 14L7 22l5-3 5 3-1.5-8" />
    </>
  ),
  check: <path d="M20 6L9 17l-5-5" />,
  file: (
    <>
      <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z" />
      <path d="M14 3v5h5" />
    </>
  ),
  id: (
    <>
      <rect height="14" rx="2" width="18" x="3" y="5" />
      <path d="M7 10h4M7 14h6M15 10h2" />
    </>
  ),
  percent: <path d="M19 5L5 19M7.5 9a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM16.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />,
  box: (
    <>
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <path d="M3.3 7.3L12 12l8.7-4.7M12 22V12" />
    </>
  ),
  cog: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  card: (
    <>
      <rect height="14" rx="2" width="20" x="2" y="5" />
      <path d="M2 10h20" />
    </>
  ),
  shield: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  send: <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />,
  external: <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5" />,
};

export function Icon({ name, className = 'h-4 w-4' }: { name: IconName; className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
      {ICONS[name]}
    </svg>
  );
}

export type Row = { icon: IconName; label: string; value: string };
export type Highlight = { icon: IconName; text: string };

/** Quita los huecos de una lista armada con condiciones. */
function compact<T>(items: (T | null | false | undefined)[]): T[] {
  return items.filter((item): item is T => Boolean(item));
}

function row(icon: IconName, label: string, value: string): Row {
  return { icon, label, value };
}

export function Rows({ rows }: { rows: Row[] }) {
  return (
    <dl className="divide-y divide-slate-100">
      {rows.map((row) => (
        <div key={row.label} className="grid grid-cols-[20px_minmax(0,0.85fr)_minmax(0,1.15fr)] items-start gap-3 py-3">
          <span className="mt-0.5 text-indigo-600">
            <Icon name={row.icon} />
          </span>
          <dt className="text-[13px] text-slate-500">{row.label}</dt>
          <dd className="text-[13px] font-medium text-slate-950">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Datos derivados de la ficha, compartidos por la vista mobile y la de escritorio. */
export function buildSupplierView(supplier: SupplierDirectoryRecord, products: Product[]) {
  const about = supplier.about ?? supplier.description;
  const subtitle = [supplier.supplierRole ? SUPPLIER_ROLE_LABELS[supplier.supplierRole] : null, products.slice(0, 2).map((item) => item.label).join(' y ')]
    .filter(Boolean)
    .join(' de ');
  // La portada usa la foto de un producto; el ícono genérico de "A medida" no sirve de portada.
  const cover = products.find((item) => item.imageSrc && item.imageSrc !== '/amedida.png')?.imageSrc ?? '/hero-industria.png';
  const leadTime = typeof supplier.leadTimeDays === 'number' ? `${supplier.leadTimeDays} días` : null;
  const minimumOrder = typeof supplier.minimumOrder === 'number' ? new Intl.NumberFormat('es-AR').format(supplier.minimumOrder) : null;
  const featured = supplier.mainProducts.length > 0 ? products.filter((item) => supplier.mainProducts.includes(item.label)) : products.slice(0, 4);

  const highlights = compact<Highlight>([
    supplier.city ? { icon: 'pin', text: `Opera desde ${supplier.city}` } : null,
    leadTime ? { icon: 'truck', text: `Entrega en ${leadTime}` } : null,
    supplier.certifications.length > 0 ? { icon: 'award', text: 'Calidad certificada' } : null,
    { icon: 'chat', text: 'Atención por chat' },
  ]);

  const companyRows = compact<Row>([
    supplier.legalName ? row('users', 'Razón social', supplier.legalName) : null,
    supplier.taxId ? row('id', 'CUIT', supplier.taxId) : null,
    supplier.taxCondition ? row('percent', 'Condición IVA', supplier.taxCondition) : null,
    supplier.foundedYear ? row('calendar', 'Año de fundación', String(supplier.foundedYear)) : null,
    supplier.employeeRange ? row('users', 'Empleados', supplier.employeeRange) : null,
    supplier.supplierRole ? row('shield', 'Tipo de empresa', SUPPLIER_ROLE_LABELS[supplier.supplierRole]) : null,
    supplier.genericCode ? row('file', 'Código genérico', supplier.genericCode) : null,
  ]);

  const capacityRows = compact<Row>([
    supplier.capabilities.length > 0 ? row('cog', 'Procesos', supplier.capabilities.join(', ')) : null,
    leadTime ? row('clock', 'Plazo de entrega', leadTime) : null,
    minimumOrder ? row('box', 'Pedido mínimo', minimumOrder) : null,
    supplier.certifications.length > 0 ? row('award', 'Control de calidad', supplier.certifications.join(' · ')) : null,
    supplier.logisticsSummary ? row('truck', 'Logística', supplier.logisticsSummary) : null,
    supplier.financingSummary ? row('card', 'Financiación', supplier.financingSummary) : null,
  ]);

  return { about, subtitle, cover, leadTime, minimumOrder, featured, highlights, companyRows, capacityRows };
}

export default function SupplierDetailMobile({
  supplier,
  products,
  variant,
  backHref,
  location,
  quoteOpen,
  quoteForm,
  onToggleQuote,
  onOpenChat,
}: {
  supplier: SupplierDirectoryRecord;
  products: Product[];
  variant: Variant;
  backHref: string;
  location: string;
  quoteOpen: boolean;
  /** Formulario de solicitud rápida (lo arma la ficha contenedora). */
  quoteForm: ReactNode;
  onToggleQuote: () => void;
  onOpenChat: () => void;
}) {
  const isPreview = variant === 'preview';
  const [active, setActive] = useState<SectionKey>('resumen');
  const [stuck, setStuck] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [shared, setShared] = useState(false);
  const tabsRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Record<SectionKey, HTMLElement | null>>({ resumen: null, productos: null, ficha: null, ubicacion: null });

  // La barra compacta aparece cuando las pestañas salen de pantalla, y la
  // pestaña activa sigue a la sección que se está leyendo. Va con position
  // fixed y no sticky: el <body> tiene overflow-x-hidden, que anula el sticky.
  useEffect(() => {
    const tabs = tabsRef.current;
    if (!tabs) {
      return;
    }
    // "Pegada" = las pestañas en flujo ya quedaron arriba del borde superior.
    const heroObserver = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 },
    );
    heroObserver.observe(tabs);

    // Pestaña activa: la última sección cuyo inicio ya pasó el tercio superior
    // de la pantalla. El scroll puede ser de la ventana o del contenedor del
    // panel, por eso se escucha en captura sobre el documento.
    let frame = 0;
    const updateActive = () => {
      frame = 0;
      const line = window.innerHeight * 0.35;
      let current: SectionKey = 'resumen';
      for (const tab of TABS) {
        const node = sectionRefs.current[tab.key];
        if (node && node.getBoundingClientRect().top <= line) {
          current = tab.key;
        }
      }
      const last = sectionRefs.current.ubicacion;
      if (last && last.getBoundingClientRect().bottom <= window.innerHeight) {
        current = 'ubicacion';
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(updateActive);
      }
    };
    document.addEventListener('scroll', onScroll, { capture: true, passive: true });

    return () => {
      heroObserver.disconnect();
      document.removeEventListener('scroll', onScroll, { capture: true });
      window.cancelAnimationFrame(frame);
    };
  }, []);

  function goTo(key: SectionKey) {
    setActive(key);
    sectionRefs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function share() {
    const url = `${window.location.origin}/productos/${supplier.slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: supplier.name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShared(true);
      window.setTimeout(() => setShared(false), 2000);
    } catch {
      // El usuario canceló o el navegador no lo permite: no hay nada que hacer.
    }
  }

  const { about, subtitle, cover, featured, highlights, companyRows, capacityRows } = buildSupplierView(supplier, products);

  const tabsNav = (
    <nav className="flex overflow-x-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          aria-current={active === tab.key}
          className={`relative flex-1 whitespace-nowrap px-1.5 py-3.5 text-[13.5px] ${active === tab.key ? 'font-semibold text-indigo-700' : 'text-slate-500'}`}
          onClick={() => goTo(tab.key)}
          type="button"
        >
          {tab.label}
          {active === tab.key ? <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-indigo-600" /> : null}
        </button>
      ))}
    </nav>
  );

  const bleed = variant === 'app' ? '-mx-3 -mt-3' : variant === 'preview' ? '-mx-4 -mt-5' : '-mx-4 -mt-4';
  const requestHref = (category: string) => `/dashboard/comprador/solicitudes/nueva?category=${encodeURIComponent(category)}`;
  const mapQuery = encodeURIComponent(location);
  const roundButton = 'flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-800 shadow-[0_6px_18px_rgba(15,23,42,0.18)]';
  const heading = 'text-[17px] font-bold tracking-[-0.02em] text-slate-950';

  return (
    <div className={`${bleed} bg-white pb-28 lg:hidden`}>
      {/* ---------------------------------------------------------- portada */}
      <div className="relative h-[230px] bg-slate-200">
        <Image alt="" className="object-cover" fill priority sizes="100vw" src={cover} />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/35 via-transparent to-slate-950/10" />
        <Link aria-label="Volver" className={`absolute left-4 top-4 ${roundButton}`} href={backHref}>
          <span className="text-slate-800">
            <Icon className="h-5 w-5" name="back" />
          </span>
        </Link>
        <button aria-label="Compartir ficha" className={`absolute right-4 top-4 ${roundButton}`} onClick={() => void share()} type="button">
          <Icon className="h-[18px] w-[18px]" name={shared ? 'check' : 'share'} />
        </button>
      </div>

      {/* -------------------------------------------------------- identidad */}
      <div className="relative -mt-6 rounded-t-[26px] bg-white px-4 pb-4">
        <div className="flex gap-3.5">
          <div className="-mt-10 flex h-[104px] w-[104px] shrink-0 items-center justify-center overflow-hidden rounded-[20px] border border-slate-100 bg-white p-2.5 shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
            {supplier.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt={supplier.name} className="max-h-full max-w-full object-contain" src={supplier.logoUrl} />
            ) : (
              <span className="text-[26px] font-bold tracking-tight text-indigo-600">{supplier.name.slice(0, 2).toUpperCase()}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            {supplier.isVerified ? (
              <span className="absolute -top-4 left-[136px] inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-indigo-700 shadow-[0_6px_18px_rgba(15,23,42,0.14)]">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-white">
                  <Icon className="h-2.5 w-2.5" name="check" />
                </span>
                Proveedor verificado
              </span>
            ) : null}
            <h1 className="pt-5 text-[19px] font-bold leading-6 tracking-[-0.02em] text-slate-950">{supplier.name}</h1>
            {subtitle ? <p className="mt-1 text-[13px] leading-5 text-slate-500">{subtitle}</p> : null}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <Icon className="h-3.5 w-3.5 text-slate-500" name="pin" />
            {location}
          </span>
          {supplier.employeeRange ? (
            <span className="inline-flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5 text-slate-500" name="users" />
              {supplier.employeeRange} empleados
            </span>
          ) : null}
          {supplier.foundedYear ? (
            <span className="inline-flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5 text-slate-500" name="calendar" />
              Desde {supplier.foundedYear}
            </span>
          ) : null}
        </div>

        {isPreview ? (
          <>
            <p className="mt-4 rounded-xl bg-indigo-50 px-3.5 py-2.5 text-[12px] leading-5 text-indigo-800">
              Así ven tu empresa los compradores. A ellos les aparecen los botones para contactarte y pedirte una cotización.
            </p>
            <Link className="mt-3 flex h-12 items-center justify-center rounded-xl bg-indigo-600 text-[14px] font-semibold" href="/dashboard/proveedor/configuracion">
              <span className="text-white">Editar mi ficha</span>
            </Link>
          </>
        ) : (
          <div className="mt-4 grid grid-cols-[0.8fr_1.2fr] gap-2.5">
            <button
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 text-[14px] font-semibold text-indigo-700"
              onClick={onOpenChat}
              type="button"
            >
              <Icon className="h-[18px] w-[18px]" name="chat" />
              Contactar
            </button>
            <button
              className="inline-flex h-12 items-center justify-center rounded-xl bg-indigo-600 text-[14px] font-semibold text-white shadow-[0_10px_24px_rgba(79,70,229,0.28)]"
              onClick={onToggleQuote}
              type="button"
            >
              Solicitar cotización
            </button>
          </div>
        )}
        {quoteOpen && !isPreview ? <div className="mt-3">{quoteForm}</div> : null}
      </div>

      {/* --------------------------------------------------------- pestañas */}
      <div ref={tabsRef} className="border-b border-slate-100 bg-white">
        {tabsNav}
      </div>
      {stuck ? (
        <div className="fixed inset-x-0 top-0 z-30 border-b border-slate-100 bg-white/95 pt-[env(safe-area-inset-top)] shadow-[0_6px_18px_rgba(15,23,42,0.06)] backdrop-blur lg:hidden">
          <div className="flex items-center gap-2 px-3 pt-2">
            <Link aria-label="Volver" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" href={backHref}>
              <span className="text-slate-800">
                <Icon className="h-5 w-5" name="back" />
              </span>
            </Link>
            <p className="min-w-0 flex-1 truncate text-[15px] font-semibold text-slate-950">{supplier.name}</p>
            <button aria-label="Compartir ficha" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-100 text-slate-700" onClick={() => void share()} type="button">
              <Icon name={shared ? 'check' : 'share'} />
            </button>
          </div>
          {tabsNav}
        </div>
      ) : null}

      <div className="space-y-7 px-4 pt-5">
        {/* ---------------------------------------------------------- resumen */}
        <section ref={(node) => { sectionRefs.current.resumen = node; }} className="scroll-mt-28 space-y-5" data-section="resumen">
          {about ? (
            <div>
              <h2 className={heading}>Sobre la empresa</h2>
              <p className={`mt-2 text-[14px] leading-6 text-slate-600 ${aboutOpen ? '' : 'line-clamp-3'}`}>{about}</p>
              {about.length > 150 ? (
                <button className="mt-1.5 text-[14px] font-medium text-indigo-600" onClick={() => setAboutOpen((open) => !open)} type="button">
                  {aboutOpen ? 'Ver menos' : 'Ver más'}
                </button>
              ) : null}
            </div>
          ) : null}

          <div className={`grid divide-x divide-slate-100 ${highlights.length >= 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
            {highlights.map((item) => (
              <div key={item.text} className="flex flex-col items-center px-1.5 py-1 text-center">
                <span className="text-indigo-600">
                  <Icon className="h-5 w-5" name={item.icon} />
                </span>
                <p className="mt-2 text-[11px] leading-4 text-slate-700">{item.text}</p>
              </div>
            ))}
          </div>

          {featured.length > 0 ? (
            <div>
              <div className="flex items-center justify-between">
                <h2 className={heading}>Categorías que ofrece</h2>
                <button className="text-[13px] font-medium text-indigo-600" onClick={() => goTo('productos')} type="button">
                  Ver todas
                </button>
              </div>
              <div className="-mx-4 mt-3 flex gap-2.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {featured.map((product) => (
                  <div key={product.label} className="w-[104px] shrink-0">
                    <div className="relative h-[92px] overflow-hidden rounded-xl bg-slate-100">
                      {product.imageSrc ? <Image alt="" className="object-cover" fill sizes="104px" src={product.imageSrc} /> : null}
                    </div>
                    <p className="truncate pt-1.5 text-[12px] font-medium text-slate-800">{product.label}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {supplier.certifications.length > 0 ? (
            <div>
              <h2 className={heading}>Certificaciones</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {supplier.certifications.map((cert) => (
                  <span key={cert} className="inline-flex items-center gap-2 rounded-xl border border-slate-100 px-3 py-2.5 text-[13px] font-semibold text-slate-800">
                    <span className="text-indigo-600">
                      <Icon name="award" />
                    </span>
                    {cert}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        {/* -------------------------------------------------------- productos */}
        <section ref={(node) => { sectionRefs.current.productos = node; }} className="scroll-mt-28" data-section="productos">
          <div className="flex items-center justify-between">
            <h2 className={heading}>Catálogo completo</h2>
            <span className="text-[13px] text-slate-500">
              {products.length} {products.length === 1 ? 'producto' : 'productos'}
            </span>
          </div>
          {products.length === 0 ? (
            <p className="mt-3 rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-[13px] text-slate-500">
              Este proveedor todavía no cargó su catálogo.
            </p>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-3">
              {products.map((product) => (
                <div key={product.label}>
                  <div className="relative h-[112px] overflow-hidden rounded-xl bg-slate-100">
                    {product.imageSrc ? <Image alt="" className="object-cover" fill sizes="50vw" src={product.imageSrc} /> : null}
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <p className="truncate text-[14px] font-semibold text-slate-950">{product.label}</p>
                    {isPreview ? null : (
                      <Link className="shrink-0 text-[13px] font-semibold" href={requestHref(product.label)}>
                        <span className="text-indigo-600">Cotizar</span>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ----------------------------------------------------- ficha técnica */}
        <section ref={(node) => { sectionRefs.current.ficha = node; }} className="scroll-mt-28 space-y-5" data-section="ficha">
          {companyRows.length > 0 ? (
            <div>
              <h2 className={heading}>Ficha técnica de la empresa</h2>
              <div className="mt-1">
                <Rows rows={companyRows} />
              </div>
            </div>
          ) : null}
          {capacityRows.length > 0 ? (
            <div>
              <h2 className={heading}>Capacidades productivas</h2>
              <div className="mt-1">
                <Rows rows={capacityRows} />
              </div>
            </div>
          ) : null}
        </section>

        {/* --------------------------------------------------------- ubicación */}
        <section ref={(node) => { sectionRefs.current.ubicacion = node; }} className="scroll-mt-28" data-section="ubicacion">
          <div className="flex items-center justify-between">
            <h2 className={heading}>Ubicación</h2>
            <a className="text-[13px] font-medium" href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`} rel="noreferrer" target="_blank">
              <span className="text-indigo-600">Ver en mapa</span>
            </a>
          </div>
          <div className="relative mt-3 h-[190px] overflow-hidden rounded-2xl border border-slate-100 bg-slate-100">
            <iframe
              className="absolute inset-0 h-full w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps?q=${mapQuery}&z=11&output=embed`}
              title={`Mapa de ${location}`}
            />
            <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2.5 rounded-xl bg-white px-3 py-2 shadow-[0_8px_22px_rgba(15,23,42,0.16)]">
              <span className="text-indigo-600">
                <Icon className="h-5 w-5" name="pin" />
              </span>
              <span>
                <span className="block text-[13px] font-semibold leading-4 text-slate-950">{supplier.name}</span>
                <span className="block text-[11px] text-slate-500">{location}</span>
              </span>
            </div>
          </div>

          {isPreview ? null : (
            <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl bg-indigo-50 px-4 py-4">
              <div className="min-w-0">
                <h2 className="text-[15px] font-bold text-slate-950">¿Tenés una consulta?</h2>
                <p className="mt-0.5 text-[12px] leading-4 text-slate-600">El contacto es por el chat de ATAR.</p>
              </div>
              <button
                className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-[13px] font-semibold text-white"
                onClick={onOpenChat}
                type="button"
              >
                <Icon name="send" />
                Enviar mensaje
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
