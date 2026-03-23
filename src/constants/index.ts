// Supplier/competitor status options used across all filter and form components
export const SUPPLIER_STATUSES = ['ME', 'SUPPLIER', 'COMPETITOR'] as const;
export type SupplierStatus = typeof SUPPLIER_STATUSES[number];

export const STATUS_LABELS: Record<SupplierStatus, string> = {
  ME: 'Мій',
  SUPPLIER: 'Постачальник',
  COMPETITOR: 'Конкурент',
};

// Default markup percentage for price calculations
export const DEFAULT_MARKUP_PERCENT = 15;

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 50;
