'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import ConversationPanel from '@/components/chat/conversation-panel';
import SupplierDetailDesktop from './supplier-detail-desktop';
import SupplierDetailMobile from './supplier-detail-mobile';
import {
  atarApi,
  type RequestCatalogCategoryRecord,
  type SupplierDirectoryRecord,
} from '@/lib/atar-api';
import { LoadingState } from '@/components/ui/spinner';
import { getSupplierCategoryLabel, getSupplierLocation } from '@/lib/provider-directory';
import { getPrimaryMembershipRole, loadSession } from '@/lib/session';
import { FALLBACK_REQUEST_CATEGORIES } from '@/lib/request-catalog-fallback';

/**
 * `app` se renderiza dentro del dashboard (conserva header y navegacion de la
 * plataforma); `public` es la ficha abierta del sitio. Solo cambia a donde
 * vuelve el boton de retroceso y el ancho del contenedor.
 */
/**
 * - `public`: sitio abierto.
 * - `app`: dentro del panel del comprador.
 * - `preview`: el proveedor mirando su propia ficha dentro de su panel; sin
 *   chat ni cotización (no se cotiza ni se chatea a sí mismo).
 */
type SupplierDetailVariant = 'app' | 'public' | 'preview';

/** Compara sin acentos ni mayusculas: "Films plasticos" == "Films Plásticos". */
function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();
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
  // En mobile/tablet el chat no se muestra junto a la ficha: se abre a
  // pantalla completa desde el botón "Chatear".
  const [chatOpen, setChatOpen] = useState(false);
  const chatRef = useRef<HTMLDivElement | null>(null);

  // "Contactar": debajo de xl abre el chat a pantalla completa; desde xl el
  // chat ya está a la vista, así que lleva el foco al campo de mensaje.
  function contact() {
    if (window.matchMedia('(min-width: 1280px)').matches) {
      chatRef.current?.querySelector<HTMLElement>('input[type="text"], input:not([type]), textarea')?.focus();
      return;
    }
    setChatOpen(true);
  }

  const isPreview = variant === 'preview';
  const backHref =
    variant === 'app'
      ? '/dashboard/comprador/proveedores'
      : isPreview
        ? '/dashboard/proveedor/configuracion'
        : '/proveedores';

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
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 shadow-sm">
        <LoadingState label="Cargando ficha del proveedor..." />
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
  // Cada producto se cruza con el catalogo para mostrar su foto real.
  const productImages = new Map(
    // El catálogo de respaldo va primero: si el API no trae imagen, queda la local.
    [...FALLBACK_REQUEST_CATEGORIES, ...categories]
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

  // Formulario de solicitud rápida: lo comparten la vista mobile y la de escritorio.
  const quoteForm = (
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4">
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
  );

  return (
    <>
      <SupplierDetailMobile
        backHref={backHref}
        location={location}
        onOpenChat={() => setChatOpen(true)}
        onToggleQuote={() => setQuoteOpen((open) => !open)}
        products={products}
        quoteForm={quoteForm}
        quoteOpen={quoteOpen}
        supplier={supplier}
        variant={variant}
      />
    {/* Escritorio: una sola superficie blanca a todo el ancho. Desde xl ocupa
        exactamente el alto visible; el contenido y el chat scrollean por dentro. */}
    <div
      className={
        isPreview
          ? 'lg:-mx-6 lg:-mt-4 lg:bg-white'
          : `lg:bg-white xl:grid xl:grid-cols-[minmax(0,1fr)_400px] xl:grid-rows-[auto_minmax(0,1fr)] 2xl:grid-cols-[minmax(0,1fr)_440px] ${
              variant === 'app'
                ? 'lg:-mx-4 lg:-my-3 xl:-mx-6 xl:h-[calc(100dvh-102px)]'
                : 'lg:-mx-6 lg:-my-4 xl:h-[calc(100dvh-69px)]'
            }`
      }
    >
      <SupplierDetailDesktop
        backHref={backHref}
        location={location}
        onContact={contact}
        onToggleQuote={() => setQuoteOpen((open) => !open)}
        products={products}
        quoteForm={quoteForm}
        quoteOpen={quoteOpen}
        supplier={supplier}
        variant={variant}
      />

      {/* ------------------------------------------------------------- chat */}
      {/* Desde xl va fijo a la derecha. Debajo de xl queda oculto y se abre a
          pantalla completa con el botón "Chatear". */}
      {isPreview ? null : (
      <div className={chatOpen ? 'fixed inset-0 z-50 flex flex-col bg-white xl:static xl:z-auto xl:block xl:min-h-0 xl:border-l xl:border-slate-200' : 'hidden xl:block xl:min-h-0 xl:border-l xl:border-slate-200'} ref={chatRef}>
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3 xl:hidden">
          <p className="truncate text-[15px] font-semibold text-slate-950">Chat con {supplier.name}</p>
          <button
            aria-label="Cerrar chat"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600"
            onClick={() => setChatOpen(false)}
            type="button"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
            </svg>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden bg-white xl:h-full">
          <ConversationPanel
            mode="product"
            productName={supplier.genericCode ?? supplier.name}
            supplierCompanyName={supplier.name}
            title={`Chat con ${supplier.name}`}
            description="Consultá disponibilidad, condiciones o capacidad antes de pedir la cotización."
          />
        </div>
      </div>
      )}
    </div>
    </>
  );
}
