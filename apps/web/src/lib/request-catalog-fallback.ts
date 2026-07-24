import type {
  RequestCatalogCategoryRecord,
  RequestCatalogFieldRecord,
  RequestCatalogFieldType,
} from './atar-api';

// Catálogo de respaldo del wizard de solicitudes. Espeja el seed del backend
// (apps/api/prisma/seed.js) para que el paso 1 y el paso 2 funcionen aunque
// el endpoint /catalog/request-categories devuelva vacío o falle.

type FieldInput = {
  key: string;
  label: string;
  type: RequestCatalogFieldType;
  options?: string[];
  placeholder?: string;
  helper?: string;
  required?: boolean;
  fullWidth?: boolean;
  inputType?: 'text' | 'date';
};

type CategoryInput = {
  label: string;
  subtitle: string;
  imageSrc: string;
  imageClassName: string;
  searchKeywords: string[];
  fields: FieldInput[];
};

function toField(categoryId: string, input: FieldInput): RequestCatalogFieldRecord {
  return {
    id: `${categoryId}-${input.key}`,
    label: input.label,
    type: input.type,
    options: input.options ?? [],
    placeholder: input.placeholder ?? null,
    helper: input.helper ?? null,
    required: input.required ?? false,
    fullWidth: input.fullWidth ?? false,
    inputType: input.inputType ?? null,
  };
}

function toCategory(input: CategoryInput): RequestCatalogCategoryRecord {
  const id = input.label
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return {
    id,
    label: input.label,
    subtitle: input.subtitle,
    imageSrc: input.imageSrc,
    imageClassName: input.imageClassName,
    searchKeywords: input.searchKeywords,
    fields: input.fields.map((field) => toField(id, field)),
  };
}

