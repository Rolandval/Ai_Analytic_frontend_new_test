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
  const [filters, setFilters] = useState<BatteryPriceListRequestSchema>({ page: 1, page_size: 10, supplier_status: ['SUPPLIER'] });

  const { data, isFetching } = useQuery<PaginatedBatteryPricesResponse>({
    queryKey: ['battery-current-prices', filters],
    queryFn: () => listBatteryCurrentPrices(filters),
    placeholderData: (prev) => prev,
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

  const setPage = (p: number) => setFilters((f) => ({ ...f, page: p }));
  const setPageSize = (size: number) => setFilters((f) => ({ ...f, page_size: size, page: 1 }));

  return {
    rows: data?.battery_prices ?? [],
    total: data?.total ?? 0,
    page: filters.page ?? 1,
    pageSize: filters.page_size ?? 10,
    loading: isFetching,
    setPage,
    setPageSize,
    filters,
    setFilters: setFilters as any,
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
