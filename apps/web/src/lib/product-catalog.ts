export type ProductCatalogItem = {
  id: string;
  supplierName: string;
  supplierCity: string;
  category: string;
  name: string;
  slug: string;
  description: string;
  unitLabel: string;
  unitReferencePrice: number;
  stockAvailable: number;
  leadTimeLabel: string;
  specs: string[];
};

export const productCatalog: ProductCatalogItem[] = [
  {
    id: 'bobina-laminada-120',
    supplierName: 'Proveedor Metal Demo SRL',
    supplierCity: 'Cordoba, Argentina',
    category: 'Packaging',
    name: 'Bobina laminada industrial 120 micrones',
    slug: 'bobina-laminada-industrial-120',
    description:
      'Bobina para conversion industrial con buen rendimiento mecanico y estabilidad para procesos continuos.',
    unitLabel: 'kg',
    unitReferencePrice: 2450,
    stockAvailable: 12000,
    leadTimeLabel: '5 a 7 dias',
    specs: ['120 micrones', 'Ancho 1000 mm', 'Uso industrial continuo'],
  },
  {
    id: 'bolsa-valvula-25kg',
    supplierName: 'Proveedor Metal Demo SRL',
    supplierCity: 'Cordoba, Argentina',
    category: 'Bolsas industriales',
    name: 'Bolsa valvula 25 kg reforzada',
    slug: 'bolsa-valvula-25kg-reforzada',
    description:
      'Bolsa reforzada para insumos granulados con buena resistencia al transporte y apilado.',
    unitLabel: 'unidades',
    unitReferencePrice: 980,
    stockAvailable: 35000,
    leadTimeLabel: '72 hs',
    specs: ['Capacidad 25 kg', 'Valvula autodescarga', 'Papel + laminado interior'],
  },
  {
    id: 'liner-bigbag-premium',
    supplierName: 'Proveedor Metal Demo SRL',
    supplierCity: 'Cordoba, Argentina',
    category: 'Plasticos',
    name: 'Liner para big bag premium',
    slug: 'liner-bigbag-premium',
    description:
      'Liner interior para proteccion de producto y mejora de performance en despacho y almacenamiento.',
    unitLabel: 'unidades',
    unitReferencePrice: 3150,
    stockAvailable: 8000,
    leadTimeLabel: '7 a 10 dias',
    specs: ['Alta barrera', 'Soldadura reforzada', 'Compatibilidad con big bags estandar'],
  },
];

export function findProductBySlug(slug: string) {
  return productCatalog.find((item) => item.slug === slug) ?? null;
}