const CATALOG: CategoryInput[] = [
  {
    label: 'Big Bags',
    subtitle: 'FIBC 500 - 2000 kg',
    imageSrc: '/bigbags.png',
    imageClassName: 'scale-[1.1]',
    searchKeywords: ['big bag', 'bolsas', 'fibc', 'polipropileno'],
    fields: [
      { key: 'material', label: 'Material', type: 'choices', options: ['Polipropileno virgen', 'Reciclado', 'Laminado', 'Antiestatico'], required: true },
      { key: 'capacidad', label: 'Capacidad', type: 'segmented', options: ['500 kg', '750 kg', '1000 kg', '1250 kg', '1500 kg', '2000 kg'], required: true },
      { key: 'tipo-asa', label: 'Tipo de asa', type: 'choices', options: ['Loop', 'Cruzada', 'Tubular', '4 asas'], required: true },
      { key: 'tipo-boca', label: 'Tipo de boca', type: 'segmented', options: ['Abierta', 'Faldon', 'Carga rapida', 'Valvula'] },
      { key: 'tipo-fondo', label: 'Tipo de fondo', type: 'segmented', options: ['Plano', 'Descarga parcial', 'Descarga total'] },
      { key: 'liner', label: 'Liner', type: 'segmented', options: ['Sin liner', 'Suelto', 'Pegado'] },
      { key: 'impresion', label: 'Impresion', type: 'choices', options: ['Sin impresion', '1 color', '2 colores', 'Cobertura total'] },
      { key: 'cantidad', label: 'Cantidad', type: 'quantity', required: true },
      { key: 'adjuntos', label: 'Adjuntar archivos', type: 'uploader', helper: 'PDF, AI, PNG, STEP o DWG' },
      { key: 'observaciones', label: 'Observaciones', type: 'textarea', placeholder: 'Indicá medidas, certificaciones, uso o cualquier detalle clave.', fullWidth: true },
    ],
  },
  {
    label: 'Bolsas PP',
    subtitle: 'Tejidas y laminadas',
    imageSrc: '/bolsaspp.png',
    imageClassName: 'scale-[1.05]',
    searchKeywords: ['bolsas', 'packaging', 'polipropileno'],
    fields: [
      { key: 'material', label: 'Material', type: 'choices', options: ['Virgen', 'Reciclado', 'Laminado', 'Mixto'], required: true },
      { key: 'gramaje', label: 'Gramaje', type: 'segmented', options: ['40 g', '55 g', '70 g', '90 g', '120 g'], required: true },
      { key: 'medidas', label: 'Medidas', type: 'input', placeholder: 'Ej: 50 x 80 cm', required: true },
      { key: 'fuelle', label: 'Fuelle', type: 'segmented', options: ['Sin fuelle', 'Lateral', 'Base'] },
      { key: 'laminado', label: 'Laminado', type: 'segmented', options: ['No', '1 cara', '2 caras'] },
      { key: 'microperforado', label: 'Microperforado', type: 'segmented', options: ['No', 'Si'] },
      { key: 'tipo-cierre', label: 'Tipo de cierre', type: 'choices', options: ['Abierto', 'Costura', 'Valvula', 'Troquel'] },
      { key: 'impresion', label: 'Impresion', type: 'choices', options: ['Sin impresion', '1 color', '2 colores', 'Full print'] },
      { key: 'cantidad', label: 'Cantidad', type: 'quantity', required: true },
      { key: 'adjuntos', label: 'Adjuntar diseño', type: 'uploader', helper: 'Subí artes, croquis o referencias.' },
      { key: 'observaciones', label: 'Observaciones', type: 'textarea', placeholder: 'Agregá detalles sobre sellado, uso o terminaciones.', fullWidth: true },
    ],
  },
  {
    label: 'Polipropileno',
    subtitle: 'Tejidos, rafia y laminados',
    imageSrc: '/polimerosweb.png',
    imageClassName: 'scale-[1.05]',
    searchKeywords: ['polipropileno', 'plasticos', 'rafia', 'polimeros'],
    fields: [
      { key: 'tipo', label: 'Tipo', type: 'choices', options: ['Homopolimero', 'Copolimero', 'Rafia', 'Fibra'], required: true },
      { key: 'presentacion', label: 'Presentacion', type: 'segmented', options: ['Pellets', 'Rollo', 'Tejido', 'Bobina'], required: true },
      { key: 'color', label: 'Color', type: 'segmented', options: ['Natural', 'Blanco', 'Negro', 'Personalizado'] },
      { key: 'indice-fluidez', label: 'Indice de fluidez', type: 'input', placeholder: 'Ej: 3.5 g/10 min' },
      { key: 'cantidad', label: 'Cantidad', type: 'quantity', required: true },
      { key: 'frecuencia', label: 'Frecuencia de compra', type: 'segmented', options: ['Unica', 'Mensual', 'Trimestral', 'Programada'] },
      { key: 'adjuntos', label: 'Adjuntar especificaciones', type: 'uploader', helper: 'Subí ficha técnica o requerimientos.' },
      { key: 'observaciones', label: 'Observaciones', type: 'textarea', placeholder: 'Especificá aplicaciones, normas o propiedades buscadas.', fullWidth: true },
    ],
  },
  {
    label: 'Polietileno',
    subtitle: 'Films, mangas y bobinas',
    imageSrc: '/polimerosweb.png',
    imageClassName: 'scale-[1.05]',
    searchKeywords: ['plasticos', 'filmes', 'envases', 'polimeros'],
    fields: [
      { key: 'tipo', label: 'Tipo', type: 'choices', options: ['PEAD', 'PEBD', 'PEBDL', 'Reciclado'], required: true },
      { key: 'presentacion', label: 'Presentacion', type: 'segmented', options: ['Film', 'Manga', 'Bobina', 'Lamina'], required: true },
      { key: 'espesor', label: 'Espesor', type: 'input', placeholder: 'Ej: 80 micrones' },
      { key: 'ancho', label: 'Ancho', type: 'input', placeholder: 'Ej: 1200 mm' },
      { key: 'color', label: 'Color', type: 'segmented', options: ['Natural', 'Blanco', 'Negro', 'Color custom'] },
      { key: 'uso', label: 'Uso', type: 'choices', options: ['Packaging', 'Industrial', 'Agro', 'Construccion'] },
      { key: 'cantidad', label: 'Cantidad', type: 'quantity', required: true },
      { key: 'adjuntos', label: 'Adjuntar ficha tecnica', type: 'uploader', helper: 'Incluí tolerancias o fichas de calidad.' },
      { key: 'observaciones', label: 'Observaciones', type: 'textarea', placeholder: 'Agregá requerimientos de aplicación, espesor o acabado.', fullWidth: true },
    ],
  },
  {
    label: 'Rollos y Telas',
    subtitle: 'Polipropileno y otros',
    imageSrc: '/telasweb.png',
    imageClassName: 'scale-[1.05]',
    searchKeywords: ['filmes', 'packaging', 'plasticos', 'telas', 'mallas'],
    fields: [
      { key: 'material', label: 'Material', type: 'choices', options: ['PP', 'PE', 'Mixto', 'Reciclado'], required: true },
      { key: 'ancho', label: 'Ancho', type: 'input', placeholder: 'Ej: 160 cm', required: true },
      { key: 'largo', label: 'Largo', type: 'input', placeholder: 'Ej: 500 m' },
      { key: 'espesor', label: 'Espesor', type: 'input', placeholder: 'Ej: 120 micrones' },
      { key: 'color', label: 'Color', type: 'segmented', options: ['Natural', 'Blanco', 'Negro', 'Custom'] },
      { key: 'tratamiento-uv', label: 'Tratamiento UV', type: 'segmented', options: ['No', 'UV 6 meses', 'UV 12 meses', 'Reforzado'] },
      { key: 'laminado', label: 'Laminado', type: 'segmented', options: ['No', 'Simple', 'Doble'] },
      { key: 'impresion', label: 'Impresion', type: 'choices', options: ['Sin impresion', '1 color', '2 colores', 'Alta cobertura'] },
      { key: 'cantidad', label: 'Cantidad', type: 'quantity', required: true },
      { key: 'adjuntos', label: 'Adjuntar plano', type: 'uploader', helper: 'Subí referencia visual, plano o muestra.' },
      { key: 'observaciones', label: 'Observaciones', type: 'textarea', placeholder: 'Indicá aplicación, tensión, tratamiento o acabado.', fullWidth: true },
    ],
  },
  {
    label: 'Sacos',
    subtitle: 'De papel, rafia y mas',
    imageSrc: '/sacos.png',
    imageClassName: 'scale-[1.05]',
    searchKeywords: ['bolsas', 'packaging', 'industriales', 'sacos'],
    fields: [
      { key: 'material', label: 'Material', type: 'choices', options: ['Papel', 'Rafia', 'Mixto', 'Laminado'], required: true },
      { key: 'capacidad', label: 'Capacidad', type: 'segmented', options: ['10 kg', '25 kg', '40 kg', '50 kg', 'Custom'], required: true },
      { key: 'medidas', label: 'Medidas', type: 'input', placeholder: 'Ej: 45 x 75 cm' },
      { key: 'costura', label: 'Costura', type: 'segmented', options: ['Simple', 'Doble', 'Termosellada'] },
      { key: 'valvula', label: 'Valvula', type: 'segmented', options: ['Sin valvula', 'Interna', 'Externa'] },
      { key: 'impresion', label: 'Impresion', type: 'choices', options: ['Sin impresion', '1 color', '2 colores', '3 colores'] },
      { key: 'paletizado', label: 'Paletizado', type: 'segmented', options: ['Sin paletizar', 'Estandar', 'Reforzado'] },
      { key: 'cantidad', label: 'Cantidad', type: 'quantity', required: true },
      { key: 'observaciones', label: 'Observaciones', type: 'textarea', placeholder: 'Agregá detalles sobre carga, almacenamiento o despacho.', fullWidth: true },
    ],
  },
  {
    label: 'Tintas',
    subtitle: 'Flexografia e impresion industrial',
    imageSrc: '/tintasweb.png',
    imageClassName: 'scale-[1.05]',
    searchKeywords: ['impresiones', 'packaging', 'conversion', 'tintas', 'aditivos'],
    fields: [
      { key: 'tipo-tinta', label: 'Tipo de tinta', type: 'choices', options: ['Flexografica', 'Huecograbado', 'Base agua', 'Base solvente'], required: true },
      { key: 'base', label: 'Base', type: 'segmented', options: ['Agua', 'Solvente', 'UV', 'Especial'], required: true },
      { key: 'cantidad-colores', label: 'Cantidad de colores', type: 'segmented', options: ['1', '2', '3', '4+'] },
      { key: 'pantone', label: 'Pantone', type: 'input', placeholder: 'Ej: Pantone 286 C' },
      { key: 'sustrato', label: 'Sustrato', type: 'choices', options: ['PP', 'PE', 'Papel', 'Mixto'] },
      { key: 'cantidad', label: 'Cantidad', type: 'quantity', required: true },
      { key: 'adjuntos', label: 'Adjuntar diseño', type: 'uploader', helper: 'Subí artes, layout o especificaciones.' },
      { key: 'observaciones', label: 'Observaciones', type: 'textarea', placeholder: 'Aclará viscosidad, anilox, secado o requerimientos especiales.', fullWidth: true },
    ],
  },
  {
    label: 'Cuerdas/Cordones',
    subtitle: 'Polipropileno y multifilamento',
    imageSrc: '/cuerdas.png',
    imageClassName: 'scale-[1.05]',
    searchKeywords: ['cuerdas', 'cordones', 'sogas', 'atado'],
    fields: [
      { key: 'material', label: 'Material', type: 'choices', options: ['Polipropileno', 'Polietileno', 'Poliester', 'Nylon'], required: true },
      { key: 'diametro', label: 'Diametro', type: 'input', placeholder: 'Ej: 6 mm', required: true },
      { key: 'resistencia', label: 'Resistencia', type: 'input', placeholder: 'Ej: 250 kg' },
      { key: 'construccion', label: 'Construccion', type: 'segmented', options: ['Torcida', 'Trenzada', 'Cableada'] },
      { key: 'color', label: 'Color', type: 'segmented', options: ['Natural', 'Blanco', 'Negro', 'Custom'] },
      { key: 'presentacion', label: 'Presentacion', type: 'segmented', options: ['Rollo', 'Madeja', 'Bobina'] },
      { key: 'cantidad', label: 'Cantidad', type: 'quantity', required: true },
      { key: 'adjuntos', label: 'Adjuntar especificaciones', type: 'uploader', helper: 'Subí ficha técnica o referencias.' },
      { key: 'observaciones', label: 'Observaciones', type: 'textarea', placeholder: 'Indicá uso, normas o requerimientos.', fullWidth: true },
    ],
  },
  {
    label: 'Cintas/Cintillas',
    subtitle: 'Flejado y aseguramiento',
    imageSrc: '/cintas.png',
    imageClassName: 'scale-[1.05]',
    searchKeywords: ['cintas', 'cintillas', 'flejado', 'strapping'],
    fields: [
      { key: 'material', label: 'Material', type: 'choices', options: ['Polipropileno', 'PET', 'Poliester'], required: true },
      { key: 'ancho', label: 'Ancho', type: 'input', placeholder: 'Ej: 12 mm', required: true },
      { key: 'espesor', label: 'Espesor', type: 'input', placeholder: 'Ej: 0.6 mm' },
      { key: 'color', label: 'Color', type: 'segmented', options: ['Natural', 'Blanco', 'Negro', 'Custom'] },
      { key: 'impresion', label: 'Impresion', type: 'choices', options: ['Sin impresion', '1 color', '2 colores'] },
      { key: 'cantidad', label: 'Cantidad', type: 'quantity', required: true },
      { key: 'adjuntos', label: 'Adjuntar diseño', type: 'uploader', helper: 'Subí artes o referencias.' },
      { key: 'observaciones', label: 'Observaciones', type: 'textarea', placeholder: 'Indicá resistencia, uso o terminaciones.', fullWidth: true },
    ],
  },
  {
    label: 'Hilo multifilamento de PP',
    subtitle: 'Alta tenacidad',
    imageSrc: '/hilomulti.png',
    imageClassName: 'scale-[1.05]',
    searchKeywords: ['hilo', 'multifilamento', 'polipropileno', 'tejeduria'],
    fields: [
      { key: 'titulo', label: 'Titulo / Denier', type: 'input', placeholder: 'Ej: 1000 den', required: true },
      { key: 'cabos', label: 'Cabos', type: 'segmented', options: ['1', '2', '3', '4+'] },
      { key: 'tenacidad', label: 'Tenacidad', type: 'input', placeholder: 'Ej: 7 g/den' },
      { key: 'color', label: 'Color', type: 'segmented', options: ['Natural', 'Blanco', 'Negro', 'Custom'] },
      { key: 'presentacion', label: 'Presentacion', type: 'segmented', options: ['Cono', 'Bobina', 'Carrete'] },
      { key: 'cantidad', label: 'Cantidad', type: 'quantity', required: true },
      { key: 'observaciones', label: 'Observaciones', type: 'textarea', placeholder: 'Indicá aplicación o requerimientos técnicos.', fullWidth: true },
    ],
  },
  {
    label: 'Hilo retorcido y Mallas',
    subtitle: 'Arrolladora y empaque agrícola',
    imageSrc: '/hiloretor.png',
    imageClassName: 'scale-[1.05]',
    searchKeywords: ['hilo', 'retorcido', 'mallas', 'arrolladora', 'agro'],
    fields: [
      { key: 'producto', label: 'Producto', type: 'segmented', options: ['Hilo retorcido', 'Malla', 'Ambos'], required: true },
      { key: 'material', label: 'Material', type: 'choices', options: ['Polipropileno', 'Polietileno', 'Mixto'], required: true },
      { key: 'ancho-malla', label: 'Ancho de malla', type: 'input', placeholder: 'Ej: 1.23 m' },
      { key: 'color', label: 'Color', type: 'segmented', options: ['Natural', 'Blanco', 'Negro', 'Custom'] },
      { key: 'cantidad', label: 'Cantidad', type: 'quantity', required: true },
      { key: 'adjuntos', label: 'Adjuntar especificaciones', type: 'uploader', helper: 'Subí ficha técnica o referencias.' },
      { key: 'observaciones', label: 'Observaciones', type: 'textarea', placeholder: 'Indicá tipo de rollo, largo o requerimientos.', fullWidth: true },
    ],
  },
  {
    label: 'Telas Tubulares',
    subtitle: 'Para bolsas y Big Bags',
    imageSrc: '/telatubular.png',
    imageClassName: 'scale-[1.05]',
    searchKeywords: ['telas', 'tubulares', 'polipropileno', 'tejido'],
    fields: [
      { key: 'material', label: 'Material', type: 'choices', options: ['PP', 'PE', 'Mixto'], required: true },
      { key: 'ancho', label: 'Ancho tubular', type: 'input', placeholder: 'Ej: 60 cm', required: true },
      { key: 'gramaje', label: 'Gramaje', type: 'segmented', options: ['60 g', '80 g', '100 g', '120 g', 'Custom'] },
      { key: 'color', label: 'Color', type: 'segmented', options: ['Natural', 'Blanco', 'Negro', 'Custom'] },
      { key: 'tratamiento-uv', label: 'Tratamiento UV', type: 'segmented', options: ['No', 'UV 6 meses', 'UV 12 meses'] },
      { key: 'impresion', label: 'Impresion', type: 'choices', options: ['Sin impresion', '1 color', '2 colores'] },
      { key: 'cantidad', label: 'Cantidad', type: 'quantity', required: true },
      { key: 'observaciones', label: 'Observaciones', type: 'textarea', placeholder: 'Indicá aplicación o terminaciones.', fullWidth: true },
    ],
  },
  {
    label: 'Telas planas',
    subtitle: 'Coberturas y multiuso',
    imageSrc: '/telaplana.png',
    imageClassName: 'scale-[1.05]',
    searchKeywords: ['telas', 'planas', 'polipropileno', 'coberturas'],
    fields: [
      { key: 'material', label: 'Material', type: 'choices', options: ['PP', 'PE', 'Mixto'], required: true },
      { key: 'ancho', label: 'Ancho', type: 'input', placeholder: 'Ej: 320 cm', required: true },
      { key: 'gramaje', label: 'Gramaje', type: 'segmented', options: ['60 g', '80 g', '100 g', '120 g', 'Custom'] },
      { key: 'color', label: 'Color', type: 'segmented', options: ['Natural', 'Blanco', 'Negro', 'Custom'] },
      { key: 'tratamiento-uv', label: 'Tratamiento UV', type: 'segmented', options: ['No', 'UV 6 meses', 'UV 12 meses'] },
      { key: 'impresion', label: 'Impresion', type: 'choices', options: ['Sin impresion', '1 color', '2 colores'] },
      { key: 'cantidad', label: 'Cantidad', type: 'quantity', required: true },
      { key: 'observaciones', label: 'Observaciones', type: 'textarea', placeholder: 'Indicá aplicación o terminaciones.', fullWidth: true },
    ],
  },
  {
    label: 'Maquinarias',
    subtitle: 'Equipos y líneas de producción',
    imageSrc: '/maquinariaweb.png',
    imageClassName: 'scale-[1.05]',
    searchKeywords: ['maquinas', 'equipos', 'extrusion', 'impresion', 'conversion'],
    fields: [
      { key: 'tipo-maquina', label: 'Tipo de máquina', type: 'choices', options: ['Extrusora', 'Impresora', 'Telar', 'Conversión', 'Reciclado', 'Otra'], required: true },
      { key: 'aplicacion', label: 'Aplicación', type: 'input', placeholder: 'Ej: Big Bags, bolsas, film' },
      { key: 'capacidad', label: 'Capacidad / Producción', type: 'input', placeholder: 'Ej: 300 kg/h' },
      { key: 'condicion', label: 'Condición', type: 'segmented', options: ['Nueva', 'Usada', 'Reacondicionada'], required: true },
      { key: 'cantidad', label: 'Cantidad', type: 'quantity', required: true },
      { key: 'adjuntos', label: 'Adjuntar especificaciones', type: 'uploader', helper: 'Subí ficha técnica o requerimientos.' },
      { key: 'observaciones', label: 'Observaciones', type: 'textarea', placeholder: 'Indicá voltaje, dimensiones o requerimientos.', fullWidth: true },
    ],
  },
  {
    label: 'A medida',
    subtitle: 'Desarrollos especiales',
    imageSrc: '/amedida.png',
    imageClassName: 'scale-[1.05]',
    searchKeywords: ['atencion personalizada', 'integracion', 'premium', 'maquinas', 'equipos'],
    fields: [
      { key: 'descripcion-producto', label: 'Descripcion del producto', type: 'textarea', placeholder: 'Contanos qué producto necesitás desarrollar.', required: true, fullWidth: true },
      { key: 'uso-producto', label: 'Uso del producto', type: 'choices', options: ['Agro', 'Construccion', 'Logistica', 'Retail'], required: true },
      { key: 'material-deseado', label: 'Material deseado', type: 'choices', options: ['PP', 'PE', 'Papel', 'A definir'] },
      { key: 'cantidad-estimada', label: 'Cantidad estimada', type: 'quantity', required: true },
      { key: 'fecha-objetivo', label: 'Fecha objetivo', type: 'input', inputType: 'date', required: true },
      { key: 'adjuntar-planos', label: 'Adjuntar planos', type: 'uploader', helper: 'PDF, CAD o documentación técnica.' },
      { key: 'adjuntar-imagenes', label: 'Adjuntar imágenes', type: 'uploader', helper: 'Fotos, renders o referencias visuales.' },
      { key: 'observaciones', label: 'Observaciones', type: 'textarea', placeholder: 'Indicá condicionantes, normativas o hitos del proyecto.', fullWidth: true },
    ],
  },
];

export const FALLBACK_REQUEST_CATEGORIES: RequestCatalogCategoryRecord[] = CATALOG.map(toCategory);
