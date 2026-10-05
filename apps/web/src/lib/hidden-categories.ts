/**
 * Rubros del catálogo ocultos por ahora. Para volver a mostrarlos alcanza con
 * sacarlos de esta lista: los datos (catálogo de respaldo, seed, fichas de los
 * proveedores, imágenes) no se borraron.
 *
 * Polímeros = Polipropileno + Polietileno. "Polímeros" es el nombre de la
 * familia en el sitio público.
 */
const HIDDEN_CATEGORY_LABELS = ['Polipropileno', 'Polietileno', 'Polímeros'];

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

const HIDDEN = new Set(HIDDEN_CATEGORY_LABELS.map(normalize));

export function isCategoryHidden(label: string) {
  return HIDDEN.has(normalize(label));
}

/** Quita de una lista de rubros los que están ocultos. */
export function withoutHiddenCategories(labels: string[]) {
  return labels.filter((label) => !isCategoryHidden(label));
}
