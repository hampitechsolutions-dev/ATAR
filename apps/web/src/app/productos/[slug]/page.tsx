'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ConversationPanel from '@/components/chat/conversation-panel';
import {
  DashboardCard,
  DashboardHero,
  dashboardInputClassName,
  dashboardPrimaryButtonClassName,
  dashboardSecondaryButtonClassName,
} from '@/components/dashboard/dashboard-ui';
import { atarApi } from '@/lib/atar-api';
import { findProductBySlug } from '@/lib/product-catalog';
import { getPrimaryMembershipRole, loadSession } from '@/lib/session';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const product = findProductBySlug(typeof params.slug === 'string' ? params.slug : '');
  const [quantity, setQuantity] = useState('1');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numericQuantity = Number(quantity);
  const quantityError = useMemo(() => {
    if (!Number.isFinite(numericQuantity) || !Number.isInteger(numericQuantity)) {
      return 'La cantidad debe ser numerica y entera.';
    }

    if (numericQuantity < 1) {
      return 'La cantidad minima es 1.';
    }

    if (product && numericQuantity > product.stockAvailable) {
      return 'La cantidad supera el stock disponible informado.';
    }

    return null;
  }, [numericQuantity, product]);

  const estimatedTotal = product ? numericQuantity * product.unitReferencePrice : 0;

  async function handleQuickRequest() {
    if (!product || quantityError) {
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
          title: `Solicitud de cotizacion - ${product.name}`,
          productName: product.name,
          category: product.category,
          description:
            description.trim() ||
            `Solicitud generada desde ficha de producto para ${product.name}.`,
          quantityRequested: numericQuantity,
          referenceUnitPrice: product.unitReferencePrice,
          estimatedTotalCost: estimatedTotal,
          preferredSupplierName: product.supplierName,
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

  if (!product) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-950 lg:px-10">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold">Producto no encontrado</h1>
          <p className="mt-3 text-sm text-slate-600">
            La ficha solicitada no existe o fue removida del catálogo demo.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_20%,#eef2ff_100%)] px-6 py-10 text-slate-950 lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <DashboardHero
          actions={
            <>
              <Link className={dashboardSecondaryButtonClassName} href="/proveedores">
                Volver a proveedores
              </Link>
              <button
                className={dashboardPrimaryButtonClassName}
                disabled={Boolean(quantityError) || submitting}
                onClick={() => void handleQuickRequest()}
                type="button"
              >
                {submitting ? 'Creando solicitud...' : 'Solicitar cotizacion'}
              </button>
            </>
          }
          aside={
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[1.5rem] border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
                <p className="text-xs uppercase tracking-[0.18em] text-indigo-600">Proveedor</p>
                <p className="mt-2 font-semibold">{product.supplierName}</p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Lead time</p>
                <p className="mt-2 font-semibold text-slate-950">{product.leadTimeLabel}</p>
              </div>
            </div>
          }
          description={product.description}
          eyebrow={product.category}
          title={
            <>
              {product.name} <span className="text-indigo-600">en solicitud rapida</span>
            </>
          }
        />

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <DashboardCard>
            <h2 className="text-xl font-semibold text-slate-950">Especificaciones</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Precio unitario referencial</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {formatCurrency(product.unitReferencePrice)} / {product.unitLabel}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Stock informado</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {product.stockAvailable} {product.unitLabel}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {product.specs.map((spec) => (
                <span
                  key={spec}
                  className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700"
                >
                  {spec}
                </span>
              ))}
            </div>
          </DashboardCard>

          <DashboardCard>
            <h2 className="text-xl font-semibold text-slate-950">Solicitar cotizacion</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Completa la cantidad y publica la solicitud sin volver a cargar el contexto del producto.
            </p>

            <div className="mt-5 space-y-4">
              <label className="block space-y-2 text-sm">
                <span className="text-slate-700">Cantidad solicitada</span>
                <input
                  className={dashboardInputClassName}
                  min="1"
                  onChange={(event) => setQuantity(event.target.value)}
                  step="1"
                  type="number"
                  value={quantity}
                />
              </label>

              <label className="block space-y-2 text-sm">
                <span className="text-slate-700">Fecha limite</span>
                <input
                  className={dashboardInputClassName}
                  onChange={(event) => setDueDate(event.target.value)}
                  type="date"
                  value={dueDate}
                />
              </label>

              <label className="block space-y-2 text-sm">
                <span className="text-slate-700">Aclaraciones</span>
                <textarea
                  className={`${dashboardInputClassName} min-h-28 resize-y`}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Especificaciones adicionales, entrega, embalaje o condiciones."
                  value={description}
                />
              </label>

              <div className="rounded-[1.5rem] border border-indigo-200 bg-indigo-50 px-4 py-4 text-sm text-indigo-900">
                <p className="text-xs uppercase tracking-[0.18em] text-indigo-600">Costo estimado</p>
                <p className="mt-2 text-xl font-semibold">
                  {quantityError ? quantityError : formatCurrency(estimatedTotal)}
                </p>
              </div>

              {error ? (
                <div className="rounded-[1.25rem] bg-rose-100 px-4 py-3 text-sm text-rose-800">
                  {error}
                </div>
              ) : null}
            </div>
          </DashboardCard>
        </div>

        <ConversationPanel
          mode="product"
          productName={product.name}
          supplierCompanyName={product.supplierName}
          title="Consultar antes de cotizar"
          description="Abre una conversación contextual sobre este producto para validar especificaciones, disponibilidad o condiciones comerciales antes de publicar la solicitud."
        />
      </div>
    </main>
  );
}
