'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useWorkspace } from '@/components/auth/workspace-provider';
import {
  atarApi,
  type RequestCatalogCategoryRecord,
  type UpdateSupplierProfileInput,
} from '@/lib/atar-api';

type FormState = {
  genericCode: string;
  leadTimeDays: string;
  minimumOrder: string;
  about: string;
  foundedYear: string;
  employeeRange: string;
  logisticsSummary: string;
  financingSummary: string;
  logoUrl: string;
  certifications: string;
  mainProducts: string;
  capabilities: string;
  categories: string;
};

const EMPTY: FormState = {
  genericCode: '',
  leadTimeDays: '',
  minimumOrder: '',
  about: '',
  foundedYear: '',
  employeeRange: '',
  logisticsSummary: '',
  financingSummary: '',
  logoUrl: '',
  certifications: '',
  mainProducts: '',
  capabilities: '',
  categories: '',
};

const LOGO_MAX_PX = 320;
const LOGO_MAX_BYTES = 300_000;

/**
 * Redimensiona el logo en el navegador antes de mandarlo.
 *
 * Se guarda como data URI en la ficha, asi que el archivo original no puede
 * viajar tal cual: una foto de camara son varios MB. Se baja a 320px de lado
 * y se prueba PNG (conserva transparencia, que es lo comun en un logo); si
 * pesa demasiado se cae a JPEG con fondo blanco.
 */
async function resizeLogo(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new window.Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error('El archivo no es una imagen válida.'));
    element.src = dataUrl;
  });

  const scale = Math.min(1, LOGO_MAX_PX / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('No se pudo procesar la imagen.');
  }

  context.drawImage(image, 0, 0, width, height);
  const png = canvas.toDataURL('image/png');
  if (png.length <= LOGO_MAX_BYTES) {
    return png;
  }

  // JPEG no soporta transparencia: se pinta el fondo antes de exportar.
  context.globalCompositeOperation = 'destination-over';
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  return canvas.toDataURL('image/jpeg', 0.85);
}

const inputClass =
  'mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[13px] text-slate-950 outline-none transition focus:border-indigo-500';

function Field({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[12px] font-medium text-slate-700">{label}</span>
      {children}
      {helper ? <span className="mt-1 block text-[11px] text-slate-500">{helper}</span> : null}
    </label>
  );
}

/**
 * Ficha publica de la proveedora: lo que ve un comprador antes de pedirle una
 * cotizacion.
 *
 * Las listas se cargan separadas por comas porque en la ficha se muestran como
 * chips sueltos, no como texto corrido. No hay telefono ni mail: el contacto
 * pasa por el chat interno de la plataforma.
 */
