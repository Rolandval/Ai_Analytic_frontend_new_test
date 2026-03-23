// Type definitions related to battery price history pages

export interface BatteryPriceListRequestSchema {
  full_name?: string;
  volume_min?: number;
  volume_max?: number;
  c_amps_min?: number;
  c_amps_max?: number;
  region?: string | string[];
  polarity?: string | string[];
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
  usd_rate?: number; // Optional USD exchange rate used in some price views
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

// Comparison API response — paginated batteries with per-supplier prices
export interface BatterySupplierPriceItem {
  supplier_id: number;
  supplier_name: string;
  supplier_url: string | null;
  supplier_status: string;
  price: number | null;
  promo_price: number | null;
  recommended_price: number | null;
  availability: number | null;
  site_id: number | null;
  date: string | null;
  updated_at: string | null;
}

export interface BatteryComparisonItem {
  id: number;
  battery_id: number;
  full_name: string;
  brand: string;
  volume: number | null;
  c_amps: number | null;
  region: string | null;
  polarity: string | null;
  electrolyte: string | null;
  supplier_prices: BatterySupplierPriceItem[];
}

export interface BatteryMultiPriceListResponseSchema {
  batteries: BatteryComparisonItem[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}
