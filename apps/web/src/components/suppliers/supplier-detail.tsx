'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ConversationPanel from '@/components/chat/conversation-panel';
import {
  atarApi,
  type RequestCatalogCategoryRecord,
  type SupplierDirectoryRecord,
} from '@/lib/atar-api';
import { getSupplierCategoryLabel, getSupplierLocation } from '@/lib/provider-directory';
import { getPrimaryMembershipRole, loadSession } from '@/lib/session';

/**
 * `app` se renderiza dentro del dashboard (conserva header y navegacion de la
 * plataforma); `public` es la ficha abierta del sitio. Solo cambia a donde
 * vuelve el boton de retroceso y el ancho del contenedor.
 */
type SupplierDetailVariant = 'app' | 'public';

/** Compara sin acentos ni mayusculas: "Films plasticos" == "Films Plásticos". */
function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();
}

function Icon({ name, className = 'h-4 w-4' }: { name: string; className?: string }) {
  const common = {
    className,
    fill: 'none' as const,
    viewBox: '0 0 24 24',
    'aria-hidden': true,
  };
  const stroke = {
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 2,
  };

  if (name === 'shield') {
    return (
      <svg {...common}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" {...stroke} />
      </svg>
    );
  }

  if (name === 'check-circle') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" {...stroke} />
        <path d="M8.5 12.5l2.5 2.5 4.5-5" {...stroke} />
      </svg>
    );
  }

  if (name === 'pin') {
    return (
      <svg {...common}>
        <path d="M12 21s7-5.5 7-11a7 7 0 10-14 0c0 5.5 7 11 7 11z" {...stroke} />
        <circle cx="12" cy="10" r="2.5" {...stroke} />
      </svg>
    );
  }

  if (name === 'clock') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" {...stroke} />
        <path d="M12 7v5l3 2" {...stroke} />
      </svg>
    );
  }

  if (name === 'box') {
    return (
      <svg {...common}>
        <path d="M21 8l-9-5-9 5 9 5 9-5z" {...stroke} />
        <path d="M3 8v8l9 5 9-5V8" {...stroke} />
      </svg>
    );
  }

  if (name === 'calendar') {
    return (
      <svg {...common}>
        <rect height="17" rx="2" width="18" x="3" y="4" {...stroke} />
        <path d="M8 2v4M16 2v4M3 10h18" {...stroke} />
      </svg>
    );
  }

  if (name === 'users') {
    return (
      <svg {...common}>
        <path d="M16 20v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" {...stroke} />
        <circle cx="9" cy="7" r="4" {...stroke} />
        <path d="M22 20v-2a4 4 0 00-3-3.87" {...stroke} />
      </svg>
    );
  }

  if (name === 'award') {
    return (
      <svg {...common}>
        <circle cx="12" cy="9" r="6" {...stroke} />
        <path d="M8.5 14L7 22l5-2.5L17 22l-1.5-8" {...stroke} />
      </svg>
    );
  }

  if (name === 'truck') {
    return (
      <svg {...common}>
        <path d="M3 16V6h11v10M14 9h4l3 3v4h-7" {...stroke} />
        <circle cx="7" cy="17.5" r="1.8" {...stroke} />
        <circle cx="17.5" cy="17.5" r="1.8" {...stroke} />
      </svg>
    );
  }

  if (name === 'card') {
    return (
      <svg {...common}>
        <rect height="14" rx="2" width="18" x="3" y="5" {...stroke} />
        <path d="M3 10h18" {...stroke} />
      </svg>
    );
  }

  if (name === 'file') {
    return (
      <svg {...common}>
        <path d="M14 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V8l-5-6z" {...stroke} />
        <path d="M14 2v6h6" {...stroke} />
      </svg>
    );
  }

  if (name === 'arrow-left') {
    return (
      <svg {...common}>
        <path d="M19 12H5M11 18l-6-6 6-6" {...stroke} />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" {...stroke} />
    </svg>
  );
}

/** Titulo de seccion con su icono, como en el resto del dashboard. */
function SectionTitle({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-[13px] font-semibold text-slate-950">
      <span className="text-indigo-600">
        <Icon name={icon} className="h-3.5 w-3.5" />
      </span>
      {children}
    </p>
  );
}

