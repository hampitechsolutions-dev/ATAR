'use client';

import { useMemo } from 'react';
import SupplierDashboardShell from '@/components/dashboard/supplier-dashboard-shell';
import { useSupplierDashboardData } from '@/lib/dashboard-hooks';

function renderStars(value: number) {
  return Array.from({ length: 5 }, (_, index) => index < value);
}

export default function SupplierReviewsPage() {
  const { session, myQuotes, loading, error } = useSupplierDashboardData();

  const reviews = useMemo(() => {
    return myQuotes
      .filter((quote) => quote.status === 'AWARDED')
      .slice(0, 8)
      .map((quote, index) => ({
        id: quote.id,
        company: quote.request?.buyerCompany?.name ?? 'Cliente',
        title: quote.request?.title ?? 'Proceso comercial',
        rating: 5 - (index % 2),
        comment:
          index % 2 === 0
            ? 'Respuesta agil y propuesta bien presentada.'
            : 'Buen seguimiento comercial y cumplimiento de plazos.',
      }));
  }, [myQuotes]);

  const average = useMemo(() => {
    if (reviews.length === 0) {
      return 0;
    }
    return (reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length).toFixed(1);
  }, [reviews]);

  return (
    <SupplierDashboardShell searchPlaceholder="Buscar resenas o clientes..." session={session}>
      <section className="space-y-4">
        <div className="rounded-[24px] border border-[#e7eaf3] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
          <h1 className="text-[32px] font-semibold tracking-[-0.03em] text-[#1f2373]">
            Resenas
          </h1>
          <p className="mt-1 text-sm text-[#7e85b2]">
            Seguimiento de feedback comercial recibido por tus clientes.
          </p>
        </div>

        {error ? (
          <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-[22px] border border-[#e7eaf3] bg-white p-5">
            <p className="text-xs font-semibold text-[#8b92bc]">Promedio actual</p>
            <p className="mt-2 text-[28px] font-semibold text-[#1f2373]">
              {loading ? '-' : average}
            </p>
          </article>
          <article className="rounded-[22px] border border-[#e7eaf3] bg-white p-5">
            <p className="text-xs font-semibold text-[#8b92bc]">Resenas visibles</p>
            <p className="mt-2 text-[28px] font-semibold text-[#1f2373]">
              {loading ? '-' : reviews.length}
            </p>
          </article>
          <article className="rounded-[22px] border border-[#e7eaf3] bg-white p-5">
            <p className="text-xs font-semibold text-[#8b92bc]">Satisfaccion</p>
            <p className="mt-2 text-[28px] font-semibold text-[#1f2373]">
              {loading ? '-' : `${Math.round((Number(average) / 5) * 100)}%`}
            </p>
          </article>
        </div>

        <div className="grid gap-3">
          {loading ? (
            <div className="rounded-[18px] border border-[#edf0fb] bg-white px-4 py-8 text-sm text-[#8d95be]">
              Cargando resenas...
            </div>
          ) : reviews.length === 0 ? (
            <div className="rounded-[18px] border border-dashed border-[#d8ddee] bg-white px-4 py-8 text-sm text-[#8d95be]">
              Todavia no hay resenas para mostrar.
            </div>
          ) : (
            reviews.map((review) => (
              <article
                key={review.id}
                className="rounded-[20px] border border-[#e7eaf3] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.04)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-[#33407a]">{review.company}</p>
                    <p className="mt-1 text-sm text-[#7e85b2]">{review.title}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {renderStars(review.rating).map((active, index) => (
                      <span
                        key={`${review.id}-${index}`}
                        className={active ? 'text-[#f5a623]' : 'text-[#d7dbef]'}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-[#5f6795]">{review.comment}</p>
              </article>
            ))
          )}
        </div>
      </section>
    </SupplierDashboardShell>
  );
}
