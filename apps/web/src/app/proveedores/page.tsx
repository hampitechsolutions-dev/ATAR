'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { atarApi, type SupplierDirectoryRecord } from '@/lib/atar-api';
import { mapSupplierToProviderDirectoryItem } from '@/lib/provider-directory';

function getMonogram(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const raw = words.length > 1 ? words.slice(0, 2).map((word) => word[0]).join('') : name.slice(0, 2);
  return raw.toUpperCase();
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white px-5 py-4 shadow-sm">
      <p className="text-xl font-semibold text-slate-950">{value}</p>
      <p className="mt-0.5 text-xs text-slate-600">{label}</p>
    </div>
  );
}

export default function ProveedoresPage() {
  const [suppliers, setSuppliers] = useState<SupplierDirectoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadSuppliers() {
      try {
        setLoading(true);
        setError(null);
        const response = await atarApi.getMarketplaceSuppliers();
        if (!cancelled) {
          setSuppliers(response);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : 'No se pudieron cargar los proveedores.',
          );
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

  const providerItems = useMemo(() => suppliers.map(mapSupplierToProviderDirectoryItem), [suppliers]);

  const filteredSuppliers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return providerItems.filter((supplier) => {
      if (!query) {
        return true;
      }

      return [
        supplier.name,
        supplier.city,
        supplier.category,
        supplier.description,
        supplier.tags.join(' '),
      ]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [providerItems, search]);

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(59,91,255,0.12),_transparent_45%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
        <div className="mx-auto w-full max-w-7xl px-6 py-12 lg:px-10 lg:py-16">
          <div className="grid gap-10 lg:grid-cols-[0.48fr_0.52fr] lg:items-center">
            <div className="space-y-7">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">
                Para compradores industriales
              </p>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Proveedores reales de la red <span className="text-indigo-600">ATAR</span>
              </h1>
              <p className="max-w-xl text-lg leading-8 text-slate-600">
                Este directorio se construye directamente desde la base activa de empresas proveedoras registradas.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500"
                  href="/acceso"
                >
                  Solicitar cotización
                </Link>
                <Link
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  href="/como-funciona"
                >
                  Ver cómo funciona
                </Link>
              </div>
            </div>

            <div className="relative h-[320px] w-full sm:h-[380px] lg:h-[420px]">
              <Image
                alt="Proveedores ATAR"
                className="object-contain object-right"
                fill
                priority
                sizes="(min-width: 1024px) 52vw, 100vw"
                src="/proveedores.png"
              />
            </div>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Proveedores únicos" value={suppliers.length} />
            <StatCard label="Empresas híbridas" value={suppliers.filter((item) => item.companyType === 'HYBRID').length} />
            <StatCard label="Con lead time cargado" value={suppliers.filter((item) => typeof item.leadTimeDays === 'number').length} />
            <StatCard label="Con código genérico" value={suppliers.filter((item) => Boolean(item.genericCode)).length} />
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-10">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            <input
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:bg-white"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre, ubicación o descripción"
              value={search}
            />
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="mt-6 grid gap-4">
            {loading ? (
              <div className="rounded-[2rem] border border-slate-200 bg-white px-5 py-10 text-sm text-slate-500 shadow-sm">
                Cargando proveedores...
              </div>
            ) : filteredSuppliers.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white px-5 py-10 text-sm text-slate-500 shadow-sm">
                No hay proveedores que coincidan con la búsqueda.
              </div>
            ) : (
              filteredSuppliers.map((supplier) => (
                <article
                  key={supplier.id}
                  className="rounded-[2rem] border border-slate-200 bg-white px-5 py-4 shadow-sm"
                >
                  <div className="grid gap-5 lg:grid-cols-[1fr_280px] lg:items-start">
                    <div className="space-y-3">
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">
                          {getMonogram(supplier.name)}
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
                            {supplier.category}
                          </p>
                          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                            {supplier.name}
                          </h2>
                          <p className="mt-1 text-sm text-slate-500">{supplier.city}</p>
                        </div>
                      </div>

                      {supplier.description ? (
                        <p className="text-sm leading-7 text-slate-600">{supplier.description}</p>
                      ) : null}

                      <div className="flex flex-wrap gap-2">
                        {supplier.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                      <div className="space-y-3 text-sm text-slate-600">
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Lead time</p>
                          <p className="mt-1 font-semibold text-slate-950">
                            {typeof supplier.leadTimeDays === 'number' ? `${supplier.leadTimeDays} días` : 'No informado'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Pedido mínimo</p>
                          <p className="mt-1 font-semibold text-slate-950">
                            {typeof supplier.minimumOrder === 'number' ? supplier.minimumOrder : 'No informado'}
                          </p>
                        </div>
                      </div>

                      <Link
                        className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-500"
                        href={`/productos/${supplier.slug}`}
                      >
                        Ver ficha real
                      </Link>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
