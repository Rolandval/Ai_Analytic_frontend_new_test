// Type definitions related to battery price history pages

export interface BatteryPriceListRequestSchema {
  full_name?: string;
  volume_min?: number;
  volume_max?: number;
  c_amps_min?: number;
  c_amps_max?: number;
  region?: string;
  polarity?: string;
  electrolyte?: string[];
  brands?: string[];
  suppliers?: string[];
  cities?: string[];
  price_min?: number;
  price_max?: number;
  price_sort?: 'asc' | 'desc';
  date_min?: string;
  date_max?: string;
  supplier_status?: string[];
  markup?: number;
  page?: number;
  page_size?: number;
}

export interface BatteryPriceCreateSchemaRequest {
  full_name: string;
  brand: string;
  volume?: number;
  c_amps?: number;
  region?: string;
  polarity?: string;
  electrolyte?: string;
  supplier: string;
  supplier_status: string;
  price: number;
}

export interface BatteryPriceUpdateSchemaRequest {
  price: number;
}

export interface BatteryPriceSchema {
  id: number;
  full_name: string;
  brand: string | null;
  volume?: number | null;
  c_amps?: number | null;
  region?: string | null;
  polarity?: string | null;
  electrolyte?: string | null;
  supplier: string;
  supplier_status: string;
  supplier_url?: string;
  supplier_cities?: string[] | null;
  price: number;
  date: string;
}

export interface PaginatedBatteryPricesResponse {
  battery_prices: BatteryPriceSchema[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}
