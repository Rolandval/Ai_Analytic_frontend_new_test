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

  const { data, isFetching, refetch } = useQuery<PaginatedBatteryPricesResponse>({
    queryKey: ['battery-current-prices', filters, hasUserInteracted],
    queryFn: () => listBatteryCurrentPrices({ ...filters, supplier_status: ['SUPPLIER'] }), // Додаємо supplier_status тільки при запиті
    placeholderData: (prev) => prev,
    enabled: false, // ПОВНІСТЮ ВІДКЛЮЧАЄМО до взаємодії
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
  const supplierNames = supplierOptions.map((o) => o.name);

  const setPage = (p: number) => {
    setHasUserInteracted(true);
    setFilters((f) => ({ ...f, page: p }));
    refetch();
  };
  const setPageSize = (size: number) => {
    setHasUserInteracted(true);
    setFilters((f) => ({ ...f, page_size: size, page: 1 }));
    refetch();
  };

  // Обгортаємо setFilters для відстеження взаємодії користувача
  const wrappedSetFilters = (newFilters: BatteryPriceListRequestSchema | ((prev: BatteryPriceListRequestSchema) => BatteryPriceListRequestSchema)) => {
    setHasUserInteracted(true);
    if (typeof newFilters === 'function') {
      setFilters((prev) => ({ ...newFilters(prev), supplier_status: ['SUPPLIER'] }));
    } else {
      setFilters({ ...newFilters, supplier_status: ['SUPPLIER'] });
    }
    // Ручно викликаємо запит після встановлення фільтрів
    refetch();
  };

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
