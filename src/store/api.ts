import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query/react';
import { facebookApi } from '@/services/adsManager/facebook.api';
import { solarPanelComparisonApi } from '@/services/solarPanelComparison.api';
import { batteryComparisonApi } from '@/services/batteryComparison.api';
import { inverterComparisonApi } from '@/services/inverterComparison.api';
import { solarPanelSitePriceApi } from '@/services/solarPanelSitePrice.api';

export const store = configureStore({
  reducer: {
    [facebookApi.reducerPath]: facebookApi.reducer,
    [solarPanelComparisonApi.reducerPath]: solarPanelComparisonApi.reducer,
    [batteryComparisonApi.reducerPath]: batteryComparisonApi.reducer,
    [inverterComparisonApi.reducerPath]: inverterComparisonApi.reducer,
    [solarPanelSitePriceApi.reducerPath]: solarPanelSitePriceApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      facebookApi.middleware,
      solarPanelComparisonApi.middleware,
      batteryComparisonApi.middleware,
      inverterComparisonApi.middleware,
      solarPanelSitePriceApi.middleware,
    ),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
