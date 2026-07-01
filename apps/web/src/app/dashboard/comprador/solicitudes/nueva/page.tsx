'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { atarApi } from '@/lib/atar-api';
import { providerDirectory } from '@/lib/provider-directory';

type StepKey = 1 | 2 | 3 | 4 | 5 | 6;

type RequestDraft = {
  category: string;
  title: string;
  description: string;
  quantity: string;
  material: string;
  capacityOption: string;
  handleType: string;
  printType: string;
  specSelections: Record<string, string>;
  uploadedFiles: Record<string, string[]>;
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

type SpecModuleType = 'choices' | 'segmented' | 'input' | 'quantity' | 'uploader' | 'textarea';

type SpecModule = {
  id: string;
  label: string;
  type: SpecModuleType;
  options?: readonly string[];
  placeholder?: string;
  helper?: string;
  required?: boolean;
  fullWidth?: boolean;
  inputType?: 'text' | 'date';
};

const DRAFT_KEY = 'atar:buyer:new-request:draft';

const steps = [
  { key: 1 as const, label: 'Tipo de producto' },
  { key: 2 as const, label: 'Especificaciones' },
  { key: 3 as const, label: 'Entrega' },
  { key: 4 as const, label: 'Proveedores' },
  { key: 5 as const, label: 'Resumen' },
];

const categoryOptions = [
  { label: 'Big Bags', subtitle: 'FIBC 500 - 2000 kg', imageSrc: '/bigbag.png', imageClassName: 'scale-[1.56] translate-y-4' },
  { label: 'Bolsas PP', subtitle: 'Tejidas y laminadas', imageSrc: '/bolsapp.png', imageClassName: 'scale-[1.5] translate-y-4' },
  { label: 'Polipropileno', subtitle: 'Tejidos, rafia y laminados', imageSrc: '/rollo.png', imageClassName: 'scale-[1.64] translate-y-2' },
  { label: 'Polietileno', subtitle: 'Films, mangas y bobinas', imageSrc: '/bolsapp.png', imageClassName: 'scale-[1.52] translate-y-4' },
  { label: 'Rollos y Telas', subtitle: 'Polipropileno y otros', imageSrc: '/rollo.png', imageClassName: 'scale-[1.64] translate-y-2' },
  { label: 'Sacos', subtitle: 'De papel, rafia y mas', imageSrc: '/saco.png', imageClassName: 'scale-[1.5] translate-y-3' },
  { label: 'A medida', subtitle: 'Desarrollos especiales', imageSrc: '/amedida.png', imageClassName: 'scale-[1.62] translate-y-3' },
  { label: 'Tintas', subtitle: 'Flexografia e impresion industrial', imageSrc: '/amedida.png', imageClassName: 'scale-[1.52] translate-y-3' },
] as const;

const quantityShortcuts = ['50', '100', '250', '500', '1000', 'Otro'] as const;

const providerKeywordsByCategory: Record<string, string[]> = {
  'Big Bags': ['big bag', 'bolsas', 'fibc', 'polipropileno'],
  'Bolsas PP': ['bolsas', 'packaging', 'polipropileno'],
  Polipropileno: ['polipropileno', 'plasticos', 'rafia'],
  Polietileno: ['plasticos', 'filmes', 'envases'],
  'Rollos y Telas': ['filmes', 'packaging', 'plasticos'],
  Sacos: ['bolsas', 'packaging', 'industriales'],
  'A medida': ['atencion personalizada', 'integracion', 'premium'],
  Tintas: ['impresiones', 'packaging', 'conversion'],
};

const productSpecModules: Record<string, SpecModule[]> = {
  'Big Bags': [
    { id: 'material', label: 'Material', type: 'choices', options: ['Polipropileno virgen', 'Reciclado', 'Laminado', 'Antiestatico'], required: true },
    { id: 'capacidad', label: 'Capacidad', type: 'segmented', options: ['500 kg', '750 kg', '1000 kg', '1250 kg', '1500 kg', '2000 kg'], required: true },
    { id: 'tipo-asa', label: 'Tipo de asa', type: 'choices', options: ['Loop', 'Cruzada', 'Tubular', '4 asas'], required: true },
    { id: 'tipo-boca', label: 'Tipo de boca', type: 'segmented', options: ['Abierta', 'Faldon', 'Carga rapida', 'Valvula'] },
    { id: 'tipo-fondo', label: 'Tipo de fondo', type: 'segmented', options: ['Plano', 'Descarga parcial', 'Descarga total'] },
    { id: 'liner', label: 'Liner', type: 'segmented', options: ['Sin liner', 'Suelto', 'Pegado'] },
    { id: 'impresion', label: 'Impresion', type: 'choices', options: ['Sin impresion', '1 color', '2 colores', 'Cobertura total'] },
    { id: 'cantidad', label: 'Cantidad', type: 'quantity', required: true },
    { id: 'adjuntos', label: 'Adjuntar archivos', type: 'uploader', helper: 'PDF, AI, PNG, STEP o DWG' },
    { id: 'observaciones', label: 'Observaciones', type: 'textarea', placeholder: 'Indicá medidas, certificaciones, uso o cualquier detalle clave.', fullWidth: true },
  ],
  'Bolsas PP': [
    { id: 'material', label: 'Material', type: 'choices', options: ['Virgen', 'Reciclado', 'Laminado', 'Mixto'], required: true },
    { id: 'gramaje', label: 'Gramaje', type: 'segmented', options: ['40 g', '55 g', '70 g', '90 g', '120 g'], required: true },
    { id: 'medidas', label: 'Medidas', type: 'input', placeholder: 'Ej: 50 x 80 cm', required: true },
    { id: 'fuelle', label: 'Fuelle', type: 'segmented', options: ['Sin fuelle', 'Lateral', 'Base'] },
    { id: 'laminado', label: 'Laminado', type: 'segmented', options: ['No', '1 cara', '2 caras'] },
    { id: 'microperforado', label: 'Microperforado', type: 'segmented', options: ['No', 'Si'] },
    { id: 'tipo-cierre', label: 'Tipo de cierre', type: 'choices', options: ['Abierto', 'Costura', 'Valvula', 'Troquel'] },
    { id: 'impresion', label: 'Impresion', type: 'choices', options: ['Sin impresion', '1 color', '2 colores', 'Full print'] },
    { id: 'cantidad', label: 'Cantidad', type: 'quantity', required: true },
    { id: 'adjuntos', label: 'Adjuntar diseño', type: 'uploader', helper: 'Subí artes, croquis o referencias.' },
    { id: 'observaciones', label: 'Observaciones', type: 'textarea', placeholder: 'Agregá detalles sobre sellado, uso o terminaciones.', fullWidth: true },
  ],
  Polipropileno: [
    { id: 'tipo', label: 'Tipo', type: 'choices', options: ['Homopolimero', 'Copolimero', 'Rafia', 'Fibra'], required: true },
    { id: 'presentacion', label: 'Presentacion', type: 'segmented', options: ['Pellets', 'Rollo', 'Tejido', 'Bobina'], required: true },
    { id: 'color', label: 'Color', type: 'segmented', options: ['Natural', 'Blanco', 'Negro', 'Personalizado'] },
    { id: 'indice-fluidez', label: 'Indice de fluidez', type: 'input', placeholder: 'Ej: 3.5 g/10 min' },
    { id: 'cantidad', label: 'Cantidad', type: 'quantity', required: true },
    { id: 'frecuencia', label: 'Frecuencia de compra', type: 'segmented', options: ['Unica', 'Mensual', 'Trimestral', 'Programada'] },
    { id: 'adjuntos', label: 'Adjuntar especificaciones', type: 'uploader', helper: 'Subí ficha técnica o requerimientos.' },
    { id: 'observaciones', label: 'Observaciones', type: 'textarea', placeholder: 'Especificá aplicaciones, normas o propiedades buscadas.', fullWidth: true },
  ],
  Polietileno: [
    { id: 'tipo', label: 'Tipo', type: 'choices', options: ['PEAD', 'PEBD', 'PEBDL', 'Reciclado'], required: true },
    { id: 'presentacion', label: 'Presentacion', type: 'segmented', options: ['Film', 'Manga', 'Bobina', 'Lamina'], required: true },
    { id: 'espesor', label: 'Espesor', type: 'input', placeholder: 'Ej: 80 micrones' },
    { id: 'ancho', label: 'Ancho', type: 'input', placeholder: 'Ej: 1200 mm' },
    { id: 'color', label: 'Color', type: 'segmented', options: ['Natural', 'Blanco', 'Negro', 'Color custom'] },
    { id: 'uso', label: 'Uso', type: 'choices', options: ['Packaging', 'Industrial', 'Agro', 'Construccion'] },
    { id: 'cantidad', label: 'Cantidad', type: 'quantity', required: true },
    { id: 'adjuntos', label: 'Adjuntar ficha tecnica', type: 'uploader', helper: 'Incluí tolerancias o fichas de calidad.' },
    { id: 'observaciones', label: 'Observaciones', type: 'textarea', placeholder: 'Agregá requerimientos de aplicación, espesor o acabado.', fullWidth: true },
  ],
  'Rollos y Telas': [
    { id: 'material', label: 'Material', type: 'choices', options: ['PP', 'PE', 'Mixto', 'Reciclado'], required: true },
    { id: 'ancho', label: 'Ancho', type: 'input', placeholder: 'Ej: 160 cm', required: true },
    { id: 'largo', label: 'Largo', type: 'input', placeholder: 'Ej: 500 m' },
    { id: 'espesor', label: 'Espesor', type: 'input', placeholder: 'Ej: 120 micrones' },
    { id: 'color', label: 'Color', type: 'segmented', options: ['Natural', 'Blanco', 'Negro', 'Custom'] },
    { id: 'tratamiento-uv', label: 'Tratamiento UV', type: 'segmented', options: ['No', 'UV 6 meses', 'UV 12 meses', 'Reforzado'] },
    { id: 'laminado', label: 'Laminado', type: 'segmented', options: ['No', 'Simple', 'Doble'] },
    { id: 'impresion', label: 'Impresion', type: 'choices', options: ['Sin impresion', '1 color', '2 colores', 'Alta cobertura'] },
    { id: 'cantidad', label: 'Cantidad', type: 'quantity', required: true },
    { id: 'adjuntos', label: 'Adjuntar plano', type: 'uploader', helper: 'Subí referencia visual, plano o muestra.' },
    { id: 'observaciones', label: 'Observaciones', type: 'textarea', placeholder: 'Indicá aplicación, tensión, tratamiento o acabado.', fullWidth: true },
  ],
  Sacos: [
    { id: 'material', label: 'Material', type: 'choices', options: ['Papel', 'Rafia', 'Mixto', 'Laminado'], required: true },
    { id: 'capacidad', label: 'Capacidad', type: 'segmented', options: ['10 kg', '25 kg', '40 kg', '50 kg', 'Custom'], required: true },
    { id: 'medidas', label: 'Medidas', type: 'input', placeholder: 'Ej: 45 x 75 cm' },
    { id: 'costura', label: 'Costura', type: 'segmented', options: ['Simple', 'Doble', 'Termosellada'] },
    { id: 'valvula', label: 'Valvula', type: 'segmented', options: ['Sin valvula', 'Interna', 'Externa'] },
    { id: 'impresion', label: 'Impresion', type: 'choices', options: ['Sin impresion', '1 color', '2 colores', '3 colores'] },
    { id: 'paletizado', label: 'Paletizado', type: 'segmented', options: ['Sin paletizar', 'Estandar', 'Reforzado'] },
    { id: 'cantidad', label: 'Cantidad', type: 'quantity', required: true },
    { id: 'observaciones', label: 'Observaciones', type: 'textarea', placeholder: 'Agregá detalles sobre carga, almacenamiento o despacho.', fullWidth: true },
  ],
  'A medida': [
    { id: 'descripcion-producto', label: 'Descripcion del producto', type: 'textarea', placeholder: 'Contanos qué producto necesitás desarrollar.', required: true, fullWidth: true },
    { id: 'uso-producto', label: 'Uso del producto', type: 'choices', options: ['Agro', 'Construccion', 'Logistica', 'Retail'], required: true },
    { id: 'material-deseado', label: 'Material deseado', type: 'choices', options: ['PP', 'PE', 'Papel', 'A definir'] },
    { id: 'cantidad-estimada', label: 'Cantidad estimada', type: 'quantity', required: true },
    { id: 'fecha-objetivo', label: 'Fecha objetivo', type: 'input', inputType: 'date', required: true },
    { id: 'adjuntar-planos', label: 'Adjuntar planos', type: 'uploader', helper: 'PDF, CAD o documentación técnica.' },
    { id: 'adjuntar-imagenes', label: 'Adjuntar imágenes', type: 'uploader', helper: 'Fotos, renders o referencias visuales.' },
    { id: 'observaciones', label: 'Observaciones', type: 'textarea', placeholder: 'Indicá condicionantes, normativas o hitos del proyecto.', fullWidth: true },
  ],
  Tintas: [
    { id: 'tipo-tinta', label: 'Tipo de tinta', type: 'choices', options: ['Flexografica', 'Huecograbado', 'Base agua', 'Base solvente'], required: true },
    { id: 'base', label: 'Base', type: 'segmented', options: ['Agua', 'Solvente', 'UV', 'Especial'], required: true },
    { id: 'cantidad-colores', label: 'Cantidad de colores', type: 'segmented', options: ['1', '2', '3', '4+'] },
    { id: 'pantone', label: 'Pantone', type: 'input', placeholder: 'Ej: Pantone 286 C' },
    { id: 'sustrato', label: 'Sustrato', type: 'choices', options: ['PP', 'PE', 'Papel', 'Mixto'] },
    { id: 'cantidad', label: 'Cantidad', type: 'quantity', required: true },
    { id: 'adjuntos', label: 'Adjuntar diseño', type: 'uploader', helper: 'Subí artes, layout o especificaciones.' },
    { id: 'observaciones', label: 'Observaciones', type: 'textarea', placeholder: 'Aclará viscosidad, anilox, secado o requerimientos especiales.', fullWidth: true },
  ],
};

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

function getCategoryOption(category: string) {
  return categoryOptions.find((option) => option.label === category) ?? null;
}

function clampStep(value: number): StepKey {
  if (value <= 1) return 1;
  if (value === 2) return 2;
  if (value === 3) return 3;
  if (value === 4) return 4;
  if (value === 5) return 5;
  return 6;
}

function getProductModules(category: string) {
  return productSpecModules[category] ?? [];
}

function getModuleValue(draft: RequestDraft, moduleId: string) {
  if (moduleId === 'observaciones') {
    return draft.description;
  }
  if (moduleId === 'cantidad' || moduleId === 'cantidad-estimada') {
    return draft.quantity;
  }
  if (moduleId === 'material') {
    return draft.specSelections[moduleId] ?? draft.material;
  }
  if (moduleId === 'capacidad') {
    return draft.specSelections[moduleId] ?? draft.capacityOption;
  }
  if (moduleId === 'tipo-asa') {
    return draft.specSelections[moduleId] ?? draft.handleType;
  }
  if (moduleId === 'impresion') {
    return draft.specSelections[moduleId] ?? draft.printType;
  }
  if (moduleId === 'fecha-objetivo') {
    return draft.specSelections[moduleId] ?? draft.deliveryDate;
  }
  return draft.specSelections[moduleId] ?? '';
}

function getModuleFiles(draft: RequestDraft, moduleId: string) {
  return draft.uploadedFiles[moduleId] ?? [];
}

function getStepTwoSummary(draft: RequestDraft) {
  const modules = getProductModules(draft.category);
  const values = modules
    .filter((module) => module.type !== 'uploader' && module.id !== 'observaciones')
    .map((module) => getModuleValue(draft, module.id).trim())
    .filter(Boolean);

  return {
    line1: values.slice(0, 2).join(' · ') || 'Completá las especificaciones',
    line2: values[2] || 'Indicá los detalles principales',
  };
}

function getSpecificationLines(draft: RequestDraft) {
  return getProductModules(draft.category).flatMap((module) => {
    if (module.type === 'uploader') {
      const fileNames = getModuleFiles(draft, module.id);
      return fileNames.length > 0 ? [`${module.label}: ${fileNames.join(', ')}`] : [];
    }

    const value = getModuleValue(draft, module.id).trim();
    return value ? [`${module.label}: ${value}`] : [];
  });
}

function loadDraft(): RequestDraft {
  if (typeof window === 'undefined') {
    return {
      category: '',
      title: '',
      description: '',
      quantity: '',
      material: '',
      capacityOption: '',
      handleType: '',
      printType: '',
      specSelections: {},
      uploadedFiles: {},
      deliveryCountry: 'Argentina',
      deliveryCity: '',
      deliveryAddressMode: 'saved',
      deliveryAddressLine: 'Planta San Martin',
      deliveryDate: '',
      deliveryDateMode: 'asap',
      deliveryDateRange: '',
      deliveryNotes: '',
      deliverySchedule: 'Lunes a viernes 8 a 17 hs',
      deliveryContactName: 'Mariana Lopez',
      deliveryPhone: '+54 11 3456 7890',
      selectedProviders: [],
    };
  }

  const raw = window.localStorage.getItem(DRAFT_KEY);
  if (!raw) {
    return {
      category: '',
      title: '',
      description: '',
      quantity: '',
      material: '',
      capacityOption: '',
      handleType: '',
      printType: '',
      specSelections: {},
      uploadedFiles: {},
      deliveryCountry: 'Argentina',
      deliveryCity: '',
      deliveryAddressMode: 'saved',
      deliveryAddressLine: 'Planta San Martin',
      deliveryDate: '',
      deliveryDateMode: 'asap',
      deliveryDateRange: '',
      deliveryNotes: '',
      deliverySchedule: 'Lunes a viernes 8 a 17 hs',
      deliveryContactName: 'Mariana Lopez',
      deliveryPhone: '+54 11 3456 7890',
      selectedProviders: [],
    };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<RequestDraft>;
    return {
      category: parsed.category ?? '',
      title: parsed.title ?? '',
      description: parsed.description ?? '',
      quantity: parsed.quantity ?? '',
      material: parsed.material ?? '',
      capacityOption: parsed.capacityOption ?? '',
      handleType: parsed.handleType ?? '',
      printType: parsed.printType ?? '',
      specSelections: parsed.specSelections ?? {},
      uploadedFiles: parsed.uploadedFiles ?? {},
      deliveryCountry: parsed.deliveryCountry ?? 'Argentina',
      deliveryCity: parsed.deliveryCity ?? '',
      deliveryAddressMode: parsed.deliveryAddressMode ?? 'saved',
      deliveryAddressLine: parsed.deliveryAddressLine ?? 'Planta San Martin',
      deliveryDate: parsed.deliveryDate ?? '',
      deliveryDateMode: parsed.deliveryDateMode ?? 'asap',
      deliveryDateRange: parsed.deliveryDateRange ?? '',
      deliveryNotes: parsed.deliveryNotes ?? '',
      deliverySchedule: parsed.deliverySchedule ?? 'Lunes a viernes 8 a 17 hs',
      deliveryContactName: parsed.deliveryContactName ?? 'Mariana Lopez',
      deliveryPhone: parsed.deliveryPhone ?? '+54 11 3456 7890',
      selectedProviders: Array.isArray(parsed.selectedProviders) ? parsed.selectedProviders : [],
    };
  } catch {
    window.localStorage.removeItem(DRAFT_KEY);
    return {
      category: '',
      title: '',
      description: '',
      quantity: '',
      material: '',
      capacityOption: '',
      handleType: '',
      printType: '',
      specSelections: {},
      uploadedFiles: {},
      deliveryCountry: 'Argentina',
      deliveryCity: '',
      deliveryAddressMode: 'saved',
      deliveryAddressLine: 'Planta San Martin',
      deliveryDate: '',
      deliveryDateMode: 'asap',
      deliveryDateRange: '',
      deliveryNotes: '',
      deliverySchedule: 'Lunes a viernes 8 a 17 hs',
      deliveryContactName: 'Mariana Lopez',
      deliveryPhone: '+54 11 3456 7890',
      selectedProviders: [],
    };
  }
}

function saveDraft(nextDraft: RequestDraft) {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify(nextDraft));
}

