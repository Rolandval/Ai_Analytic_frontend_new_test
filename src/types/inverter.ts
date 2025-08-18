// Based on a presumed backend schema for inverters

export interface Inverter {
  id: number;
  full_name: string;
  power_w: number | null;
  voltage_v: number | null;
  phases: number | null;
  region: string;
  brand_id: number | null;
  brand: {
    id: number;
    name: string;
  } | null;
}

export interface InverterListRequest {
  full_name?: string | null;
  power_w_min?: number;
  power_w_max?: number;
  phases?: number | null;
  region?: string | null;
  brands?: string[] | null;
  page?: number;
  page_size?: number;
}

export interface PaginatedInvertersResponse {
  total: number;
  page: number;
  page_size: number;
  inverters: Inverter[];
}

// Types for Price Analysis

export enum SupplierStatusEnum {
  ACTIVE = 'active',
  NOT_ACTIVE = 'not_active',
  TEMPORARILY_INACTIVE = 'temporarily_inactive',
}

export enum InverterTypeEnum {
  HYBRID = 'hybrid',
  OFF_GRID = 'off-grid',
  ON_GRID = 'on-grid',
}

export interface InverterPriceSchema {
  id: number;
  full_name: string;
  brand: string;
  price: number;
  supplier: string;
  supplier_status: SupplierStatusEnum;
  supplier_cities?: string[] | null;
  date: string;
}

export interface InverterPriceListRequest {
  page?: number;
  page_size?: number;
  full_name?: string;
  price_min?: number;
  price_max?: number;
  brands?: string[];
  suppliers?: string[];
  cities?: string[];
  supplier_status?: SupplierStatusEnum[];
  inverter_types?: InverterTypeEnum[];
  date_from?: string;
  date_to?: string;
}

export interface PaginatedInverterPricesResponse {
  total: number;
  page: number;
  page_size: number;
  prices: InverterPriceSchema[];
}

