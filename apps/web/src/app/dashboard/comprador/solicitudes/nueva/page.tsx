'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import CompanyLogo from '@/components/dashboard/company-logo';
import {
  atarApi,
  type RequestCatalogCategoryRecord,
  type RequestCatalogFieldRecord,
  type RequestRecord,
} from '@/lib/atar-api';
import { mapSupplierToProviderDirectoryItem, type ProviderDirectoryItem } from '@/lib/provider-directory';
import {
  findRequestCatalogCategory,
  getRequestCatalogFields,
  getRequestCatalogKeywords,
} from '@/lib/request-catalog';
import { FALLBACK_REQUEST_CATEGORIES } from '@/lib/request-catalog-fallback';
import { getCategoryUnits, getDefaultUnit } from '@/lib/request-units';
import { formatRequestCode } from '@/lib/request-code';

type StepKey = 1 | 2 | 3 | 4 | 5 | 6;

// Un producto ya agregado a la solicitud (multi-producto). Guarda el slice de
// campos "por producto" del draft para poder mostrarlo, editarlo y armar el item.
type ProductLine = {
  id: string;
  category: string;
  description: string;
  quantity: string;
  // Unidad de la cantidad (metro lineal, kg, rollo…), sugerida por categoría.
  unit: string;
  material: string;
  capacityOption: string;
  handleType: string;
  printType: string;
  specSelections: Record<string, string>;
  uploadedFiles: Record<string, string[]>;
  // Solo para productos cargados al EDITAR una solicitud: texto de specs ya
  // guardado. Se usa tal cual (no se re-deriva de los modulos del catalogo).
  specifications?: string;
  // El comprador ya revisó sus especificaciones (paso 2).
  specsReviewed?: boolean;
};

type RequestDraft = {
  category: string;
  title: string;
  description: string;
  quantity: string;
  unit: string;
  material: string;
  capacityOption: string;
  handleType: string;
  printType: string;
  specSelections: Record<string, string>;
  uploadedFiles: Record<string, string[]>;
  // Productos ya agregados (ademas del que se esta editando en los pasos 1-2).
  products: ProductLine[];
  deliveryCountry: string;
  deliveryCity: string;
  deliveryAddressMode: 'saved' | 'new';
  deliveryAddressLine: string;
  deliveryDate: string;
  deliveryDateMode: 'asap' | 'exact' | 'range';
  deliveryDateRange: string;
  deliveryNotes: string;
  deliverySchedule: string;
  deliveryContactName: string;
  deliveryPhone: string;
  selectedProviders: string[];
};

const DRAFT_KEY = 'atar:buyer:new-request:draft';

const steps = [
  { key: 1 as const, label: 'Productos', hint: 'Agregá lo que necesitás' },
  { key: 2 as const, label: 'Especificaciones', hint: 'Completá los detalles' },
  { key: 3 as const, label: 'Entrega', hint: 'Definí plazos y ubicación' },
  { key: 4 as const, label: 'Proveedores', hint: 'Seleccioná y enviá' },
  { key: 5 as const, label: 'Resumen', hint: 'Revisá y publicá' },
];

const deliveryWhenOptions = [
  { key: 'asap', label: 'Lo antes posible' },
  { key: 'En 15 días', label: 'En 15 días' },
  { key: 'En 30 días', label: 'En 30 días' },
  { key: 'exact', label: 'Tengo una fecha específica' },
] as const;

const syncedDraftFields: Partial<Record<string, keyof RequestDraft>> = {
  material: 'material',
  capacidad: 'capacityOption',
  'tipo-asa': 'handleType',
  impresion: 'printType',
  cantidad: 'quantity',
  'cantidad-estimada': 'quantity',
  observaciones: 'description',
  'fecha-objetivo': 'deliveryDate',
};

// Claves de modulo que se sincronizan con campos del draft. El catalogo del
// backend usa la clave pelada ("material"); el de respaldo la prefija con la
// categoria ("rollos-y-telas-material"), asi que se reconocen ambas formas.
const SYNC_KEYS = ['cantidad-estimada', 'cantidad', 'material', 'capacidad', 'tipo-asa', 'impresion', 'observaciones', 'fecha-objetivo'];

function canonicalModuleKey(moduleId: string) {
  return SYNC_KEYS.find((key) => moduleId === key || moduleId.endsWith(`-${key}`)) ?? moduleId;
}

function getCategoryOption(
  categories: RequestCatalogCategoryRecord[],
  category: string,
) {
  return findRequestCatalogCategory(categories, category);
}

function clampStep(value: number): StepKey {
  if (value <= 1) return 1;
  if (value === 2) return 2;
  if (value === 3) return 3;
  if (value === 4) return 4;
  if (value === 5) return 5;
  return 6;
}

function getProductModules(
  categories: RequestCatalogCategoryRecord[],
  category: string,
): RequestCatalogFieldRecord[] {
  return getRequestCatalogFields(categories, category);
}

function getModuleValue(draft: RequestDraft, moduleId: string) {
  const key = canonicalModuleKey(moduleId);
  if (key === 'observaciones') {
    return draft.description;
  }
  if (key === 'cantidad' || key === 'cantidad-estimada') {
    return draft.quantity;
  }
  if (key === 'material') {
    return draft.specSelections[moduleId] ?? draft.material;
  }
  if (key === 'capacidad') {
    return draft.specSelections[moduleId] ?? draft.capacityOption;
  }
  if (key === 'tipo-asa') {
    return draft.specSelections[moduleId] ?? draft.handleType;
  }
  if (key === 'impresion') {
    return draft.specSelections[moduleId] ?? draft.printType;
  }
  if (key === 'fecha-objetivo') {
    return draft.specSelections[moduleId] ?? draft.deliveryDate;
  }
  return draft.specSelections[moduleId] ?? '';
}

function getSpecificationLines(
  categories: RequestCatalogCategoryRecord[],
  draft: RequestDraft,
) {
  return getProductModules(categories, draft.category).flatMap((module) => {
    if (module.type === 'uploader') {
      // Los archivos NO se transmiten todavía (solo se captan nombres en el
      // navegador). No los incluimos en las specs para no prometerle al
      // proveedor un adjunto que no va a recibir: los documentos se comparten
      // por el chat de la solicitud.
      return [];
    }

    const value = getModuleValue(draft, module.id).trim();
    return value ? [`${module.label}: ${value}`] : [];
  });
}

// Toma una foto de los campos "por producto" del draft actual.
function snapshotProduct(draft: RequestDraft): ProductLine {
  return {
    id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    category: draft.category,
    description: draft.description,
    quantity: draft.quantity,
    unit: draft.unit,
    material: draft.material,
    capacityOption: draft.capacityOption,
    handleType: draft.handleType,
    printType: draft.printType,
    specSelections: { ...draft.specSelections },
    uploadedFiles: { ...draft.uploadedFiles },
  };
}

// Campos "por producto" vacios, para empezar a cargar otro producto.
function blankProductFields() {
  return {
    category: '',
    title: '',
    description: '',
    quantity: '',
    unit: '',
    material: '',
    capacityOption: '',
    handleType: '',
    printType: '',
    specSelections: {} as Record<string, string>,
    uploadedFiles: {} as Record<string, string[]>,
  };
}

// Devuelve un draft con los campos del producto `line` cargados (para reusar
// los helpers de specs, o para editar una linea ya agregada).
function withProductLine(draft: RequestDraft, line: ProductLine): RequestDraft {
  return {
    ...draft,
    category: line.category,
    description: line.description,
    quantity: line.quantity,
    unit: line.unit,
    material: line.material,
    capacityOption: line.capacityOption,
    handleType: line.handleType,
    printType: line.printType,
    specSelections: line.specSelections,
    uploadedFiles: line.uploadedFiles,
  };
}

function getProductDisplayName(line: Pick<ProductLine, 'category'>) {
  return line.category.trim() || 'Producto';
}

function getLineMaterial(line: ProductLine) {
  if (line.material.trim()) {
    return line.material;
  }
  const entry = Object.entries(line.specSelections).find(([id]) => canonicalModuleKey(id) === 'material');
  return entry?.[1] ?? '';
}

// Cantidades solo con digitos: "80.000" se tipea en formato local y el
// parseInt del envio lo leeria como 80.
function cleanQuantity(value: string) {
  return value.replace(/\D/g, '');
}

function formatQuantity(quantity: string, unit: string) {
  const parsed = Number.parseInt(quantity, 10);
  if (!Number.isFinite(parsed)) {
    return '';
  }
  return `${parsed.toLocaleString('es-AR')} ${unit || 'unidades'}`;
}

// Direccion de entrega sin repetir ciudad/pais si ya vienen en la linea.
function formatDeliveryAddress(draft: Pick<RequestDraft, 'deliveryAddressLine' | 'deliveryCity' | 'deliveryCountry'>) {
  const line = draft.deliveryAddressLine.trim();
  const lower = line.toLowerCase();
  const extras = [draft.deliveryCity, draft.deliveryCountry]
    .map((part) => part.trim())
    .filter((part) => part && !lower.includes(part.toLowerCase()));
  return [line, ...extras].filter(Boolean).join(', ');
}

