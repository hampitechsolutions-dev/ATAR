export type ProviderDirectoryItem = {
  id: string;
  name: string;
  city: string;
  category: string;
  description: string;
  rating: string;
  tags: string[];
};

export const supplierCategories = [
  'Bolsas industriales',
  'Packaging',
  'Plasticos',
  'Quimicos',
  'Maquinaria',
  'Servicios',
];

export const supplierFilters = [
  'ISO 9001',
  'ISO 14001',
  'BRC',
  'FSSC 22000',
  'Entrega rapida',
  'Produccion nacional',
];

export const providerDirectory: ProviderDirectoryItem[] = [
  {
    id: 'bolpack',
    name: 'BOLPACK',
    city: 'Cordoba, Argentina',
    category: 'Bolsas industriales',
    description:
      'Fabricacion de bolsas industriales, big bags y soluciones de polipropileno.',
    rating: '4.8',
    tags: ['ISO 9001', 'Entrega rapida', 'Produccion nacional'],
  },
  {
    id: 'polymax',
    name: 'POLYMAX',
    city: 'Rosario, Santa Fe',
    category: 'Packaging',
    description:
      'Packaging flexible, impresiones de alta calidad y conversion industrial.',
    rating: '4.9',
    tags: ['BRC', 'Linea premium', 'Atencion personalizada'],
  },
  {
    id: 'flexibag',
    name: 'FLEXIBAG',
    city: 'Mendoza, Argentina',
    category: 'Plasticos',
    description:
      'Envases y filmes tecnicos para agroindustria, alimentos e higiene.',
    rating: '4.7',
    tags: ['FSSC 22000', 'Exportacion', 'Stock permanente'],
  },
  {
    id: 'quimar',
    name: 'QUIMAR S.A.',
    city: 'Buenos Aires, Argentina',
    category: 'Quimicos',
    description:
      'Materias primas y productos quimicos para procesos industriales.',
    rating: '4.8',
    tags: ['ISO 14001', 'Asistencia tecnica', 'Laboratorio'],
  },
  {
    id: 'megaline',
    name: 'MEGALINE',
    city: 'San Luis, Argentina',
    category: 'Maquinaria',
    description:
      'Automatizacion de linea, integracion de maquinaria y mantenimiento industrial.',
    rating: '4.6',
    tags: ['Servicio postventa', 'Integracion', 'Produccion nacional'],
  },
  {
    id: 'logisur',
    name: 'LOGISUR',
    city: 'Buenos Aires, Argentina',
    category: 'Servicios',
    description:
      'Servicios logisticos, almacenaje tercerizado y coordinacion de entregas industriales.',
    rating: '4.7',
    tags: ['Cobertura nacional', 'Entrega rapida', 'Tracking'],
  },
];

export const trustItems = [
  'Validacion de documentacion',
  'Informacion actualizada',
  'Reputacion y calificaciones',
  'Transparencia en los datos',
];
