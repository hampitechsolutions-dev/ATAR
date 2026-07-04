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

export function getRequestCatalogFields(
  categories: RequestCatalogCategoryRecord[],
  label: string,
): RequestCatalogFieldRecord[] {
  return findRequestCatalogCategory(categories, label)?.fields ?? [];
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
