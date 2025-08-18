export type ProductType = 'batteries' | 'solar_panels' | 'inverters';

export interface SQLQuery {
  id: number;
  name: string;
  query: string;
  product_type: ProductType;
}

export interface SQLQueryCreateRequest {
  name: string;
  query: string;
  product_type: ProductType;
}

export interface GenerateCSVRequest {
  product_type: ProductType;
  add_weather: boolean;
  add_days: boolean;
  from_date: string; // ISO date string
  to_date: string;   // ISO date string
}

export interface CSVDataItem {
  [key: string]: string | number | null;
  TheDate: string;
  weekday?: string;
  temperature?: number;
  precipitation?: number;
  weather_condition?: string;
}
