import type { CompanyType, SupplierDirectoryRecord } from './atar-api';

export type ProviderDirectoryItem = {
  id: string;
  slug: string;
  name: string;
  city: string;
  category: string;
  description: string;
  tags: string[];
  companyType: CompanyType;
  leadTimeDays: number | null;
  minimumOrder: number | null;
};

export function getSupplierCategoryLabel(companyType: CompanyType) {
  if (companyType === 'HYBRID') {
    return 'Empresa híbrida';
  }

  if (companyType === 'SUPPLIER') {
    return 'Proveedor industrial';
  }

  return 'Empresa';
}

export function getSupplierLocation(city: string | null, country: string) {
  return [city, country].filter(Boolean).join(', ') || country;
}

export function mapSupplierToProviderDirectoryItem(
  supplier: SupplierDirectoryRecord,
): ProviderDirectoryItem {
  return {
    id: supplier.id,
    slug: supplier.slug,
    name: supplier.name,
    city: getSupplierLocation(supplier.city, supplier.country),
    category: getSupplierCategoryLabel(supplier.companyType),
    description: supplier.description ?? '',
    tags: supplier.tags,
    companyType: supplier.companyType,
    leadTimeDays: supplier.leadTimeDays,
    minimumOrder: supplier.minimumOrder,
  };
}
