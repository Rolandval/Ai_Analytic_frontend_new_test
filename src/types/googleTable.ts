export interface GoogleTable {
  id: number;
  name: string;
  doc_url: string;
  prompt?: string;
  product_type: string;
  last_update?: string | null;
}

export interface GoogleTableListResponse {
  google_tables: GoogleTable[];
}