function Icon({ name }: { name: 'arrow' | 'check' | 'pin' | 'calendar' | 'clock' | 'phone' | 'truck' }) {
  if (name === 'arrow') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path d="M9 18l6-6-6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }
  if (name === 'pin') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path d="M21 10c0 6-9 12-9 12S3 16 3 10a9 9 0 1118 0z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="M12 10a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }
  if (name === 'calendar') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path d="M8 2v4M16 2v4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="M3 10h18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="M5 6h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }
  if (name === 'clock') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="M12 7v5l3 2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }
  if (name === 'phone') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.86 19.86 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.86 19.86 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.12.9.33 1.77.62 2.6a2 2 0 01-.45 2.11L8.04 9.96a16 16 0 006 6l1.53-1.26a2 2 0 012.11-.45c.83.29 1.7.5 2.6.62A2 2 0 0122 16.92z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }
  if (name === 'truck') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path d="M10 17H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v1" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="M14 9h3l3 3v3h-6V9z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <circle cx="7.5" cy="17.5" r="1.5" stroke="currentColor" strokeWidth="2" />
        <circle cx="17.5" cy="17.5" r="1.5" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

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
  const [draft, setDraft] = useState<RequestDraft>(() => loadDraft());
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [providerSearch, setProviderSearch] = useState('');

  useEffect(() => {
    const initialCategory = searchParams?.get('category');
    if (initialCategory && !draft.category) {
      const next = { ...draft, category: initialCategory };
      setDraft(next);
      saveDraft(next);
    }
  }, [draft, searchParams]);

  useEffect(() => {
    setStep(initialStep);
  }, [initialStep]);

  useEffect(() => {
    saveDraft(draft);
  }, [draft]);

  const providers = useMemo(() => providerDirectory.slice(0, 6), []);
  const providerKeywords = useMemo(() => providerKeywordsByCategory[draft.category] ?? [], [draft.category]);
  const filteredProviders = useMemo(() => {
    const query = providerSearch.trim().toLowerCase();
    if (!query) {
      return providers;
    }

    return providers.filter((provider) =>
      [provider.name, provider.city, provider.category, provider.description, provider.tags.join(' ')]
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [providerSearch, providers]);
  const suggestedProviders = useMemo(() => {
    return [...filteredProviders]
      .map((provider) => {
        const haystack = [provider.category, provider.description, provider.tags.join(' ')].join(' ').toLowerCase();
        const score = providerKeywords.reduce((total, keyword) => total + (haystack.includes(keyword) ? 2 : 0), 0) + Number.parseFloat(provider.rating);
        return { provider, score };
      })
      .sort((left, right) => right.score - left.score)
      .slice(0, 5)
      .map((item) => item.provider);
  }, [filteredProviders, providerKeywords]);

  const selectedProviders = useMemo(() => {
    const selected = new Set(draft.selectedProviders);
    return providers.filter((provider) => selected.has(provider.id));
  }, [draft.selectedProviders, providers]);

  const selectedCategory = useMemo(() => getCategoryOption(draft.category), [draft.category]);
  const currentProductModules = useMemo(() => getProductModules(draft.category), [draft.category]);
  const stepTwoSummary = useMemo(() => getStepTwoSummary(draft), [draft]);
  const specificationLines = useMemo(() => getSpecificationLines(draft), [draft]);
  const deliveryMapQuery = useMemo(() => {
    if (draft.deliveryAddressMode === 'saved') {
      return [draft.deliveryAddressLine || 'Planta San Martin', 'Av. San Martin 1230', draft.deliveryCity || 'San Martin', 'Buenos Aires', draft.deliveryCountry || 'Argentina']
        .filter(Boolean)
        .join(', ');
    }

    return [draft.deliveryAddressLine, draft.deliveryCity, draft.deliveryCountry].filter(Boolean).join(', ') || 'Argentina';
  }, [draft.deliveryAddressLine, draft.deliveryAddressMode, draft.deliveryCity, draft.deliveryCountry]);
  const deliveryMapUrl = useMemo(
    () => `https://www.google.com/maps?q=${encodeURIComponent(deliveryMapQuery)}&z=15&output=embed`,
    [deliveryMapQuery],
  );
  const canContinue = step === 1 ? Boolean(draft.category.trim()) : true;
  const sidebarSteps = [
    {
      key: 1 as const,
      title: 'Producto',
      line1: draft.category || 'Seleccioná una categoría',
      line2: selectedCategory?.subtitle || 'Definí el producto a cotizar',
    },
    {
      key: 2 as const,
      title: 'Especificaciones',
      line1: stepTwoSummary.line1,
      line2: stepTwoSummary.line2,
    },
    {
      key: 3 as const,
      title: 'Entrega',
      line1:
        draft.deliveryAddressMode === 'saved'
          ? draft.deliveryAddressLine
          : [draft.deliveryCity, draft.deliveryCountry].filter(Boolean).join(', ') || 'Definí el lugar de entrega',
      line2:
        draft.deliveryDateMode === 'asap'
          ? 'Lo antes posible'
          : draft.deliveryDateMode === 'range'
            ? draft.deliveryDateRange || 'Elegí un rango estimado'
            : draft.deliveryDate
              ? `Entrega estimada ${draft.deliveryDate}`
              : 'Elegí una fecha estimada',
    },
    {
      key: 4 as const,
      title: 'Proveedores',
      line1:
        selectedProviders.length > 0
          ? `${selectedProviders.length} proveedor${selectedProviders.length === 1 ? '' : 'es'} seleccionado${selectedProviders.length === 1 ? '' : 's'}`
          : 'Seleccioná a quiénes querés invitar',
      line2: '',
    },
    {
      key: 5 as const,
      title: 'Resumen',
      line1: 'Revisá y enviá tu solicitud',
      line2: '',
    },
  ].map((item) => ({
    ...item,
    status: item.key < step ? 'done' : item.key === step ? 'current' : 'pending',
  }));

  function updateSpecValue(moduleId: string, value: string) {
    setDraft((current) => {
      const next: RequestDraft = {
        ...current,
        specSelections: {
          ...current.specSelections,
          [moduleId]: value,
        },
      };

      const syncedField = syncedDraftFields[moduleId];
      if (syncedField) {
        next[syncedField] = value as never;
      }

      return next;
    });
  }

  function updateUploadedFiles(moduleId: string, fileList: FileList | null) {
    const fileNames = fileList ? Array.from(fileList).map((file) => file.name) : [];

    setDraft((current) => ({
      ...current,
      uploadedFiles: {
        ...current.uploadedFiles,
        [moduleId]: fileNames,
      },
    }));
  }

  function toggleProvider(providerId: string) {
    setDraft((current) => {
      const has = current.selectedProviders.includes(providerId);
      const selectedProviders = has ? current.selectedProviders.filter((id) => id !== providerId) : [...current.selectedProviders, providerId];
      return { ...current, selectedProviders };
    });
  }

  function goNext() {
    setError(null);
    if (step === 1 && !draft.category.trim()) {
      setError('Seleccioná un tipo de producto para continuar.');
      return;
    }
    if (step === 2) {
      const missingModule = currentProductModules.find((module) => {
        if (!module.required) {
          return false;
        }
        return !getModuleValue(draft, module.id).trim();
      });

      if (missingModule) {
        setError(`Completá "${missingModule.label}" para continuar.`);
        return;
      }
    }
    if (step === 3) {
      const missingAddress =
        draft.deliveryAddressMode === 'new' && (!draft.deliveryCity.trim() || !draft.deliveryCountry.trim() || !draft.deliveryAddressLine.trim());
      const missingDate =
        (draft.deliveryDateMode === 'exact' && !draft.deliveryDate.trim()) ||
        (draft.deliveryDateMode === 'range' && !draft.deliveryDateRange.trim());

      if (missingAddress || missingDate) {
        setError('Completá los datos principales de entrega para continuar.');
        return;
      }
    }
    if (step === 4 && draft.selectedProviders.length === 0) {
      setError('Seleccioná al menos un proveedor para continuar.');
      return;
    }
    setStep((current) => (current < 5 ? ((current + 1) as StepKey) : current));
  }

  function goBack() {
    setError(null);
    setStep((current) => (current > 1 ? ((current - 1) as StepKey) : current));
  }

  async function handleSubmit() {
    if (!session) {
      setError('No se encontró la sesión. Volvé a iniciar sesión.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const specLines = getSpecificationLines(draft);
      const title = draft.title.trim() || `${draft.category} - ${specLines[0]?.replace(/^[^:]+:\s*/, '') || 'Solicitud de cotización'}`;
      const description = [
        ...specLines,
        draft.deliveryAddressMode === 'saved'
          ? `Entrega: ${draft.deliveryAddressLine}, ${draft.deliveryCountry}`
          : draft.deliveryCountry || draft.deliveryCity || draft.deliveryAddressLine
            ? `Entrega: ${[draft.deliveryAddressLine, draft.deliveryCity, draft.deliveryCountry].filter(Boolean).join(', ')}`
            : null,
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
      ]
        .filter(Boolean)
        .join('\n');

      const trimmedDeliveryDate = draft.deliveryDate.trim();
      const parsedDeliveryDate =
        draft.deliveryDateMode === 'exact' && trimmedDeliveryDate ? new Date(trimmedDeliveryDate) : null;
      const dueDate =
        parsedDeliveryDate && !Number.isNaN(parsedDeliveryDate.getTime())
          ? parsedDeliveryDate.toISOString()
          : undefined;

      const created = await atarApi.createRequest(
        {
          title,
          description,
          category: draft.category,
          status: 'PUBLISHED',
          dueDate,
          privateRequest: false,
        },
        session.accessToken,
      );

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
      <div className="flex h-[calc(100vh-88px)] flex-col overflow-hidden">
        <div className="flex flex-1 items-center justify-center rounded-[24px] border border-slate-200 bg-white px-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
          <div className="w-full max-w-[520px] text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Icon name="check" />
            </div>
            <h1 className="mt-6 text-[30px] font-semibold tracking-[-0.04em] text-slate-950">¡Solicitud enviada con éxito!</h1>
            <p className="mt-2 text-sm text-slate-500">
              Tu solicitud {createdId ? `#${createdId.slice(0, 8)}` : ''} fue enviada a proveedores verificados.
            </p>

            <div className="mx-auto mt-8 grid max-w-[420px] gap-3 sm:grid-cols-2">
              <Link
                className="inline-flex h-11 items-center justify-center rounded-[18px] border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
                href="/dashboard/comprador/solicitudes"
              >
                Ver mis solicitudes
              </Link>
              <button
                className="inline-flex h-11 items-center justify-center rounded-[18px] bg-[#4f46ff] text-sm font-semibold text-white shadow-[0_18px_36px_rgba(79,70,255,0.24)]"
                onClick={() => router.push('/dashboard/comprador')}
                type="button"
              >
                Ir al inicio
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-88px)] flex-col gap-4 overflow-hidden">
      <div className="flex h-14 shrink-0 items-center rounded-[22px] border border-slate-200 bg-white px-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)] xl:hidden">
        <div className="grid w-full grid-cols-5 gap-3">
          {steps.map((item, index) => {
            const isActive = item.key === step;
            const isDone = item.key < step;
            return (
              <div key={item.key} className="flex min-w-0 items-center gap-3">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition ${
                    isDone
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : isActive
                        ? 'border-[#4f46ff] bg-[#eef2ff] text-[#4f46ff]'
                        : 'border-slate-200 bg-white text-slate-400'
                  }`}
                >
                  {isDone ? <Icon name="check" /> : item.key}
                </div>
                <span className={`truncate text-[13px] font-medium ${isActive ? 'text-slate-950' : isDone ? 'text-slate-700' : 'text-slate-400'}`}>
                  {item.label}
                </span>
                {index < steps.length - 1 ? <span className="hidden h-px flex-1 rounded-full bg-slate-200 xl:block" /> : null}
              </div>
            );
          })}
        </div>
      </div>

      {error ? (
        <div className="shrink-0 rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-h-0 overflow-y-auto overscroll-contain px-1 py-2 pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {step === 1 ? (
            <div className="flex h-full flex-col">
              <div className="shrink-0 space-y-1">
                <h1 className="text-[30px] font-semibold leading-[1] tracking-[-0.05em] text-slate-950">Empecemos por el producto.</h1>
                <p className="text-[13px] leading-5 text-slate-500">
                  Seleccioná la categoría que mejor describa lo que necesitás.
                </p>
              </div>

              <div className="mt-5 grid flex-1 auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-4">
                {categoryOptions.map((option) => {
                  const active = draft.category === option.label;
                  return (
                    <button
                      key={option.label}
                      className={`group relative flex h-full min-h-[210px] flex-col overflow-hidden rounded-[20px] border text-left transition duration-300 ${
                        active
                          ? 'border-[#4f46ff] shadow-[0_22px_46px_rgba(79,70,255,0.18)] ring-1 ring-[#4f46ff]'
                          : 'border-slate-200 shadow-[0_10px_26px_rgba(15,23,42,0.05)] hover:-translate-y-1 hover:border-[#c9cdff] hover:shadow-[0_26px_48px_rgba(15,23,42,0.12)]'
                      }`}
                      onClick={() => setDraft((current) => ({ ...current, category: option.label }))}
                      type="button"
                    >
                      {active ? (
                        <span className="absolute right-3 top-3 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#4f46ff] text-white shadow-[0_10px_24px_rgba(79,70,255,0.30)]">
                          <Icon name="check" />
                        </span>
                      ) : null}

                      <div className="relative flex-1 overflow-hidden bg-[radial-gradient(circle_at_50%_16%,rgba(79,70,255,0.12),transparent_60%),linear-gradient(180deg,#ffffff_0%,#f2f3ff_100%)]">
                        <div
                          className={`absolute inset-0 transition duration-500 ease-out ${
                            active ? 'scale-[1.06]' : 'group-hover:scale-[1.05]'
                          } ${option.imageClassName ?? ''}`}
                        >
                          <Image
                            alt={option.label}
                            className="object-contain drop-shadow-[0_16px_26px_rgba(15,23,42,0.10)]"
                            fill
                            sizes="(min-width: 1280px) 300px, (min-width: 768px) 50vw, 100vw"
                            src={option.imageSrc}
                          />
                        </div>
                      </div>

                      <div
                        className={`flex items-center justify-between gap-3 border-t px-4 py-3.5 transition duration-300 ${
                          active ? 'border-[#e2e0ff] bg-[#f8f9ff]' : 'border-slate-100 bg-white'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[15px] font-semibold tracking-[-0.03em] text-slate-950">{option.label}</p>
                          <p className="mt-0.5 truncate text-[11px] leading-4 text-slate-500">{option.subtitle}</p>
                        </div>
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition duration-300 ${
                            active
                              ? 'bg-[#4f46ff] text-white'
                              : 'bg-[#eef2ff] text-[#4f46ff] group-hover:bg-[#4f46ff] group-hover:text-white group-hover:translate-x-0.5'
                          }`}
                        >
                          <Icon name="arrow" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="flex h-full flex-col">
              <div className="flex shrink-0 items-start justify-between gap-4">
                <div className="space-y-1">
                  <h1 className="text-[30px] font-semibold leading-[1] tracking-[-0.05em] text-slate-950">Configuremos el producto.</h1>
                  <p className="text-[13px] leading-5 text-slate-500">Cuantos más detalles agregues, mejores serán las cotizaciones.</p>
                </div>
                <div className="hidden pt-1 md:block">
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-500 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
                    <span className="text-[#4f46ff]">↓</span>
                    Deslizá para ver más opciones
                  </span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 pb-1 sm:grid-cols-2 2xl:grid-cols-3">
                {currentProductModules.map((module) => {
                  const value = getModuleValue(draft, module.id);
                  const files = getModuleFiles(draft, module.id);
                  const spanClass =
                    module.id === 'observaciones' && currentProductModules.some((item) => item.type === 'uploader')
                      ? '2xl:col-span-2'
                      : module.fullWidth
                        ? 'sm:col-span-2 2xl:col-span-3'
                        : '';

                  return (
                    <div
                      key={module.id}
                      className={`rounded-[20px] border border-slate-200 bg-white p-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-4 ${spanClass}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[13px] font-semibold tracking-[-0.02em] text-slate-950">{module.label}</p>
                          <p className="mt-0.5 text-[11px] leading-4 text-slate-500">
                            {module.helper ?? 'Seleccioná la opción que mejor describa tu necesidad.'}
                          </p>
                        </div>
                        {module.required ? (
                          <span className="inline-flex rounded-full bg-[#eef2ff] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#4f46ff]">
                            Clave
                          </span>
                        ) : null}
                      </div>

                      {module.type === 'choices' ? (
                        <div
                          className={`mt-4 grid gap-2 ${
                            module.options && module.options.length >= 4 ? 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2'
                          }`}
                        >
                          {module.options?.map((option) => {
                            const active = value === option;
                            return (
                              <button
                                key={option}
                                className={`flex min-h-[42px] items-center rounded-[12px] border px-2.5 py-2 text-left transition sm:min-h-[46px] sm:px-3 ${
                                  active
                                    ? 'border-[#4f46ff] bg-[#f7f7ff] shadow-[0_14px_28px_rgba(79,70,255,0.10)]'
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-[#d5d8ff] hover:bg-[#fbfbff]'
                                }`}
                                onClick={() => updateSpecValue(module.id, option)}
                                type="button"
                              >
                                <span className={`text-[10px] font-semibold leading-[1.2] sm:text-[11px] ${active ? 'text-slate-950' : 'text-slate-700'}`}>{option}</span>
                              </button>
                            );
                          })}
                        </div>
                      ) : null}

                      {module.type === 'segmented' ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {module.options?.map((option) => {
                            const active = value === option;
                            return (
                              <button
                                key={option}
                                className={`inline-flex min-w-[calc(50%-4px)] items-center justify-center rounded-[12px] border px-3 py-2 text-[11px] font-semibold transition sm:min-w-0 sm:px-3.5 sm:py-0 sm:h-9 ${
                                  active
                                    ? 'border-[#4f46ff] bg-[#f5f4ff] text-[#4f46ff]'
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                }`}
                                onClick={() => updateSpecValue(module.id, option)}
                                type="button"
                              >
                                {option}
                              </button>
                            );
                          })}
                        </div>
                      ) : null}

                      {module.type === 'input' ? (
                        <div className="mt-4">
                          <input
                            className="h-10 w-full rounded-[14px] border border-slate-200 bg-[#fbfcff] px-3.5 text-[13px] text-slate-950 outline-none transition sm:h-11 sm:px-4 focus:border-[#4f46ff] focus:bg-white focus:ring-4 focus:ring-[#4f46ff]/10"
                            placeholder={module.placeholder}
                            type={module.inputType ?? 'text'}
                            value={value}
                            onChange={(event) => updateSpecValue(module.id, event.target.value)}
                          />
                        </div>
                      ) : null}

                      {module.type === 'textarea' ? (
                        <div className="mt-4">
                          <textarea
                            className="h-[88px] w-full resize-none rounded-[16px] border border-slate-200 bg-[#fbfcff] px-3.5 py-3 text-[13px] text-slate-950 outline-none transition sm:h-[96px] sm:px-4 focus:border-[#4f46ff] focus:bg-white focus:ring-4 focus:ring-[#4f46ff]/10"
                            placeholder={module.placeholder}
                            value={value}
                            onChange={(event) => updateSpecValue(module.id, event.target.value)}
                          />
                        </div>
                      ) : null}

                      {module.type === 'quantity' ? (
                        <div className="mt-4">
                          <div className="flex h-11 items-center rounded-[16px] bg-[#f6f7fb] px-2 sm:h-12">
                            <button
                              className="flex h-8 w-8 items-center justify-center rounded-[10px] text-slate-500 transition hover:bg-white"
                              onClick={() => {
                                const parsed = Number.parseInt(value, 10);
                                if (!Number.isFinite(parsed)) {
                                  updateSpecValue(module.id, '0');
                                  return;
                                }
                                updateSpecValue(module.id, String(Math.max(parsed - 50, 0)));
                              }}
                              type="button"
                            >
                              −
                            </button>
                            <input
                              className="h-full min-w-0 flex-1 bg-transparent px-2 text-center text-[20px] font-semibold tracking-[-0.04em] text-[#2d3a67] outline-none sm:px-3 sm:text-[22px]"
                              placeholder="500"
                              value={value}
                              onChange={(event) => updateSpecValue(module.id, event.target.value)}
                            />
                            <button
                              className="flex h-8 w-8 items-center justify-center rounded-[10px] text-slate-500 transition hover:bg-white"
                              onClick={() => {
                                const parsed = Number.parseInt(value, 10);
                                if (!Number.isFinite(parsed)) {
                                  updateSpecValue(module.id, '50');
                                  return;
                                }
                                updateSpecValue(module.id, String(parsed + 50));
                              }}
                              type="button"
                            >
                              +
                            </button>
                            <span className="ml-1.5 text-[10px] font-semibold text-slate-500 sm:ml-2 sm:text-[11px]">unidades</span>
                          </div>

                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {quantityShortcuts.map((shortcut) => {
                              const active = value === shortcut;
                              return (
                                <button
                                  key={shortcut}
                                  className={`inline-flex h-7 items-center justify-center rounded-[9px] border px-2.5 text-[10px] font-semibold transition ${
                                    active
                                      ? 'border-[#8b84ff] bg-[#f5f4ff] text-[#4f46ff]'
                                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                                  }`}
                                  onClick={() => updateSpecValue(module.id, shortcut === 'Otro' ? '' : shortcut)}
                                  type="button"
                                >
                                  {shortcut}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}

                      {module.type === 'uploader' ? (
                        <div className="mt-4">
                          <label className="block cursor-pointer">
                            <input className="hidden" multiple type="file" onChange={(event) => updateUploadedFiles(module.id, event.target.files)} />
                            <div className="flex min-h-[118px] flex-col items-center justify-center rounded-[16px] border border-dashed border-slate-200 bg-[linear-gradient(180deg,#fcfcfe_0%,#f8faff_100%)] px-4 text-center transition sm:min-h-[128px] sm:px-5 hover:border-[#cfd3ff] hover:bg-white">
                              <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#f3f4ff] text-[#4f46ff]">↑</div>
                              <p className="mt-2.5 text-[13px] font-semibold text-slate-800">
                                {files.length > 0 ? `${files.length} archivo${files.length === 1 ? '' : 's'} seleccionado${files.length === 1 ? '' : 's'}` : 'Arrastrá o hacé clic para adjuntar'}
                              </p>
                              <p className="mt-1 text-[11px] text-slate-500">{module.helper ?? 'Subí documentación de referencia.'}</p>
                              {files.length > 0 ? (
                                <p className="mt-2.5 max-w-full truncate text-[10px] font-medium text-[#4f46ff]">{files.join(', ')}</p>
                              ) : (
                                <p className="mt-1.5 text-[10px] text-slate-400">PDF, AI, PNG, JPG o DWG</p>
                              )}
                            </div>
                          </label>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="flex h-full flex-col">
              <div className="shrink-0 space-y-1">
                <h1 className="text-[30px] font-semibold leading-[1] tracking-[-0.05em] text-slate-950">¿Dónde y cuándo necesitás recibir tu pedido?</h1>
                <p className="text-[13px] leading-5 text-slate-500">Completá la información de entrega para que los proveedores puedan calcular costos y tiempos.</p>
              </div>

              <div className="mt-5 space-y-4">
                <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
                  <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                    <p className="text-[12px] font-semibold tracking-[-0.01em] text-slate-700">Dirección de entrega</p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        className={`inline-flex h-10 items-center gap-2 rounded-[14px] border px-4 text-[12px] font-semibold transition ${
                          draft.deliveryAddressMode === 'saved'
                            ? 'border-[#4f46ff] bg-[#f5f4ff] text-[#4f46ff]'
                            : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                        }`}
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            deliveryAddressMode: 'saved',
                            deliveryAddressLine: current.deliveryAddressLine || 'Planta San Martin',
                            deliveryCity: current.deliveryCity || 'San Martin',
                          }))
                        }
                        type="button"
                      >
                        <span className={`h-2.5 w-2.5 rounded-full ${draft.deliveryAddressMode === 'saved' ? 'bg-[#4f46ff]' : 'bg-slate-200'}`} />
                        Dirección guardada
                      </button>
                      <button
                        className={`inline-flex h-10 items-center gap-2 rounded-[14px] border px-4 text-[12px] font-semibold transition ${
                          draft.deliveryAddressMode === 'new'
                            ? 'border-[#4f46ff] bg-[#f5f4ff] text-[#4f46ff]'
                            : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                        }`}
                        onClick={() => setDraft((current) => ({ ...current, deliveryAddressMode: 'new' }))}
                        type="button"
                      >
                        <span className={`h-2.5 w-2.5 rounded-full ${draft.deliveryAddressMode === 'new' ? 'bg-[#4f46ff]' : 'bg-slate-200'}`} />
                        Nueva dirección
                      </button>
                    </div>

                    {draft.deliveryAddressMode === 'saved' ? (
                      <div className="mt-4 rounded-[16px] border border-slate-200 bg-[#fbfcff] px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-slate-950">{draft.deliveryAddressLine}</p>
                            <p className="mt-1 truncate text-[11px] text-slate-500">Av. San Martin 1230, B1679, San Martin, Buenos Aires, Argentina</p>
                          </div>
                          <span className="text-slate-400">
                            <Icon name="arrow" />
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <input
                          className="h-11 rounded-[16px] border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-[#4f46ff] focus:ring-4 focus:ring-[#4f46ff]/10 sm:col-span-2"
                          placeholder="Dirección"
                          value={draft.deliveryAddressLine}
                          onChange={(event) => setDraft((current) => ({ ...current, deliveryAddressLine: event.target.value }))}
                        />
                        <input
                          className="h-11 rounded-[16px] border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-[#4f46ff] focus:ring-4 focus:ring-[#4f46ff]/10"
                          placeholder="Ciudad"
                          value={draft.deliveryCity}
                          onChange={(event) => setDraft((current) => ({ ...current, deliveryCity: event.target.value }))}
                        />
                        <select
                          className="h-11 rounded-[16px] border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-[#4f46ff] focus:ring-4 focus:ring-[#4f46ff]/10"
                          value={draft.deliveryCountry}
                          onChange={(event) => setDraft((current) => ({ ...current, deliveryCountry: event.target.value }))}
                        >
                          <option value="Argentina">Argentina</option>
                          <option value="Uruguay">Uruguay</option>
                          <option value="Chile">Chile</option>
                        </select>
                      </div>
                    )}

                    <div className="mt-4 overflow-hidden rounded-[18px] border border-slate-200 bg-[#f8fafc]">
                      <iframe
                        className="h-[190px] w-full"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        src={deliveryMapUrl}
                        title="Mapa de entrega"
                      />
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                    <p className="text-[12px] font-semibold tracking-[-0.01em] text-slate-700">Fecha estimada de entrega</p>

                    <div className="mt-4 space-y-2.5">
                      {[
                        {
                          key: 'asap' as const,
                          title: 'Lo antes posible',
                          subtitle: 'Quiero recibirlo cuanto antes',
                        },
                        {
                          key: 'exact' as const,
                          title: 'Fecha específica',
                          subtitle: 'Seleccioná una fecha puntual',
                        },
                        {
                          key: 'range' as const,
                          title: 'Rango de fechas',
                          subtitle: 'Seleccioná un rango estimado',
                        },
                      ].map((option) => {
                        const active = draft.deliveryDateMode === option.key;
                        return (
                          <button
                            key={option.key}
                            className={`flex w-full items-start gap-3 rounded-[16px] border px-4 py-3 text-left transition ${
                              active
                                ? 'border-[#4f46ff] bg-[#f7f7ff] shadow-[0_12px_28px_rgba(79,70,255,0.08)]'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                            onClick={() => setDraft((current) => ({ ...current, deliveryDateMode: option.key }))}
                            type="button"
                          >
                            <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] ${active ? 'bg-[#eef2ff] text-[#4f46ff]' : 'bg-slate-100 text-slate-400'}`}>
                              <Icon name="calendar" />
                            </span>
                            <span className="min-w-0">
                              <span className={`block text-[13px] font-semibold ${active ? 'text-slate-950' : 'text-slate-700'}`}>{option.title}</span>
                              <span className="mt-0.5 block text-[11px] text-slate-500">{option.subtitle}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {draft.deliveryDateMode === 'exact' ? (
                      <div className="mt-3">
                        <input
                          className="h-11 w-full rounded-[16px] border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-[#4f46ff] focus:ring-4 focus:ring-[#4f46ff]/10"
                          type="date"
                          value={draft.deliveryDate}
                          onChange={(event) => setDraft((current) => ({ ...current, deliveryDate: event.target.value }))}
                        />
                      </div>
                    ) : null}

                    {draft.deliveryDateMode === 'range' ? (
                      <div className="mt-3">
                        <input
                          className="h-11 w-full rounded-[16px] border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-[#4f46ff] focus:ring-4 focus:ring-[#4f46ff]/10"
                          placeholder="Ej: 24 al 30 de junio"
                          value={draft.deliveryDateRange}
                          onChange={(event) => setDraft((current) => ({ ...current, deliveryDateRange: event.target.value }))}
                        />
                      </div>
                    ) : null}

                    <div className="mt-3 flex items-start gap-3 rounded-[16px] bg-[#f6f4ff] px-4 py-3">
                      <span className="mt-0.5 text-[#4f46ff]">
                        <Icon name="truck" />
                      </span>
                      <div>
                        <p className="text-[12px] font-semibold text-slate-800">Los proveedores verán esta información</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">para calcular costos y tiempos de entrega.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                  <p className="text-[12px] font-semibold tracking-[-0.01em] text-slate-700">Información adicional de entrega <span className="font-medium text-slate-400">(opcional)</span></p>

                  <div className="mt-4 grid gap-3 xl:grid-cols-4">
                    <div>
                      <p className="mb-2 text-[11px] font-semibold text-slate-500">Horario de recepción</p>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                          <Icon name="clock" />
                        </span>
                        <input
                          className="h-11 w-full rounded-[16px] border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-950 outline-none transition focus:border-[#4f46ff] focus:ring-4 focus:ring-[#4f46ff]/10"
                          value={draft.deliverySchedule}
                          onChange={(event) => setDraft((current) => ({ ...current, deliverySchedule: event.target.value }))}
                        />
                      </div>
                    </div>

                    <div>
                      <p className="mb-2 text-[11px] font-semibold text-slate-500">Contacto en planta</p>
                      <input
                        className="h-11 w-full rounded-[16px] border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-[#4f46ff] focus:ring-4 focus:ring-[#4f46ff]/10"
                        value={draft.deliveryContactName}
                        onChange={(event) => setDraft((current) => ({ ...current, deliveryContactName: event.target.value }))}
                      />
                    </div>

                    <div>
                      <p className="mb-2 text-[11px] font-semibold text-slate-500">Teléfono de contacto</p>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                          <Icon name="phone" />
                        </span>
                        <input
                          className="h-11 w-full rounded-[16px] border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-950 outline-none transition focus:border-[#4f46ff] focus:ring-4 focus:ring-[#4f46ff]/10"
                          value={draft.deliveryPhone}
                          onChange={(event) => setDraft((current) => ({ ...current, deliveryPhone: event.target.value }))}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-[11px] font-semibold text-slate-500">Observaciones</p>
                        <span className="text-[10px] text-slate-400">{draft.deliveryNotes.length}/120</span>
                      </div>
                      <input
                        className="h-11 w-full rounded-[16px] border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-[#4f46ff] focus:ring-4 focus:ring-[#4f46ff]/10"
                        maxLength={120}
                        placeholder="Ej: Portón 3, llamar al llegar..."
                        value={draft.deliveryNotes}
                        onChange={(event) => setDraft((current) => ({ ...current, deliveryNotes: event.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="flex h-full flex-col">
              <div className="shrink-0 space-y-1">
                <h1 className="text-[30px] font-semibold leading-[1] tracking-[-0.05em] text-slate-950">¿A quién querés invitar a cotizar?</h1>
                <p className="text-[13px] leading-5 text-slate-500">Seleccioná los proveedores que querés invitar a participar.</p>
              </div>

              <div className="mt-5 flex flex-1 flex-col">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative min-w-[280px] flex-1">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                        <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                      </svg>
                    </span>
                    <input
                      className="h-11 w-full rounded-[14px] border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-950 outline-none transition focus:border-[#4f46ff] focus:ring-4 focus:ring-[#4f46ff]/10"
                      placeholder="Buscar proveedores por nombre, ciudad o especialidad..."
                      value={providerSearch}
                      onChange={(event) => setProviderSearch(event.target.value)}
                    />
                  </div>
                  <button
                    className="inline-flex h-11 items-center gap-2 rounded-[14px] border border-slate-200 bg-white px-4 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50"
                    onClick={() => setProviderSearch('')}
                    type="button"
                  >
                    <svg aria-hidden="true" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24">
                      <path d="M4 7h16M7 12h10M10 17h4" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                    </svg>
                    Filtros
                  </button>
                </div>

                <div className="mt-5 rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                  <p className="text-[13px] font-semibold text-slate-950">Proveedores sugeridos para tu solicitud</p>
                  <p className="mt-1 text-[11px] text-slate-500">Recomendados según el producto y las especificaciones cargadas.</p>

                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {suggestedProviders.map((provider) => {
                      const selected = draft.selectedProviders.includes(provider.id);
                      return (
                        <button
                          key={provider.id}
                          className={`relative rounded-[18px] border p-4 text-left transition ${
                            selected
                              ? 'border-[#4f46ff] bg-[#f8f9ff] shadow-[0_16px_40px_rgba(79,70,255,0.10)]'
                              : 'border-slate-200 bg-white hover:border-[#cfd3ff] hover:shadow-[0_14px_32px_rgba(15,23,42,0.06)]'
                          }`}
                          onClick={() => toggleProvider(provider.id)}
                          type="button"
                        >
                          <span className={`absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-[6px] border text-[11px] ${selected ? 'border-[#4f46ff] bg-[#4f46ff] text-white' : 'border-slate-200 bg-white text-transparent'}`}>
                            ✓
                          </span>
                          <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#eef2ff] text-sm font-bold text-[#4f46ff]">
                            {provider.name.slice(0, 1)}
                          </span>
                          <p className="mt-4 truncate text-[14px] font-semibold text-slate-950">{provider.name}</p>
                          <p className="mt-1 truncate text-[11px] text-slate-500">{provider.city}</p>
                          <div className="mt-3 flex items-center gap-1 text-[11px] text-slate-500">
                            <span className="text-amber-500">★</span>
                            <span>{provider.rating} ({120 - provider.name.length})</span>
                          </div>
                          <div className="mt-3">
                            <span className="inline-flex rounded-full bg-[#eef2ff] px-2.5 py-1 text-[10px] font-semibold text-[#4f46ff]">
                              {provider.tags[0] || provider.category}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 rounded-[22px] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                  <div className="border-b border-slate-100 px-5 py-4">
                    <p className="text-[13px] font-semibold text-slate-950">Todos los proveedores</p>
                  </div>

                  <div className="overflow-hidden">
                    <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_100px_48px] gap-3 border-b border-slate-100 px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      <span>Proveedor</span>
                      <span>Ubicación</span>
                      <span>Calificación</span>
                      <span />
                    </div>

                    <div className="divide-y divide-slate-100">
                      {filteredProviders.map((provider) => {
                        const selected = draft.selectedProviders.includes(provider.id);
                        return (
                          <div key={provider.id} className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_100px_48px] items-center gap-3 px-5 py-3">
                            <button className="flex min-w-0 items-center gap-3 text-left" onClick={() => toggleProvider(provider.id)} type="button">
                              <span className={`flex h-4 w-4 items-center justify-center rounded-[5px] border text-[10px] ${selected ? 'border-[#4f46ff] bg-[#4f46ff] text-white' : 'border-slate-300 bg-white text-transparent'}`}>
                                ✓
                              </span>
                              <span className="truncate text-[13px] font-semibold text-slate-950">{provider.name}</span>
                            </button>
                            <span className="truncate text-[12px] text-slate-500">{provider.city}</span>
                            <span className="flex items-center gap-1 text-[12px] text-slate-600">
                              <span className="text-amber-500">★</span>
                              {provider.rating}
                            </span>
                            <button className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] text-slate-400 transition hover:bg-slate-50 hover:text-slate-600" type="button">
                              <svg aria-hidden="true" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                <circle cx="12" cy="5" r="1.8" />
                                <circle cx="12" cy="12" r="1.8" />
                                <circle cx="12" cy="19" r="1.8" />
                              </svg>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
                    <p className="text-[11px] text-slate-500">Mostrando {filteredProviders.length} de {providers.length} proveedores</p>
                    <div className="flex items-center gap-1.5">
                      {['2', '3', '...', '5'].map((item) => (
                        <span
                          key={item}
                          className={`inline-flex h-7 min-w-7 items-center justify-center rounded-[8px] px-2 text-[11px] font-semibold ${
                            item === '3' ? 'bg-[#eef2ff] text-[#4f46ff]' : 'bg-white text-slate-400'
                          }`}
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {step === 5 ? (
            <div className="flex h-full flex-col">
              <div className="shrink-0 space-y-1">
                <h1 className="text-[30px] font-semibold leading-[1] tracking-[-0.05em] text-slate-950">Revisá antes de enviar.</h1>
                <p className="text-[13px] leading-5 text-slate-500">Confirmá que todo esté correcto y enviá la solicitud a los proveedores seleccionados.</p>
              </div>

              <div className="mt-5 grid flex-1 gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Resumen de tu solicitud</p>

                  <div className="mt-5 flex items-center gap-4 rounded-[18px] bg-[#fbfcff] p-4">
                    <div className="relative h-[88px] w-[148px] overflow-hidden rounded-[14px] bg-[#f5f7ff]">
                      {selectedCategory?.imageSrc ? (
                        <Image alt="" className="object-contain p-3" fill sizes="180px" src={selectedCategory.imageSrc} />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold text-slate-950">{draft.category || '-'}</p>
                      <span className="mt-2 inline-flex rounded-full bg-[#eef2ff] px-2.5 py-1 text-[10px] font-semibold text-[#4f46ff]">
                        Producto seleccionado
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 divide-y divide-slate-100 rounded-[18px] border border-slate-100 bg-white">
                    {[
                      {
                        key: 'producto',
                        label: 'Producto',
                        value: draft.category || '-',
                        stepKey: 1 as StepKey,
                        icon: (
                          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
                          </svg>
                        ),
                      },
                      {
                        key: 'esp1',
                        label: 'Especificación 1',
                        value: specificationLines[0]?.replace(/^[^:]+:\s*/, '') || '-',
                        stepKey: 2 as StepKey,
                        icon: (
                          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <path d="M12 4l7 4-7 4-7-4 7-4zM5 12l7 4 7-4M5 16l7 4 7-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                          </svg>
                        ),
                      },
                      {
                        key: 'esp2',
                        label: 'Especificación 2',
                        value: specificationLines[1]?.replace(/^[^:]+:\s*/, '') || '-',
                        stepKey: 2 as StepKey,
                        icon: (
                          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <path d="M7 21h10M12 17V3M8 7h8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                          </svg>
                        ),
                      },
                      {
                        key: 'entrega',
                        label: 'Entrega',
                        value:
                          draft.deliveryAddressMode === 'saved'
                            ? `${draft.deliveryAddressLine}, ${draft.deliveryCountry}`
                            : [draft.deliveryCity, draft.deliveryCountry].filter(Boolean).join(', ') || '-',
                        stepKey: 3 as StepKey,
                        icon: <Icon name="pin" />,
                      },
                      {
                        key: 'fecha',
                        label: 'Fecha estimada',
                        value:
                          draft.deliveryDateMode === 'asap'
                            ? 'Lo antes posible'
                            : draft.deliveryDateMode === 'range'
                              ? draft.deliveryDateRange || '-'
                              : draft.deliveryDate || '-',
                        stepKey: 3 as StepKey,
                        icon: <Icon name="calendar" />,
                      },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between gap-4 px-4 py-3.5">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[#f3f5ff] text-[#4f46ff]">
                            {item.icon}
                          </span>
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">{item.label}</p>
                            <p className="mt-1 truncate text-[13px] font-semibold text-slate-950">{item.value}</p>
                          </div>
                        </div>
                        <button
                          className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#4f46ff] hover:text-[#4338ca]"
                          onClick={() => setStep(item.stepKey)}
                          type="button"
                        >
                          Editar
                          <Icon name="arrow" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[18px] bg-[#fbfcff] p-4">
                      <div className="flex items-start gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#eef2ff] text-[#4f46ff]">
                          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <path d="M12 22s8-4 8-10V6l-8-3-8 3v6c0 6 8 10 8 10z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                            <path d="M9 12l2 2 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                          </svg>
                        </span>
                        <div>
                          <p className="text-[12px] font-semibold text-slate-900">Tu información está protegida</p>
                          <p className="mt-1 text-[11px] leading-5 text-slate-500">Solo los proveedores que seleccionaste podrán ver los detalles de tu solicitud.</p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-[18px] bg-[#fbfcff] p-4">
                      <div className="flex items-start gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#eef2ff] text-[#4f46ff]">
                          <Icon name="clock" />
                        </span>
                        <div>
                          <p className="text-[12px] font-semibold text-slate-900">Tiempo estimado de respuesta</p>
                          <p className="mt-1 text-[24px] font-semibold tracking-[-0.04em] text-[#4f46ff]">3 minutos</p>
                          <p className="text-[11px] leading-5 text-slate-500">Te notificaremos por email.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Proveedores seleccionados</p>
                    <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-[#f3f5ff] px-2 text-[11px] font-semibold text-slate-500">
                      {selectedProviders.length}
                    </span>
                  </div>

                  <div className="mt-5 space-y-3">
                    {selectedProviders.length === 0 ? (
                      <div className="rounded-[18px] border border-dashed border-slate-200 bg-[#fbfcff] px-4 py-5 text-sm text-slate-500">
                        No seleccionaste proveedores.
                      </div>
                    ) : (
                      selectedProviders.map((provider) => (
                        <div key={provider.id} className="rounded-[18px] border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-start gap-3">
                              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[#eef2ff] text-lg font-bold text-[#4f46ff]">
                                {provider.name.slice(0, 1)}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate text-[14px] font-semibold text-slate-950">{provider.name}</p>
                                <p className="mt-1 truncate text-[12px] text-slate-500">{provider.city}</p>
                                <span className="mt-2 inline-flex rounded-full bg-[#eef2ff] px-2.5 py-1 text-[10px] font-semibold text-[#4f46ff]">
                                  {provider.tags[0] || `Especialista en ${draft.category}`}
                                </span>
                              </div>
                            </div>
                            <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-emerald-600">
                              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100">
                                <svg aria-hidden="true" className="h-3 w-3" fill="none" viewBox="0 0 24 24">
                                  <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                                </svg>
                              </span>
                              Verificado
                            </span>
                          </div>
                        </div>
                      ))
                    )}

                    <button
                      className="flex w-full items-center gap-4 rounded-[18px] border border-dashed border-[#cfd3ff] bg-[#fbfcff] px-4 py-5 text-left transition hover:bg-white"
                      onClick={() => setStep(4)}
                      type="button"
                    >
                      <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#eef2ff] text-[22px] leading-none text-[#4f46ff]">+</span>
                      <span>
                        <span className="block text-[13px] font-semibold text-[#4f46ff]">Agregar más proveedores</span>
                        <span className="mt-1 block text-[11px] leading-5 text-slate-500">Podés sumar más proveedores antes de enviar tu solicitud.</span>
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </section>

        <aside className="hidden h-full min-h-0 self-stretch border-l border-slate-200 pl-5 lg:sticky lg:top-0 lg:block xl:pl-8">
          <div className="flex h-full min-h-full flex-col justify-between">
            <div>
              <p className="text-[16px] font-semibold tracking-[-0.03em] text-slate-950">Tu solicitud</p>
              <p className="mt-0.5 text-[11px] leading-4 text-slate-400">Revisá la información antes de continuar.</p>
              <div className="mt-3.5 space-y-1">
                {sidebarSteps.map((item) => (
                  <div
                    key={item.key}
                    className={`rounded-[16px] px-3 py-3 transition ${
                      item.status === 'current' ? 'bg-[#f4f3ff]' : 'bg-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold ${
                          item.status === 'done'
                            ? 'bg-emerald-500 text-white'
                            : item.status === 'current'
                              ? 'bg-[#4f46ff] text-white'
                              : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {item.status === 'done' ? '✓' : item.key}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-[13px] font-semibold ${item.status === 'pending' ? 'text-slate-500' : 'text-slate-950'}`}>{item.title}</p>
                          {item.status === 'done' ? (
                            <button
                              className="text-[10px] font-semibold text-[#4f46ff] hover:text-[#4338ca]"
                              onClick={() => setStep(item.key)}
                              type="button"
                            >
                              Editar
                            </button>
                          ) : null}
                        </div>
                        <p className={`mt-0.5 truncate text-[10px] ${item.status === 'pending' ? 'text-slate-400' : 'text-slate-600'}`}>{item.line1}</p>
                        {item.line2 ? (
                          <p className={`truncate text-[10px] ${item.status === 'pending' ? 'text-slate-400' : 'text-slate-400'}`}>{item.line2}</p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2.5 border-t border-slate-100 pt-3">
              <button
                className="inline-flex h-9 items-center justify-center rounded-[14px] border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50"
                onClick={() => {
                  if (step === 1) {
                    router.push('/dashboard/comprador');
                    return;
                  }
                  goBack();
                }}
                type="button"
              >
                ← Volver
              </button>

              {step < 5 ? (
                <button
                  className="inline-flex h-9 items-center justify-center rounded-[14px] bg-[#4f46ff] px-4 text-[13px] font-semibold text-white shadow-[0_18px_36px_rgba(79,70,255,0.24)] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                  disabled={submitting || !canContinue}
                  onClick={goNext}
                  type="button"
                >
                  Continuar →
                </button>
              ) : (
                <button
                  className="inline-flex h-9 items-center justify-center rounded-[14px] bg-[#4f46ff] px-4 text-[13px] font-semibold text-white shadow-[0_18px_36px_rgba(79,70,255,0.24)] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                  disabled={submitting}
                  onClick={handleSubmit}
                  type="button"
                >
                  {submitting ? 'Enviando...' : 'Enviar solicitud →'}
                </button>
              )}
            </div>
          </div>
        </aside>
      </div>

      <div className="flex h-16 shrink-0 items-center justify-between rounded-[22px] border border-slate-200 bg-white px-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] lg:hidden">
        <button
          className="inline-flex h-10 items-center justify-center rounded-[16px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          onClick={() => {
            if (step === 1) {
              router.push('/dashboard/comprador');
              return;
            }
            goBack();
          }}
          type="button"
        >
          ← Volver
        </button>

        {step < 5 ? (
          <button
            className="inline-flex h-10 items-center justify-center rounded-[16px] bg-[#4f46ff] px-5 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(79,70,255,0.24)] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
            disabled={submitting || !canContinue}
            onClick={goNext}
            type="button"
          >
            Continuar →
          </button>
        ) : (
          <button
            className="inline-flex h-10 items-center justify-center rounded-[16px] bg-[#4f46ff] px-5 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(79,70,255,0.24)] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
            disabled={submitting}
            onClick={handleSubmit}
            type="button"
          >
            {submitting ? 'Enviando...' : 'Enviar solicitud →'}
          </button>
        )}
      </div>
    </div>
  );
}
