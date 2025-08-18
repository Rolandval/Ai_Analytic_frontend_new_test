export interface ChartDataRequest {
  period: 'day' | 'week' | 'month' | 'year';
  brand?: string;
}

export interface ChartDataResponse {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
  }[];
}

export interface CompetitorAnalyticData {
  name: string;
  market_share: number;
  average_price: number;
}

export interface SupplierAnalyticData {
  name: string;
  product_count: number;
  average_price: number;
}
