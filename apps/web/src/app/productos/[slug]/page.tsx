'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ConversationPanel from '@/components/chat/conversation-panel';
import {
  DashboardCard,
  DashboardHero,
  dashboardInputClassName,
  dashboardPrimaryButtonClassName,
  dashboardSecondaryButtonClassName,
} from '@/components/dashboard/dashboard-ui';
import { atarApi, type SupplierDirectoryRecord } from '@/lib/atar-api';
import { getSupplierCategoryLabel, getSupplierLocation } from '@/lib/provider-directory';
import { getPrimaryMembershipRole, loadSession } from '@/lib/session';

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const [supplier, setSupplier] = useState<SupplierDirectoryRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState('1');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof params.slug !== 'string') {
      return;
    }

    let cancelled = false;

    async function loadSupplier() {
      try {
        setLoading(true);
        setError(null);
        const response = await atarApi.getMarketplaceSupplierBySlug(params.slug);
        if (!cancelled) {
          setSupplier(response);
        }
      } catch (loadSupplierError) {
        if (!cancelled) {
          setError(
            loadSupplierError instanceof Error
              ? loadSupplierError.message
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
  }, [params.slug]);

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
            `Solicitud generada desde la ficha pública del proveedor ${supplier.name}.`,
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
      <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-950 lg:px-10">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm text-slate-600">Cargando ficha del proveedor...</p>
        </div>
      </main>
    );
  }

  if (!supplier) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-950 lg:px-10">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold">Proveedor no encontrado</h1>
          <p className="mt-3 text-sm text-slate-600">
            La ficha solicitada no existe en la base actual.
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
                disabled={submitting}
                onClick={() => void handleQuickRequest()}
                type="button"
              >
                {submitting ? 'Creando solicitud...' : 'Solicitar cotización'}
              </button>
            </>
          }
          aside={
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[1.5rem] border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
                <p className="text-xs uppercase tracking-[0.18em] text-indigo-600">Ubicación</p>
                <p className="mt-2 font-semibold">{getSupplierLocation(supplier.city, supplier.country)}</p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Lead time</p>
                <p className="mt-2 font-semibold text-slate-950">
                  {typeof supplier.leadTimeDays === 'number' ? `${supplier.leadTimeDays} días` : 'No informado'}
                </p>
              </div>
            </div>
          }
          description={supplier.description ?? 'Proveedor activo registrado en la red ATAR.'}
          eyebrow={getSupplierCategoryLabel(supplier.companyType)}
          title={
            <>
              {supplier.name} <span className="text-indigo-600">en solicitud rápida</span>
            </>
          }
        />

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <DashboardCard>
            <h2 className="text-xl font-semibold text-slate-950">Ficha real del proveedor</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Código genérico</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {supplier.genericCode || 'No informado'}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Pedido mínimo</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {typeof supplier.minimumOrder === 'number' ? supplier.minimumOrder : 'No informado'}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {supplier.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          </DashboardCard>

          <DashboardCard>
            <h2 className="text-xl font-semibold text-slate-950">Solicitar cotización</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Publica una solicitud privada dirigida a este proveedor sin cargar datos inventados.
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
                <span className="text-slate-700">Fecha límite</span>
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
          productName={supplier.genericCode ?? supplier.name}
          supplierCompanyName={supplier.name}
          title="Consultar antes de cotizar"
          description="Abre una conversación contextual con este proveedor para validar disponibilidad, condiciones o capacidad."
        />
      </div>
    </main>
  );
}
