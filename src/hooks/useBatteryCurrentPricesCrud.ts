import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listBatteryCurrentPrices,
  createBatteryPrice,
  updateBatteryCurrentPrice,
  deleteBatteryCurrentPrice,
  getBatteryBrands,
  getBatterySuppliers,
} from '@/services/batteryPrices.api';
import { BatteryPriceListRequestSchema, BatteryPriceUpdateSchemaRequest, PaginatedBatteryPricesResponse } from '@/types/batteries';
import { useState } from 'react';

export const useBatteryCurrentPricesCrud = () => {
  const qc = useQueryClient();
  const [filters, setFilters] = useState<BatteryPriceListRequestSchema>({ page: 1, page_size: 10 });
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // Не викликаємо API до першої взаємодії користувача
  const shouldFetchData = hasUserInteracted;

  const { data, isFetching } = useQuery<PaginatedBatteryPricesResponse>({
    queryKey: ['battery-current-prices', filters, hasUserInteracted],
    queryFn: () => {
      const queryParams = { ...filters, supplier_status: ['SUPPLIER'] };
      console.log('🔍 Battery Current Prices Query:', queryParams);
      return listBatteryCurrentPrices(queryParams);
    },
    placeholderData: (prev) => prev,
    enabled: shouldFetchData, // Використовуємо shouldFetchData замість false
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: BatteryPriceUpdateSchemaRequest }) =>
      updateBatteryCurrentPrice(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['battery-current-prices'] }),
  });
  const deleteMut = useMutation({
    mutationFn: deleteBatteryCurrentPrice,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['battery-current-prices'] }),
  });

  const { data: brands = [] } = useQuery({ queryKey: ['battery-brands'], queryFn: getBatteryBrands });
  const { data: suppliersData = [] } = useQuery({ queryKey: ['battery-suppliers'], queryFn: getBatterySuppliers });

  // Map suppliers to objects with id when possible
  const supplierOptions = (suppliersData as any[]).map((s: any, idx) =>
    typeof s === 'string' ? { id: idx + 1, name: s } : { id: s.id, name: s.name }
  );
  
  // Дедуплікуємо постачальників за назвою
  const uniqueSupplierNames = [...new Set(supplierOptions.map(o => o.name))];
  const supplierNames = uniqueSupplierNames;

  const setPage = (p: number) => {
    setHasUserInteracted(true);
    setFilters((f) => ({ ...f, page: p }));
  };
  const setPageSize = (size: number) => {
    setHasUserInteracted(true);
    setFilters((f) => ({ ...f, page_size: size, page: 1 }));
  };

  // Обгортаємо setFilters для відстеження взаємодії користувача
  const wrappedSetFilters = (newFilters: BatteryPriceListRequestSchema | ((prev: BatteryPriceListRequestSchema) => BatteryPriceListRequestSchema)) => {
    console.log('🔧 Setting Battery Filters:', newFilters);
    setHasUserInteracted(true);
    if (typeof newFilters === 'function') {
      const updatedFilters = (prev: BatteryPriceListRequestSchema) => {
        const result = { ...newFilters(prev), supplier_status: ['SUPPLIER'] };
        console.log('📝 Updated Battery Filters (function):', result);
        return result;
      };
      setFilters(updatedFilters);
    } else {
      const result = { ...newFilters, supplier_status: ['SUPPLIER'] };
      console.log('📝 Updated Battery Filters (direct):', result);
      setFilters(result);
    }
    // Query автоматично перезапуститься через зміну filters та hasUserInteracted
  };

  // Логування даних для дебагу
  console.log('📊 Battery Current Prices Data:', {
    hasData: !!data,
    rowsCount: data?.battery_prices?.length ?? 0,
    total: data?.total ?? 0,
    loading: isFetching && shouldFetchData,
    hasUserInteracted,
    shouldFetchData,
    filters
  });

  return {
    rows: data?.battery_prices ?? [],
    total: data?.total ?? 0,
    page: filters.page ?? 1,
    pageSize: filters.page_size ?? 10,
    loading: isFetching && shouldFetchData,
    setPage,
    setPageSize,
    filters,
    setFilters: wrappedSetFilters as any,
    // no create for current prices
    createPrice: async (payload: any) => createBatteryPrice(payload),
    updatePrice: async (id: number, payload: BatteryPriceUpdateSchemaRequest) => updateMut.mutateAsync({ id, payload }),
    deletePrice: async (id: number) => deleteMut.mutateAsync(id),
    brands,
    suppliers: supplierNames,
    supplierOptions,
    getChart: async (batteryId: number, supplierIds: number[]) =>
      (await import('@/services/priceChart.api')).getBatteryPriceChart({ battery_id: batteryId, include_suppliers: supplierIds }),
  } as const;
};
