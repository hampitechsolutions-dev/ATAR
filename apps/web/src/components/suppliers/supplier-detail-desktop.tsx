'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { type SupplierDirectoryRecord } from '@/lib/atar-api';
import { Icon, Rows, buildSupplierView, type Product, type Variant } from './supplier-detail-mobile';

/**
 * Ficha del proveedor en escritorio (lg+): portada a todo el ancho, identidad,
 * pestañas y el contenido en una sola superficie blanca. No hay tarjetas dentro
 * de tarjetas: las secciones se separan con espacio y líneas finas.
 *
 * Devuelve dos bloques hermanos (cabecera y contenido) para que la ficha
 * contenedora los ubique en su grilla junto al chat.
 */

type SectionKey = 'resumen' | 'productos' | 'ficha' | 'ubicacion';

const TABS: { key: SectionKey; label: string }[] = [
  { key: 'resumen', label: 'Resumen' },
  { key: 'productos', label: 'Productos' },
  { key: 'ficha', label: 'Ficha técnica' },
  { key: 'ubicacion', label: 'Ubicación' },
];

export default function SupplierDetailDesktop({
  supplier,
  products,
  variant,
  backHref,
  location,
  quoteOpen,
  quoteForm,
  onToggleQuote,
  onContact,
}: {
  supplier: SupplierDirectoryRecord;
  products: Product[];
  variant: Variant;
  backHref: string;
  location: string;
  quoteOpen: boolean;
  quoteForm: ReactNode;
  onToggleQuote: () => void;
  onContact: () => void;
}) {
  const isPreview = variant === 'preview';
  const [active, setActive] = useState<SectionKey>('resumen');
  const [shared, setShared] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Record<SectionKey, HTMLElement | null>>({ resumen: null, productos: null, ficha: null, ubicacion: null });
  const { about, subtitle, cover, featured, highlights, companyRows, capacityRows } = buildSupplierView(supplier, products);

  // La pestaña activa sigue a la sección visible. El scroll puede ser del
  // contenido (xl) o de la página (lg), por eso se escucha en captura.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const container = contentRef.current;
      if (!container) {
        return;
      }
      const line = Math.max(container.getBoundingClientRect().top, 0) + 140;
      let current: SectionKey = 'resumen';
      for (const tab of TABS) {
        const node = sectionRefs.current[tab.key];
        if (node && node.getBoundingClientRect().top <= line) {
          current = tab.key;
        }
      }
      if (container.scrollHeight > container.clientHeight && container.scrollTop + container.clientHeight >= container.scrollHeight - 4) {
        current = 'ubicacion';
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(update);
      }
    };
    document.addEventListener('scroll', onScroll, { capture: true, passive: true });
    return () => {
      document.removeEventListener('scroll', onScroll, { capture: true });
      window.cancelAnimationFrame(frame);
    };
  }, []);

  function goTo(key: SectionKey) {
    setActive(key);
    sectionRefs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function share() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/productos/${supplier.slug}`);
      setShared(true);
      window.setTimeout(() => setShared(false), 2000);
    } catch {
      // Sin permiso para el portapapeles: no hay nada que hacer.
    }
  }

  const requestHref = (category: string) => `/dashboard/comprador/solicitudes/nueva?category=${encodeURIComponent(category)}`;
  const mapQuery = encodeURIComponent(location);
  const heading = 'text-[17px] font-bold tracking-[-0.02em] text-slate-950';
  const chip = 'inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[12px] text-slate-700';

  return (
    <>
      {/* ------------------------------------------------- portada + identidad */}
      <header className="hidden bg-white lg:block xl:col-span-2">
        <div className="relative h-[130px] bg-slate-200 2xl:h-[170px]">
          <Image alt="" className="object-cover" fill priority sizes="100vw" src={cover} />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/25 to-transparent" />
        </div>

        <div className="flex items-start gap-5 px-6">
          <div className="relative -mt-10 flex h-[112px] w-[112px] shrink-0 items-center justify-center overflow-hidden rounded-[18px] border border-slate-100 bg-white p-3 shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
            {supplier.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt={supplier.name} className="max-h-full max-w-full object-contain" src={supplier.logoUrl} />
            ) : (
              <span className="text-[28px] font-bold tracking-tight text-indigo-600">{supplier.name.slice(0, 2).toUpperCase()}</span>
            )}
          </div>

          <div className="min-w-0 flex-1 pt-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[26px] font-bold leading-tight tracking-[-0.03em] text-slate-950">{supplier.name}</h1>
              {supplier.isVerified ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-white">
                    <Icon className="h-2.5 w-2.5" name="check" />
                  </span>
                  Proveedor verificado
                </span>
              ) : null}
            </div>
            {subtitle ? <p className="mt-0.5 text-[14px] text-slate-500">{subtitle}</p> : null}
            <div className="mt-2.5 flex flex-wrap gap-2">
              <span className={chip}>
                <Icon className="h-3.5 w-3.5 text-slate-500" name="pin" />
                {location}
              </span>
              {supplier.employeeRange ? (
                <span className={chip}>
                  <Icon className="h-3.5 w-3.5 text-slate-500" name="users" />
                  {supplier.employeeRange} empleados
                </span>
              ) : null}
              {supplier.foundedYear ? (
                <span className={chip}>
                  <Icon className="h-3.5 w-3.5 text-slate-500" name="calendar" />
                  Desde {supplier.foundedYear}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 pt-4">
            <Link aria-label="Volver" className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 transition hover:bg-slate-50" href={backHref}>
              <span className="text-slate-600">
                <Icon className="h-5 w-5" name="back" />
              </span>
            </Link>
            <button
              aria-label="Copiar enlace de la ficha"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
              onClick={() => void share()}
              title={shared ? 'Enlace copiado' : 'Copiar enlace'}
              type="button"
            >
              <Icon className="h-[18px] w-[18px]" name={shared ? 'check' : 'share'} />
            </button>
            {isPreview ? (
              <Link className="inline-flex h-11 items-center rounded-xl bg-indigo-600 px-5 text-[14px] font-semibold transition hover:bg-indigo-500" href="/dashboard/proveedor/configuracion">
                <span className="text-white">Editar mi ficha</span>
              </Link>
            ) : (
              <>
                <button
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 text-[14px] font-semibold text-indigo-700 transition hover:bg-indigo-100"
                  onClick={onContact}
                  type="button"
                >
                  <Icon className="h-[18px] w-[18px]" name="chat" />
                  Contactar
                </button>
                <button
                  className="inline-flex h-11 items-center rounded-xl bg-indigo-600 px-5 text-[14px] font-semibold text-white shadow-[0_10px_24px_rgba(79,70,229,0.28)] transition hover:bg-indigo-500"
                  onClick={() => {
                    onToggleQuote();
                    // El formulario se abre arriba del contenido: se sube para que quede a la vista.
                    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  type="button"
                >
                  Solicitar cotización
                </button>
              </>
            )}
          </div>
        </div>

        <nav className="mt-3 flex gap-1 border-b border-slate-200 px-4">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              aria-current={active === tab.key}
              className={`relative px-4 py-3 text-[14px] transition ${active === tab.key ? 'font-semibold text-indigo-700' : 'text-slate-500 hover:text-slate-800'}`}
              onClick={() => goTo(tab.key)}
              type="button"
            >
              {tab.label}
              {active === tab.key ? <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-indigo-600" /> : null}
            </button>
          ))}
        </nav>
      </header>

      {/* ------------------------------------------------------------ contenido */}
      <div ref={contentRef} className={`hidden bg-white px-6 pb-10 pt-6 [scrollbar-width:thin] lg:block ${isPreview ? '' : 'xl:min-h-0 xl:overflow-y-auto'}`}>
        {isPreview ? (
          <p className="mb-6 rounded-xl bg-indigo-50 px-4 py-2.5 text-[13px] text-indigo-800">
            Así ven tu empresa los compradores. A ellos además les aparecen los botones para contactarte y pedirte una cotización, y el chat.
          </p>
        ) : null}
        {quoteOpen && !isPreview ? <div className="mb-6 max-w-[720px]">{quoteForm}</div> : null}

        <div className="space-y-9">
          {/* ---------------------------------------------------------- resumen */}
          <section ref={(node) => { sectionRefs.current.resumen = node; }} className="scroll-mt-4 space-y-8">
            <div className="grid gap-10 2xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
              <div>
                <h2 className={heading}>Sobre la empresa</h2>
                <p className="mt-2 max-w-[720px] text-[14px] leading-6 text-slate-600">{about ?? 'Esta empresa todavía no cargó su descripción.'}</p>
                <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
                  {highlights.map((item) => (
                    <li key={item.text} className="flex items-center gap-2.5 text-[13px] text-slate-700">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                        <Icon className="h-[18px] w-[18px]" name={item.icon} />
                      </span>
                      {item.text}
                    </li>
                  ))}
                </ul>
              </div>
              {companyRows.length > 0 ? (
                <div>
                  <h2 className={heading}>Datos generales</h2>
                  <div className="mt-1">
                    <Rows rows={companyRows} />
                  </div>
                </div>
              ) : null}
            </div>

            {featured.length > 0 ? (
              <div>
                <div className="flex items-center justify-between">
                  <h2 className={heading}>Categorías que ofrece</h2>
                  <button className="text-[13px] font-medium text-indigo-600 hover:underline" onClick={() => goTo('productos')} type="button">
                    Ver todo el catálogo
                  </button>
                </div>
                <div className="mt-3 flex gap-4 overflow-x-auto pb-1 [scrollbar-width:thin]">
                  {featured.map((product) => (
                    <button key={product.label} className="group w-[150px] shrink-0 text-left" onClick={() => goTo('productos')} type="button">
                      <span className="relative block h-[104px] overflow-hidden rounded-xl bg-slate-100">
                        {product.imageSrc ? (
                          <Image alt="" className="object-cover transition duration-300 group-hover:scale-105" fill sizes="150px" src={product.imageSrc} />
                        ) : null}
                      </span>
                      <span className="mt-2 block truncate text-[13px] font-semibold text-slate-900">{product.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          {/* -------------------------------------------------------- productos */}
          <section ref={(node) => { sectionRefs.current.productos = node; }} className="scroll-mt-4 border-t border-slate-100 pt-8">
            <div className="flex items-center justify-between">
              <h2 className={heading}>Catálogo completo</h2>
              <span className="text-[13px] text-slate-500">
                {products.length} {products.length === 1 ? 'producto' : 'productos'}
              </span>
            </div>
            {products.length === 0 ? (
              <p className="mt-3 text-[13px] text-slate-500">Este proveedor todavía no cargó su catálogo.</p>
            ) : (
              <div className="mt-4 grid grid-cols-3 gap-x-5 gap-y-6 2xl:grid-cols-4">
                {products.map((product) => (
                  <div key={product.label}>
                    <div className="relative h-[130px] overflow-hidden rounded-xl bg-slate-100">
                      {product.imageSrc ? <Image alt="" className="object-cover" fill sizes="260px" src={product.imageSrc} /> : null}
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <p className="truncate text-[14px] font-semibold text-slate-950">{product.label}</p>
                      {isPreview ? null : (
                        <Link className="shrink-0 text-[13px] font-semibold hover:underline" href={requestHref(product.label)}>
                          <span className="text-indigo-600">Cotizar</span>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ---------------------------------------------------- ficha técnica */}
          <section ref={(node) => { sectionRefs.current.ficha = node; }} className="scroll-mt-4 border-t border-slate-100 pt-8">
            <div className="grid gap-10 2xl:grid-cols-2">
              {capacityRows.length > 0 ? (
                <div>
                  <h2 className={heading}>Capacidades productivas</h2>
                  <div className="mt-1">
                    <Rows rows={capacityRows} />
                  </div>
                </div>
              ) : null}
              {supplier.certifications.length > 0 || supplier.capabilities.length > 0 ? (
                <div className="space-y-6">
                  {supplier.capabilities.length > 0 ? (
                    <div>
                      <h2 className={heading}>Procesos</h2>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {supplier.capabilities.map((capability) => (
                          <span key={capability} className={chip}>
                            <Icon className="h-3.5 w-3.5 text-indigo-600" name="check" />
                            {capability}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {supplier.certifications.length > 0 ? (
                    <div>
                      <h2 className={heading}>Certificaciones</h2>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {supplier.certifications.map((cert) => (
                          <span key={cert} className={chip}>
                            <Icon className="h-3.5 w-3.5 text-indigo-600" name="award" />
                            {cert}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </section>

          {/* -------------------------------------------------------- ubicación */}
          <section ref={(node) => { sectionRefs.current.ubicacion = node; }} className="scroll-mt-4 border-t border-slate-100 pt-8">
            <div className="flex items-center justify-between">
              <h2 className={heading}>Ubicación</h2>
              <a className="text-[13px] font-medium hover:underline" href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`} rel="noreferrer" target="_blank">
                <span className="text-indigo-600">Ver en mapa</span>
              </a>
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-[13px] text-slate-600">
              <Icon className="h-3.5 w-3.5 text-indigo-600" name="pin" />
              {location}
            </p>
            <div className="relative mt-3 h-[240px] overflow-hidden rounded-xl bg-slate-100">
              <iframe
                className="absolute inset-0 h-full w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps?q=${mapQuery}&z=11&output=embed`}
                title={`Mapa de ${location}`}
              />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
