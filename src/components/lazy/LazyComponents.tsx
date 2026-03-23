import React, { lazy } from 'react';

// Lazy-завантаження важких компонентів
export const LazyInverterPriceComparison = lazy(() => 
  import('@/pages/prices/inverters/PriceComparison').then(module => ({
    default: module.default
  }))
);

export const LazyInverterSuppliers = lazy(() => 
  import('@/pages/inverters/Suppliers').then(module => ({
    default: module.default
  }))
);

export const LazySolarPanelSuppliers = lazy(() => 
  import('@/pages/solar-panels/Suppliers').then(module => ({
    default: module.default
  }))
);

export const LazyBatterySuppliers = lazy(() => 
  import('@/pages/batteries/Suppliers').then(module => ({
    default: module.default
  }))
);

// Lazy charts для графіків
export const LazyCharts = lazy(() =>
  import('@/components/charts').then(module => ({
    default: module as unknown as React.ComponentType<unknown>
  }))
);

// Lazy CreatableCombobox для важких форм
export const LazyCreatableCombobox = lazy(() =>
  import('@/components/ui/CreatableCombobox').then(module => ({
    default: module.CreatableCombobox
  }))
);
