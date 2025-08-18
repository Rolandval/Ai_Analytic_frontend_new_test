import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  BatteryPriceListRequestSchema,
  BatteryMultiPriceListResponseSchema
} from '@/types/batteries';


const BASE = '/batteries/backend';

export const batteryComparisonApi = createApi({
  reducerPath: 'batteryComparisonApi',
  baseQuery: fetchBaseQuery(),
  endpoints: (builder) => ({
    getSupplierBatteryComparison: builder.mutation<
      BatteryMultiPriceListResponseSchema,
      BatteryPriceListRequestSchema
    >({
      query: (data) => ({
        url: `${BASE}/price_comparisons`,
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const { useGetSupplierBatteryComparisonMutation } = batteryComparisonApi;
