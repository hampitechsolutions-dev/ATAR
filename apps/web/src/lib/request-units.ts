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

export function getCategoryUnits(category: string | null | undefined): string[] {
  if (!category) {
    return GENERIC.units;
  }
  return (BY_CATEGORY[category] ?? GENERIC).units;
}

export function getDefaultUnit(category: string | null | undefined): string {
  if (!category) {
    return GENERIC.default;
  }
  return (BY_CATEGORY[category] ?? GENERIC).default;
}
