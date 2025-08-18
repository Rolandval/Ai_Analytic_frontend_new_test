export interface Paginated<T> {
  count: number;
  results: T[];
}

export interface BrandList {
  brands: string[];
}

export interface SupplierList {
  suppliers: string[];
}
