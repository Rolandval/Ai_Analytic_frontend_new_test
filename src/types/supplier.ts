export interface Supplier {
  /** Core supplier id (maps to supplier_id in backend) */
  id: number;
  /** Supplier name */
  name: string;

  /* ---------------- Old fields kept for backward-compatibility ---------------- */
  contact_person?: string;
  /** First e-mail shown in UI (derived from emails[0]) */
  email?: string;
  /** First phone number shown in UI (derived from phone_numbers[0]) */
  phone?: string;

  /* ---------------- New full-detail fields ---------------- */
  status_id?: number | null;
  description?: string | null;
  /** Cities can be array of strings (frontend) or comma-separated string (backend) */
  cities?: string[] | string | null;
  /** Emails can be array of strings (frontend) or comma-separated string (backend) */
  emails?: string[] | string | null;
  /** Phone numbers can be array of strings (frontend) or comma-separated string (backend) */
  phone_numbers?: string[] | string | null;
}

export interface PaginatedSuppliersResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Supplier[];
}

export type SupplierList = Supplier[];
