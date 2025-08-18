export interface InverterPriceListRequestSchema {
  full_name?: string;
  power_min?: number;
  power_max?: number;
  inverter_type?: string;
  generation?: string;
  string_count_min?: number;
  string_count_max?: number;
  firmware?: string;
  brands?: string[];
  suppliers?: string[];
  cities?: string[];
  price_min?: number;
  price_max?: number;
  price_sort?: 'asc' | 'desc';
  date_min?: string;
  date_max?: string;
  supplier_status?: string[];
  usd_rate?: number;
  markup?: number;
  page?: number;
  page_size?: number;
}

export interface InverterPriceCreateSchemaRequest {
  full_name: string;
  brand: string;
  power?: number;
  inverter_type?: string;
  generation?: string;
  string_count?: number;
  firmware?: string;
  supplier: string;
  supplier_status: string;
  price: number;
}

export interface InverterPriceUpdateSchemaRequest {
  price: number;
}

export interface InverterPriceSchema {
  id: number;
  full_name: string;
  brand: string | null;
  power?: number | null;
  inverter_type?: string | null;
  generation?: string | null;
  string_count?: number | null;
  firmware?: string | null;
  supplier: string;
  supplier_status: string;
  supplier_url?: string;
  supplier_contacts?: string | null;
  supplier_cities?: string[] | null;
  price: number;
  date: string;
}

export interface PaginatedInverterPricesResponse {
  prices: InverterPriceSchema[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}
