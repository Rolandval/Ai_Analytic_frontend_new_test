// Cleaned and extended according to backend schemas
// ===================== AUTO-GENERATED CLEAN SOLAR PANEL TYPES =====================
// Feel free to extend, but DO NOT place code after the opening /* comment further below.

export interface SolarPanelPriceListRequestSchema {
  full_name?: string;
  power_min?: number;
  power_max?: number;
  thickness_min?: number;
  thickness_max?: number;
  panel_type?: string;
  cell_type?: string;
  panel_color?: string;
  frame_color?: string;
  brands?: string[];
  suppliers?: string[];
  cities?: string[];
  price_min?: number;
  price_max?: number;
  price_per_w_min?: number;
  price_per_w_max?: number;
  date_min?: string; // ISO string
  date_max?: string; // ISO string
  supplier_status?: string[];
  usd_rate?: number;
  markup?: number;
  page?: number;
  page_size?: number;
  price_sort?: 'asc' | 'desc';
  price_per_w_sort?: 'asc' | 'desc';
  // Нові фільтри
  cells_count_min?: number;
  cells_count_max?: number;
  width_min?: number;
  width_max?: number;
  height_min?: number;
  height_max?: number;
  weight_min?: number;
  weight_max?: number;
  impp_min?: number;
  impp_max?: number;
}

export interface SolarPanelPriceCreateSchemaRequest {
  full_name: string;
  brand: string;
  power?: number;
  thickness?: number;
  panel_type?: string;
  cell_type?: string;
  panel_color?: string;
  frame_color?: string;
  supplier: string;
  supplier_status: string;
  price: number;
  price_per_w: number;
}

export interface SolarPanelPriceUpdateSchemaRequest {
  price: number;
  price_per_w?: number;
}

export interface SolarPanelPriceSchema {
  id: number;
  full_name: string;
  brand: string | null;
  power?: number | null;
  thickness?: number | null;
  panel_type?: string | null;
  cell_type?: string | null;
  panel_color?: string | null;
  frame_color?: string | null;
  supplier: string;
  supplier_status: string;
  supplier_url?: string;
  supplier_contact?: string | null;
  suppliers_cities?: string[] | null;
  price: number;
  price_per_w: number;
  date: string; // ISO string
}

export interface PaginatedSolarPanelPricesResponse {
  prices: SolarPanelPriceSchema[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}


