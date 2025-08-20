import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const BASE = '/solar_panels/upload';

export const solarPanelSitePriceApi = createApi({
  reducerPath: 'solarPanelSitePriceApi',
  baseQuery: fetchBaseQuery(),
  endpoints: (builder) => ({
    updateAllSitePrices: builder.mutation<string, number>({
      query: (markup) => ({
        url: `${BASE}/update_all_site_prices/${markup}`,
        method: 'GET',
      }),
    }),
  }),
});

export const { useUpdateAllSitePricesMutation } = solarPanelSitePriceApi;