export default function SupplierPublicProfileForm({
  accessToken,
  className = '',
}: {
  accessToken?: string;
  className?: string;
}) {
  const { isManager, activeWorkspace } = useWorkspace();
  const [form, setForm] = useState<FormState>(EMPTY);
  // Los productos principales se eligen del catalogo de la app, no se escriben:
  // asi la ficha siempre encuentra la foto que le corresponde a cada uno.
  const [categories, setCategories] = useState<RequestCatalogCategoryRecord[]>([]);
  const [slug, setSlug] = useState('');
  const [logoBusy, setLogoBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!accessToken || !isManager) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const result = await atarApi.getOwnSupplierProfile(accessToken);
        const profile = result.supplierProfile;
        if (cancelled) {
          return;
        }

        setSlug(result.slug);

        setForm({
          genericCode: profile?.genericCode ?? '',
          leadTimeDays: profile?.leadTimeDays?.toString() ?? '',
          minimumOrder: profile?.minimumOrder?.toString() ?? '',
          about: profile?.about ?? '',
          foundedYear: profile?.foundedYear?.toString() ?? '',
          employeeRange: profile?.employeeRange ?? '',
          logisticsSummary: profile?.logisticsSummary ?? '',
          financingSummary: profile?.financingSummary ?? '',
          logoUrl: result.logoUrl ?? '',
          certifications: (profile?.certifications ?? []).join(', '),
          mainProducts: (profile?.mainProducts ?? []).join(', '),
          capabilities: (profile?.capabilities ?? []).join(', '),
          categories: (profile?.categories ?? []).join(', '),
        });
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : 'No se pudo cargar tu ficha.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [accessToken, isManager]);

  useEffect(() => {
    let cancelled = false;

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

  const parseList = (value: string) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

  // `categories` es todo lo que la empresa provee; `mainProducts` son los que
  // ademas se destacan con foto en la ficha. Los destacados son siempre un
  // subconjunto del catalogo.
  const selectedCatalog = parseList(form.categories);
  const selectedProducts = parseList(form.mainProducts);

  function toggleCatalog(label: string) {
    const inCatalog = selectedCatalog.includes(label);
    const nextCatalog = inCatalog
      ? selectedCatalog.filter((item) => item !== label)
      : [...selectedCatalog, label];
    // Si sale del catalogo no puede seguir destacado.
    const nextProducts = inCatalog
      ? selectedProducts.filter((item) => item !== label)
      : selectedProducts;

    setForm((current) => ({
      ...current,
      categories: nextCatalog.join(', '),
      mainProducts: nextProducts.join(', '),
    }));
    setMessage(null);
  }

  function toggleProduct(label: string) {
    const next = selectedProducts.includes(label)
      ? selectedProducts.filter((item) => item !== label)
      : [...selectedProducts, label];
    setForm((current) => ({ ...current, mainProducts: next.join(', ') }));
    setMessage(null);
  }

  async function handleLogoFile(file: File | null) {
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('El archivo tiene que ser una imagen.');
      return;
    }

    try {
      setLogoBusy(true);
      setError(null);
      setMessage(null);
      const resized = await resizeLogo(file);
      setForm((current) => ({ ...current, logoUrl: resized }));
    } catch (logoError) {
      setError(logoError instanceof Error ? logoError.message : 'No se pudo cargar la imagen.');
    } finally {
      setLogoBusy(false);
    }
  }

  function set(key: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
    setMessage(null);
  }

  async function handleSave() {
    if (!accessToken) {
      return;
    }

    const list = (value: string) =>
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    const num = (value: string) => {
      const parsed = Number(value);
      return value.trim() && Number.isFinite(parsed) ? Math.round(parsed) : undefined;
    };

    const payload: UpdateSupplierProfileInput = {
      genericCode: form.genericCode.trim(),
      leadTimeDays: num(form.leadTimeDays),
      minimumOrder: num(form.minimumOrder),
      about: form.about.trim(),
      foundedYear: num(form.foundedYear),
      employeeRange: form.employeeRange.trim(),
      logisticsSummary: form.logisticsSummary.trim(),
      financingSummary: form.financingSummary.trim(),
      logoUrl: form.logoUrl.trim(),
      certifications: list(form.certifications),
      mainProducts: list(form.mainProducts),
      capabilities: list(form.capabilities),
      categories: list(form.categories),
    };

    try {
      setSaving(true);
      setError(null);
      setMessage(null);
      await atarApi.updateOwnSupplierProfile(payload, accessToken);
      setMessage('Ficha actualizada. Ya la ven los compradores.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo guardar la ficha.');
    } finally {
      setSaving(false);
    }
  }

  if (!isManager) {
    return null;
  }

  if (loading) {
    return (
      <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
        <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div className="h-16 animate-pulse rounded-xl bg-slate-100" key={index} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-950">Ficha pública y catálogo</p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Lo que ve un comprador de {activeWorkspace?.company.name ?? 'tu empresa'} antes de
            pedirte una cotización. Lo que dejes vacío no se muestra.
          </p>
        </div>
        {slug ? (
          <Link
            className="shrink-0 text-[11px] font-semibold text-indigo-600 hover:text-indigo-500"
            href={`/dashboard/comprador/proveedores/${slug}`}
            target="_blank"
          >
            Ver mi ficha ↗
          </Link>
        ) : null}
      </div>

      {error ? (
        <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[12px] text-rose-700">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-[12px] text-emerald-700">
          {message}
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Field label="Código genérico">
          <input
            className={inputClass}
            onChange={(event) => set('genericCode', event.target.value)}
            placeholder="ENV-002"
            value={form.genericCode}
          />
        </Field>
        <Field label="Lead time (días)">
          <input
            className={inputClass}
            onChange={(event) => set('leadTimeDays', event.target.value)}
            placeholder="12"
            type="number"
            value={form.leadTimeDays}
          />
        </Field>
        <Field label="Pedido mínimo">
          <input
            className={inputClass}
            onChange={(event) => set('minimumOrder', event.target.value)}
            placeholder="80000"
            type="number"
            value={form.minimumOrder}
          />
        </Field>
      </div>

      <div className="mt-3">
        <Field label="Sobre la empresa">
          <textarea
            className={`${inputClass} h-auto min-h-[96px] resize-y py-2.5`}
            onChange={(event) => set('about', event.target.value)}
            placeholder="Qué hacen, desde cuándo y con qué tecnología."
            value={form.about}
          />
        </Field>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Field label="Año de fundación">
          <input
            className={inputClass}
            onChange={(event) => set('foundedYear', event.target.value)}
            placeholder="2008"
            type="number"
            value={form.foundedYear}
          />
        </Field>
        <Field label="Empleados">
          <input
            className={inputClass}
            onChange={(event) => set('employeeRange', event.target.value)}
            placeholder="51 - 200"
            value={form.employeeRange}
          />
        </Field>
        <div>
          <span className="text-[12px] font-medium text-slate-700">Logo</span>
          <div className="mt-1 flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
              {form.logoUrl ? (
                // Puede ser un data URI recien subido: se usa <img> para no
                // pasar por el optimizador de next/image.
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="Logo" className="max-h-full max-w-full object-contain" src={form.logoUrl} />
              ) : (
                <span className="text-[10px] font-semibold text-slate-400">Sin logo</span>
              )}
            </span>

            <label className="inline-flex h-11 cursor-pointer items-center rounded-xl border border-slate-200 bg-white px-3.5 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50">
              {logoBusy ? 'Procesando...' : form.logoUrl ? 'Cambiar' : 'Subir imagen'}
              <input
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  void handleLogoFile(event.target.files?.[0] ?? null);
                  // Permite volver a elegir el mismo archivo.
                  event.target.value = '';
                }}
                type="file"
              />
            </label>

            {form.logoUrl ? (
              <button
                className="text-[12px] font-semibold text-slate-500 transition hover:text-rose-600"
                onClick={() => set('logoUrl', '')}
                type="button"
              >
                Quitar
              </button>
            ) : null}
          </div>
          <span className="mt-1 block text-[11px] text-slate-500">
            PNG o JPG. Se recorta a 320px automáticamente.
          </span>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field label="Logística" helper="Cobertura y plazos de entrega.">
          <input
            className={inputClass}
            onChange={(event) => set('logisticsSummary', event.target.value)}
            placeholder="Entrega en AMBA en 24 - 48 hs."
            value={form.logisticsSummary}
          />
        </Field>
        <Field label="Financiación" helper="Condiciones de pago.">
          <input
            className={inputClass}
            onChange={(event) => set('financingSummary', event.target.value)}
            placeholder="30 días fecha factura."
            value={form.financingSummary}
          />
        </Field>
      </div>

      <div className="mt-5 border-t border-slate-200 pt-4">
        <p className="text-sm font-semibold text-slate-950">Tu catálogo</p>
        <p className="mt-0.5 text-[11px] text-slate-500">
          Marcá todo lo que fabricás o vendés. Se muestra completo en tu ficha con su foto, y
          es lo que usan los compradores para encontrarte cuando publican una solicitud.
        </p>

        {categories.length === 0 ? (
          <p className="mt-3 text-[11px] text-slate-500">Cargando catálogo...</p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
            {categories.map((category) => {
              const selected = selectedCatalog.includes(category.label);

              return (
                <button
                  aria-pressed={selected}
                  className={`flex items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition ${
                    selected
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                  key={category.id}
                  onClick={() => toggleCatalog(category.label)}
                  type="button"
                >
                  <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-50">
                    {category.imageSrc ? (
                      <Image
                        alt={category.label}
                        className="object-contain p-0.5"
                        fill
                        sizes="40px"
                        src={category.imageSrc}
                      />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block truncate text-[11px] font-semibold ${
                        selected ? 'text-indigo-700' : 'text-slate-700'
                      }`}
                    >
                      {category.label}
                    </span>
                    {category.subtitle ? (
                      <span className="block truncate text-[10px] text-slate-500">
                        {category.subtitle}
                      </span>
                    ) : null}
                  </span>
                  {selected ? (
                    <span className="shrink-0 text-indigo-600" aria-hidden="true">
                      ✓
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}

        <p className="mt-2 text-[11px] text-slate-500">
          {selectedCatalog.length === 0
            ? 'Todavía no marcaste nada.'
            : `${selectedCatalog.length} de ${categories.length} seleccionados.`}
        </p>
      </div>

      {/* Destacados: subconjunto del catalogo, con foto en la ficha. */}
      {selectedCatalog.length > 0 ? (
        <div className="mt-4">
          <p className="text-[12px] font-medium text-slate-700">
            Destacados <span className="font-normal text-slate-500">(opcional)</span>
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Todo tu catálogo ya aparece en la ficha. Esto es solo para elegir qué va primero.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedCatalog.map((label) => {
              const selected = selectedProducts.includes(label);

              return (
                <button
                  aria-pressed={selected}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                    selected
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                  key={label}
                  onClick={() => toggleProduct(label)}
                  type="button"
                >
                  {selected ? <span aria-hidden="true">★</span> : null}
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field label="Capacidades" helper="Separadas por comas.">
          <input
            className={inputClass}
            onChange={(event) => set('capabilities', event.target.value)}
            placeholder="Extrusión de film, Laminación"
            value={form.capabilities}
          />
        </Field>
        <Field label="Certificaciones" helper="Separadas por comas.">
          <input
            className={inputClass}
            onChange={(event) => set('certifications', event.target.value)}
            placeholder="ISO 9001:2015"
            value={form.certifications}
          />
        </Field>
      </div>

      <button
        className="mt-4 inline-flex h-11 items-center rounded-xl bg-indigo-600 px-5 text-[13px] font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
        disabled={saving}
        onClick={() => void handleSave()}
        type="button"
      >
        {saving ? 'Guardando...' : 'Guardar ficha'}
      </button>
    </section>
  );
}
