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
  ump_min?: number;
  ump_max?: number;
  isc_min?: number;
  isc_max?: number;
  amperage_min?: number;
  amperage_max?: number;
}
