'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useWorkspace } from '@/components/auth/workspace-provider';
import CompanyLogo from '@/components/dashboard/company-logo';
import { Spinner } from '@/components/ui/spinner';
import {
  atarApi,
  SUPPLIER_ROLE_LABELS,
  type RequestCatalogCategoryRecord,
  type SupplierProfileRecord,
  type SupplierRole,
  type UpdateSupplierProfileInput,
} from '@/lib/atar-api';
import { loadSupplierSettings, saveSupplierSettings, type SupplierSettings } from '@/lib/dashboard-local';
import { FALLBACK_REQUEST_CATEGORIES } from '@/lib/request-catalog-fallback';
import { clearSession, getUserFullName, type WebSession } from '@/lib/session';

/* Datos ---------------------------------------------------------------------- */

type TabKey = 'company' | 'operation' | 'preferences' | 'notifications' | 'security';

/** Campos de la ficha pública (se guardan en la API). */
type ProfileForm = {
  legalName: string;
  taxId: string;
  taxCondition: string;
  genericCode: string;
  supplierRole: string;
  foundedYear: string;
  about: string;
  logoUrl: string;
  capabilities: string[];
  certifications: string[];
  employeeRange: string;
  leadTimeDays: string;
  minimumOrder: string;
  logisticsSummary: string;
  financingSummary: string;
  categories: string[];
  mainProducts: string[];
};

/**
 * Preferencias de operación que la API todavía no guarda: viven en este
 * navegador (igual que el resto de la configuración local del proveedor).
 */
type LocalPrefs = {
  tradeName: string;
  coverage: 'national' | 'regional' | 'provinces';
  zones: string[];
  deliveryTypes: string[];
  deliveryTime: string;
  shipScope: string;
  packaging: string;
  paymentTerm: string;
  paymentMethods: string[];
  channels: Record<string, boolean>;
  other: Record<string, boolean>;
  notify: Record<string, boolean>;
};

const LOCAL_KEY = 'atar:supplier:settings-extra';

const DEFAULT_PREFS: LocalPrefs = {
  tradeName: '',
  coverage: 'national',
  zones: ['Buenos Aires', 'Córdoba', 'Santa Fe'],
  deliveryTypes: ['own'],
  deliveryTime: '24 - 48',
  shipScope: 'country',
  packaging: 'Estándar (incluido)',
  paymentTerm: '30 días fecha factura',
  paymentMethods: ['transfer'],
  channels: { chat: true, email: true, phone: false, whatsapp: false },
  other: { categoryOpportunities: true, programs: true, featured: false, offPlatform: false },
  notify: { newRequests: true, quoteAnswers: true, messages: true, orders: true, weeklySummary: false },
};

