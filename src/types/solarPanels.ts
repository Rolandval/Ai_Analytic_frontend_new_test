export interface SolarPanelPriceUpdateSchemaRequest {
  price: number;
  price_per_w?: number;
}

export interface SolarPanelPriceCreateSchemaRequest {
  full_name: string;
  brand: string;
  supplier: string;
  supplier_status: string;
  price: number;
  price_per_w: number;
  power?: number | string;
  thickness?: number | string;
  panel_type?: string;
  cell_type?: string;
  panel_color?: string;
  frame_color?: string;
}

export interface SolarPanelPriceSchema {
  id: number;
  full_name: string;
  brand: string | null;
  supplier: string;
  supplier_status: string;
  price: number;
  price_per_w: number;
  power?: number | null;
  thickness?: number | null;
  panel_type?: string | null;
  cell_type?: string | null;
  panel_color?: string | null;
  frame_color?: string | null;
  date: string;
  supplier_url?: string;
  supplier_cities?: string[] | null;
  datasheet_url?: string | null;
  supplier_contact?: string | null;
}

export interface PaginatedSolarPanelPricesResponse {
  prices: SolarPanelPriceSchema[];
  total: number;
  page: number;
  page_size: number;
}

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
  voltage_min?: number;
  voltage_max?: number;
  amperage_min?: number;
  amperage_max?: number;
  ump_min?: number;
  ump_max?: number;
  isc_min?: number;
  isc_max?: number;
}
