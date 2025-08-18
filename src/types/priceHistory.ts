export interface PriceDataPoint {
  date: string; // Assuming date is in 'YYYY-MM-DD' format
  price: number;
  currency: string;
}

export interface PriceHistoryResponse {
  product_id: number;
  full_name: string;
  history: PriceDataPoint[];
}

export interface PriceHistoryRequest {
  product_ids: number[];
  start_date?: string;
  end_date?: string;
}