function loadPrefs(): LocalPrefs {
  if (typeof window === 'undefined') return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    return raw ? { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<LocalPrefs>) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

const PROVINCES = ['Buenos Aires', 'Córdoba', 'Santa Fe', 'Mendoza', 'Entre Ríos', 'Tucumán', 'Otras provincias'];
const TAX_CONDITIONS = ['Responsable Inscripto', 'Monotributo', 'Exento'];
const EMPLOYEE_RANGES = ['1 - 10', '11 - 50', '51 - 200', '201 - 500', 'Más de 500'];
const PACKAGING = ['Estándar (incluido)', 'Reforzado', 'Paletizado', 'A pedido del cliente'];
const PAYMENT_TERMS = ['Contado', '15 días fecha factura', '30 días fecha factura', '60 días fecha factura', 'A convenir'];

const DELIVERY_TYPES: { key: string; label: string; icon: IconName }[] = [
  { key: 'own', label: 'Envío propio', icon: 'truck' },
  { key: 'external', label: 'Transporte externo', icon: 'truck' },
  { key: 'pickup', label: 'Retiro en planta', icon: 'factory' },
  { key: 'courier', label: 'Mercado Envíos', icon: 'box' },
];
const SHIP_SCOPES: { key: string; label: string; icon: IconName }[] = [
  { key: 'country', label: 'A todo el país', icon: 'check' },
  { key: 'region', label: 'Solo región', icon: 'globe' },
  { key: 'international', label: 'Internacional', icon: 'globe' },
];
const PAYMENT_METHODS: { key: string; label: string; icon: IconName }[] = [
  { key: 'transfer', label: 'Transferencia', icon: 'card' },
  { key: 'check', label: 'Cheque', icon: 'mail' },
  { key: 'cash', label: 'Efectivo', icon: 'card' },
  { key: 'other', label: 'Otros', icon: 'card' },
];
const CHANNELS: { key: string; label: string; text: string; icon: IconName }[] = [
  { key: 'chat', label: 'Mensajes dentro de ATAR', text: 'Recomendado. Centraliza todas las consultas.', icon: 'chat' },
  { key: 'email', label: 'Email', text: 'Recibí copias de nuevas solicitudes por email.', icon: 'mail' },
  { key: 'phone', label: 'Teléfono', text: 'Podrán ver tu teléfono en tu perfil público.', icon: 'phone' },
  { key: 'whatsapp', label: 'WhatsApp', text: 'Mostrará un botón de WhatsApp en tu perfil público.', icon: 'chat' },
];
const OTHER_PREFS: { key: string; label: string }[] = [
  { key: 'categoryOpportunities', label: 'Recibir oportunidades de categorías seleccionadas' },
  { key: 'programs', label: 'Participar en programas y beneficios de ATAR' },
  { key: 'featured', label: 'Mostrarme en el listado de proveedores destacados' },
  { key: 'offPlatform', label: 'Permitir que me contacten fuera de la plataforma' },
];
const NOTIFY_PREFS: { key: string; label: string; text: string }[] = [
  { key: 'newRequests', label: 'Nuevas solicitudes', text: 'Cuando un comprador te invita o publica en tus categorías.' },
  { key: 'quoteAnswers', label: 'Respuestas a cotizaciones', text: 'Cuando aceptan, rechazan o comentan una propuesta.' },
  { key: 'messages', label: 'Mensajes nuevos', text: 'Cuando un comprador te escribe por el chat.' },
  { key: 'orders', label: 'Pedidos', text: 'Cambios de estado de tus pedidos en curso.' },
  { key: 'weeklySummary', label: 'Resumen semanal', text: 'Un resumen de tu actividad cada lunes.' },
];

/* Íconos --------------------------------------------------------------------- */

type IconName =
  | 'building' | 'truck' | 'sliders' | 'bell' | 'shield' | 'eye' | 'external' | 'check' | 'image' | 'factory' | 'users'
  | 'pin' | 'clock' | 'card' | 'map' | 'box' | 'doc' | 'upload' | 'tag' | 'chat' | 'mail' | 'phone' | 'gear' | 'globe'
  | 'bulb' | 'share' | 'trash' | 'arrow' | 'info' | 'back' | 'lock' | 'logout';

const ICON_PATHS: Record<IconName, ReactNode> = {
  building: <path d="M4 21V4h11v17M15 9h5v12M2 21h20M8 8h3M8 12h3M8 16h3" />,
  truck: <path d="M2 6h12v10H2zM14 9h4l4 4v3h-8M6 20a2 2 0 100-4 2 2 0 000 4zM18 20a2 2 0 100-4 2 2 0 000 4z" />,
  sliders: <path d="M4 7h10M18 7h2M4 17h4M12 17h8M14 5v4M8 15v4" />,
  bell: <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" />,
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4" />,
  eye: <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12zM12 15a3 3 0 100-6 3 3 0 000 6z" />,
  external: <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5" />,
  check: <path d="M20 6L9 17l-5-5" />,
  image: <path d="M4 5h16v14H4zM4 16l4-4 4 4 3-3 5 5M15 9h.01" />,
  factory: <path d="M3 21V10l6 4V10l6 4V4h6v17H3z" />,
  users: <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8" />,
  pin: <path d="M12 21s7-5.4 7-11a7 7 0 10-14 0c0 5.6 7 11 7 11zM12 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />,
  clock: <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0zM12 7v5l3 2" />,
  card: <path d="M3 6h18v12H3zM3 10h18" />,
  map: <path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14" />,
  box: <path d="M21 16V8l-9-5-9 5v8l9 5 9-5zM3.3 7.3L12 12l8.7-4.7M12 22V12" />,
  doc: <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5zM14 3v5h5M9 13h6M9 17h4" />,
  upload: <path d="M12 16V4M7 9l5-5 5 5M4 20h16" />,
  tag: <path d="M20.6 13.4L12 22l-9-9V4h9l8.6 8.6a2 2 0 010 2.8zM7.5 7.5h.01" />,
  chat: <path d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z" />,
  mail: <path d="M4 6h16v12H4zM4 8l8 6 8-6" />,
  phone: <path d="M22 16.9v3a2 2 0 01-2.2 2 19.9 19.9 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.9 19.9 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.3 1.8.6 2.6a2 2 0 01-.4 2.1L8 9.7a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.4c.8.3 1.7.5 2.6.6a2 2 0 011.7 2z" />,
  gear: <path d="M12 15a3 3 0 100-6 3 3 0 000 6zM12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />,
  globe: <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0zM3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" />,
  bulb: <path d="M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7V16h8v-1.3A7 7 0 0012 2z" />,
  share: <path d="M18 8a3 3 0 100-6 3 3 0 000 6zM6 15a3 3 0 100-6 3 3 0 000 6zM18 22a3 3 0 100-6 3 3 0 000 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />,
  trash: <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />,
  arrow: <path d="M9 6l6 6-6 6" />,
  info: <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0zM12 11v5M12 8h.01" />,
  back: <path d="M19 12H5M11 18l-6-6 6-6" />,
  lock: <path d="M5 11h14v10H5zM8 11V7a4 4 0 018 0v4" />,
  logout: <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />,
};

function Icon({ name, className = 'h-4 w-4' }: { name: IconName; className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" viewBox="0 0 24 24">
      {ICON_PATHS[name]}
    </svg>
  );
}

/* Piezas ---------------------------------------------------------------------- */

const card = 'rounded-[18px] border border-slate-100 bg-white shadow-[0_10px_30px_rgba(40,28,110,0.05)]';
const inputClass =
  'h-11 w-full rounded-[10px] border border-slate-200 bg-white px-3.5 text-[14px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100';

function SectionHead({ icon, title, text, action }: { icon: IconName; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-indigo-50 text-indigo-600">
          <Icon className="h-5 w-5" name={icon} />
        </span>
        <div>
          <h2 className="text-[17px] font-bold text-[#16123a]">{title}</h2>
          <p className="text-[13px] text-slate-500">{text}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

function Label({ children, optional = false }: { children: ReactNode; optional?: boolean }) {
  return (
    <span className="mb-1.5 block text-[13px] font-medium text-slate-700">
      {children}
      {optional ? <span className="font-normal text-slate-400"> (opcional)</span> : null}
    </span>
  );
}

function Select({ value, onChange, options, placeholder }: { value: string; onChange: (value: string) => void; options: string[]; placeholder?: string }) {
  return (
    <span className="relative block">
      <select className={`${inputClass} appearance-none pr-9`} onChange={(event) => onChange(event.target.value)} value={value}>
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
        <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </span>
    </span>
  );
}

function ChoiceCard({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: IconName; label: string }) {
  return (
    <button
      className={`flex min-h-12 items-center gap-2 rounded-[10px] border px-3 py-2 text-left text-[13px] leading-4 transition ${
        active ? 'border-indigo-300 bg-indigo-50 font-semibold text-indigo-700' : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-200'
      }`}
      onClick={onClick}
      type="button"
    >
      <Icon className="h-4 w-4 shrink-0" name={icon} />
      <span className="flex-1">{label}</span>
      {active ? (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white">
          <Icon className="h-3 w-3" name="check" />
        </span>
      ) : null}
    </button>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return (
    <button
      aria-checked={checked}
      aria-label={label}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-indigo-600' : 'bg-slate-200'}`}
      onClick={() => onChange(!checked)}
      role="switch"
      type="button"
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${checked ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  );
}

/** Lista editable de chips (capacidades, certificaciones). */
function ChipInput({ values, onChange, placeholder }: { values: string[]; onChange: (values: string[]) => void; placeholder: string }) {
  const [draft, setDraft] = useState('');
  function add() {
    const items = draft.split(',').map((item) => item.trim()).filter(Boolean);
    if (items.length) onChange(Array.from(new Set([...values, ...items])));
    setDraft('');
  }
  return (
    <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-[10px] border border-slate-200 bg-white px-2 py-1.5 focus-within:border-indigo-400">
      {values.map((value) => (
        <span key={value} className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[12px] text-slate-700">
          {value}
          <button aria-label={`Quitar ${value}`} className="text-slate-400 hover:text-slate-700" onClick={() => onChange(values.filter((item) => item !== value))} type="button">
            ×
          </button>
        </span>
      ))}
      <input
        className="min-w-[120px] flex-1 bg-transparent px-1 text-[13px] outline-none placeholder:text-indigo-500"
        onBlur={add}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault();
            add();
          }
        }}
        placeholder={placeholder}
        value={draft}
      />
    </div>
  );
}

/* Redimensionado del logo (se guarda como data URI en la ficha) --------------- */

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
  const scale = Math.min(1, 320 / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('No se pudo procesar la imagen.');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const png = canvas.toDataURL('image/png');
  if (png.length <= 300_000) return png;
  context.globalCompositeOperation = 'destination-over';
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.85);
}

const EMPTY_FORM: ProfileForm = {
  legalName: '',
  taxId: '',
  taxCondition: '',
  genericCode: '',
  supplierRole: '',
  foundedYear: '',
  about: '',
  logoUrl: '',
  capabilities: [],
  certifications: [],
  employeeRange: '',
  leadTimeDays: '',
  minimumOrder: '',
  logisticsSummary: '',
  financingSummary: '',
  categories: [],
  mainProducts: [],
};

function toForm(record: SupplierProfileRecord): ProfileForm {
  const profile = record.supplierProfile;
  return {
    legalName: record.legalName ?? '',
    taxId: record.taxId ?? '',
    taxCondition: record.taxCondition ?? '',
    genericCode: profile?.genericCode ?? '',
    supplierRole: profile?.supplierRole ?? '',
    foundedYear: profile?.foundedYear?.toString() ?? '',
    about: profile?.about ?? '',
    logoUrl: record.logoUrl ?? '',
    capabilities: profile?.capabilities ?? [],
    certifications: profile?.certifications ?? [],
    employeeRange: profile?.employeeRange ?? '',
    leadTimeDays: profile?.leadTimeDays?.toString() ?? '',
    minimumOrder: profile?.minimumOrder?.toString() ?? '',
    logisticsSummary: profile?.logisticsSummary ?? '',
    financingSummary: profile?.financingSummary ?? '',
    categories: profile?.categories ?? [],
    mainProducts: profile?.mainProducts ?? [],
  };
}

/* Componente ---------------------------------------------------------------- */

export default function SupplierSettings({ session }: { session: WebSession | null }) {
  const router = useRouter();
  const { isManager, activeWorkspace } = useWorkspace();
  const accessToken = session?.accessToken;
  const [tab, setTab] = useState<TabKey>('company');
  const [record, setRecord] = useState<SupplierProfileRecord | null>(null);
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [savedForm, setSavedForm] = useState<ProfileForm>(EMPTY_FORM);
  // Se monta detrás del AuthGuard (solo en el cliente): se puede leer el navegador al iniciar.
  const [prefs, setPrefs] = useState<LocalPrefs>(() => loadPrefs());
  const [savedPrefs, setSavedPrefs] = useState<LocalPrefs>(() => loadPrefs());
  const [settings, setSettings] = useState<SupplierSettings>(() => loadSupplierSettings());
  const [savedSettings, setSavedSettings] = useState<SupplierSettings>(() => loadSupplierSettings());
  const [catalog, setCatalog] = useState<RequestCatalogCategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoBusy, setLogoBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const logoInput = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    atarApi
      .getRequestCategories()
      .then((result) => !cancelled && setCatalog(result.length ? result : FALLBACK_REQUEST_CATEGORIES))
      .catch(() => !cancelled && setCatalog(FALLBACK_REQUEST_CATEGORIES));
    return () => {
      cancelled = true;
    };
  }, []);

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
        if (cancelled) return;
        setRecord(result);
        setForm(toForm(result));
        setSavedForm(toForm(result));
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar tu empresa.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [accessToken, isManager]);

  const companyName = record?.name ?? activeWorkspace?.company.name ?? 'Tu empresa';
  const location = [record?.city, record?.country].filter(Boolean).join(', ');
  const publicHref = record?.slug ? `/productos/${record.slug}` : null;
  const dirty =
    JSON.stringify(form) !== JSON.stringify(savedForm) ||
    JSON.stringify(prefs) !== JSON.stringify(savedPrefs) ||
    JSON.stringify(settings) !== JSON.stringify(savedSettings);

  function setField<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setMessage(null);
  }
  function setPref<K extends keyof LocalPrefs>(key: K, value: LocalPrefs[K]) {
    setPrefs((current) => ({ ...current, [key]: value }));
    setMessage(null);
  }
  function toggleIn(list: string[], value: string) {
    return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
  }

  // Completitud del perfil y tips accionables.
  const tips = useMemo(
    () => [
      { done: form.about.trim().length >= 40, label: 'Completá la descripción de tu empresa', tab: 'company' as TabKey },
      { done: Boolean(form.logoUrl), label: 'Subí tu logo', tab: 'company' as TabKey },
      { done: form.categories.length >= 3, label: 'Elegí al menos 3 categorías de productos', tab: 'preferences' as TabKey },
      { done: form.certifications.length > 0, label: 'Sumá una certificación', tab: 'company' as TabKey },
      { done: Boolean(form.leadTimeDays && form.minimumOrder), label: 'Definí tiempos y pedido mínimo', tab: 'operation' as TabKey },
    ],
    [form],
  );
  const completion = Math.round(
    ([form.legalName, form.taxId, form.taxCondition, form.about, form.logoUrl, form.foundedYear, form.employeeRange, form.leadTimeDays, form.minimumOrder, form.logisticsSummary]
      .filter((value) => value.trim()).length +
      (form.capabilities.length ? 1 : 0) +
      (form.certifications.length ? 1 : 0) +
      (form.categories.length ? 1 : 0) +
      (form.supplierRole ? 1 : 0) +
      (form.financingSummary.trim() ? 1 : 0)) /
      15 *
      100,
  );

  async function handleLogo(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('El archivo tiene que ser una imagen.');
      return;
    }
    try {
      setLogoBusy(true);
      setError(null);
      setField('logoUrl', await resizeLogo(file));
    } catch (logoError) {
      setError(logoError instanceof Error ? logoError.message : 'No se pudo cargar la imagen.');
    } finally {
      setLogoBusy(false);
    }
  }

  async function handleSave() {
    setError(null);
    setMessage(null);
    const num = (value: string) => {
      const parsed = Number(value.replace(/\./g, ''));
      return value.trim() && Number.isFinite(parsed) ? Math.round(parsed) : undefined;
    };
    try {
      setSaving(true);
      if (accessToken && JSON.stringify(form) !== JSON.stringify(savedForm)) {
        const payload: UpdateSupplierProfileInput = {
          legalName: form.legalName.trim(),
          taxId: form.taxId.trim(),
          taxCondition: form.taxCondition.trim(),
          genericCode: form.genericCode.trim(),
          supplierRole: (form.supplierRole || undefined) as SupplierRole | undefined,
          foundedYear: num(form.foundedYear),
          about: form.about.trim(),
          logoUrl: form.logoUrl.trim(),
          capabilities: form.capabilities,
          certifications: form.certifications,
          employeeRange: form.employeeRange.trim(),
          leadTimeDays: num(form.leadTimeDays),
          minimumOrder: num(form.minimumOrder),
          logisticsSummary: form.logisticsSummary.trim(),
          financingSummary: form.financingSummary.trim(),
          categories: form.categories,
          mainProducts: form.mainProducts.filter((item) => form.categories.includes(item)),
        };
        await atarApi.updateOwnSupplierProfile(payload, accessToken);
        setSavedForm(form);
      }
      window.localStorage.setItem(LOCAL_KEY, JSON.stringify(prefs));
      setSavedPrefs(prefs);
      saveSupplierSettings(settings);
      setSavedSettings(settings);
      setUpdatedAt(new Date());
      setMessage('Cambios guardados. Tu perfil público ya está actualizado.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudieron guardar los cambios.');
    } finally {
      setSaving(false);
    }
  }

  function discard() {
    setForm(savedForm);
    setPrefs(savedPrefs);
    setSettings(savedSettings);
    setError(null);
    setMessage(null);
  }

  async function sharePublicProfile() {
    if (!publicHref) return;
    const url = `${window.location.origin}${publicHref}`;
    try {
      if (navigator.share) await navigator.share({ title: companyName, url });
      else {
        await navigator.clipboard.writeText(url);
        setMessage('Link de tu perfil público copiado.');
      }
    } catch {
      /* el usuario canceló */
    }
  }

  if (!isManager) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
        La configuración de la empresa es solo para administradores.
      </div>
    );
  }

  const tabs: { key: TabKey; label: string; icon: IconName }[] = [
    { key: 'company', label: 'Información de la empresa', icon: 'building' },
    { key: 'operation', label: 'Operación y logística', icon: 'truck' },
    { key: 'preferences', label: 'Preferencias', icon: 'sliders' },
    { key: 'notifications', label: 'Notificaciones', icon: 'bell' },
    { key: 'security', label: 'Seguridad', icon: 'shield' },
  ];

  /* --- Tarjeta de perfil público (se usa en dos pestañas) --- */
  const publicCard = (
    <div className="overflow-hidden rounded-[14px] bg-white">
      <div className="relative h-24 bg-slate-800">
        <Image alt="" className="object-cover opacity-80" fill sizes="420px" src={FALLBACK_REQUEST_CATEGORIES.find((c) => c.label === form.categories[0])?.imageSrc ?? '/maquinariaweb.png'} />
      </div>
      <div className="relative px-4 pb-4">
        <div className="-mt-9 flex items-end gap-3">
          <span className="rounded-[12px] bg-white p-1 shadow-md">
            <CompanyLogo className="h-[72px] w-[72px]" logoUrl={form.logoUrl || null} name={companyName} rounded="rounded-[10px]" textClassName="text-[18px]" tone="bg-[#eef3ff] text-indigo-600" />
          </span>
          <div className="min-w-0 pb-1">
            {record?.supplierProfile?.isVerified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-600">
                <Icon className="h-3 w-3" name="shield" />
                Proveedor verificado
              </span>
            ) : null}
            <p className="truncate text-[17px] font-bold text-[#16123a]">{companyName}</p>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5 text-[12px] text-slate-600">
          {form.supplierRole ? <span className="rounded-md bg-slate-100 px-2 py-0.5">{SUPPLIER_ROLE_LABELS[form.supplierRole as SupplierRole]}</span> : null}
          {location ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5">
              <Icon className="h-3 w-3" name="pin" />
              {location}
            </span>
          ) : null}
        </div>
        <p className="mt-3 line-clamp-2 text-[13px] leading-5 text-slate-600">{form.about || 'Contá qué hace tu empresa para que los compradores te conozcan.'}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-indigo-200 text-[13px] font-semibold text-indigo-600 hover:bg-indigo-50 disabled:opacity-50" disabled={!publicHref} onClick={() => void sharePublicProfile()} type="button">
            <Icon name="share" />
            Compartir perfil
          </button>
          {publicHref ? (
            <Link className="inline-flex h-10 items-center justify-center rounded-[10px] bg-indigo-600 text-[13px] font-semibold hover:bg-indigo-700" href={publicHref} target="_blank">
              <span className="inline-flex items-center gap-2 text-white">
                Ver perfil público
                <Icon name="external" />
              </span>
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );

  return (
    <div className="pb-24">
      {/* Encabezado */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-bold leading-tight tracking-[-0.035em] text-[#16123a] sm:text-[34px]">Configuración</h1>
          <p className="text-[15px] text-slate-500">Gestioná la información de tu empresa y cómo operás en ATAR.</p>
        </div>
        <div className={`${card} flex w-full flex-wrap items-center gap-3 px-4 py-3 sm:w-auto sm:flex-nowrap sm:gap-4`}>
          <span className={`flex h-9 w-9 items-center justify-center rounded-full ${completion >= 80 ? 'bg-emerald-500' : 'bg-amber-400'} text-white`}>
            <Icon name="check" />
          </span>
          <div className="min-w-0 flex-1 sm:w-[200px] sm:flex-none">
            <p className="text-[13px] font-semibold text-slate-900">{completion >= 100 ? 'Perfil completo' : 'Completitud del perfil'}</p>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                <span className="block h-full rounded-full bg-emerald-500" style={{ width: `${completion}%` }} />
              </span>
              <span className="text-[12px] text-slate-500">{completion}%</span>
            </div>
          </div>
          {publicHref ? (
            <Link className="inline-flex h-10 w-full items-center justify-center rounded-[10px] border border-indigo-200 px-4 text-[13px] font-semibold hover:bg-indigo-50 sm:w-auto" href={publicHref} target="_blank">
              <span className="inline-flex items-center gap-2 text-indigo-600">
                Ver mi perfil público
                <Icon name="external" />
              </span>
            </Link>
          ) : null}
        </div>
      </div>

      {/* Pestañas */}
      <div className={`${card} mt-4 flex gap-1 overflow-x-auto px-3 [scrollbar-width:none]`}>
        {tabs.map((item) => {
          const active = tab === item.key;
          return (
            <button
              key={item.key}
              className={`-mb-px inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-4 text-[14px] transition ${
                active ? 'border-indigo-600 font-semibold text-indigo-700' : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
              onClick={() => setTab(item.key)}
              type="button"
            >
              <Icon className="h-[18px] w-[18px]" name={item.icon} />
              {item.label}
            </button>
          );
        })}
      </div>

      {error ? <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      {message ? <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}

      {loading ? (
        <div className={`${card} mt-4 flex items-center justify-center gap-3 px-5 py-16 text-sm text-slate-500`}>
          <Spinner className="h-5 w-5" />
          Cargando tu empresa…
        </div>
      ) : (
        <div className="mt-4 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_440px]">
          {/* ============== INFORMACIÓN DE LA EMPRESA ============== */}
          {tab === 'company' ? (
            <>
              <div className="space-y-5">
                <section className={`${card} p-5`}>
                  <SectionHead
                    action={
                      publicHref ? (
                        <Link className="inline-flex h-10 items-center rounded-[10px] border border-indigo-200 px-4 text-[13px] font-semibold hover:bg-indigo-50" href={publicHref} target="_blank">
                          <span className="inline-flex items-center gap-2 text-indigo-600">
                            <Icon name="eye" />
                            Vista previa
                          </span>
                        </Link>
                      ) : null
                    }
                    icon="building"
                    text="Esta información se muestra a compradores en tu perfil público."
                    title="Información de la empresa"
                  />
                  <div className="mt-5 grid gap-4 md:grid-cols-3">
                    <label>
                      <Label>Razón social</Label>
                      <input className={inputClass} onChange={(event) => setField('legalName', event.target.value)} placeholder={companyName} value={form.legalName} />
                    </label>
                    <label>
                      <Label>CUIT</Label>
                      <input className={inputClass} onChange={(event) => setField('taxId', event.target.value)} placeholder="30-12345678-9" value={form.taxId} />
                      <span className="mt-1 block text-[11px] text-slate-400">Lo ven los compradores como dato de confianza.</span>
                    </label>
                    <label>
                      <Label>Condición IVA</Label>
                      <Select onChange={(value) => setField('taxCondition', value)} options={TAX_CONDITIONS} placeholder="Sin especificar" value={form.taxCondition} />
                    </label>
                    <label>
                      <Label optional>Nombre comercial</Label>
                      <input className={inputClass} onChange={(event) => setPref('tradeName', event.target.value)} placeholder={companyName} value={prefs.tradeName} />
                    </label>
                    <label>
                      <Label>Código genérico</Label>
                      <input className={inputClass} onChange={(event) => setField('genericCode', event.target.value)} placeholder="MET-001" value={form.genericCode} />
                    </label>
                    <label>
                      <Label>Año de fundación</Label>
                      <input className={inputClass} inputMode="numeric" onChange={(event) => setField('foundedYear', event.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="1998" value={form.foundedYear} />
                    </label>
                  </div>
                  <div className="mt-4">
                    <Label>Rol comercial</Label>
                    <div className="flex flex-wrap gap-2">
                      {(Object.keys(SUPPLIER_ROLE_LABELS) as SupplierRole[]).map((role) => (
                        <button
                          key={role}
                          className={`h-9 rounded-[10px] border px-3.5 text-[13px] transition ${form.supplierRole === role ? 'border-indigo-300 bg-indigo-50 font-semibold text-indigo-700' : 'border-slate-200 text-slate-600 hover:border-indigo-200'}`}
                          onClick={() => setField('supplierRole', form.supplierRole === role ? '' : role)}
                          type="button"
                        >
                          {SUPPLIER_ROLE_LABELS[role]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="mt-4 block">
                    <Label>Sobre la empresa</Label>
                    <textarea className={`${inputClass} h-24 resize-none py-3`} maxLength={500} onChange={(event) => setField('about', event.target.value)} placeholder="Contá qué fabricás o comercializás, desde cuándo y qué te diferencia." value={form.about} />
                    <span className="mt-1 block text-right text-[11px] text-slate-400">{form.about.length}/500</span>
                  </label>
                  <div>
                    <Label>Logo de la empresa</Label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <button
                        className="flex h-[110px] flex-col items-center justify-center rounded-[12px] border border-dashed border-indigo-200 bg-[#fbfaff] text-center transition hover:bg-indigo-50/60"
                        onClick={() => logoInput.current?.click()}
                        type="button"
                      >
                        <input accept="image/*" className="hidden" onChange={(event) => void handleLogo(event.target.files?.[0] ?? null)} ref={logoInput} type="file" />
                        {logoBusy ? <Spinner className="h-5 w-5" /> : <Icon className="h-5 w-5 text-indigo-600" name="image" />}
                        <span className="mt-1.5 text-[14px] font-semibold text-indigo-600">{form.logoUrl ? 'Cambiar imagen' : 'Subir imagen'}</span>
                        <span className="text-[11px] text-slate-400">PNG o JPG · se ajusta a 320px</span>
                      </button>
                      <div className="flex h-[110px] items-center justify-center rounded-[12px] bg-slate-50">
                        {form.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img alt="Logo actual" className="max-h-[90px] max-w-[80%] object-contain" src={form.logoUrl} />
                        ) : (
                          <span className="text-[13px] text-slate-400">Sin logo cargado</span>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                <section className={`${card} p-5`}>
                  <SectionHead icon="factory" text="Mostrá tus principales capacidades productivas y certificaciones." title="Capacidades y certificaciones" />
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Capacidades</Label>
                      <ChipInput onChange={(values) => setField('capabilities', values)} placeholder="+ Agregar" values={form.capabilities} />
                      <span className="mt-1 block text-[11px] text-slate-400">Enter o coma para agregar.</span>
                    </div>
                    <div>
                      <Label>Certificaciones</Label>
                      <ChipInput onChange={(values) => setField('certifications', values)} placeholder="+ Agregar" values={form.certifications} />
                      <span className="mt-1 block text-[11px] text-slate-400">Enter o coma para agregar.</span>
                    </div>
                  </div>
                </section>

                <section className={`${card} flex flex-wrap items-center justify-between gap-4 p-5`}>
                  <SectionHead icon="users" text="Contanos más sobre tu equipo de trabajo." title="Tamaño del equipo" />
                  <label className="w-full sm:w-[340px]">
                    <Label>Empleados</Label>
                    <Select onChange={(value) => setField('employeeRange', value)} options={EMPLOYEE_RANGES} placeholder="Sin especificar" value={form.employeeRange} />
                  </label>
                </section>
              </div>

              <div className="space-y-5">
                <section className="rounded-[18px] bg-[#16123a] p-4">
                  <p className="mb-3 flex items-center gap-2 px-1 text-[14px] font-semibold text-white">
                    Tu perfil público
                    <Icon className="h-4 w-4" name="external" />
                  </p>
                  {publicCard}
                </section>

                <section className={`${card} p-5`}>
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 text-amber-500">
                      <Icon className="h-5 w-5" name="bulb" />
                    </span>
                    <div>
                      <p className="text-[16px] font-bold text-[#16123a]">Tips para mejorar tu perfil</p>
                      <p className="text-[13px] text-slate-500">
                        {tips.filter((tip) => tip.done).length} de {tips.length} completados
                      </p>
                    </div>
                  </div>
                  <ul className="mt-4 divide-y divide-slate-100 rounded-[12px] border border-slate-100">
                    {tips.map((tip) => (
                      <li key={tip.label}>
                        <button className="flex w-full items-center gap-3 px-3.5 py-3 text-left text-[14px] text-slate-700 hover:bg-slate-50" onClick={() => setTab(tip.tab)} type="button">
                          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${tip.done ? 'bg-emerald-500 text-white' : 'border-2 border-slate-200'}`}>
                            {tip.done ? <Icon className="h-3 w-3" name="check" /> : null}
                          </span>
                          <span className={`flex-1 ${tip.done ? 'text-slate-500' : ''}`}>{tip.label}</span>
                          <Icon className="h-4 w-4 text-indigo-500" name="arrow" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </>
          ) : null}

          {/* ============== OPERACIÓN Y LOGÍSTICA ============== */}
          {tab === 'operation' ? (
            <>
              <div className="space-y-5">
                <section className="relative overflow-hidden rounded-[18px] border border-indigo-100 bg-[linear-gradient(90deg,#f3f0ff,#ffffff)] p-5">
                  <SectionHead icon="truck" text="Esta información ayuda a los compradores a elegirte y facilita el proceso de cotización." title="Definí cómo operás" />
                </section>

                <section className={`${card} p-5`}>
                  <SectionHead icon="pin" text="Indicá desde dónde operás y a dónde podés entregar." title="Cobertura y envíos" />
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <label>
                      <Label>Ubicación principal</Label>
                      <span className="relative block">
                        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                          <Icon name="pin" />
                        </span>
                        <input className={`${inputClass} bg-slate-50 pl-10 text-slate-500`} readOnly value={location || 'Sin ubicación'} />
                      </span>
                      <span className="mt-1 block text-[11px] text-slate-400">Se toma de los datos de alta de la empresa.</span>
                    </label>
                    <label>
                      <Label>Radio de cobertura</Label>
                      <Select
                        onChange={(value) => setPref('coverage', value === 'Nacional' ? 'national' : value === 'Regional' ? 'regional' : 'provinces')}
                        options={['Nacional', 'Regional', 'Provincias específicas']}
                        value={prefs.coverage === 'national' ? 'Nacional' : prefs.coverage === 'regional' ? 'Regional' : 'Provincias específicas'}
                      />
                      <span className="mt-1 block text-[11px] text-slate-400">Podés seleccionar provincias o cobertura nacional.</span>
                    </label>
                  </div>
                  <Label>
                    <span className="mt-4 block">Tipos de entrega</span>
                  </Label>
                  <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                    {DELIVERY_TYPES.map((item) => (
                      <ChoiceCard active={prefs.deliveryTypes.includes(item.key)} icon={item.icon} key={item.key} label={item.label} onClick={() => setPref('deliveryTypes', toggleIn(prefs.deliveryTypes, item.key))} />
                    ))}
                  </div>
                </section>

                <section className={`${card} p-5`}>
                  <SectionHead icon="clock" text="Definí tiempos de producción, entrega y condiciones comerciales." title="Tiempos y condiciones" />
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <label>
                      <Label>Lead time de producción</Label>
                      <span className="relative block">
                        <input className={`${inputClass} pr-14`} inputMode="numeric" onChange={(event) => setField('leadTimeDays', event.target.value.replace(/\D/g, ''))} placeholder="7" value={form.leadTimeDays} />
                        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[13px] text-slate-400">días</span>
                      </span>
                      <span className="mt-1 block text-[11px] text-slate-400">Tiempo estimado desde la confirmación.</span>
                    </label>
                    <label>
                      <Label>Tiempo de entrega</Label>
                      <span className="relative block">
                        <input className={`${inputClass} pr-16`} onChange={(event) => setPref('deliveryTime', event.target.value)} placeholder="24 - 48" value={prefs.deliveryTime} />
                        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[13px] text-slate-400">horas</span>
                      </span>
                      <span className="mt-1 block text-[11px] text-slate-400">Una vez listo para despacho.</span>
                    </label>
                    <label>
                      <Label>Pedido mínimo</Label>
                      <span className="relative block">
                        <input className={`${inputClass} pr-14`} inputMode="numeric" onChange={(event) => setField('minimumOrder', event.target.value.replace(/\D/g, ''))} placeholder="100000" value={form.minimumOrder} />
                        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[13px] text-slate-400">ARS</span>
                      </span>
                      <span className="mt-1 block text-[11px] text-slate-400">Monto mínimo por cotización.</span>
                    </label>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                    <div>
                      <Label>Formas de envío</Label>
                      <div className="grid gap-2.5 sm:grid-cols-3">
                        {SHIP_SCOPES.map((item) => (
                          <ChoiceCard active={prefs.shipScope === item.key} icon={item.icon} key={item.key} label={item.label} onClick={() => setPref('shipScope', item.key)} />
                        ))}
                      </div>
                    </div>
                    <label>
                      <Label>Embalaje</Label>
                      <Select onChange={(value) => setPref('packaging', value)} options={PACKAGING} value={prefs.packaging} />
                      <span className="mt-1 block text-[11px] text-slate-400">Tipo de embalaje por defecto.</span>
                    </label>
                  </div>
                </section>

                <section className={`${card} p-5`}>
                  <SectionHead icon="card" text="Configurá las condiciones de pago que ofrecés a tus clientes." title="Condiciones de pago" />
                  <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                    <label>
                      <Label>Plazo de pago</Label>
                      <Select onChange={(value) => setPref('paymentTerm', value)} options={PAYMENT_TERMS} value={prefs.paymentTerm} />
                      <span className="mt-1 block text-[11px] text-slate-400">Plazo estándar para cuentas aprobadas.</span>
                    </label>
                    <div>
                      <Label>Métodos de pago</Label>
                      <div className="grid gap-2.5 sm:grid-cols-4">
                        {PAYMENT_METHODS.map((item) => (
                          <ChoiceCard active={prefs.paymentMethods.includes(item.key)} icon={item.icon} key={item.key} label={item.label} onClick={() => setPref('paymentMethods', toggleIn(prefs.paymentMethods, item.key))} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <label className="mt-4 block">
                    <Label optional>Financiación</Label>
                    <input className={inputClass} onChange={(event) => setField('financingSummary', event.target.value)} placeholder="Ej: cheques a 30/60 días para clientes con historial" value={form.financingSummary} />
                  </label>
                  <p className="mt-4 flex items-center gap-2 rounded-[10px] bg-sky-50 px-3.5 py-2.5 text-[12px] text-sky-700">
                    <Icon name="info" />
                    Estos datos se muestran a los compradores en tu perfil público y pueden variar en cada cotización.
                  </p>
                </section>
              </div>

              <div className="space-y-5">
                <section className={`${card} p-5`}>
                  <SectionHead icon="map" text="Mostrá en qué zonas realizás entregas." title="Mi zona de servicio" />
                  <div className="mt-4 grid grid-cols-[minmax(0,1fr)_170px] gap-4">
                    <ZoneMap zones={prefs.coverage === 'national' ? PROVINCES : prefs.zones} />
                    <div className="rounded-[12px] border border-slate-100 p-3">
                      <p className="text-[13px] font-semibold text-slate-800">Cobertura</p>
                      <ul className="mt-2 space-y-1.5 text-[13px]">
                        <li className="flex items-center gap-2 text-slate-700">
                          <span className={`h-3.5 w-3.5 rounded-full border-4 ${prefs.coverage === 'national' ? 'border-indigo-600' : 'border-slate-200'}`} />
                          Nacional
                        </li>
                        {PROVINCES.map((province) => {
                          const on = prefs.coverage === 'national' || prefs.zones.includes(province);
                          return (
                            <li key={province}>
                              <button
                                className="flex items-center gap-2 text-slate-700 disabled:cursor-default"
                                disabled={prefs.coverage === 'national'}
                                onClick={() => setPref('zones', toggleIn(prefs.zones, province))}
                                type="button"
                              >
                                <span className={`flex h-3.5 w-3.5 items-center justify-center rounded-full ${on ? 'bg-emerald-500 text-white' : 'border border-slate-300'}`}>
                                  {on ? <Icon className="h-2.5 w-2.5" name="check" /> : null}
                                </span>
                                {province}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                </section>

                <section className={`${card} p-5`}>
                  <SectionHead icon="box" text="Detalles adicionales sobre tu operación." title="Logística" />
                  <textarea
                    className={`${inputClass} mt-4 h-28 resize-none py-3`}
                    maxLength={500}
                    onChange={(event) => setField('logisticsSummary', event.target.value)}
                    placeholder="Ej: Entrega en AMBA en 24-48 hs. Envíos al interior coordinados."
                    value={form.logisticsSummary}
                  />
                  <span className="mt-1 block text-right text-[11px] text-slate-400">{form.logisticsSummary.length}/500</span>
                </section>

                <section className={`${card} p-5`}>
                  <SectionHead icon="doc" text="Condiciones de envío, política de devoluciones y otros documentos." title="Documentación logística" />
                  <div className="mt-4 rounded-[12px] border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center text-[13px] text-slate-500">
                    <Icon className="mx-auto h-5 w-5 text-slate-400" name="upload" />
                    <p className="mt-1.5">La carga de documentos va a estar disponible próximamente.</p>
                    <p className="text-[12px] text-slate-400">Mientras tanto, compartilos con cada comprador por el chat de la solicitud.</p>
                  </div>
                </section>
              </div>
            </>
          ) : null}

          {/* ============== PREFERENCIAS ============== */}
          {tab === 'preferences' ? (
            <>
              <div className="space-y-5">
                <section className="rounded-[18px] border border-indigo-100 bg-[linear-gradient(90deg,#f3f0ff,#ffffff)] p-5">
                  <SectionHead icon="sliders" text="Definí qué productos ofrecés, cómo querés que te contacten y qué mostrar en tu perfil público." title="Personalizá tu experiencia" />
                </section>

                <section className={`${card} p-5`}>
                  <SectionHead
                    action={
                      <button
                        className="h-9 shrink-0 rounded-[10px] border border-indigo-200 px-3.5 text-[13px] font-semibold text-indigo-600 hover:bg-indigo-50"
                        onClick={() => setField('categories', form.categories.length === catalog.length ? [] : catalog.map((item) => item.label))}
                        type="button"
                      >
                        {form.categories.length === catalog.length ? 'Quitar todas' : 'Seleccionar todas'}
                      </button>
                    }
                    icon="tag"
                    text="Aparecen en tu perfil público y te traemos solicitudes relevantes. La estrella destaca el producto con foto."
                    title="Categorías de interés"
                  />
                  <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
                    {catalog.map((category) => {
                      const selected = form.categories.includes(category.label);
                      const featured = form.mainProducts.includes(category.label);
                      const image = FALLBACK_REQUEST_CATEGORIES.find((item) => item.label === category.label)?.imageSrc ?? category.imageSrc;
                      return (
                        <div
                          key={category.id}
                          className={`relative overflow-hidden rounded-[12px] border transition ${selected ? 'border-indigo-400 shadow-[0_0_0_1px_var(--color-indigo-400)]' : 'border-slate-200 hover:border-indigo-200'}`}
                        >
                          <button
                            className="block w-full text-left"
                            onClick={() => {
                              setField('categories', toggleIn(form.categories, category.label));
                              if (selected) setField('mainProducts', form.mainProducts.filter((item) => item !== category.label));
                            }}
                            type="button"
                          >
                            <span className="relative block aspect-[4/3] bg-slate-100">
                              {image ? <Image alt="" className="object-cover" fill sizes="200px" src={image} /> : null}
                            </span>
                            <span className="flex items-center justify-between gap-2 px-2.5 py-2">
                              <span className="truncate text-[12px] font-medium text-slate-800">{category.label}</span>
                              <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] ${selected ? 'bg-indigo-600 text-white' : 'border border-slate-300'}`}>
                                {selected ? <Icon className="h-3 w-3" name="check" /> : null}
                              </span>
                            </span>
                          </button>
                          {selected ? (
                            <button
                              aria-label={featured ? 'Quitar de destacados' : 'Destacar en el perfil'}
                              className={`absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full text-[14px] shadow ${featured ? 'bg-amber-400 text-white' : 'bg-white/90 text-slate-400'}`}
                              onClick={() => setField('mainProducts', toggleIn(form.mainProducts, category.label))}
                              title={featured ? 'Destacado en tu perfil' : 'Destacar en tu perfil'}
                              type="button"
                            >
                              ★
                            </button>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className={`${card} p-5`}>
                  <SectionHead icon="pin" text="Elegí en qué zonas querés recibir solicitudes." title="Áreas geográficas de interés" />
                  <div className="mt-4 grid gap-5 md:grid-cols-[minmax(0,1fr)_200px_170px]">
                    <div className="space-y-3">
                      {[
                        { key: 'national' as const, label: 'Todo el país', text: 'Recibí oportunidades de todas las provincias.' },
                        { key: 'regional' as const, label: 'Regiones específicas', text: 'Seleccioná una o más regiones.' },
                        { key: 'provinces' as const, label: 'Provincias específicas', text: 'Elegí las provincias que te interesan.' },
                      ].map((option) => (
                        <button key={option.key} className="flex items-start gap-3 text-left" onClick={() => setPref('coverage', option.key)} type="button">
                          <span className={`mt-0.5 h-5 w-5 shrink-0 rounded-full border-[5px] ${prefs.coverage === option.key ? 'border-indigo-600' : 'border-slate-200'}`} />
                          <span>
                            <span className="block text-[14px] font-medium text-slate-800">{option.label}</span>
                            <span className="block text-[12px] text-slate-500">{option.text}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                    <ZoneMap zones={prefs.coverage === 'national' ? PROVINCES : prefs.zones} />
                    <ul className="space-y-2 text-[13px]">
                      {PROVINCES.map((province) => {
                        const on = prefs.coverage === 'national' || prefs.zones.includes(province);
                        return (
                          <li key={province}>
                            <button className="flex items-center gap-2 text-slate-700 disabled:opacity-60" disabled={prefs.coverage === 'national'} onClick={() => setPref('zones', toggleIn(prefs.zones, province))} type="button">
                              <span className={`flex h-4 w-4 items-center justify-center rounded-[4px] ${on ? 'bg-indigo-600 text-white' : 'border border-slate-300'}`}>
                                {on ? <Icon className="h-3 w-3" name="check" /> : null}
                              </span>
                              {province}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </section>
              </div>

              <div className="space-y-5">
                <section className={`${card} p-4`}>
                  <div className="mb-3 flex items-center justify-between px-1">
                    <p className="flex items-center gap-2 text-[15px] font-bold text-[#16123a]">
                      <Icon className="h-5 w-5 text-indigo-600" name="eye" />
                      Vista previa de tu perfil
                    </p>
                  </div>
                  <div className="rounded-[14px] border border-slate-100">{publicCard}</div>
                </section>

                <section className={`${card} p-5`}>
                  <SectionHead icon="chat" text="Cómo querés que te contacten los compradores de ATAR." title="Canales de contacto" />
                  <ul className="mt-4 space-y-3.5">
                    {CHANNELS.map((channel) => (
                      <li key={channel.key} className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-slate-200 text-slate-600">
                          <Icon name={channel.icon} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[14px] font-medium text-slate-800">{channel.label}</span>
                          <span className="block text-[12px] text-slate-500">{channel.text}</span>
                        </span>
                        <Toggle checked={Boolean(prefs.channels[channel.key])} label={channel.label} onChange={(value) => setPref('channels', { ...prefs.channels, [channel.key]: value })} />
                      </li>
                    ))}
                  </ul>
                </section>

                <section className={`${card} p-5`}>
                  <SectionHead icon="gear" text="Cómo participás de la plataforma." title="Otras preferencias" />
                  <ul className="mt-4 space-y-3">
                    {OTHER_PREFS.map((pref) => (
                      <li key={pref.key}>
                        <label className="flex cursor-pointer items-center gap-3 text-[14px] text-slate-700">
                          <input
                            checked={Boolean(prefs.other[pref.key])}
                            className="h-4 w-4 accent-indigo-600"
                            onChange={(event) => setPref('other', { ...prefs.other, [pref.key]: event.target.checked })}
                            type="checkbox"
                          />
                          {pref.label}
                        </label>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </>
          ) : null}

          {/* ============== NOTIFICACIONES ============== */}
          {tab === 'notifications' ? (
            <>
              <section className={`${card} p-5`}>
                <SectionHead icon="bell" text="Elegí de qué querés enterarte." title="Notificaciones" />
                <ul className="mt-5 divide-y divide-slate-100">
                  <li className="flex items-center gap-4 pb-4">
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold text-slate-900">Notificaciones activadas</span>
                      <span className="block text-[13px] text-slate-500">Pausalas si no querés recibir ningún aviso por un tiempo.</span>
                    </span>
                    <Toggle checked={settings.notificationsEnabled} label="Notificaciones activadas" onChange={(value) => setSettings((current) => ({ ...current, notificationsEnabled: value }))} />
                  </li>
                  {NOTIFY_PREFS.map((pref) => (
                    <li key={pref.key} className={`flex items-center gap-4 py-4 ${settings.notificationsEnabled ? '' : 'opacity-50'}`}>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] font-medium text-slate-800">{pref.label}</span>
                        <span className="block text-[13px] text-slate-500">{pref.text}</span>
                      </span>
                      <Toggle checked={Boolean(prefs.notify[pref.key])} label={pref.label} onChange={(value) => setPref('notify', { ...prefs.notify, [pref.key]: value })} />
                    </li>
                  ))}
                  <li className="flex items-center gap-4 pt-4">
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14px] font-medium text-slate-800">Actualización automática</span>
                      <span className="block text-[13px] text-slate-500">Refresca solicitudes y contadores sin recargar la página.</span>
                    </span>
                    <Toggle checked={settings.autoRefreshEnabled} label="Actualización automática" onChange={(value) => setSettings((current) => ({ ...current, autoRefreshEnabled: value }))} />
                  </li>
                </ul>
              </section>
              <section className={`${card} p-5`}>
                <SectionHead icon="card" text="Moneda con la que se precargan tus cotizaciones." title="Moneda preferida" />
                <div className="mt-4">
                  <Select onChange={(value) => setSettings((current) => ({ ...current, preferredCurrency: value }))} options={['ARS', 'USD', 'BRL', 'EUR']} value={settings.preferredCurrency} />
                </div>
                <Link className="mt-5 flex items-center justify-between rounded-[12px] border border-slate-100 px-4 py-3 text-[14px] hover:bg-slate-50" href="/dashboard/proveedor/notificaciones">
                  <span className="text-slate-700">Ver mis notificaciones</span>
                  <Icon className="h-4 w-4 text-indigo-500" name="arrow" />
                </Link>
              </section>
            </>
          ) : null}

          {/* ============== SEGURIDAD ============== */}
          {tab === 'security' ? (
            <>
              <section className={`${card} p-5`}>
                <SectionHead icon="shield" text="Datos de acceso de tu cuenta." title="Seguridad" />
                <dl className="mt-5 divide-y divide-slate-100 text-[14px]">
                  <div className="flex justify-between gap-4 py-3">
                    <dt className="text-slate-500">Titular de la cuenta</dt>
                    <dd className="font-medium text-slate-900">{session ? getUserFullName(session.user) : '—'}</dd>
                  </div>
                  <div className="flex justify-between gap-4 py-3">
                    <dt className="text-slate-500">Email de acceso</dt>
                    <dd className="font-medium text-slate-900">{session?.user.email ?? '—'}</dd>
                  </div>
                  <div className="flex justify-between gap-4 py-3">
                    <dt className="text-slate-500">Rol en {companyName}</dt>
                    <dd className="font-medium text-slate-900">Gerente</dd>
                  </div>
                </dl>
                <p className="mt-4 flex items-start gap-2 rounded-[10px] bg-slate-50 px-3.5 py-3 text-[13px] text-slate-600">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0" name="lock" />
                  Para cambiar tu contraseña o el email de acceso, escribinos desde el Asistente ATAR y te ayudamos a verificar tu identidad.
                </p>
              </section>
              <section className={`${card} p-5`}>
                <SectionHead icon="logout" text="Cerrá la sesión en este dispositivo." title="Sesión" />
                <button
                  className="mt-5 inline-flex h-11 items-center gap-2 rounded-[10px] border border-rose-200 px-5 text-[14px] font-semibold text-rose-600 hover:bg-rose-50"
                  onClick={() => {
                    clearSession();
                    router.push('/acceso');
                  }}
                  type="button"
                >
                  <Icon name="logout" />
                  Cerrar sesión
                </button>
              </section>
            </>
          ) : null}
        </div>
      )}

      {/* Barra de guardado (en mobile, por encima de la navegación inferior) */}
      {tab !== 'security' ? (
        <div className="sticky bottom-[84px] z-10 mt-5 flex items-center justify-between gap-3 rounded-[16px] border border-slate-100 bg-white/95 px-3 py-3 shadow-[0_-8px_30px_rgba(40,28,110,0.06)] backdrop-blur sm:flex-wrap sm:pl-5 sm:pr-24 lg:bottom-0">
          <button
            className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-rose-200 px-4 text-[14px] font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-40"
            disabled={!dirty || saving}
            onClick={discard}
            type="button"
          >
            <Icon name="trash" />
            <span className="sm:hidden">Descartar</span>
            <span className="hidden sm:inline">Descartar cambios</span>
          </button>
          <div className="flex items-center gap-4">
            <span className="hidden text-[12px] text-slate-400 sm:inline">
              {dirty
                ? 'Tenés cambios sin guardar.'
                : updatedAt
                  ? `Última actualización: ${new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(updatedAt)}`
                  : 'Sin cambios pendientes.'}
            </span>
            <button
              className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-indigo-600 px-4 text-[14px] font-semibold sm:px-6 sm:text-[15px] text-white shadow-[0_10px_24px_rgba(100,64,232,0.28)] hover:bg-indigo-700 disabled:opacity-50"
              disabled={saving || !dirty}
              onClick={() => void handleSave()}
              type="button"
            >
              {saving ? <Spinner className="h-4 w-4" /> : <Icon name="check" />}
              Guardar cambios
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* Mapa estilizado de Argentina con las provincias marcadas --------------------- */

const PROVINCE_SHAPES: Record<string, string> = {
  Tucumán: 'M52 44 L64 42 L66 56 L54 58 Z',
  Córdoba: 'M50 78 L70 74 L74 104 L54 108 Z',
  'Santa Fe': 'M72 66 L88 64 L90 102 L76 104 Z',
  'Entre Ríos': 'M90 84 L102 84 L100 108 L90 106 Z',
  Mendoza: 'M26 96 L46 94 L48 124 L28 128 Z',
  'Buenos Aires': 'M56 108 L92 108 L104 118 L96 146 L70 152 L58 136 Z',
};

function ZoneMap({ zones }: { zones: string[] }) {
  const others = zones.includes('Otras provincias');
  return (
    <svg aria-label="Zonas de servicio" className="h-full max-h-[260px] w-full rounded-[12px] bg-[#f6f4fd]" role="img" viewBox="0 0 130 270">
      <path
        d="M36 8 L60 6 L84 12 L100 30 L104 44 L92 52 L88 70 L84 88 L92 104 L104 118 L96 146 L80 150 L74 160 L64 164 L62 180 L56 196 L52 212 L48 230 L44 246 L46 260 L34 264 L30 248 L30 226 L28 204 L26 182 L24 160 L22 138 L22 116 L24 94 L26 72 L28 50 L30 30 Z"
        fill={others ? '#d9d0ff' : '#ebe7fb'}
        stroke="#c9bdf9"
        strokeWidth="1.2"
      />
      {Object.entries(PROVINCE_SHAPES).map(([name, d]) => (
        <path key={name} d={d} fill={zones.includes(name) ? '#7a55f7' : '#ddd6fb'} opacity={zones.includes(name) ? 0.85 : 1} stroke="#fff" strokeWidth="1">
          <title>{name}</title>
        </path>
      ))}
    </svg>
  );
}
