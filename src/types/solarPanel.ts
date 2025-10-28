// Based on services/solar_panels/backend/schemas.py

export interface SolarPanel {
  id: number;
  full_name: string;
  power: number | null;
  panel_type: string | null;
  cell_type: string | null;
  thickness: number | null;
  panel_color: string | null;
  frame_color: string | null;
  brand: {
    id: number;
    name: string;
  } | string | null;
}

export enum PanelColorEnum {
  DEFAULT = "Default",
  ALL_BLACK = "All_Black",
}

export enum FrameColorEnum {
  SILVER = "silver",
  BLACK = "black",
}

export enum PanelTypeEnum {
  FIRST_SIDE = "одностороння",
  SECOND_SIDE = "двостороння",
}

export enum CellTypeEnum {
  N_TYPE = "n-type",
  P_TYPE = "p-type",
}

export interface SolarPanelListRequest {
  page: number;
  page_size: number;
  full_name?: string;
  power_min?: number;
  power_max?: number;
  panel_type?: PanelTypeEnum;
  cell_type?: CellTypeEnum;
  thickness_min?: number;
  thickness_max?: number;
  panel_color?: PanelColorEnum;
  frame_color?: FrameColorEnum;
  brands?: string[];
}

export interface PaginatedSolarPanelsResponse {
  total: number;
  page: number;
  page_size: number;
  solar_panels: SolarPanel[];
}

// Price Analysis Types

export enum SupplierStatusEnum {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked',
}

export interface SolarPanelPriceSchema {
  id: number;
  full_name: string;
  brand: string;
  supplier: string;
  supplier_status: SupplierStatusEnum;
  supplier_cities?: string[] | null;
  price: number;
  date: string;
  datasheet_url?: string | null;
  power?: number | null;
  panel_type?: string | null;
  cell_type?: string | null;
  panel_color?: string | null;
  frame_color?: string | null;
  supplier_url?: string | null;
  supplier_contact?: string | null;
  price_per_w?: number | null;
  panel_id?: number | null;
  cells_count?: number | null;
  width?: number | null;
  height?: number | null;
  weight?: number | null;
  impp?: number | null;
}

// Common sort direction type for list endpoints
export type SortDirection = 'asc' | 'desc';

export interface SolarPanelPriceListRequest {
  page?: number;
  page_size?: number;
  full_name?: string;
  price_min?: number;
  price_max?: number;
  brands?: string[];
  suppliers?: string[];
  cities?: string[];
  supplier_status?: SupplierStatusEnum[];
  panel_types?: PanelTypeEnum[];
  cell_types?: CellTypeEnum[];
  date_from?: string;
  date_to?: string;
  /** Sort prices by absolute price */
  price_sort?: SortDirection;
  /** Sort prices by price per watt */
  price_per_w_sort?: SortDirection;
}

export interface PaginatedSolarPanelPricesResponse {
  total: number;
  page: number;
  page_size: number;
  prices: SolarPanelPriceSchema[];
}

