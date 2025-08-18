import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  SolarPanelPriceListRequestSchema,
  SolarPanelMultiPriceListResponseSchema
} from '@/types/solar-panels';

const BASE = '/solar_panels/backend';

export const solarPanelComparisonApi = createApi({
  reducerPath: 'solarPanelComparisonApi',
  baseQuery: fetchBaseQuery(),
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
