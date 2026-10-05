import type {
  RequestCatalogCategoryRecord,
  RequestCatalogFieldRecord,
} from '@/lib/atar-api';

export function findRequestCatalogCategory(
  categories: RequestCatalogCategoryRecord[],
  label: string,
) {
  return categories.find((category) => category.label === label) ?? null;
}

/**
 * Especificaciones que se le piden al comprador: solo las indispensables para
 * cotizar (las obligatorias del catálogo) más un campo libre de observaciones
 * para todo lo demás. Los campos opcionales y los adjuntos (que todavía no se
 * transmiten) quedan afuera: el detalle fino se conversa por el chat.
 */
function isEssentialField(field: RequestCatalogFieldRecord) {
  const key = field.id.toLowerCase();
  return field.required || key === 'observaciones' || key.endsWith('-observaciones');
}

export function getRequestCatalogFields(
  categories: RequestCatalogCategoryRecord[],
  label: string,
): RequestCatalogFieldRecord[] {
  return (findRequestCatalogCategory(categories, label)?.fields ?? []).filter(isEssentialField);
}

export function getRequestCatalogKeywords(
  categories: RequestCatalogCategoryRecord[],
  label: string,
): string[] {
  return findRequestCatalogCategory(categories, label)?.searchKeywords ?? [];
}

export function getRequestCategoryImage(
  categories: RequestCatalogCategoryRecord[],
  label: string,
) {
  return findRequestCatalogCategory(categories, label)?.imageSrc ?? null;
}
