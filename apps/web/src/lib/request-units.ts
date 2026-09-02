// Unidades de medida sugeridas por categoría de insumo.
//
// La investigación de producto mostró que en este rubro la unidad debe ser
// inequívoca por categoría (metro lineal, kg, m², rollo, tambor, cono…): sin
// ella, un "precio unitario" no significa nada. Cada categoría propone sus
// unidades típicas y una por defecto; el comprador puede cambiarla.

type UnitConfig = { units: string[]; default: string };

// Fallback para categorías sin mapa propio (o catálogo del backend distinto).
const GENERIC: UnitConfig = {
  units: ['unidades', 'kg', 'metros', 'rollos'],
  default: 'unidades',
};

// Claves = label de la categoría (igual que en el catálogo del wizard).
const BY_CATEGORY: Record<string, UnitConfig> = {
  'Big Bags': { units: ['unidades', 'millar'], default: 'unidades' },
  'Bolsas PP': { units: ['unidades', 'millar'], default: 'unidades' },
  Sacos: { units: ['unidades', 'millar'], default: 'unidades' },
  Polipropileno: { units: ['kg', 'toneladas', 'rollos', 'bobinas'], default: 'kg' },
  Polietileno: { units: ['kg', 'toneladas', 'rollos', 'bobinas'], default: 'kg' },
  'Rollos y Telas': { units: ['metros lineales', 'm²', 'rollos', 'kg'], default: 'metros lineales' },
  'Telas planas': { units: ['metros lineales', 'm²', 'rollos', 'kg'], default: 'metros lineales' },
  'Telas Tubulares': { units: ['metros lineales', 'rollos', 'kg'], default: 'metros lineales' },
  Tintas: { units: ['kg', 'litros', 'tambores'], default: 'kg' },
  'Cuerdas/Cordones': { units: ['metros', 'rollos', 'kg'], default: 'metros' },
  'Cintas/Cintillas': { units: ['metros', 'rollos', 'kg'], default: 'metros' },
  'Hilo multifilamento de PP': { units: ['kg', 'conos', 'bobinas'], default: 'kg' },
  'Hilo retorcido y Mallas': { units: ['kg', 'rollos', 'bobinas'], default: 'kg' },
  Maquinarias: { units: ['unidades'], default: 'unidades' },
  'A medida': { units: ['unidades', 'kg', 'metros', 'rollos'], default: 'unidades' },
};

// Unidad neutra: nunca tergiversa el pedido. Es el default para toda categoría
// y siempre está disponible como opción, aunque no figure en el mapa del rubro.
const NEUTRAL_UNIT = 'unidades';

export function getCategoryUnits(category: string | null | undefined): string[] {
  const units = category ? (BY_CATEGORY[category] ?? GENERIC).units : GENERIC.units;
  // Garantiza que "unidades" siempre esté (primero), sin duplicar.
  return [NEUTRAL_UNIT, ...units.filter((unit) => unit !== NEUTRAL_UNIT)];
}

// El default es SIEMPRE la unidad neutra: la unidad del rubro (metro lineal,
// kg, rollo…) es una elección explícita del comprador, no una suposición que
// cambie el significado de la cantidad que cargó.
export function getDefaultUnit(_category: string | null | undefined): string {
  return NEUTRAL_UNIT;
}