function getDeliveryWhenLabel(draft: RequestDraft) {
  if (draft.deliveryDateMode === 'asap') {
    return 'Lo antes posible';
  }
  if (draft.deliveryDateMode === 'range') {
    return draft.deliveryDateRange || 'A definir';
  }
  if (!draft.deliveryDate) {
    return 'Fecha a definir';
  }
  const parsed = new Date(`${draft.deliveryDate}T00:00:00`);
  return Number.isNaN(parsed.getTime())
    ? draft.deliveryDate
    : parsed.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Reconstruye los campos de entrega desde la descripcion (que el wizard arma
// con "Label: value"). Best-effort, para pre-cargar al editar.
function parseDeliveryFromDescription(description: string): Partial<RequestDraft> {
  const out: Partial<RequestDraft> = {};
  for (const raw of description.split('\n')) {
    const line = raw.trim();
    const idx = line.indexOf(':');
    if (idx === -1) {
      continue;
    }
    const label = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (!value) {
      continue;
    }
    if (label.startsWith('entrega')) {
      const parts = value.split(',').map((part) => part.trim()).filter(Boolean);
      out.deliveryAddressMode = 'new';
      out.deliveryAddressLine = parts[0] ?? '';
      if (parts.length >= 3) {
        out.deliveryCity = parts[1];
      }
      out.deliveryCountry = parts[parts.length - 1] ?? 'Argentina';
    } else if (label.startsWith('fecha de entrega')) {
      if (value.toLowerCase().includes('antes posible')) {
        out.deliveryDateMode = 'asap';
      } else {
        out.deliveryDateMode = 'exact';
        out.deliveryDate = value;
      }
    } else if (label.startsWith('rango de entrega')) {
      out.deliveryDateMode = 'range';
      out.deliveryDateRange = value;
    } else if (label.startsWith('horario')) {
      out.deliverySchedule = value;
    } else if (label.startsWith('contacto')) {
      out.deliveryContactName = value;
    } else if (label.startsWith('telefono')) {
      out.deliveryPhone = value;
    } else if (label.startsWith('observaciones')) {
      out.deliveryNotes = value;
    }
  }
  return out;
}

// Reconstruye specSelections a partir del texto "Label: value" que guardamos
// en specifications, matcheando contra las etiquetas de los modulos del
// catalogo de esa categoria. Asi, al editar un producto, los campos aparecen
// completos (antes quedaban en blanco).
function specSelectionsFromText(
  categories: RequestCatalogCategoryRecord[],
  category: string,
  specsText: string,
): Record<string, string> {
  const modules = getProductModules(categories, category);
  if (modules.length === 0 || !specsText.trim()) {
    return {};
  }
  const byLabel = new Map(modules.map((m) => [m.label.trim().toLowerCase(), m]));
  const out: Record<string, string> = {};
  for (const raw of specsText.split('\n')) {
    const idx = raw.indexOf(':');
    if (idx === -1) continue;
    const label = raw.slice(0, idx).trim().toLowerCase();
    const value = raw.slice(idx + 1).trim();
    const mod = byLabel.get(label);
    if (mod && mod.type !== 'uploader' && value) {
      out[mod.id] = value;
    }
  }
  return out;
}

// Convierte las lineas (RequestItem) de una solicitud en ProductLine[] para
// pre-cargar el wizard al editar. Reconstruye las specs estructuradas.
function productLinesFromRequest(
  request: RequestRecord,
  categories: RequestCatalogCategoryRecord[] = [],
): ProductLine[] {
  return (request.items ?? []).map((item, index) => {
    const category = item.category ?? request.category ?? '';
    const specSelections = specSelectionsFromText(categories, category, item.specifications ?? '');
    const material = Object.entries(specSelections).find(([id]) => canonicalModuleKey(id) === 'material')?.[1] ?? '';
    return {
      id: `edit-${item.id ?? index}`,
      category,
      description: '',
      quantity: item.quantity != null ? String(item.quantity) : '',
      unit: item.unit ?? '',
      material,
      capacityOption: '',
      handleType: '',
      printType: '',
      specSelections,
      uploadedFiles: {},
      specifications: item.specifications ?? '',
      specsReviewed: true,
    };
  });
}

function loadDraft(): RequestDraft {
  if (typeof window === 'undefined') {
    return {
      category: '',
      title: '',
      description: '',
      quantity: '',
      unit: '',
      material: '',
      capacityOption: '',
      handleType: '',
      printType: '',
      specSelections: {},
      uploadedFiles: {},
      deliveryCountry: 'Argentina',
      deliveryCity: '',
      deliveryAddressMode: 'saved',
      deliveryAddressLine: '',
      deliveryDate: '',
      deliveryDateMode: 'asap',
      deliveryDateRange: '',
      deliveryNotes: '',
      deliverySchedule: '',
      deliveryContactName: '',
      deliveryPhone: '',
      selectedProviders: [],
      products: [],
    };
  }

  const raw = window.localStorage.getItem(DRAFT_KEY);
  if (!raw) {
    return {
      category: '',
      title: '',
      description: '',
      quantity: '',
      unit: '',
      material: '',
      capacityOption: '',
      handleType: '',
      printType: '',
      specSelections: {},
      uploadedFiles: {},
      deliveryCountry: 'Argentina',
      deliveryCity: '',
      deliveryAddressMode: 'saved',
      deliveryAddressLine: '',
      deliveryDate: '',
      deliveryDateMode: 'asap',
      deliveryDateRange: '',
      deliveryNotes: '',
      deliverySchedule: '',
      deliveryContactName: '',
      deliveryPhone: '',
      selectedProviders: [],
      products: [],
    };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<RequestDraft>;
    return {
      category: parsed.category ?? '',
      title: parsed.title ?? '',
      description: parsed.description ?? '',
      quantity: parsed.quantity ?? '',
      unit: parsed.unit ?? '',
      material: parsed.material ?? '',
      capacityOption: parsed.capacityOption ?? '',
      handleType: parsed.handleType ?? '',
      printType: parsed.printType ?? '',
      specSelections: parsed.specSelections ?? {},
      uploadedFiles: parsed.uploadedFiles ?? {},
      deliveryCountry: parsed.deliveryCountry ?? 'Argentina',
      deliveryCity: parsed.deliveryCity ?? '',
      deliveryAddressMode: parsed.deliveryAddressMode ?? 'saved',
      deliveryAddressLine: parsed.deliveryAddressLine ?? '',
      deliveryDate: parsed.deliveryDate ?? '',
      deliveryDateMode: parsed.deliveryDateMode ?? 'asap',
      deliveryDateRange: parsed.deliveryDateRange ?? '',
      deliveryNotes: parsed.deliveryNotes ?? '',
      deliverySchedule: parsed.deliverySchedule ?? '',
      deliveryContactName: parsed.deliveryContactName ?? '',
      deliveryPhone: parsed.deliveryPhone ?? '',
      selectedProviders: Array.isArray(parsed.selectedProviders) ? parsed.selectedProviders : [],
      products: Array.isArray(parsed.products) ? parsed.products : [],
    };
  } catch {
    window.localStorage.removeItem(DRAFT_KEY);
    return {
      category: '',
      title: '',
      description: '',
      quantity: '',
      unit: '',
      material: '',
      capacityOption: '',
      handleType: '',
      printType: '',
      specSelections: {},
      uploadedFiles: {},
      deliveryCountry: 'Argentina',
      deliveryCity: '',
      deliveryAddressMode: 'saved',
      deliveryAddressLine: '',
      deliveryDate: '',
      deliveryDateMode: 'asap',
      deliveryDateRange: '',
      deliveryNotes: '',
      deliverySchedule: '',
      deliveryContactName: '',
      deliveryPhone: '',
      selectedProviders: [],
      products: [],
    };
  }
}

function saveDraft(nextDraft: RequestDraft) {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify(nextDraft));
}

type IconName =
  | 'arrow-right'
  | 'arrow-left'
  | 'chev-left'
  | 'chev-down'
  | 'check'
  | 'pin'
  | 'calendar'
  | 'clock'
  | 'phone'
  | 'truck'
  | 'info'
  | 'search'
  | 'plus'
  | 'x'
  | 'save'
  | 'edit'
  | 'users'
  | 'shield'
  | 'lock'
  | 'chat'
  | 'box'
  | 'scale'
  | 'building'
  | 'bulb'
  | 'file'
  | 'layers'
  | 'upload'
  | 'ruler'
  | 'drop'
  | 'dot';

const ICON_PATHS: Record<IconName, ReactNode> = {
  'arrow-right': <path d="M5 12h14M13 6l6 6-6 6" />,
  'arrow-left': <path d="M19 12H5M11 18l-6-6 6-6" />,
  'chev-left': <path d="M15 18l-6-6 6-6" />,
  'chev-down': <path d="M6 9l6 6 6-6" />,
  check: <path d="M20 6L9 17l-5-5" />,
  pin: (
    <>
      <path d="M21 10c0 6-9 12-9 12S3 16 3 10a9 9 0 1118 0z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  calendar: (
    <>
      <path d="M8 2v4M16 2v4M3 10h18" />
      <rect height="16" rx="2" width="18" x="3" y="6" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  phone: (
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.86 19.86 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.86 19.86 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.12.9.33 1.77.62 2.6a2 2 0 01-.45 2.11L8.04 9.96a16 16 0 006 6l1.53-1.26a2 2 0 012.11-.45c.83.29 1.7.5 2.6.62A2 2 0 0122 16.92z" />
  ),
  truck: (
    <>
      <path d="M2 6h12v10H2zM14 9h4l4 4v3h-8" />
      <circle cx="6" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  x: <path d="M18 6L6 18M6 6l12 12" />,
  save: (
    <>
      <path d="M5 3h11l3 3v13a2 2 0 01-2 2H7a2 2 0 01-2-2V3z" />
      <path d="M8 3v5h7V3M8 21v-7h8v7" />
    </>
  ),
  edit: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
    </>
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </>
  ),
  shield: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  lock: (
    <>
      <rect height="10" rx="2" width="14" x="5" y="11" />
      <path d="M8 11V7a4 4 0 018 0v4" />
    </>
  ),
  chat: (
    <>
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      <path d="M8 9h8M8 13h5" />
    </>
  ),
  box: (
    <>
      <path d="M21 8l-9-5-9 5 9 5 9-5z" />
      <path d="M3 8v8l9 5 9-5V8M12 13v8" />
    </>
  ),
  scale: <path d="M12 3v18M7 21h10M5 7h14M5 7l-3 7a3 3 0 006 0L5 7zM19 7l-3 7a3 3 0 006 0l-3-7z" />,
  building: <path d="M4 21V5a2 2 0 012-2h8a2 2 0 012 2v16M16 9h2a2 2 0 012 2v10M2 21h20M8 7h4M8 11h4M8 15h4" />,
  bulb: <path d="M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7V16h8v-1.3A7 7 0 0012 2z" />,
  file: (
    <>
      <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </>
  ),
  layers: <path d="M12 4l8 4-8 4-8-4 8-4zM4 12l8 4 8-4M4 16l8 4 8-4" />,
  upload: <path d="M12 16V4M7 9l5-5 5 5M4 20h16" />,
  ruler: <path d="M4 16L16 4l4 4L8 20l-4-4zM8 12l2 2M11 9l2 2M14 6l2 2" />,
  drop: <path d="M12 3s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z" />,
  dot: <circle cx="12" cy="12" r="3" />,
};

function Icon({ name, className = 'h-4 w-4' }: { name: IconName; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="5" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="12" cy="19" r="1.8" />
    </svg>
  );
}

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white">
        <Icon className="h-2.5 w-2.5" name="check" />
      </span>
      <span className="rounded-full bg-emerald-50 px-2 py-0.5">Proveedor verificado</span>
    </span>
  );
}

function specIconFor(label: string): IconName {
  const value = label.toLowerCase();
  if (/ancho|largo|medida|diametro|diámetro/.test(value)) return 'ruler';
  if (/espesor|gramaje|laminad|capa/.test(value)) return 'layers';
  if (/color|pantone|tinta/.test(value)) return 'drop';
  if (/capacidad|resistencia|peso/.test(value)) return 'scale';
  if (/uv|tratamiento|proteccion|protección/.test(value)) return 'shield';
  return 'dot';
}

