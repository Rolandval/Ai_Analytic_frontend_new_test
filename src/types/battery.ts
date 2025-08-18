// Based on services/batteries/backend/schemas.py

export enum RegionEnum {
  EUROPE = 'EUROPE',
  ASIA = 'ASIA',
}

export enum PolarityEnum {
  R = 'R+',
  L = 'L+',
}

export enum ElectrolyteEnum {
  LAB = 'LAB',
  AGM = 'AGM',
  GEL = 'GEL',
  EFB = 'EFB',
}

export enum SupplierStatusEnum {
  ME = 'ME',
  SUPPLIER = 'SUPPLIER',
  COMPETITOR = 'COMPETITOR',
}

// Schema for the main directory list, matches backend BatterySchema
export interface BatteryDirectoryItem {
  id: number;
  full_name: string;
  volume: number | null;
  c_amps: number | null;
  region: RegionEnum | null;
  polarity: PolarityEnum | null;
  electrolyte: ElectrolyteEnum | null;
  brand: string;
}

// Params for filtering the directory, matches backend BatteryListRequestSchema
export interface BatteryDirectoryParams {
  full_name?: string | null;
  volume_min?: number;
  volume_max?: number;
  c_amps_min?: number;
  c_amps_max?: number;
  region?: RegionEnum | null;
  polarity?: PolarityEnum | null;
  electrolyte?: ElectrolyteEnum[] | null;
  brands?: string[] | null;
  page?: number;
  page_size?: number;
}

// This is for the prices page, keep it as is.
export interface BatteryPriceSchema {
  id: number;
  full_name: string;
  brand: string;
  volume: number | null;
  c_amps: number | null;
  region: RegionEnum | null;
  polarity: PolarityEnum | null;
  electrolyte: ElectrolyteEnum | null;
  supplier: string;
  supplier_status: SupplierStatusEnum;
  price: number;
  date: string;
}

// This is for the prices page, keep it as is.
export interface BatteryPriceListRequest {
  page: number;
  page_size: number;
  full_name?: string;
  volume_min?: number;
  volume_max?: number;
  c_amps_min?: number;
  c_amps_max?: number;
  region?: RegionEnum;
  polarity?: PolarityEnum;
  electrolyte?: ElectrolyteEnum[];
  brands?: string[];
  suppliers?: string[];
  price_min?: number;
  price_max?: number;
  date_min?: string;
  date_max?: string;
  supplier_status?: SupplierStatusEnum[];
}

// Response for the paginated directory
export interface PaginatedBatteriesResponse {
  total: number;
  page: number;
  page_size: number;
  pages: number;
  batteries: BatteryDirectoryItem[];
}
