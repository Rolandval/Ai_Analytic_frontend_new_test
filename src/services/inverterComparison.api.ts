import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  InverterPriceListRequestSchema,
  InverterMultiPriceListResponseSchema
} from '@/types/inverters';

const BASE = '/inverters/backend';

export const inverterComparisonApi = createApi({
  reducerPath: 'inverterComparisonApi',
  baseQuery: fetchBaseQuery(),
  endpoints: (builder) => ({
    getSupplierInverterComparison: builder.mutation<
      InverterMultiPriceListResponseSchema,
      InverterPriceListRequestSchema
    >({
      query: (data) => ({
        url: `${BASE}/supplier_inverter_comparison`,
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const { useGetSupplierInverterComparisonMutation } = inverterComparisonApi;