const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-[10px] bg-[#3f3df5] font-semibold text-white shadow-[0_10px_24px_rgba(63,61,245,0.25)] transition hover:bg-[#3431e0] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none';
const secondaryButton =
  'inline-flex items-center justify-center gap-2 rounded-[10px] border border-[#dfe4f0] bg-white font-semibold text-slate-800 transition hover:bg-slate-50';
const outlineAccentButton =
  'inline-flex items-center justify-center gap-2 rounded-[10px] border border-[#d6dcf5] bg-white font-semibold text-[#3f3df5] transition hover:bg-[#f6f7ff]';
const fieldInput =
  'h-11 w-full rounded-[10px] border border-[#dfe4f0] bg-white px-3.5 text-[14px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#3f3df5] focus:ring-4 focus:ring-[#3f3df5]/10';

export default function BuyerNewRequestWizardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session } = useAuth();

  const initialStep = useMemo(() => {
    const raw = searchParams?.get('step');
    const parsed = raw ? Number(raw) : 1;
    return clampStep(Number.isFinite(parsed) ? parsed : 1);
  }, [searchParams]);

  const [step, setStep] = useState<StepKey>(initialStep);
  // Producto de la lista cuyas especificaciones se editan en el paso 2.
  const [specIndex, setSpecIndex] = useState(0);
  // Sub-paso del paso 2: qué especificación del producto se está respondiendo.
  // Va atado al id del producto, así al cambiar de producto arranca de cero.
  const [fieldStep, setFieldStep] = useState<{ productId: string; index: number }>({ productId: '', index: 0 });
  // Si se entra al paso 2 para editar un producto desde otro paso, al guardar
  // se vuelve a ese paso (no se re-recorren entrega/proveedores).
  const [editReturnStep, setEditReturnStep] = useState<StepKey | null>(null);
  const [draft, setDraft] = useState<RequestDraft>(() => loadDraft());
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [providerSearch, setProviderSearch] = useState('');
  const [providerCityFilter, setProviderCityFilter] = useState('');
  const [providerProductFilter, setProviderProductFilter] = useState('');
  const [providerCertFilter, setProviderCertFilter] = useState('');
  const [providers, setProviders] = useState<ProviderDirectoryItem[]>([]);
  const [requestCategories, setRequestCategories] = useState<RequestCatalogCategoryRecord[]>([]);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [productSwitcherOpen, setProductSwitcherOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadRequestCategories() {
      try {
        const response = await atarApi.getRequestCategories();
        if (!cancelled) {
          setRequestCategories(response.length > 0 ? response : FALLBACK_REQUEST_CATEGORIES);
        }
      } catch {
        if (!cancelled) {
          setRequestCategories(FALLBACK_REQUEST_CATEGORIES);
        }
      }
    }

    void loadRequestCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const initialCategory = searchParams?.get('category');
    if (initialCategory && !draft.category) {
      const next = { ...draft, category: initialCategory, unit: draft.unit || getDefaultUnit(initialCategory) };
      setDraft(next);
      saveDraft(next);
    }
  }, [draft, searchParams]);

  useEffect(() => {
    setStep(initialStep);
  }, [initialStep]);

  // Modo edición: si viene ?edit=<id>, se carga la solicitud y se pre-llena el
  // wizard para ACTUALIZARLA (no crear otra).
  const editId = searchParams?.get('edit') ?? null;
  const [editRequestId, setEditRequestId] = useState<string | null>(null);
  const [prefillProviderNames, setPrefillProviderNames] = useState<string[]>([]);

  useEffect(() => {
    if (!editId || !session?.accessToken || editRequestId === editId) {
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const req = await atarApi.getRequestDetail(editId, session.accessToken);
        if (cancelled) {
          return;
        }
        setDraft((current) => ({
          ...current,
          ...blankProductFields(),
          title: req.title ?? '',
          products: productLinesFromRequest(
            req,
            requestCategories.length ? requestCategories : FALLBACK_REQUEST_CATEGORIES,
          ),
          ...parseDeliveryFromDescription(req.description ?? ''),
        }));
        setPrefillProviderNames(
          (req.preferredSupplierName ?? '')
            .split('|')
            .map((name) => name.trim().toLowerCase())
            .filter(Boolean),
        );
        setEditRequestId(editId);
        // Al editar se abre en el Resumen: así el comprador ve de una todos los
        // productos que ya había cargado (con su cantidad) y puede editarlos,
        // agregar o quitar, en vez de una pantalla de specs en blanco.
        setStep(5);
      } catch {
        if (!cancelled) {
          setError('No se pudo cargar la solicitud para editar.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editId, editRequestId, session?.accessToken]);

  // Al cargar el directorio de proveedores, matchear por nombre los que la
  // solicitud tenía seleccionados.
  useEffect(() => {
    if (!editRequestId || providers.length === 0 || prefillProviderNames.length === 0) {
      return;
    }
    const ids = providers
      .filter((provider) => prefillProviderNames.includes(provider.name.trim().toLowerCase()))
      .map((provider) => provider.id);
    if (ids.length > 0) {
      setDraft((current) => ({ ...current, selectedProviders: ids }));
    }
    setPrefillProviderNames([]);
  }, [editRequestId, providers, prefillProviderNames]);

  // Al cambiar de paso (o de producto en el paso 2), subir al tope.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [step, specIndex]);

  useEffect(() => {
    saveDraft(draft);
  }, [draft]);

  useEffect(() => {
    if (!notice) {
      return;
    }
    const timeout = window.setTimeout(() => setNotice(null), 2500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    if (!session?.accessToken) {
      setProviders([]);
      return;
    }
    const accessToken: string = session.accessToken;

    let cancelled = false;

    async function loadSuppliers() {
      try {
        const response = await atarApi.getSuppliers(accessToken);
        if (cancelled) {
          return;
        }

        if (response.length > 0) {
          setProviders(response.map((supplier) => mapSupplierToProviderDirectoryItem(supplier)));
          return;
        }

        setProviders([]);
      } catch {
        if (!cancelled) {
          setProviders([]);
        }
      }
    }

    void loadSuppliers();

    return () => {
      cancelled = true;
    };
  }, [session?.accessToken]);

  useEffect(() => {
    if (!session?.user) {
      return;
    }

    const fullName = [session.user.firstName, session.user.lastName].filter(Boolean).join(' ').trim();

    setDraft((current) => {
      if (current.deliveryContactName || current.deliveryCountry !== 'Argentina') {
        return current;
      }

      return {
        ...current,
        deliveryContactName: fullName || current.deliveryContactName,
      };
    });
  }, [session?.user]);

  // Productos de la solicitud. El "compositor" del paso 1 (draft.category,
  // draft.quantity…) no cuenta hasta que se agrega a la lista.
  const allProductLines = draft.products;
  const productCount = allProductLines.length;

  const providerKeywords = useMemo(
    () =>
      Array.from(
        new Set(allProductLines.flatMap((line) => getRequestCatalogKeywords(requestCategories, line.category))),
      ),
    [allProductLines, requestCategories],
  );
  const rankedProviders = useMemo(() => {
    return providers
      .map((provider) => {
        const haystack = [provider.category, provider.description, provider.tags.join(' '), (provider.mainProducts ?? []).join(' ')]
          .join(' ')
          .toLowerCase();
        const score =
          providerKeywords.reduce((total, keyword) => total + (haystack.includes(keyword.toLowerCase()) ? 2 : 0), 0) +
          (provider.isVerified ? 2 : 0) +
          (typeof provider.leadTimeDays === 'number' ? 1 : 0);
        return { provider, score };
      })
      .sort((left, right) => right.score - left.score)
      .map((item) => item.provider);
  }, [providerKeywords, providers]);
  const providerCityOptions = useMemo(
    () => Array.from(new Set(providers.map((provider) => provider.city).filter(Boolean))).sort(),
    [providers],
  );
  const providerProductOptions = useMemo(
    () =>
      Array.from(new Set(providers.flatMap((provider) => [...provider.tags, ...(provider.mainProducts ?? [])]).filter(Boolean))).sort(),
    [providers],
  );
  const providerCertOptions = useMemo(
    () => Array.from(new Set(providers.flatMap((provider) => provider.certifications ?? []).filter(Boolean))).sort(),
    [providers],
  );
  const filteredProviders = useMemo(() => {
    const query = providerSearch.trim().toLowerCase();
    return rankedProviders.filter((provider) => {
      if (providerCityFilter && provider.city !== providerCityFilter) {
        return false;
      }
      if (providerProductFilter && ![...provider.tags, ...(provider.mainProducts ?? [])].includes(providerProductFilter)) {
        return false;
      }
      if (providerCertFilter && !(provider.certifications ?? []).includes(providerCertFilter)) {
        return false;
      }
      if (!query) {
        return true;
      }
      return [provider.name, provider.city, provider.category, provider.description, provider.tags.join(' ')]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [providerCertFilter, providerCityFilter, providerProductFilter, providerSearch, rankedProviders]);

  const selectedProviders = useMemo(() => {
    const selected = new Set(draft.selectedProviders);
    return providers.filter((provider) => selected.has(provider.id));
  }, [draft.selectedProviders, providers]);

  const composerCategory = useMemo(
    () => getCategoryOption(requestCategories, draft.category),
    [draft.category, requestCategories],
  );
  const composerModules = useMemo(
    () => getProductModules(requestCategories, draft.category),
    [draft.category, requestCategories],
  );
  const composerMaterialModule = composerModules.find(
    (module) => canonicalModuleKey(module.id) === 'material' && module.options.length > 0,
  );
  const composerQuantityModule = composerModules.find((module) => module.type === 'quantity');

  const editingIndex = Math.min(specIndex, Math.max(productCount - 1, 0));
  const editingLine: ProductLine | null = draft.products[editingIndex] ?? null;
  const editingDraft = editingLine ? withProductLine(draft, editingLine) : null;
  const editingModules = editingLine ? getProductModules(requestCategories, editingLine.category) : [];
  const currentField = editingLine && fieldStep.productId === editingLine.id ? Math.min(fieldStep.index, Math.max(editingModules.length - 1, 0)) : 0;

  const deliveryAddress = formatDeliveryAddress(draft);
  const deliveryMapUrl = useMemo(
    () =>
      `https://www.google.com/maps?q=${encodeURIComponent(formatDeliveryAddress(draft) || 'Argentina')}&z=${
        draft.deliveryAddressLine.trim() ? 12 : 4
      }&output=embed`,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [draft.deliveryAddressLine, draft.deliveryCity, draft.deliveryCountry],
  );
  const activeWhen =
    draft.deliveryDateMode === 'asap'
      ? 'asap'
      : draft.deliveryDateMode === 'exact'
        ? 'exact'
        : draft.deliveryDateRange;

  // Filtro de productos del paso 1 (viene del home: ?only=Label1,Label2).
  const onlyLabels = (searchParams?.get('only') ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const normalizeLabel = (value: string) =>
    value
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .trim();
  const onlyNormalized = onlyLabels.map(normalizeLabel);
  const matchedCategories =
    onlyNormalized.length > 0
      ? requestCategories.filter((item) => {
          const label = normalizeLabel(item.label);
          return onlyNormalized.some(
            (token) => label === token || label.includes(token) || token.includes(label),
          );
        })
      : requestCategories;
  // Si el filtro no coincide con ninguna categoría real, mostramos todas
  // (evita que el paso 1 quede vacío por una etiqueta desalineada).
  const filterActive = onlyLabels.length > 0 && matchedCategories.length > 0;
  const visibleCategories = filterActive ? matchedCategories : requestCategories;

  const allSpecsReviewed = productCount > 0 && allProductLines.every((line) => line.specsReviewed);
  const deliveryReady = Boolean(draft.deliveryAddressLine.trim());
  const quantityUnits = Array.from(new Set(allProductLines.map((line) => line.unit || 'unidades')));
  const quantityTotal = allProductLines.reduce((sum, line) => sum + (Number.parseInt(line.quantity, 10) || 0), 0);

  function getCategoryImage(category: string) {
    return getCategoryOption(requestCategories, category)?.imageSrc ?? null;
  }

  function getLineSpecEntries(line: ProductLine) {
    const modules = getProductModules(requestCategories, line.category);
    const lineDraft = withProductLine(draft, line);
    const fromModules = modules
      .filter((module) => {
        const key = canonicalModuleKey(module.id);
        return module.type !== 'uploader' && module.type !== 'quantity' && key !== 'material' && key !== 'observaciones';
      })
      .map((module) => ({ label: module.label, value: getModuleValue(lineDraft, module.id).trim() }))
      .filter((entry) => entry.value);
    if (fromModules.length > 0 || !line.specifications?.trim()) {
      return fromModules;
    }
    return line.specifications
      .split('\n')
      .map((raw) => {
        const index = raw.indexOf(':');
        return index === -1
          ? { label: '', value: raw.trim() }
          : { label: raw.slice(0, index).trim(), value: raw.slice(index + 1).trim() };
      })
      .filter((entry) => entry.value && !/^cantidad|^material$/i.test(entry.label));
  }

  // --- Compositor del paso 1 ---------------------------------------------

  function updateComposerSpec(moduleId: string, value: string) {
    setDraft((current) => {
      const next: RequestDraft = {
        ...current,
        specSelections: {
          ...current.specSelections,
          [moduleId]: value,
        },
      };

      const syncedField = syncedDraftFields[canonicalModuleKey(moduleId)];
      if (syncedField) {
        next[syncedField] = value as never;
      }

      return next;
    });
  }

  function selectCategory(label: string) {
    setError(null);
    setDraft((current) =>
      current.category === label
        ? current
        : { ...current, ...blankProductFields(), category: label, unit: getDefaultUnit(label) },
    );
    // En mobile el formulario del producto queda debajo de la grilla: se baja
    // hasta él para que se vea qué completar después de elegir la categoría.
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches) {
      window.setTimeout(() => {
        document.getElementById('wizard-composer')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    }
  }

  function clearComposer() {
    setError(null);
    setDraft((current) => ({ ...current, ...blankProductFields() }));
  }

  function updateComposerQuantity(raw: string) {
    const value = cleanQuantity(raw);
    if (composerQuantityModule) {
      updateComposerSpec(composerQuantityModule.id, value);
      return;
    }
    setDraft((current) => ({ ...current, quantity: value }));
  }

  function addComposerToRequest(): boolean {
    setError(null);
    if (!draft.category.trim()) {
      setError('Seleccioná una categoría para agregar el producto.');
      return false;
    }
    if (composerMaterialModule?.required && !getModuleValue(draft, composerMaterialModule.id).trim()) {
      setError('Elegí el material principal del producto.');
      return false;
    }
    if (!draft.quantity.trim()) {
      setError('Indicá la cantidad estimada del producto.');
      return false;
    }
    setDraft((current) => ({
      ...current,
      products: [...current.products, snapshotProduct(current)],
      ...blankProductFields(),
    }));
    return true;
  }

  function continueToSpecs() {
    setError(null);
    const hasComposer = Boolean(draft.category.trim());
    if (hasComposer && !addComposerToRequest()) {
      return;
    }
    if (productCount === 0 && !hasComposer) {
      setError('Agregá al menos un producto a la solicitud.');
      return;
    }
    const firstPending = draft.products.findIndex((line) => !line.specsReviewed);
    setSpecIndex(firstPending !== -1 ? firstPending : hasComposer ? productCount : 0);
    setEditReturnStep(null);
    setStep(2);
  }

  function addAnotherProduct() {
    setError(null);
    setOpenMenu(null);
    setEditReturnStep(null);
    setStep(1);
  }

  // --- Especificaciones de un producto de la lista ---------------------------

  function updateLine(index: number, update: (line: ProductLine) => ProductLine) {
    setDraft((current) => ({
      ...current,
      // Al tocar specs, el texto guardado (modo edición) deja de ser la fuente.
      products: current.products.map((line, i) => (i === index ? { ...update(line), specifications: undefined } : line)),
    }));
  }

  function updateLineSpec(index: number, moduleId: string, value: string) {
    updateLine(index, (line) => {
      const next: ProductLine = { ...line, specSelections: { ...line.specSelections, [moduleId]: value } };
      const syncedField = syncedDraftFields[canonicalModuleKey(moduleId)];
      if (syncedField && syncedField in next) {
        (next as Record<string, unknown>)[syncedField] = value;
      }
      return next;
    });
  }

  function saveCurrentSpecs() {
    if (!editingLine || !editingDraft) {
      return;
    }
    setError(null);
    const missing = editingModules.find(
      (module) => module.required && module.type !== 'uploader' && !getModuleValue(editingDraft, module.id).trim(),
    );
    if (missing) {
      setError(`Completá "${missing.label}" para continuar.`);
      setFieldStep({ productId: editingLine.id, index: editingModules.indexOf(missing) });
      return;
    }
    const products = draft.products.map((line, index) => (index === editingIndex ? { ...line, specsReviewed: true } : line));
    setDraft((current) => ({ ...current, products }));
    if (editReturnStep) {
      setStep(editReturnStep);
      setEditReturnStep(null);
      return;
    }
    const nextPending = products.findIndex((line) => !line.specsReviewed);
    if (nextPending !== -1) {
      setSpecIndex(nextPending);
      return;
    }
    setStep(3);
  }

  function editProduct(id: string) {
    const index = draft.products.findIndex((line) => line.id === id);
    if (index === -1) {
      return;
    }
    setError(null);
    setOpenMenu(null);
    setSpecIndex(index);
    setFieldStep({ productId: id, index: 0 });
    setEditReturnStep(step > 2 ? step : null);
    setStep(2);
  }

  function removeProduct(id: string) {
    setOpenMenu(null);
    const remaining = draft.products.filter((line) => line.id !== id);
    setDraft((current) => ({ ...current, products: current.products.filter((line) => line.id !== id) }));
    if (remaining.length === 0 && step > 1) {
      setStep(1);
    }
  }

  // --- Navegacion -----------------------------------------------------------

  function goToStep(target: StepKey) {
    setError(null);
    setOpenMenu(null);
    setEditReturnStep(null);
    setStep(target);
  }

  function goBack() {
    setError(null);
    if (step === 1) {
      router.push('/dashboard/comprador');
      return;
    }
    if (step === 2) {
      if (editingLine && currentField > 0) {
        setFieldStep({ productId: editingLine.id, index: currentField - 1 });
        return;
      }
      if (editReturnStep) {
        setStep(editReturnStep);
        setEditReturnStep(null);
        return;
      }
      if (editingIndex > 0) {
        const previous = draft.products[editingIndex - 1];
        setSpecIndex(editingIndex - 1);
        // Al volver al producto anterior se retoma en su última especificación.
        setFieldStep({ productId: previous.id, index: Math.max(0, getProductModules(requestCategories, previous.category).length - 1) });
        return;
      }
    }
    setStep((current) => (current > 1 ? ((current - 1) as StepKey) : current));
  }

  function continueToProviders() {
    setError(null);
    if (!draft.deliveryAddressLine.trim()) {
      setError('Indicá dónde entregamos para continuar.');
      return;
    }
    if (draft.deliveryDateMode === 'exact' && !draft.deliveryDate.trim()) {
      setError('Elegí la fecha de entrega para continuar.');
      return;
    }
    setStep(4);
  }

  function continueToSummary() {
    setError(null);
    if (draft.selectedProviders.length === 0) {
      setError('Seleccioná al menos un proveedor para continuar.');
      return;
    }
    setStep(5);
  }

  function saveDraftNow() {
    saveDraft(draft);
    setNotice('Borrador guardado. Podés retomarlo cuando quieras.');
  }

  function saveAndExit() {
    saveDraft(draft);
    router.push('/dashboard/comprador/solicitudes');
  }

  function toggleProvider(providerId: string) {
    setDraft((current) => {
      const has = current.selectedProviders.includes(providerId);
      const selectedProviders = has ? current.selectedProviders.filter((id) => id !== providerId) : [...current.selectedProviders, providerId];
      return { ...current, selectedProviders };
    });
  }

  const allFilteredInvited =
    filteredProviders.length > 0 && filteredProviders.every((provider) => draft.selectedProviders.includes(provider.id));

  function toggleInviteAll() {
    setDraft((current) => {
      const visibleIds = filteredProviders.map((provider) => provider.id);
      const selectedProviders = allFilteredInvited
        ? current.selectedProviders.filter((id) => !visibleIds.includes(id))
        : Array.from(new Set([...current.selectedProviders, ...visibleIds]));
      return { ...current, selectedProviders };
    });
  }

  async function handleSubmit() {
    if (!session) {
      setError('No se encontró la sesión. Volvé a iniciar sesión.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (allProductLines.length === 0) {
        setError('Agregá al menos un producto a la solicitud.');
        return;
      }
      if (draft.selectedProviders.length === 0) {
        setError('Seleccioná al menos un proveedor para publicar la solicitud.');
        return;
      }

      // Un item por producto: cada uno con su nombre, cantidad y specs propias.
      const items = allProductLines.map((line) => {
        const storedSpecs = line.specifications?.trim();
        const lineSpecs = getSpecificationLines(requestCategories, withProductLine(draft, line));
        const parsedQuantity = Number.parseInt(line.quantity, 10);
        return {
          productName: getProductDisplayName(line),
          category: line.category || undefined,
          quantity: Number.isFinite(parsedQuantity) && parsedQuantity > 0 ? parsedQuantity : undefined,
          unit: line.unit || getDefaultUnit(line.category) || undefined,
          specifications: storedSpecs || lineSpecs.join('\n') || undefined,
        };
      });

      const primary = allProductLines[0];
      const primarySpecs = getSpecificationLines(requestCategories, withProductLine(draft, primary));
      const title =
        draft.title.trim() ||
        (allProductLines.length > 1
          ? `Solicitud de ${allProductLines.length} productos`
          : `${primary.category} - ${primarySpecs[0]?.replace(/^[^:]+:\s*/, '') || 'Solicitud de cotización'}`);

      const deliveryLines = [
        deliveryAddress ? `Entrega: ${deliveryAddress}` : null,
        draft.deliveryDateMode === 'asap'
          ? 'Fecha de entrega: Lo antes posible'
          : draft.deliveryDateMode === 'range'
            ? `Rango de entrega: ${draft.deliveryDateRange}`
            : draft.deliveryDate
              ? `Fecha de entrega: ${draft.deliveryDate}`
              : null,
        draft.deliverySchedule ? `Horario de recepcion: ${draft.deliverySchedule}` : null,
        draft.deliveryContactName ? `Contacto en planta: ${draft.deliveryContactName}` : null,
        draft.deliveryPhone ? `Telefono de contacto: ${draft.deliveryPhone}` : null,
        draft.deliveryNotes ? `Observaciones: ${draft.deliveryNotes}` : null,
      ].filter(Boolean);

      const productsSummary =
        allProductLines.length > 1
          ? `Productos solicitados: ${allProductLines.map((line) => getProductDisplayName(line)).join(', ')}`
          : null;

      const description =
        [productsSummary, ...primarySpecs, ...deliveryLines].filter(Boolean).join('\n') ||
        'Solicitud de cotización.';

      const trimmedDeliveryDate = draft.deliveryDate.trim();
      const parsedDeliveryDate =
        draft.deliveryDateMode === 'exact' && trimmedDeliveryDate ? new Date(trimmedDeliveryDate) : null;
      const dueDate =
        parsedDeliveryDate && !Number.isNaN(parsedDeliveryDate.getTime())
          ? parsedDeliveryDate.toISOString()
          : undefined;
      const selectedProviderNames = selectedProviders.map((provider) => provider.name.trim()).filter(Boolean);
      const preferredSupplierName = selectedProviderNames.join(' | ').slice(0, 120) || undefined;
      const targetSupplierCompanyIds = selectedProviders.map((provider) => provider.id);
      const privateRequest = targetSupplierCompanyIds.length > 0;

      const payload = {
        title,
        description,
        category: primary.category,
        status: 'PUBLISHED' as const,
        dueDate,
        privateRequest,
        preferredSupplierName,
        targetSupplierCompanyIds,
        deliveryMode: draft.deliveryDateMode,
        // Entrega estructurada (además del texto en `description`, para que el
        // detalle no dependa de re-parsear por regex).
        deliveryAddress: formatDeliveryAddress({ ...draft, deliveryCity: '' }) || undefined,
        deliveryCity: draft.deliveryCity.trim() || undefined,
        deliveryContactName: draft.deliveryContactName.trim() || undefined,
        deliveryPhone: draft.deliveryPhone.trim() || undefined,
        deliverySchedule: draft.deliverySchedule.trim() || undefined,
        deliveryNotes: draft.deliveryNotes.trim() || undefined,
        items,
      };

      // Editar = actualizar la existente (no crear otra). Se usa el id de la
      // URL como fuente de verdad para no crear una solicitud vacía si el
      // estado de prefill todavía no terminó de setearse.
      const targetEditId = editRequestId ?? editId;
      const created = targetEditId
        ? await atarApi.updateRequest(targetEditId, payload, session.accessToken)
        : await atarApi.createRequest(payload, session.accessToken);

      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(DRAFT_KEY);
      }
      setCreatedId(created.id);
      setStep(6);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo enviar la solicitud.');
    } finally {
      setSubmitting(false);
    }
  }

  if (step === 6) {
    return (
      <div className="flex min-h-[calc(100vh-120px)] items-center justify-center py-6">
        <div className="w-full max-w-[560px] rounded-[16px] border border-[#e3e8f3] bg-white px-6 py-12 text-center shadow-[0_18px_48px_rgba(32,48,90,0.06)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <Icon className="h-6 w-6" name="check" />
          </div>
          <h1 className="mt-6 text-[30px] font-bold tracking-[-0.04em] text-slate-950">{editRequestId ? '¡Cambios guardados!' : '¡Solicitud publicada!'}</h1>
          <p className="mt-2 text-sm text-slate-500">
            Tu solicitud {createdId ? formatRequestCode(createdId) : ''} fue enviada a los proveedores seleccionados.
          </p>

          <div className="mx-auto mt-8 grid max-w-[420px] gap-3 sm:grid-cols-2">
            <Link className={`${secondaryButton} h-11 text-sm`} href="/dashboard/comprador/solicitudes">
              Ver mis solicitudes
            </Link>
            <button className={`${primaryButton} h-11 text-sm`} onClick={() => router.push('/dashboard/comprador')} type="button">
              Ir al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Piezas compartidas ---------------------------------------------------

  const stepper = (
    <div className="hidden sm:block">
      <div className="flex items-start">
        {steps.map((item, index) => {
          const isActive = item.key === step;
          const isDone = item.key < step;
          return (
            <div key={item.key} className={`flex items-start ${index < steps.length - 1 ? 'min-w-0 flex-1' : 'shrink-0'}`}>
              <button
                className="flex w-[104px] shrink-0 flex-col items-center text-center disabled:cursor-default xl:w-[136px]"
                disabled={!isDone}
                onClick={() => goToStep(item.key)}
                type="button"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[13px] font-semibold transition ${
                    isActive
                      ? 'border-[#3f3df5] bg-[#3f3df5] text-white shadow-[0_6px_16px_rgba(63,61,245,0.30)]'
                      : isDone
                        ? 'border-[#3f3df5] bg-white text-[#3f3df5]'
                        : 'border-[#cfd6e8] bg-white text-slate-600'
                  }`}
                >
                  {isDone ? <Icon className="h-4 w-4" name="check" /> : item.key}
                </span>
                <span className={`mt-1.5 truncate text-[13px] leading-4 ${isActive ? 'font-semibold text-[#3f3df5]' : 'font-medium text-slate-700'}`}>
                  {item.label}
                </span>
                <span className={`hidden truncate text-[11px] leading-4 md:block ${isActive ? 'text-[#3f3df5]' : 'text-slate-500'}`}>
                  {isDone ? 'Completado' : item.hint}
                </span>
              </button>
              {index < steps.length - 1 ? (
                <span className={`mx-1 mt-4 h-px min-w-3 flex-1 ${isDone ? 'bg-[#3f3df5]' : 'bg-[#d8deee]'}`} />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );

  const mobileProgress = (
    <div className="flex h-12 items-center gap-3 sm:hidden">
      <button
        aria-label="Volver"
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100"
        onClick={goBack}
        type="button"
      >
        <Icon className="h-5 w-5" name="chev-left" />
      </button>
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-[#3f3df5] transition-all" style={{ width: `${(step / steps.length) * 100}%` }} />
      </div>
      <span className="shrink-0 text-right text-xs leading-4 text-slate-500">
        <span className="block font-semibold text-slate-900">{steps[step - 1]?.label}</span>
        Paso {step} de {steps.length}
      </span>
    </div>
  );

  const alerts = (
    <>
      {error ? (
        <div className="rounded-[12px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}
      {notice ? (
        <div className="rounded-[12px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>
      ) : null}
    </>
  );

  const stepEyebrow = (
    <p className="text-[13px] font-medium uppercase tracking-[0.04em] text-[#3f3df5]">
      Paso {step} de {steps.length}
    </p>
  );

  function productMenu(line: ProductLine) {
    const open = openMenu === line.id;
    return (
      <div className="relative shrink-0">
        <button
          aria-label={`Opciones de ${getProductDisplayName(line)}`}
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100"
          onClick={() => setOpenMenu(open ? null : line.id)}
          type="button"
        >
          <DotsIcon />
        </button>
        {open ? (
          <>
            <button aria-label="Cerrar menú" className="fixed inset-0 z-20 cursor-default" onClick={() => setOpenMenu(null)} type="button" />
            <div className="absolute right-0 top-9 z-30 w-48 overflow-hidden rounded-[10px] border border-[#e3e8f3] bg-white py-1 shadow-[0_16px_40px_rgba(32,48,90,0.14)]">
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-slate-700 hover:bg-slate-50"
                onClick={() => editProduct(line.id)}
                type="button"
              >
                <Icon className="h-3.5 w-3.5" name="edit" />
                Editar especificaciones
              </button>
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-rose-600 hover:bg-rose-50"
                onClick={() => removeProduct(line.id)}
                type="button"
              >
                <Icon className="h-3.5 w-3.5" name="x" />
                Quitar de la solicitud
              </button>
            </div>
          </>
        ) : null}
      </div>
    );
  }

  function productThumb(line: ProductLine, size: string) {
    const imageSrc = getCategoryImage(line.category);
    return (
      <div className={`relative shrink-0 overflow-hidden rounded-[8px] bg-[#f1f4fa] ${size}`}>
        {imageSrc ? <Image alt="" className="object-cover" fill sizes="96px" src={imageSrc} /> : null}
      </div>
    );
  }

  function sidebarProductList(mode: 'plain' | 'compact' | 'status' | 'done') {
    return (
      <div className="space-y-2.5">
        {allProductLines.map((line, index) => {
          const quantityLabel = formatQuantity(line.quantity, line.unit);
          const isEditing = mode === 'status' && index === editingIndex;
          return (
            <div
              key={line.id}
              className={`flex items-center gap-3 rounded-[12px] border bg-white ${mode === 'compact' ? 'p-2' : 'p-2.5'} ${isEditing ? 'border-[#c9cfff]' : 'border-[#e6eaf3]'}`}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eef0ff] text-[12px] font-semibold text-[#3f3df5]">
                {index + 1}
              </span>
              {productThumb(line, mode === 'compact' ? 'h-12 w-12' : 'h-[64px] w-[64px]')}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-slate-950">{getProductDisplayName(line)}</p>
                {mode === 'compact' ? (
                  <p className="truncate text-[12px] text-slate-500">
                    {[getLineMaterial(line), quantityLabel].filter(Boolean).join(' · ')}
                  </p>
                ) : (
                  <>
                    {getLineMaterial(line) ? <p className="truncate text-[12px] text-slate-500">{getLineMaterial(line)}</p> : null}
                    {quantityLabel ? <p className="truncate text-[12px] text-slate-500">{quantityLabel}</p> : null}
                  </>
                )}
              </div>
              {mode === 'status' ? (
                isEditing ? (
                  <span className="shrink-0 rounded-[8px] bg-[#eef0ff] px-2.5 py-1 text-[11px] font-semibold text-[#3f3df5]">En edición</span>
                ) : line.specsReviewed ? (
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <Icon className="h-3.5 w-3.5" name="check" />
                  </span>
                ) : (
                  <span className="shrink-0 rounded-[8px] bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">Pendiente</span>
                )
              ) : null}
              {mode === 'done' ? (
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white ${line.specsReviewed ? 'bg-emerald-500' : 'bg-slate-300'}`}
                >
                  <Icon className="h-3.5 w-3.5" name="check" />
                </span>
              ) : null}
              {productMenu(line)}
            </div>
          );
        })}
      </div>
    );
  }

  const addProductCard = (
    <button
      className="flex w-full flex-col items-center justify-center rounded-[12px] border border-dashed border-[#b8c1f0] bg-white px-4 py-3 text-center transition hover:bg-[#fafbff]"
      onClick={addAnotherProduct}
      type="button"
    >
      <span className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#3f3df5]">
        <Icon className="h-4 w-4" name="plus" />
        Agregar otro producto
      </span>
      <span className="mt-1 max-w-[260px] text-[12px] leading-4 text-slate-500">
        Podés sumar todos los productos que necesités en una sola solicitud.
      </span>
    </button>
  );

  function helpCard(icon: IconName, title: string, text: string) {
    return (
      <div className="rounded-[16px] border border-[#e3e8f3] bg-[#eef1ff] p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#3f3df5]">
            <Icon className="h-5 w-5" name={icon} />
          </span>
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-slate-950">{title}</p>
            <p className="mt-1 text-[12px] leading-[18px] text-slate-600">{text}</p>
            {/* globals.css fija `a { color: inherit }` fuera de las capas de
                Tailwind: el color va en un hijo para que no lo pise. */}
            <Link className={`${outlineAccentButton} mt-3 h-9 px-4 text-[13px]`} href="/contacto">
              <span className="inline-flex items-center gap-2 text-[#3f3df5]">
                <Icon className="h-4 w-4" name="chat" />
                Hablar con un especialista
              </span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  function providerImage(provider: ProviderDirectoryItem, size: string) {
    if (provider.logoUrl) {
      return (
        <CompanyLogo
          className={size}
          logoUrl={provider.logoUrl}
          name={provider.name}
          rounded="rounded-[8px]"
        />
      );
    }
    const haystack = [...provider.tags, ...(provider.mainProducts ?? [])].join(' ').toLowerCase();
    const matched =
      requestCategories.find((category) => haystack.includes(category.label.toLowerCase())) ??
      getCategoryOption(requestCategories, allProductLines[0]?.category ?? '');
    return (
      <div className={`relative shrink-0 overflow-hidden rounded-[8px] bg-[#eef1f8] ${size}`}>
        {matched?.imageSrc ? (
          <Image alt="" className="object-cover" fill sizes="180px" src={matched.imageSrc} />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[22px] font-bold text-[#3f3df5]">{provider.name.slice(0, 1)}</span>
        )}
      </div>
    );
  }

  function providerTags(provider: ProviderDirectoryItem, limit = 3) {
    const tags = Array.from(new Set([...(provider.mainProducts ?? []), ...provider.tags])).slice(0, limit);
    if (tags.length === 0) {
      return null;
    }
    return (
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span key={tag} className="rounded-full border border-[#e3e8f3] px-2.5 py-0.5 text-[11px] text-slate-600">
            {tag}
          </span>
        ))}
      </div>
    );
  }

  // --- Contenido de cada paso -------------------------------------------------

  // En escritorio cada paso ocupa exactamente el alto disponible: encabezado y
  // acciones quedan fijos y solo scrollea por dentro la zona que puede crecer
  // (categorías, campos, proveedores, productos).
  const stepCard =
    'flex flex-col rounded-[16px] border border-[#e3e8f3] bg-white shadow-[0_10px_30px_rgba(32,48,90,0.04)] lg:min-h-0 lg:flex-1';
  const cardHeader = 'shrink-0 px-5 pt-5 sm:px-6';
  const scrollArea =
    'lg:min-h-0 lg:flex-1 lg:overflow-y-auto [scrollbar-color:#d5dbeb_transparent] [scrollbar-width:thin]';
  // En mobile las acciones quedan pegadas al borde inferior mientras se scrollea.
  const cardFooter =
    'flex shrink-0 items-center justify-between gap-3 rounded-b-[16px] border-t border-[#edf0f7] bg-white px-5 py-3.5 sm:px-6 max-lg:sticky max-lg:bottom-0 max-lg:z-20 max-lg:shadow-[0_-8px_20px_rgba(32,48,90,0.06)]';
  const stepTitle = 'mt-0.5 text-[24px] font-bold leading-tight tracking-[-0.035em] text-slate-950 xl:text-[28px]';
  const stepSubtitle = 'mt-1 text-[14px] leading-5 text-slate-500';

  const specialistLink = (
    <div className="mt-3 flex shrink-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 border-t border-[#edf0f7] pt-3 text-[12px]">
      <span className="text-[#3f3df5]">
        <Icon className="h-3.5 w-3.5" name="bulb" />
      </span>
      <span className="whitespace-nowrap text-slate-600">¿No lo encontrás?</span>
      <Link className="whitespace-nowrap font-medium hover:underline" href="/contacto">
        <span className="inline-flex items-center gap-1 text-[#3f3df5]">
          Hablá con un especialista
          <Icon className="h-3 w-3" name="arrow-right" />
        </span>
      </Link>
    </div>
  );

  const stepOne = (
    <>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[24px] font-bold leading-tight tracking-[-0.035em] text-slate-950 xl:text-[28px]">
            {editRequestId ? 'Editar solicitud de cotización' : 'Nueva solicitud de cotización'}
          </h1>
          <p className="mt-0.5 text-[14px] text-slate-500">Agregá los productos que necesitás y conectá con los mejores proveedores.</p>
        </div>
        <button className={`${outlineAccentButton} h-10 px-4 text-[13px]`} onClick={saveDraftNow} type="button">
          <Icon className="h-4 w-4" name="save" />
          Guardar borrador
        </button>
      </div>

      <div className="shrink-0">{stepper}</div>

      {productCount === 0 || showHowItWorks ? (
      <div className="shrink-0 rounded-[12px] bg-[#eef1fd] px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#6a78ff] to-[#3f3df5] text-white shadow-[0_8px_18px_rgba(63,61,245,0.25)]">
            <Icon className="h-5 w-5" name="box" />
          </span>
          <div className="min-w-0 flex-1 basis-[200px]">
            <p className="text-[14px] font-semibold text-slate-950">Podés agregar varios productos en una misma solicitud.</p>
            <p className="text-[12px] text-slate-500">Esto te permite recibir cotizaciones integradas y ahorrar tiempo.</p>
          </div>
          <button
            className="inline-flex h-9 items-center justify-center gap-2 rounded-[10px] bg-white px-3.5 text-[13px] font-semibold text-[#3f3df5] shadow-[0_4px_12px_rgba(32,48,90,0.06)] max-sm:w-full"
            onClick={() => setShowHowItWorks((current) => !current)}
            type="button"
          >
            <svg aria-hidden="true" className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 4v16l13-8L7 4z" />
            </svg>
            Ver cómo funciona
            <Icon className="h-4 w-4" name={showHowItWorks ? 'x' : 'arrow-right'} />
          </button>
        </div>
        {showHowItWorks ? (
          <ol className="mt-3 grid gap-2 border-t border-[#dde2f7] pt-3 text-[12px] text-slate-600 sm:grid-cols-3">
            <li><span className="font-semibold text-[#3f3df5]">1.</span> Elegí una categoría, el material y la cantidad, y agregala a la solicitud.</li>
            <li><span className="font-semibold text-[#3f3df5]">2.</span> Repetí con cada producto que necesites.</li>
            <li><span className="font-semibold text-[#3f3df5]">3.</span> Después completás las especificaciones de cada uno y elegís proveedores.</li>
          </ol>
        ) : null}
      </div>
      ) : null}

      {alerts}

      <div className={stepCard}>
        <div className={cardHeader}>
          {stepEyebrow}
          <h2 className={stepTitle}>¿Qué producto querés cotizar?</h2>
          <p className={stepSubtitle}>
            Seleccioná la categoría y contanos qué estás buscando. Siempre podés agregar más productos después.
            {filterActive ? (
              <button
                className="ml-2 font-semibold text-[#3f3df5]"
                onClick={() => router.push('/dashboard/comprador/solicitudes/nueva?step=1')}
                type="button"
              >
                Ver todas las categorías
              </button>
            ) : null}
          </p>
        </div>

        <div className="grid gap-4 p-5 sm:px-6 lg:min-h-0 lg:flex-1 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className={`${scrollArea} -mr-2 pr-2`}>
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5 lg:h-full lg:auto-rows-fr lg:grid-cols-4 2xl:grid-cols-5">
              {visibleCategories.length === 0 ? (
                <div className="col-span-full rounded-[12px] border border-dashed border-slate-300 px-5 py-8 text-sm text-slate-500">
                  {requestCategories.length === 0 ? 'Cargando categorías…' : 'No hay productos para este filtro.'}
                </div>
              ) : (
                visibleCategories.map((option) => {
                  const active = draft.category === option.label;
                  return (
                    <button
                      key={option.id}
                      className={`group flex flex-col rounded-[10px] border bg-white p-1.5 text-left transition ${
                        active
                          ? 'border-[#3f3df5] shadow-[0_0_0_1px_#3f3df5,0_10px_24px_rgba(63,61,245,0.12)]'
                          : 'border-[#e3e8f3] hover:border-[#c9cfff] hover:shadow-[0_8px_20px_rgba(32,48,90,0.06)]'
                      }`}
                      onClick={() => selectCategory(option.label)}
                      type="button"
                    >
                      <div className="relative aspect-[16/9] overflow-hidden rounded-[6px] bg-[#f1f4fa] lg:aspect-auto lg:min-h-[52px] lg:flex-1">
                        {option.imageSrc ? (
                          <Image
                            alt=""
                            className="object-cover transition duration-300 group-hover:scale-105"
                            fill
                            sizes="200px"
                            src={option.imageSrc}
                          />
                        ) : null}
                        {active ? (
                          <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#3f3df5] text-white shadow">
                            <Icon className="h-3 w-3" name="check" />
                          </span>
                        ) : null}
                      </div>
                      <p className="shrink-0 truncate px-0.5 pb-0.5 pt-1.5 text-[11px] font-semibold text-slate-900 sm:px-1 sm:pt-2 sm:text-[12px]">{option.label}</p>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex scroll-mt-4 flex-col gap-3 lg:min-h-0 lg:overflow-y-auto [scrollbar-width:none]" id="wizard-composer">
            <div className="flex flex-1 flex-col rounded-[12px] border border-[#e3e8f3] bg-white p-4 lg:min-h-fit">
              {composerCategory ? (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-[16px] font-bold text-slate-950">Producto {productCount + 1}</p>
                    <button className="inline-flex items-center gap-1.5 text-[12px] text-slate-600 hover:text-slate-900" onClick={clearComposer} type="button">
                      <Icon className="h-3.5 w-3.5" name="x" />
                      Cerrar
                    </button>
                  </div>

                  <label className="mt-3 block text-[12px] font-medium text-slate-700">Categoría</label>
                  <div className="relative mt-1.5">
                    <span className="pointer-events-none absolute left-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-[6px] bg-[#eef0ff] text-[#3f3df5]">
                      <Icon className="h-3.5 w-3.5" name="box" />
                    </span>
                    <select
                      className={`${fieldInput} h-10 appearance-none pl-11 pr-9 text-[13px]`}
                      onChange={(event) => selectCategory(event.target.value)}
                      value={draft.category}
                    >
                      {requestCategories.map((option) => (
                        <option key={option.id} value={option.label}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                      <Icon name="chev-down" />
                    </span>
                  </div>

                  {composerMaterialModule ? (
                    <>
                      <label className="mt-3 block text-[12px] font-medium text-slate-700">Material principal</label>
                      <div className="relative mt-1.5">
                        <span className="pointer-events-none absolute left-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-[6px] bg-[#eef0ff] text-[#3f3df5]">
                          <Icon className="h-3.5 w-3.5" name="layers" />
                        </span>
                        <select
                          className={`${fieldInput} h-10 appearance-none pl-11 pr-9 text-[13px]`}
                          onChange={(event) => updateComposerSpec(composerMaterialModule.id, event.target.value)}
                          value={getModuleValue(draft, composerMaterialModule.id)}
                        >
                          <option value="">Elegí un material</option>
                          {composerMaterialModule.options.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                          <Icon name="chev-down" />
                        </span>
                      </div>
                    </>
                  ) : null}

                  <label className="mt-3 block text-[12px] font-medium text-slate-700">Cantidad estimada</label>
                  <div className="mt-1.5 grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-2">
                    <input
                      className={`${fieldInput} h-10 text-[13px]`}
                      inputMode="numeric"
                      onChange={(event) => updateComposerQuantity(event.target.value)}
                      placeholder="Ej: 1000"
                      value={draft.quantity ? Number(draft.quantity).toLocaleString('es-AR') : ''}
                    />
                    <div className="relative">
                      <select
                        className={`${fieldInput} h-10 appearance-none pr-8 text-[13px]`}
                        onChange={(event) => setDraft((current) => ({ ...current, unit: event.target.value }))}
                        value={draft.unit || getDefaultUnit(draft.category)}
                      >
                        {getCategoryUnits(draft.category).map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500">
                        <Icon name="chev-down" />
                      </span>
                    </div>
                  </div>

                  {/* La vista previa solo usa el alto que sobra: se achica con la
                      pantalla y desaparece si no entra, sin empujar los botones. */}
                  <div className="relative mt-4 min-h-0 flex-1 basis-0 [container-type:size] max-lg:hidden">
                    <div className="absolute inset-0 overflow-hidden rounded-[10px] bg-[#f1f4fa] [@container(max-height:72px)]:hidden">
                      {composerCategory.imageSrc ? (
                        <Image alt="" className="object-cover" fill sizes="340px" src={composerCategory.imageSrc} />
                      ) : null}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/75 to-transparent px-3 pb-2.5 pt-6">
                        <p className="truncate text-[13px] font-semibold text-white">{composerCategory.label}</p>
                        <p className="text-[11px] leading-4 text-white/85 [@container(max-height:120px)]:hidden">
                          Medidas, color y terminaciones se completan en el paso de especificaciones.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center justify-between gap-2 pt-4">
                    <button className={`${secondaryButton} h-10 px-4 text-[13px]`} onClick={clearComposer} type="button">
                      Cancelar
                    </button>
                    <button className={`${primaryButton} h-10 px-4 text-[13px]`} onClick={() => addComposerToRequest()} type="button">
                      Agregar a la solicitud
                      <Icon name="arrow-right" />
                    </button>
                  </div>
                  {specialistLink}
                </>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eef0ff] text-[#3f3df5]">
                    <Icon className="h-5 w-5" name="box" />
                  </span>
                  <p className="mt-3 text-[15px] font-semibold text-slate-950">Producto {productCount + 1}</p>
                  <p className="mt-1 max-w-[230px] text-[13px] leading-5 text-slate-500">
                    Elegí una categoría para indicar el material y la cantidad que necesitás.
                  </p>
                </div>
              )}
              {composerCategory ? null : specialistLink}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  /** Pregunta que encabeza cada sub-paso de especificaciones. */
  function fieldQuestion(module: RequestCatalogFieldRecord) {
    const key = canonicalModuleKey(module.id);
    if (key === 'observaciones') return '¿Algo más que debamos saber?';
    if (module.type === 'quantity') return '¿Qué cantidad necesitás?';
    if (module.type === 'textarea') return module.label;
    return `${module.label}`;
  }

  function goToField(index: number) {
    if (!editingLine) return;
    setError(null);
    setFieldStep({ productId: editingLine.id, index: Math.max(0, Math.min(index, editingModules.length - 1)) });
  }

  function nextField() {
    if (!editingLine || !editingDraft) return;
    const field = editingModules[currentField];
    if (field?.required && field.type !== 'uploader' && !getModuleValue(editingDraft, field.id).trim()) {
      setError(`Completá "${field.label}" para continuar.`);
      return;
    }
    if (currentField >= editingModules.length - 1) {
      saveCurrentSpecs();
      return;
    }
    goToField(currentField + 1);
  }

  function renderFieldInput(module: RequestCatalogFieldRecord) {
    if (!editingLine || !editingDraft) {
      return null;
    }
    const value = getModuleValue(editingDraft, module.id);
    const optional = !module.required;
    const isLast = currentField >= editingModules.length - 1;

    if (module.type === 'choices' || module.type === 'segmented') {
      return (
        <div className={`grid min-h-[132px] flex-1 auto-rows-fr gap-3 lg:max-h-[300px] ${module.options.length <= 3 ? 'sm:grid-cols-3' : module.options.length === 4 ? 'grid-cols-2 xl:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3'}`}>
          {module.options.map((option) => {
            const active = value === option;
            return (
              <button
                key={option}
                className={`relative flex h-full min-h-[96px] items-center justify-center rounded-[16px] border-2 px-4 text-center text-[19px] font-semibold transition ${
                  active
                    ? 'border-[#3f3df5] bg-[#f3f2ff] text-[#3f3df5] shadow-[0_10px_24px_rgba(63,61,245,0.16)]'
                    : 'border-[#e3e8f3] bg-white text-slate-800 hover:-translate-y-0.5 hover:border-[#c9cfff] hover:shadow-[0_10px_24px_rgba(32,48,90,0.06)]'
                }`}
                onClick={() => {
                  const clearing = active && optional;
                  updateLineSpec(editingIndex, module.id, clearing ? '' : option);
                  // Elegir una opción (aunque ya estuviera elegida) avanza solo al siguiente sub-paso.
                  if (!clearing && !isLast) {
                    window.setTimeout(() => goToField(currentField + 1), 220);
                  }
                }}
                type="button"
              >
                {option}
                {active ? (
                  <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#3f3df5] text-white">
                    <Icon className="h-3.5 w-3.5" name="check" />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      );
    }

    if (module.type === 'quantity') {
      const units = getCategoryUnits(editingLine.category);
      const activeUnit = editingLine.unit || getDefaultUnit(editingLine.category);
      return (
        <div className="space-y-5">
          <input
            autoFocus
            className={`${fieldInput} h-16 text-[26px] font-semibold tracking-tight`}
            inputMode="numeric"
            onChange={(event) => updateLineSpec(editingIndex, module.id, cleanQuantity(event.target.value))}
            onKeyDown={(event) => event.key === 'Enter' && nextField()}
            placeholder="Ej: 1.000"
            value={value ? Number(value).toLocaleString('es-AR') : ''}
          />
          <div>
            <p className="mb-2.5 text-[14px] font-medium text-slate-600">Unidad de medida</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {units.map((unit) => (
                <button
                  key={unit}
                  className={`h-16 rounded-[12px] border-2 text-[16px] font-semibold transition ${
                    activeUnit === unit ? 'border-[#3f3df5] bg-[#f3f2ff] text-[#3f3df5]' : 'border-[#e3e8f3] text-slate-700 hover:border-[#c9cfff]'
                  }`}
                  onClick={() => updateLine(editingIndex, (line) => ({ ...line, unit }))}
                  type="button"
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (module.type === 'textarea') {
      const isNotes = canonicalModuleKey(module.id) === 'observaciones';
      return (
        <div className="relative">
          <textarea
            autoFocus
            className={`${fieldInput} h-48 resize-none py-4 text-[16px] leading-7`}
            maxLength={500}
            onChange={(event) => updateLineSpec(editingIndex, module.id, event.target.value)}
            placeholder={isNotes ? 'Ej. uso final, medidas, terminación, certificaciones, entregas parciales…' : module.placeholder ?? undefined}
            value={value}
          />
          <span className="pointer-events-none absolute bottom-3 right-4 text-[12px] text-slate-400">{value.length}/500</span>
        </div>
      );
    }

    return (
      <input
        autoFocus
        className={`${fieldInput} h-16 text-[22px] font-semibold tracking-tight`}
        onChange={(event) => updateLineSpec(editingIndex, module.id, event.target.value)}
        onKeyDown={(event) => event.key === 'Enter' && nextField()}
        placeholder={module.placeholder ?? undefined}
        type={module.inputType ?? 'text'}
        value={value}
      />
    );
  }

  const activeModule = editingModules[currentField] ?? null;
  const isLastField = currentField >= editingModules.length - 1;

  const stepTwo = editingLine ? (
    <div className={stepCard}>
      <div className={`${cardHeader} pb-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            {stepEyebrow}
            <h1 className={stepTitle}>Especificaciones del producto</h1>
          </div>
          <div className="relative flex items-center gap-3 rounded-[12px] border border-[#e6eaf3] bg-[#f6f8fc] py-2 pl-2 pr-3">
            <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-[10px] bg-white">
              {getCategoryImage(editingLine.category) ? (
                <Image alt="" className="object-cover" fill sizes="44px" src={getCategoryImage(editingLine.category) as string} />
              ) : null}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold text-slate-950">
                {editingIndex + 1}. {getProductDisplayName(editingLine)}
              </p>
              <p className="truncate text-[12px] text-slate-500">
                {[getLineMaterial(editingLine), formatQuantity(editingLine.quantity, editingLine.unit)].filter(Boolean).join(' · ')}
              </p>
            </div>
            {productCount > 1 ? (
              <button
                aria-label="Cambiar producto"
                className="ml-1 flex h-8 w-8 items-center justify-center rounded-full text-[#3f3df5] hover:bg-white"
                onClick={() => setProductSwitcherOpen((current) => !current)}
                type="button"
              >
                <Icon className="h-4 w-4" name="chev-down" />
              </button>
            ) : null}
            {productSwitcherOpen ? (
              <>
                <button aria-label="Cerrar" className="fixed inset-0 z-20 cursor-default" onClick={() => setProductSwitcherOpen(false)} type="button" />
                <div className="absolute right-0 top-[calc(100%+6px)] z-30 w-64 overflow-hidden rounded-[10px] border border-[#e3e8f3] bg-white py-1 shadow-[0_16px_40px_rgba(32,48,90,0.14)]">
                  {allProductLines.map((line, index) => (
                    <button
                      key={line.id}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-slate-50 ${index === editingIndex ? 'font-semibold text-[#3f3df5]' : 'text-slate-700'}`}
                      onClick={() => {
                        setSpecIndex(index);
                        setProductSwitcherOpen(false);
                      }}
                      type="button"
                    >
                      <span className="w-4 text-slate-400">{index + 1}</span>
                      <span className="truncate">{getProductDisplayName(line)}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>

        {/* Sub-pasos: una especificación por pantalla. */}
        {editingModules.length > 0 ? (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {editingModules.map((module, index) => {
              const done = Boolean(editingDraft && getModuleValue(editingDraft, module.id).trim());
              const active = index === currentField;
              return (
                <button
                  key={module.id}
                  className={`flex shrink-0 items-center gap-2 rounded-[10px] border px-3 py-2 text-left transition sm:min-w-0 sm:flex-1 sm:shrink ${
                    active
                      ? 'border-[#3f3df5] bg-[#f3f2ff]'
                      : done
                        ? 'border-[#dfe4f0] bg-white hover:border-[#c9cfff]'
                        : 'border-dashed border-[#dfe4f0] bg-white hover:border-[#c9cfff]'
                  }`}
                  onClick={() => goToField(index)}
                  type="button"
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold ${
                      done ? 'bg-emerald-500 text-white' : active ? 'bg-[#3f3df5] text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {done ? <Icon className="h-3.5 w-3.5" name="check" /> : index + 1}
                  </span>
                  <span className={`whitespace-nowrap text-[13px] sm:truncate ${active ? 'font-semibold text-[#3f3df5]' : 'text-slate-600'}`}>
                    {canonicalModuleKey(module.id) === 'observaciones' ? 'Notas' : module.label}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className={`${scrollArea} flex flex-col border-t border-[#edf0f7] px-5 py-6 sm:px-8`}>
        {activeModule ? (
          <div key={`${editingLine.id}-${activeModule.id}`} className="animate-fade-up flex flex-1 flex-col [animation-duration:0.4s]">
            <p className="text-[13px] font-medium text-slate-500">
              Especificación {currentField + 1} de {editingModules.length}
              {activeModule.required ? '' : ' · opcional'}
            </p>
            <h2 className="mt-1 text-[26px] font-bold tracking-[-0.03em] text-slate-950 xl:text-[30px]">{fieldQuestion(activeModule)}</h2>
            <p className="mt-1 text-[14px] text-slate-500">
              {activeModule.helper && activeModule.type !== 'uploader'
                ? activeModule.helper
                : activeModule.type === 'choices' || activeModule.type === 'segmented'
                  ? 'Elegí una opción. Si no estás seguro, elegí la más cercana y aclaralo en las notas.'
                  : activeModule.type === 'textarea'
                    ? 'Contá cualquier detalle que ayude a los proveedores a cotizar mejor.'
                    : 'Completá el dato para continuar.'}
            </p>
            <div className="mt-6 flex flex-1 flex-col">{renderFieldInput(activeModule)}</div>

          </div>
        ) : (
          <p className="text-[14px] text-slate-500">
            Esta categoría no tiene especificaciones predefinidas. Podés continuar y aclarar los detalles por el chat con el proveedor.
          </p>
        )}
      </div>

      <div className={cardFooter}>
        <button className={`${secondaryButton} h-11 px-6 text-[14px]`} onClick={goBack} type="button">
          <Icon name="arrow-left" />
          {currentField > 0 ? 'Anterior' : 'Volver'}
        </button>
        {editingModules.length > 0 ? (
          <span className="hidden h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 sm:block sm:max-w-[240px]">
            <span className="block h-full rounded-full bg-[#3f3df5] transition-all" style={{ width: `${((currentField + 1) / editingModules.length) * 100}%` }} />
          </span>
        ) : null}
        <button className={`${primaryButton} h-11 px-6 text-[14px]`} onClick={editingModules.length === 0 ? saveCurrentSpecs : nextField} type="button">
          {!isLastField && editingModules.length > 0 ? 'Siguiente' : editReturnStep ? 'Guardar cambios' : 'Guardar y agregar al listado'}
          <Icon name="arrow-right" />
        </button>
      </div>
    </div>
  ) : (
    <div className={`${stepCard} items-center justify-center p-8 text-center`}>
      <p className="text-[16px] font-semibold text-slate-950">Todavía no agregaste productos.</p>
      <button className={`${primaryButton} mt-4 h-11 px-5 text-[14px]`} onClick={() => goToStep(1)} type="button">
        Agregar un producto
      </button>
    </div>
  );

  const stepThree = (
    <div className={stepCard}>
      <div className={cardHeader}>
        {stepEyebrow}
        <h1 className={stepTitle}>¿Cuándo y dónde lo necesitás?</h1>
        <p className={stepSubtitle}>Contanos tus tiempos y ubicación para que los proveedores puedan enviarte la mejor propuesta.</p>
      </div>

      <div className="grid gap-5 px-5 py-4 sm:px-6 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className={`${scrollArea} -mr-2 space-y-4 pr-2`}>
          <div>
            <p className="text-[14px] font-semibold text-slate-950">¿Cuándo lo necesitás?</p>
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              {deliveryWhenOptions.map((option) => {
                const active = activeWhen === option.key;
                return (
                  <button
                    key={option.key}
                    className={`flex h-10 items-center gap-2.5 rounded-[10px] border px-3 text-left text-[13px] transition ${
                      active ? 'border-[#3f3df5] bg-[#f5f5ff] text-slate-950' : 'border-[#e3e8f3] text-slate-700 hover:border-[#c9cfff]'
                    }`}
                    onClick={() =>
                      setDraft((current) =>
                        option.key === 'asap' || option.key === 'exact'
                          ? { ...current, deliveryDateMode: option.key }
                          : { ...current, deliveryDateMode: 'range', deliveryDateRange: option.key },
                      )
                    }
                    type="button"
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${active ? 'border-[#3f3df5]' : 'border-slate-300'}`}
                    >
                      {active ? <span className="h-2 w-2 rounded-full bg-[#3f3df5]" /> : null}
                    </span>
                    <span className="truncate">{option.label}</span>
                  </button>
                );
              })}
            </div>
            {draft.deliveryDateMode === 'exact' ? (
              <input
                className={`${fieldInput} mt-2 h-10 text-[13px]`}
                onChange={(event) => setDraft((current) => ({ ...current, deliveryDate: event.target.value }))}
                type="date"
                value={draft.deliveryDate}
              />
            ) : null}
            <p className="mt-2.5 flex items-start gap-2 text-[12px] leading-5 text-slate-500">
              <span className="mt-0.5 text-[#3f3df5]">
                <Icon className="h-3.5 w-3.5" name="calendar" />
              </span>
              Los proveedores verán tu fecha estimada y podrán indicarte sus tiempos de entrega.
            </p>
          </div>

          <div className="h-px bg-[#e6eaf3]" />

          <div>
            <p className="text-[14px] font-semibold text-slate-950">¿Dónde entregamos?</p>
            <div className="relative mt-2.5">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#3f3df5]">
                <Icon className="h-4 w-4" name="pin" />
              </span>
              <input
                className={`${fieldInput} h-11 pl-10 pr-10 text-[14px]`}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, deliveryAddressLine: event.target.value, deliveryAddressMode: 'new' }))
                }
                placeholder="Ciudad, provincia o dirección de la planta"
                value={draft.deliveryAddressLine}
              />
              {draft.deliveryAddressLine ? (
                <button
                  aria-label="Borrar ubicación"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  onClick={() => setDraft((current) => ({ ...current, deliveryAddressLine: '' }))}
                  type="button"
                >
                  <Icon name="x" />
                </button>
              ) : null}
            </div>
            <p className="mt-4 text-[14px] font-semibold text-slate-950">
              Datos de recepción <span className="font-normal text-slate-500">(opcional)</span>
            </p>
            <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
                <input
                  className={`${fieldInput} h-10 text-[13px]`}
                  onChange={(event) => setDraft((current) => ({ ...current, deliveryCity: event.target.value }))}
                  placeholder="Ciudad"
                  value={draft.deliveryCity}
                />
                <div className="relative">
                  <select
                    className={`${fieldInput} h-10 appearance-none pr-9 text-[13px]`}
                    onChange={(event) => setDraft((current) => ({ ...current, deliveryCountry: event.target.value }))}
                    value={draft.deliveryCountry}
                  >
                    <option value="Argentina">Argentina</option>
                    <option value="Uruguay">Uruguay</option>
                    <option value="Chile">Chile</option>
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                    <Icon name="chev-down" />
                  </span>
                </div>
                <input
                  className={`${fieldInput} h-10 text-[13px]`}
                  onChange={(event) => setDraft((current) => ({ ...current, deliverySchedule: event.target.value }))}
                  placeholder="Horario de recepción"
                  value={draft.deliverySchedule}
                />
                <input
                  className={`${fieldInput} h-10 text-[13px]`}
                  onChange={(event) => setDraft((current) => ({ ...current, deliveryContactName: event.target.value }))}
                  placeholder="Contacto en planta"
                  value={draft.deliveryContactName}
                />
                <input
                  className={`${fieldInput} h-10 text-[13px] sm:col-span-2`}
                  onChange={(event) => setDraft((current) => ({ ...current, deliveryPhone: event.target.value }))}
                  placeholder="Teléfono de contacto"
                  value={draft.deliveryPhone}
                />
            </div>
          </div>

          <div>
            <p className="text-[14px] font-semibold text-slate-950">
              Nota para los proveedores <span className="font-normal text-slate-500">(opcional)</span>
            </p>
            <div className="relative mt-2.5">
              <textarea
                className={`${fieldInput} h-[76px] resize-none py-2.5 text-[13px]`}
                maxLength={300}
                onChange={(event) => setDraft((current) => ({ ...current, deliveryNotes: event.target.value }))}
                placeholder="¿Entregás en más de una ubicación? Aclaralo acá (ej: portón 3, varias entregas, stock inmediato…)"
                value={draft.deliveryNotes}
              />
              <span className="pointer-events-none absolute bottom-2 right-3 text-[11px] text-slate-400">{draft.deliveryNotes.length}/300</span>
            </div>
          </div>
        </div>

        <div className="flex min-h-[300px] flex-col gap-2.5 lg:min-h-0">
          <div className="flex shrink-0 items-center gap-2.5 rounded-[10px] bg-[#f3f5fc] px-3.5 py-2.5">
            <span className="text-[#3f3df5]">
              <Icon name="pin" />
            </span>
            <p className="text-[12px] leading-4 text-slate-600">
              Tu ubicación nos ayuda a mostrarte proveedores más cercanos y con mejores tiempos de entrega.
            </p>
          </div>
          <div className="relative flex-1 overflow-hidden rounded-[12px] border border-[#e3e8f3] bg-[#eef1fb]">
            <iframe
              className="absolute inset-0 h-full w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={deliveryMapUrl}
              title="Mapa de entrega"
            />
          </div>
        </div>
      </div>

      <div className={cardFooter}>
        <button className={`${secondaryButton} h-11 px-6 text-[14px]`} onClick={goBack} type="button">
          <Icon name="arrow-left" />
          Volver
        </button>
        <button className={`${primaryButton} h-11 px-6 text-[14px]`} onClick={continueToProviders} type="button">
          Continuar a proveedores
          <Icon name="arrow-right" />
        </button>
      </div>
    </div>
  );

  function filterSelect(label: string, value: string, options: string[], onChange: (value: string) => void) {
    return (
      <div className="relative">
        <select
          className={`${fieldInput} h-10 appearance-none pr-9 text-[13px] font-medium ${value ? 'border-[#3f3df5] text-[#3f3df5]' : ''}`}
          disabled={options.length === 0}
          onChange={(event) => onChange(event.target.value)}
          value={value}
        >
          <option value="">{label}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
          <Icon name="chev-down" />
        </span>
      </div>
    );
  }

  const stepFour = (
    <div className={stepCard}>
      <div className={cardHeader}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {stepEyebrow}
            <h1 className={stepTitle}>Seleccioná a quiénes querés invitar</h1>
            <p className={stepSubtitle}>Encontramos proveedores que se ajustan a tu solicitud. Podés invitar a uno, varios o a todos.</p>
          </div>
          <div className="flex items-center gap-3 rounded-[12px] bg-[#f1f3ff] px-3.5 py-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#3f3df5]">
              <Icon className="h-4 w-4" name="users" />
            </span>
            <div>
              <p className="text-[13px] text-slate-900">
                <span className="text-[18px] font-bold">{rankedProviders.length}</span> proveedores compatibles
              </p>
              <p className="text-[11px] text-slate-500">en base a tus productos y ubicación</p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-2.5 md:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))]">
          <div className="relative">
            <input
              className={`${fieldInput} h-10 pr-10 text-[13px]`}
              onChange={(event) => setProviderSearch(event.target.value)}
              placeholder="Buscar por nombre, localidad o productos..."
              value={providerSearch}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#3f3df5]">
              <Icon className="h-4 w-4" name="search" />
            </span>
          </div>
          {filterSelect('Ubicación', providerCityFilter, providerCityOptions, setProviderCityFilter)}
          {filterSelect('Productos', providerProductFilter, providerProductOptions, setProviderProductFilter)}
          {filterSelect('Certificaciones', providerCertFilter, providerCertOptions, setProviderCertFilter)}
        </div>
      </div>

      <div className={`${scrollArea} mt-3 space-y-2.5 px-5 pb-3 sm:px-6`}>
        {filteredProviders.length === 0 ? (
          <div className="rounded-[12px] border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-slate-500">
            {providers.length === 0 ? 'Cargando proveedores…' : 'No encontramos proveedores con esos filtros.'}
          </div>
        ) : (
          filteredProviders.map((provider) => {
            const selected = draft.selectedProviders.includes(provider.id);
            const facts: Array<{ icon: IconName; text: string }> = [];
            if (typeof provider.leadTimeDays === 'number') {
              facts.push({ icon: 'clock', text: `Entrega en ~${provider.leadTimeDays} días` });
            }
            if (typeof provider.minimumOrder === 'number') {
              facts.push({ icon: 'truck', text: `Mínimo de compra: ${provider.minimumOrder.toLocaleString('es-AR')}` });
            }
            if ((provider.certifications ?? []).length > 0) {
              facts.push({ icon: 'file', text: `Certificaciones ${(provider.certifications ?? []).slice(0, 2).join(', ')}` });
            }
            facts.push({ icon: 'building', text: provider.category });
            return (
              <div
                key={provider.id}
                className={`grid gap-3 rounded-[12px] border p-2.5 transition md:grid-cols-[150px_minmax(0,1fr)_minmax(0,0.9fr)_112px] md:items-center md:gap-4 ${
                  selected ? 'border-[#c9cfff] bg-[#fbfbff]' : 'border-[#e6eaf3] bg-white'
                }`}
              >
                {providerImage(provider, 'h-[84px] w-full md:w-[150px]')}
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-slate-950">{provider.name}</p>
                  {provider.isVerified ? (
                    <div className="mt-0.5">
                      <VerifiedBadge />
                    </div>
                  ) : null}
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-[12px] text-slate-500">
                    <Icon className="h-3.5 w-3.5 shrink-0" name="pin" />
                    {provider.city}
                  </p>
                  {providerTags(provider)}
                </div>
                <div className="space-y-1.5">
                  {facts.slice(0, 3).map((fact) => (
                    <p key={fact.text} className="flex items-center gap-2 truncate text-[12px] text-slate-600">
                      <span className="shrink-0 text-[#3f3df5]">
                        <Icon className="h-3.5 w-3.5" name={fact.icon} />
                      </span>
                      {fact.text}
                    </p>
                  ))}
                </div>
                <div className="flex gap-2 md:flex-col">
                  <button
                    className={`inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-[8px] border text-[13px] font-medium transition md:flex-none ${
                      selected ? 'border-[#dfe2ff] bg-[#eef0ff] text-[#3f3df5]' : 'border-[#dfe4f0] bg-white text-slate-700 hover:border-[#c9cfff]'
                    }`}
                    onClick={() => toggleProvider(provider.id)}
                    type="button"
                  >
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-[4px] border ${
                        selected ? 'border-[#3f3df5] bg-[#3f3df5] text-white' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {selected ? <Icon className="h-3 w-3" name="check" /> : null}
                    </span>
                    {selected ? 'Invitado' : 'Invitar'}
                  </button>
                  <Link
                    className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-[8px] border border-[#dfe4f0] bg-white text-[13px] font-medium text-slate-700 transition hover:bg-slate-50 md:flex-none"
                    href={`/dashboard/comprador/proveedores/${provider.slug}`}
                    target="_blank"
                  >
                    Ver perfil
                    <Icon className="h-3.5 w-3.5" name="arrow-right" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
        {filteredProviders.length > 1 ? (
          <div className="flex flex-wrap items-center gap-3 rounded-[12px] bg-[#f1f3ff] px-4 py-3">
            <span className="text-[#3f3df5]">
              <Icon className="h-6 w-6" name="users" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-slate-950">¿Querés invitar a todos los proveedores compatibles?</p>
              <p className="text-[12px] text-slate-500">Te recomendamos invitar a varios para obtener mejores condiciones.</p>
            </div>
            <button className={`${outlineAccentButton} h-9 px-4 text-[13px]`} onClick={toggleInviteAll} type="button">
              <Icon className="h-4 w-4" name="users" />
              {allFilteredInvited ? 'Quitar a todos' : 'Invitar a todos'}
            </button>
          </div>
        ) : null}

      </div>

      <div className={cardFooter}>
        <button className={`${secondaryButton} h-11 px-6 text-[14px]`} onClick={goBack} type="button">
          <Icon name="arrow-left" />
          Volver
        </button>
        <button className={`${primaryButton} h-11 px-8 text-[14px]`} onClick={continueToSummary} type="button">
          Continuar a resumen
          <Icon name="arrow-right" />
        </button>
      </div>
    </div>
  );

  const stepFive = (
    <div className={stepCard}>
      <div className={cardHeader}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            {stepEyebrow}
            <h1 className={stepTitle}>Revisá tu solicitud</h1>
            <p className={stepSubtitle}>Antes de enviar, revisá que toda la información sea correcta. Podés editar cualquier dato.</p>
          </div>
          <button className={`${outlineAccentButton} h-10 px-4 text-[13px]`} onClick={saveDraftNow} type="button">
            <Icon className="h-4 w-4" name="save" />
            Guardar borrador
          </button>
        </div>
      </div>

      <div className={`${scrollArea} mt-4 space-y-3 px-5 pb-5 sm:px-6`}>
      <div className="rounded-[12px] border border-[#e6eaf3]">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-[#e6eaf3] px-4 py-3">
          <p className="whitespace-nowrap text-[15px] font-semibold text-slate-950">Productos ({productCount})</p>
          <div className="flex items-center gap-4 whitespace-nowrap">
            <button className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#3f3df5]" onClick={addAnotherProduct} type="button">
              <Icon className="h-3.5 w-3.5" name="plus" />
              Agregar producto
            </button>
            <button className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#3f3df5]" onClick={() => goToStep(1)} type="button">
              <Icon className="h-3.5 w-3.5" name="edit" />
              Editar productos
            </button>
          </div>
        </div>
        <div className="divide-y divide-[#e6eaf3]">
          {allProductLines.map((line, index) => {
            const specs = getLineSpecEntries(line).slice(0, 5);
            return (
              <div
                key={line.id}
                className="grid grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:grid-cols-[auto_auto_minmax(0,1fr)_minmax(0,1.2fr)_auto]"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#eef0ff] text-[12px] font-semibold text-[#3f3df5]">
                  {index + 1}
                </span>
                {productThumb(line, 'h-16 w-16 sm:h-[72px] sm:w-[72px]')}
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-slate-950">{getProductDisplayName(line)}</p>
                  {getLineMaterial(line) ? <p className="truncate text-[13px] text-slate-500">{getLineMaterial(line)}</p> : null}
                  <p className="truncate text-[13px] text-slate-500">{formatQuantity(line.quantity, line.unit) || 'Cantidad a definir'}</p>
                </div>
                <div className="order-last col-span-full min-w-0 space-y-0.5 sm:order-none sm:col-span-1">
                  {specs.length === 0 ? (
                    <p className="text-[12px] text-slate-400">Sin especificaciones adicionales</p>
                  ) : (
                    specs.map((spec) => (
                      <p key={`${spec.label}-${spec.value}`} className="flex items-center gap-2 truncate text-[12px] text-slate-600">
                        <span className="shrink-0 text-slate-400">
                          <Icon className="h-3.5 w-3.5" name={specIconFor(spec.label)} />
                        </span>
                        <span className="truncate">{spec.label ? `${spec.label}: ${spec.value}` : spec.value}</span>
                      </p>
                    ))
                  )}
                </div>
                {productMenu(line)}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-[12px] border border-[#e6eaf3] px-4 py-3.5">
          <div className="flex items-center justify-between">
            <p className="text-[15px] font-semibold text-slate-950">Entrega</p>
            <button className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#3f3df5]" onClick={() => goToStep(3)} type="button">
              <Icon className="h-3.5 w-3.5" name="edit" />
              Editar
            </button>
          </div>
          <div className="mt-2.5 space-y-2 text-[13px] text-slate-700">
            <p className="flex items-center gap-2.5">
              <span className="text-[#3f3df5]"><Icon name="pin" /></span>
              <span className="truncate">{deliveryAddress || 'Ubicación a definir'}</span>
            </p>
            <p className="flex items-center gap-2.5">
              <span className="text-[#3f3df5]"><Icon name="calendar" /></span>
              {getDeliveryWhenLabel(draft)}
            </p>
            <p className="flex items-center gap-2.5">
              <span className="text-[#3f3df5]"><Icon name="truck" /></span>
              <span className="truncate">{draft.deliverySchedule ? `Recepción: ${draft.deliverySchedule}` : 'Entrega en una ubicación'}</span>
            </p>
          </div>
        </div>
        <div className="flex flex-col rounded-[12px] border border-[#e6eaf3] px-4 py-3.5">
          <div className="flex items-center justify-between">
            <p className="text-[15px] font-semibold text-slate-950">Información adicional</p>
            <button className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#3f3df5]" onClick={() => goToStep(3)} type="button">
              <Icon className="h-3.5 w-3.5" name="edit" />
              Editar
            </button>
          </div>
          <p className="mt-2.5 flex items-center gap-2.5 text-[13px] text-slate-700">
            <span className="text-[#3f3df5]"><Icon name="chat" /></span>
            Nota para los proveedores
          </p>
          <div className="mt-2 line-clamp-2 flex-1 rounded-[10px] bg-[#f3f5fc] px-3 py-2 text-[12px] leading-5 text-slate-600">
            {draft.deliveryNotes.trim() || 'Sin notas adicionales.'}
          </div>
        </div>
      </div>
      </div>
    </div>
  );

  // --- Barra lateral --------------------------------------------------------

  const sidebarCard =
    'flex flex-col rounded-[16px] border border-[#e3e8f3] bg-white p-5 shadow-[0_10px_30px_rgba(32,48,90,0.04)] lg:min-h-0';

  const quickSummary = (
  <div className="rounded-[12px] bg-[#f1f3ff] p-4">
    <p className="text-[14px] font-semibold text-slate-950">Resumen rápido</p>
    <div className="mt-3 grid grid-cols-3 gap-2">
      {[
        { icon: 'box' as const, value: String(productCount), label: 'productos' },
        {
          icon: 'scale' as const,
          value: quantityUnits.length === 1 && quantityTotal > 0 ? quantityTotal.toLocaleString('es-AR') : '—',
          label: quantityUnits.length === 1 && quantityTotal > 0 ? `${quantityUnits[0]} en total` : 'total estimado',
        },
        { icon: 'building' as const, value: providers.length > 0 ? `${providers.length}+` : '—', label: 'proveedores disponibles' },
      ].map((item) => (
        <div key={item.label} className="flex min-w-0 items-start gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#3f3df5]">
            <Icon className="h-4 w-4" name={item.icon} />
          </span>
          <div className="min-w-0">
            <p className="break-words text-[14px] font-bold leading-5 text-slate-950">{item.value}</p>
            <p className="text-[11px] leading-4 text-slate-500">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
  );

  let sidebar: ReactNode = null;
  if (step === 1) {
    sidebar = (
      <div className={`${sidebarCard} lg:h-full`}>
        <div className="flex shrink-0 items-start justify-between gap-3">
          <div>
            <p className="text-[22px] font-bold tracking-[-0.03em] text-slate-950">Tu solicitud</p>
            <p className="text-[14px] text-slate-500">Productos agregados</p>
          </div>
          <span className="mt-1 flex h-8 min-w-8 items-center justify-center rounded-full bg-[#eef0ff] px-2 text-[13px] font-semibold text-[#3f3df5]">
            {productCount}
          </span>
        </div>
        <div className={`${scrollArea} -mx-1 mt-4 space-y-2.5 px-1`}>
          {productCount === 0 ? (
            <div className="flex h-full min-h-[160px] flex-col justify-center rounded-[12px] border border-dashed border-[#cfd6e8] px-5 py-6">
              <p className="text-center text-[13px] font-medium text-slate-700">Todavía no agregaste productos</p>
              <ol className="mt-4 space-y-3">
                {[
                  { icon: 'box' as const, text: 'Elegí la categoría del producto' },
                  { icon: 'layers' as const, text: 'Indicá material y cantidad estimada' },
                  { icon: 'plus' as const, text: 'Agregalo y repetí con los demás' },
                ].map((item, index) => (
                  <li key={item.text} className="flex items-center gap-3 text-[13px] text-slate-600">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eef0ff] text-[#3f3df5]">
                      <Icon className="h-4 w-4" name={item.icon} />
                    </span>
                    <span>
                      <span className="font-semibold text-[#3f3df5]">{index + 1}.</span> {item.text}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <>
              {sidebarProductList('plain')}
              {addProductCard}
            </>
          )}
        </div>

        <div className="mt-4 shrink-0">{quickSummary}</div>

        <button className={`${primaryButton} mt-4 h-11 w-full shrink-0 text-[14px] max-lg:hidden`} onClick={continueToSpecs} type="button">
          Continuar a especificaciones
          <Icon name="arrow-right" />
        </button>
        <button
          className="mt-3 flex w-full shrink-0 items-center justify-center gap-2 text-[13px] font-medium text-[#3f3df5]"
          onClick={saveAndExit}
          type="button"
        >
          <Icon className="h-4 w-4" name="save" />
          Guardar y continuar después
        </button>
      </div>
    );
  } else if (step === 2 || step === 3) {
    sidebar = (
      <div className={`${sidebarCard} lg:h-full`}>
        <div className="flex shrink-0 items-center justify-between">
          <p className="text-[18px] font-bold tracking-[-0.02em] text-slate-950">Tu solicitud</p>
          <p className="text-[13px] text-slate-500">
            {productCount} producto{productCount === 1 ? '' : 's'}
          </p>
        </div>
        <div className={`lg:min-h-0 lg:overflow-y-auto [scrollbar-color:#d5dbeb_transparent] [scrollbar-width:thin] -mx-1 mt-4 space-y-2.5 px-1`}>
          {sidebarProductList(step === 2 ? 'status' : 'done')}
          {step === 2 && editingLine ? (
            <div className="rounded-[12px] border border-[#e6eaf3] p-3.5">
              <p className="text-[13px] font-semibold text-slate-900">Especificaciones de {getProductDisplayName(editingLine)}</p>
              <ul className="mt-2.5 space-y-1.5">
                {editingModules
                  .filter((field) => canonicalModuleKey(field.id) !== 'observaciones')
                  .map((field) => {
                    const value = editingDraft ? getModuleValue(editingDraft, field.id).trim() : '';
                    return (
                      <li key={field.id}>
                        <button
                          className="flex w-full items-center justify-between gap-3 rounded-[8px] px-2 py-1.5 text-left text-[13px] hover:bg-slate-50"
                          onClick={() => goToField(editingModules.indexOf(field))}
                          type="button"
                        >
                          <span className="text-slate-500">{field.label}</span>
                          <span className={`truncate font-medium ${value ? 'text-slate-900' : 'text-slate-300'}`}>
                            {value ? (field.type === 'quantity' ? formatQuantity(value, editingLine.unit) : value) : 'Pendiente'}
                          </span>
                        </button>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ) : null}
          {addProductCard}
        </div>
        <div className="mt-auto shrink-0 space-y-3 pt-4">
          {quickSummary}
          {step === 2
            ? helpCard(
                'info',
                '¿No encontrás alguna especificación?',
                'Contanos tu necesidad y te ayudamos a completar los datos o te ponemos en contacto con un especialista.',
              )
            : helpCard(
                'chat',
                '¿Necesitás una logística especial?',
                'Si tenés múltiples entregas, destinos internacionales o requisitos específicos, contanos en las notas o hablá con un especialista.',
              )}
        </div>
      </div>
    );
  } else if (step === 4) {
    sidebar = (
      <div className={`${sidebarCard} lg:h-full`}>
        <div className="flex shrink-0 items-center justify-between">
          <p className="text-[18px] font-bold tracking-[-0.02em] text-slate-950">Tu solicitud</p>
          <button className="text-[13px] font-medium text-[#3f3df5]" onClick={() => goToStep(1)} type="button">
            Editar
          </button>
        </div>
        <p className="mt-3 shrink-0 text-[14px] font-medium text-slate-900">Productos ({productCount})</p>
        <div className={`lg:min-h-0 lg:overflow-y-auto [scrollbar-color:#d5dbeb_transparent] [scrollbar-width:thin] -mx-1 mt-2 px-1`}>{sidebarProductList('compact')}</div>

        <div className="mt-4 flex shrink-0 items-center justify-between">
          <p className="text-[14px] font-medium text-slate-900">Entrega</p>
          <button className="text-[13px] font-medium text-[#3f3df5]" onClick={() => goToStep(3)} type="button">
            Editar
          </button>
        </div>
        <div className="mt-2 shrink-0 space-y-1.5 text-[13px] text-slate-700">
          <p className="flex items-center gap-2.5">
            <span className="text-[#3f3df5]"><Icon name="pin" /></span>
            <span className="truncate">{deliveryAddress || 'Ubicación a definir'}</span>
          </p>
          <p className="flex items-center gap-2.5">
            <span className="text-[#3f3df5]"><Icon name="calendar" /></span>
            {getDeliveryWhenLabel(draft)}
          </p>
        </div>

        <div className="mt-4 mb-3 flex max-h-[40%] shrink-0 flex-col rounded-[12px] bg-[#f3f5fc] p-3.5">
          <div className="flex shrink-0 items-center justify-between">
            <p className="text-[14px] font-medium text-slate-900">Proveedores seleccionados ({selectedProviders.length})</p>
            {selectedProviders.length > 0 ? (
              <button
                className="text-[12px] font-medium text-[#3f3df5]"
                onClick={() => setDraft((current) => ({ ...current, selectedProviders: [] }))}
                type="button"
              >
                Eliminar todos
              </button>
            ) : null}
          </div>
          <div className={`${scrollArea} mt-2.5 overflow-y-auto rounded-[8px] bg-white`}>
            {selectedProviders.length === 0 ? (
              <p className="px-3 py-2.5 text-[13px] text-slate-500">Todavía no invitaste proveedores.</p>
            ) : (
              selectedProviders.map((provider) => (
                <div key={provider.id} className="flex items-center justify-between gap-3 border-b border-[#edf0f7] px-3 py-2 last:border-b-0">
                  <span className="truncate text-[13px] text-slate-800">{provider.name}</span>
                  <button
                    aria-label={`Quitar ${provider.name}`}
                    className="text-slate-500 hover:text-slate-900"
                    onClick={() => toggleProvider(provider.id)}
                    type="button"
                  >
                    <Icon name="x" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-auto flex shrink-0 items-center gap-3 rounded-[12px] bg-[#f1f3ff] px-3.5 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#3f3df5]">
            <Icon className="h-4 w-4" name="shield" />
          </span>
          <p className="text-[12px] leading-4 text-slate-600">
            Tu solicitud se enviará a los proveedores seleccionados y recibirás sus cotizaciones en breve.
          </p>
        </div>
      </div>
    );
  } else if (step === 5) {
    const checklist = [
      { done: productCount > 0, label: `${productCount} producto${productCount === 1 ? '' : 's'}` },
      { done: allSpecsReviewed, label: 'Especificaciones' },
      { done: deliveryReady, label: 'Entrega definida' },
      {
        done: selectedProviders.length > 0,
        label: `${selectedProviders.length} proveedor${selectedProviders.length === 1 ? '' : 'es'}`,
      },
    ];
    sidebar = (
      <div className={`${sidebarCard} lg:h-full`}>
        <div className="flex shrink-0 items-center justify-between">
          <p className="text-[16px] font-semibold text-slate-950">Proveedores seleccionados ({selectedProviders.length})</p>
          <button className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#3f3df5]" onClick={() => goToStep(4)} type="button">
            <Icon className="h-3.5 w-3.5" name="edit" />
            Editar
          </button>
        </div>
        <div className={`lg:min-h-0 lg:overflow-y-auto [scrollbar-color:#d5dbeb_transparent] [scrollbar-width:thin] -mx-1 mt-3 space-y-2.5 px-1`}>
          {selectedProviders.length === 0 ? (
            <p className="rounded-[12px] border border-dashed border-slate-300 px-4 py-5 text-center text-[13px] text-slate-500">
              No seleccionaste proveedores.
            </p>
          ) : (
            selectedProviders.map((provider) => (
              <div key={provider.id} className="flex items-center gap-3 rounded-[12px] border border-[#e6eaf3] p-2.5">
                {providerImage(provider, 'h-[72px] w-[84px]')}
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-slate-950">{provider.name}</p>
                  {provider.isVerified ? <VerifiedBadge /> : null}
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-[12px] text-slate-500">
                    <Icon className="h-3.5 w-3.5 shrink-0" name="pin" />
                    {provider.city}
                  </p>
                  {providerTags(provider)}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-3 mb-4 shrink-0 rounded-[12px] bg-[#f1f3ff] p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#3f3df5]">
              <Icon className="h-4 w-4" name="shield" />
            </span>
            <p className="text-[13px] leading-5 text-slate-600">
              Tu solicitud se enviará <span className="font-semibold text-slate-900">a {selectedProviders.length} proveedor{selectedProviders.length === 1 ? '' : 'es'}</span> y recibirás sus cotizaciones en breve.
            </p>
          </div>
          <div className="mt-3 border-t border-[#dde2f7] pt-3">
            <p className="text-[14px] font-semibold text-slate-950">¿Todo listo para publicar?</p>
            <ul className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-2">
              {checklist.map((item) => (
                <li key={item.label} className="flex items-center gap-2 text-[13px] text-slate-700">
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-white ${item.done ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <Icon className="h-2.5 w-2.5" name="check" />
                  </span>
                  <span className="truncate">{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <button
          className={`${primaryButton} mt-auto h-12 w-full shrink-0 text-[16px] max-lg:hidden`}
          disabled={submitting || productCount === 0 || selectedProviders.length === 0}
          onClick={handleSubmit}
          type="button"
        >
          {submitting ? 'Publicando…' : editRequestId ? 'Guardar cambios' : 'Publicar solicitud'}
          {submitting ? null : <Icon className="h-5 w-5" name="arrow-right" />}
        </button>
        <p className="mt-3 flex shrink-0 items-center justify-center gap-2 text-center text-[11px] leading-4 text-slate-500">
          <span className="text-[#3f3df5]">
            <Icon className="h-3.5 w-3.5" name="lock" />
          </span>
          Tu información está protegida. Solo los proveedores seleccionados podrán verla.
        </p>
      </div>
    );
  }

  const stepContent =
    step === 2 ? stepTwo : step === 3 ? stepThree : step === 4 ? stepFour : step === 5 ? stepFive : null;

  // Pasos 1 y 5: su acción principal vive en la barra lateral, que en mobile
  // queda al final de la página. Se repite en una barra fija inferior.
  const mobileActionBar =
    step === 1 || step === 5 ? (
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#e3e8f3] bg-white/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 shadow-[0_-10px_30px_rgba(32,48,90,0.08)] backdrop-blur lg:hidden">
        {step === 1 ? (
          <button className={`${primaryButton} h-12 w-full text-[15px]`} onClick={continueToSpecs} type="button">
            {productCount > 0 || draft.category ? `Continuar con ${productCount + (draft.category ? 1 : 0)} producto${productCount + (draft.category ? 1 : 0) === 1 ? '' : 's'}` : 'Continuar a especificaciones'}
            <Icon name="arrow-right" />
          </button>
        ) : (
          <button
            className={`${primaryButton} h-12 w-full text-[15px]`}
            disabled={submitting || productCount === 0 || selectedProviders.length === 0}
            onClick={handleSubmit}
            type="button"
          >
            {submitting ? 'Publicando…' : editRequestId ? 'Guardar cambios' : 'Publicar solicitud'}
            {submitting ? null : <Icon name="arrow-right" />}
          </button>
        )}
      </div>
    ) : null;

  return (
    <div
      className={`flex w-full flex-col gap-3 lg:h-[calc(100dvh-85px)] lg:overflow-hidden lg:pb-0 ${mobileActionBar ? 'pb-28' : 'pb-6'}`}
    >
      {mobileProgress}
      {mobileActionBar}

      {step > 1 ? (
        <div className="hidden shrink-0 items-start gap-6 sm:flex">
          <button
            className="mt-2 inline-flex shrink-0 items-center gap-1.5 text-[13px] text-slate-600 hover:text-slate-900"
            onClick={goBack}
            type="button"
          >
            <Icon name="arrow-left" />
            Volver
          </button>
          <div className="min-w-0 flex-1 lg:pr-10">{stepper}</div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="flex min-w-0 flex-col gap-3 lg:min-h-0">
          {step > 1 ? alerts : null}
          {step === 1 ? stepOne : stepContent}
        </div>
        <aside className="min-w-0 lg:min-h-0">{sidebar}</aside>
      </div>
    </div>
  );
}