function InfoTile({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 text-slate-400">
        <Icon name={icon} className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] leading-4 text-slate-500">{label}</p>
        <p className="mt-0.5 text-[13px] font-semibold text-slate-950">{value}</p>
      </div>
    </div>
  );
}

export default function SupplierDetail({
  slug,
  variant,
}: {
  slug: string;
  variant: SupplierDetailVariant;
}) {
  const router = useRouter();
  const [supplier, setSupplier] = useState<SupplierDirectoryRecord | null>(null);
  // Catalogo de la app: de aca sale la foto de cada producto principal.
  const [categories, setCategories] = useState<RequestCatalogCategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // El formulario de cotizacion vive en un panel que se abre desde el boton:
  // la ficha se lee primero y se pide despues.
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quantity, setQuantity] = useState('1');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const backHref = variant === 'app' ? '/dashboard/comprador/proveedores' : '/proveedores';

  useEffect(() => {
    let cancelled = false;

    async function loadSupplier() {
      try {
        setLoading(true);
        setError(null);
        const response = await atarApi.getMarketplaceSupplierBySlug(slug);
        if (!cancelled) {
          setSupplier(response);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'No se pudo cargar la ficha del proveedor.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadSupplier();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    let cancelled = false;

    // Si falla, los productos caen al icono generico: no bloquea la ficha.
    atarApi
      .getRequestCategories()
      .then((result) => {
        if (!cancelled) {
          setCategories(result);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleQuickRequest() {
    if (!supplier) {
      return;
    }

    const session = loadSession();
    if (!session) {
      router.push('/acceso');
      return;
    }

    if (getPrimaryMembershipRole(session.user) !== 'BUYER') {
      router.push('/dashboard/proveedor');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const request = await atarApi.createRequest(
        {
          title: `Solicitud de cotización - ${supplier.name}`,
          productName: supplier.genericCode ?? supplier.name,
          category: getSupplierCategoryLabel(supplier.companyType),
          description:
            description.trim() ||
            `Solicitud dirigida al proveedor ${supplier.name}.`,
          quantityRequested: Number(quantity) || undefined,
          preferredSupplierName: supplier.name,
          privateRequest: true,
          dueDate: dueDate || undefined,
          status: 'PUBLISHED',
        },
        session.accessToken,
      );

      router.push(`/dashboard/comprador/solicitudes/${request.id}`);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'No se pudo crear la solicitud desde esta ficha.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500 shadow-sm">
        Cargando ficha del proveedor...
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-slate-950">Proveedor no encontrado</h1>
        <p className="mt-2 text-sm text-slate-500">
          {error ?? 'La ficha solicitada no existe en la base actual.'}
        </p>
        <Link
          className="mt-4 inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          href={backHref}
        >
          Volver a proveedores
        </Link>
      </div>
    );
  }

  const location = getSupplierLocation(supplier.city, supplier.country);
  const leadTime =
    typeof supplier.leadTimeDays === 'number' ? `${supplier.leadTimeDays} días` : 'No informado';
  const about = supplier.about ?? supplier.description;
  // Cada producto se cruza con el catalogo para mostrar su foto real.
  const productImages = new Map(
    categories
      .filter((category) => category.imageSrc)
      .map((category) => [normalize(category.label), category.imageSrc as string]),
  );

  /**
   * Todo lo que la empresa cargo en su catalogo aparece aca, sin que tenga que
   * destacarlo a mano. `mainProducts` solo decide el orden: lo destacado va
   * primero y el resto del catalogo lo sigue.
   */
  const destacados = supplier.mainProducts;
  const resto = supplier.categories.filter(
    (label) => !destacados.some((item) => normalize(item) === normalize(label)),
  );
  const products = [...destacados, ...resto].map((label) => ({
    label,
    imageSrc: productImages.get(normalize(label)) ?? null,
  }));
  // El encabezado resume; el catalogo completo se lista mas abajo.
  const catalogCount = products.length;

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
      <div className="space-y-4">
        {/* ------------------------------------------------------- encabezado */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-600">
                <Icon name="shield" className="h-3 w-3" />
                {getSupplierCategoryLabel(supplier.companyType)}
              </span>

              <h1 className="mt-3 text-[26px] font-bold leading-tight tracking-[-0.03em] text-slate-950 sm:text-[32px]">
                {supplier.name} <span className="text-indigo-600">en solicitud rápida</span>
              </h1>

              <p className="mt-2 max-w-[560px] text-[13px] leading-5 text-slate-600">
                {supplier.description ?? 'Proveedor activo registrado en la red ATAR.'}
              </p>

              {supplier.isVerified || catalogCount > 0 ? (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {supplier.isVerified ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[12px] font-semibold text-emerald-700">
                      <Icon name="check-circle" className="h-3.5 w-3.5" />
                      Proveedor verificado
                    </span>
                  ) : null}
                  {catalogCount > 0 ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-[12px] font-semibold text-indigo-700">
                      <Icon name="box" className="h-3.5 w-3.5" />
                      {catalogCount} {catalogCount === 1 ? 'producto' : 'productos'} en catálogo
                    </span>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Link
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50"
                  href={backHref}
                >
                  <Icon name="arrow-left" className="h-4 w-4 text-slate-400" />
                  Volver a proveedores
                </Link>
                <button
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-[13px] font-semibold text-white shadow-[0_12px_28px_rgba(79,70,229,0.24)] transition hover:bg-indigo-500 disabled:opacity-60"
                  onClick={() => setQuoteOpen((open) => !open)}
                  type="button"
                >
                  <Icon name="send" className="h-4 w-4" />
                  Solicitar cotización
                </button>
              </div>
            </div>

            <aside className="grid shrink-0 gap-3 sm:grid-cols-3 lg:w-[190px] lg:grid-cols-1">
              <div className="flex h-[86px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-3">
                {supplier.logoUrl ? (
                  // El logo puede ser un data URI subido desde Configuracion,
                  // que el optimizador de next/image no procesa.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={supplier.name}
                    className="max-h-full max-w-full object-contain"
                    src={supplier.logoUrl}
                  />
                ) : (
                  <span className="text-lg font-bold tracking-tight text-slate-400">
                    {supplier.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  <Icon name="pin" className="h-3 w-3" />
                  Ubicación
                </p>
                <p className="mt-1.5 text-[13px] font-semibold text-slate-950">{location}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  <Icon name="clock" className="h-3 w-3" />
                  Lead time promedio
                </p>
                <p className="mt-1.5 text-[13px] font-semibold text-slate-950">{leadTime}</p>
              </div>
            </aside>
          </div>

          {/* Panel de cotizacion: se despliega desde el boton de arriba. */}
          {quoteOpen ? (
            <div className="mt-5 rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4">
              <p className="text-[13px] font-semibold text-slate-950">Solicitar cotización</p>
              <p className="mt-0.5 text-[11px] text-slate-600">
                Publica una solicitud privada dirigida a este proveedor.
              </p>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-[11px] font-medium text-slate-600">Cantidad solicitada</span>
                  <input
                    className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[13px] outline-none transition focus:border-indigo-500"
                    min="1"
                    onChange={(event) => setQuantity(event.target.value)}
                    step="1"
                    type="number"
                    value={quantity}
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] font-medium text-slate-600">Fecha límite</span>
                  <input
                    className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[13px] outline-none transition focus:border-indigo-500"
                    onChange={(event) => setDueDate(event.target.value)}
                    type="date"
                    value={dueDate}
                  />
                </label>
              </div>

              <label className="mt-3 block">
                <span className="text-[11px] font-medium text-slate-600">Aclaraciones</span>
                <textarea
                  className="mt-1 min-h-[88px] w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] outline-none transition focus:border-indigo-500"
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Especificaciones adicionales, entrega, embalaje o condiciones."
                  value={description}
                />
              </label>

              {error ? (
                <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[12px] text-rose-700">
                  {error}
                </div>
              ) : null}

              <button
                className="mt-3 inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-[13px] font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
                disabled={submitting}
                onClick={() => void handleQuickRequest()}
                type="button"
              >
                {submitting ? 'Creando solicitud...' : 'Enviar solicitud'}
              </button>
            </div>
          ) : null}
        </section>

        {/* ------------------------------------------------------------ ficha */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="flex items-center gap-2 text-[17px] font-bold tracking-[-0.02em] text-slate-950">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Icon name="file" className="h-4 w-4" />
            </span>
            Ficha real del proveedor
          </p>

          <div className="mt-5 grid gap-6 lg:grid-cols-2 lg:gap-8">
            {/* --- columna izquierda: identidad y operacion --- */}
            <div className="space-y-5 lg:border-r lg:border-slate-200 lg:pr-8">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Icon name="file" className="h-3.5 w-3.5 text-indigo-500" />
                    Código genérico
                  </p>
                  <p className="mt-1.5 text-[17px] font-bold tracking-tight text-slate-950">
                    {supplier.genericCode || 'No informado'}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Icon name="box" className="h-3.5 w-3.5 text-indigo-500" />
                    Pedido mínimo
                  </p>
                  <p className="mt-1.5 text-[17px] font-bold tracking-tight text-slate-950">
                    {typeof supplier.minimumOrder === 'number'
                      ? new Intl.NumberFormat('es-AR').format(supplier.minimumOrder)
                      : 'No informado'}
                  </p>
                </div>
              </div>

              {supplier.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {supplier.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-medium text-slate-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}

              {about ? (
                <div>
                  <SectionTitle icon="shield">Sobre la empresa</SectionTitle>
                  <p className="mt-2 text-[13px] leading-6 text-slate-600">{about}</p>
                </div>
              ) : null}

              {supplier.foundedYear || supplier.employeeRange || supplier.certifications.length > 0 ? (
                <div className="grid gap-4 border-t border-slate-200 pt-4 sm:grid-cols-3">
                  {supplier.foundedYear ? (
                    <InfoTile
                      icon="calendar"
                      label="Año de fundación"
                      value={String(supplier.foundedYear)}
                    />
                  ) : null}
                  {supplier.employeeRange ? (
                    <InfoTile icon="users" label="Empleados" value={supplier.employeeRange} />
                  ) : null}
                  {supplier.certifications.length > 0 ? (
                    <InfoTile
                      icon="award"
                      label="Certificaciones"
                      value={supplier.certifications.join(' · ')}
                    />
                  ) : null}
                </div>
              ) : null}

              {supplier.logisticsSummary || supplier.financingSummary ? (
                <div className="border-t border-slate-200 pt-4">
                  <SectionTitle icon="truck">Cobertura y condiciones</SectionTitle>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    {supplier.logisticsSummary ? (
                      <InfoTile
                        icon="truck"
                        label="Logística"
                        value={supplier.logisticsSummary}
                      />
                    ) : null}
                    {supplier.financingSummary ? (
                      <InfoTile
                        icon="card"
                        label="Financiación"
                        value={supplier.financingSummary}
                      />
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>

            {/* --- columna derecha: que hace y que puede --- */}
            <div className="space-y-6">
              {products.length > 0 ? (
                <div>
                  <SectionTitle icon="box">Productos principales</SectionTitle>
                  <div className="mt-3 grid grid-cols-3 gap-2.5 sm:grid-cols-4 xl:grid-cols-5">
                    {products.map((product) => (
                      <div
                        key={product.label}
                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-center"
                      >
                        <div className="relative h-16 w-full bg-slate-50">
                          {product.imageSrc ? (
                            <Image
                              alt={product.label}
                              className="object-contain p-1.5"
                              fill
                              sizes="120px"
                              src={product.imageSrc}
                            />
                          ) : (
                            <span className="flex h-full items-center justify-center text-indigo-500">
                              <Icon name="box" className="h-5 w-5" />
                            </span>
                          )}
                        </div>
                        <span className="block px-1.5 py-2 text-[10px] font-medium leading-3 text-slate-600">
                          {product.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {supplier.capabilities.length > 0 ? (
                <div>
                  <SectionTitle icon="check-circle">Capacidades</SectionTitle>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {supplier.capabilities.map((capability) => (
                      <span
                        key={capability}
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700"
                      >
                        <Icon name="check-circle" className="h-3.5 w-3.5 text-indigo-500" />
                        {capability}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {products.length === 0 && supplier.capabilities.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-[12px] text-slate-500">
                  Este proveedor todavía no cargó sus productos y capacidades.
                </p>
              ) : null}
            </div>
          </div>
        </section>
      </div>

      {/* ------------------------------------------------------------- chat */}
      <div className="xl:sticky xl:top-4">
        <div className="h-[560px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:h-[calc(100vh-120px)]">
          <ConversationPanel
            mode="product"
            productName={supplier.genericCode ?? supplier.name}
            supplierCompanyName={supplier.name}
            title={`Chat con ${supplier.name}`}
            description="Consultá disponibilidad, condiciones o capacidad antes de pedir la cotización."
          />
        </div>
      </div>
    </div>
  );
}
