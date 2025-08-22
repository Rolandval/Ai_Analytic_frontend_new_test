import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { SolarPanelPriceListRequestSchema } from '@/types/solarPanels';

const BASE = '/solar_panels/backend';
const BASE_URL = 'http://185.233.44.234:8002';

// Minimal response shape for supplier comparison used by the UI
export interface SolarPanelMultiPriceListResponseSchema {
  panels: any[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export const solarPanelComparisonApi = createApi({
  reducerPath: 'solarPanelComparisonApi',
  baseQuery: fetchBaseQuery({ baseUrl: BASE_URL }),
  endpoints: (builder) => ({
    getSupplierSolarPanelComparison: builder.mutation<
      SolarPanelMultiPriceListResponseSchema,
      SolarPanelPriceListRequestSchema
    >({
      query: (data) => ({
        url: `${BASE}/supplier_solar_panel_comparison`,
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const { useGetSupplierSolarPanelComparisonMutation } = solarPanelComparisonApi;
