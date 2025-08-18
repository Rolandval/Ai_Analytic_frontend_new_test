import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listBatteryPrices,
  createBatteryPrice,
  updateBatteryPrice,
  deleteBatteryPrice,
  getBatteryBrands,
  getBatterySuppliers,
} from '@/services/batteryPrices.api';
import {
  BatteryPriceListRequestSchema,
  BatteryPriceCreateSchemaRequest,
  BatteryPriceUpdateSchemaRequest,
  PaginatedBatteryPricesResponse,
} from '@/types/batteries';
import { useState } from 'react';

export const useBatteryPricesCrud = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<BatteryPriceListRequestSchema>({ page: 1, page_size: 10 });

  const { data, isFetching } = useQuery<PaginatedBatteryPricesResponse, Error>({
    queryKey: ['battery-prices', filters],
    queryFn: () => listBatteryPrices(filters),
    placeholderData: (prev) => prev,
  });

  const createMut = useMutation<void, Error, BatteryPriceCreateSchemaRequest>({
    mutationFn: createBatteryPrice,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['battery-prices'] }),
  });
  const updateMut = useMutation<void, Error, { id: number; payload: BatteryPriceUpdateSchemaRequest }>({
    mutationFn: ({ id, payload }) => updateBatteryPrice(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['battery-prices'] }),
  });
  const deleteMut = useMutation<void, Error, number>({
    mutationFn: deleteBatteryPrice,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['battery-prices'] }),
  });

  const { data: brands = [] } = useQuery({ queryKey: ['battery-brands'], queryFn: getBatteryBrands });
  const { data: suppliersData = [] } = useQuery({ queryKey: ['battery-suppliers'], queryFn: getBatterySuppliers });

  const supplierOptions = (suppliersData as any[]).map((s:any,idx)=> typeof s === 'string'? {id:idx+1,name:s}:{id:s.id,name:s.name});
  const supplierNames = supplierOptions.map(o=>o.name);
  // helpers
  const setPage = (p: number) => setFilters((f) => ({ ...f, page: p }));

  return {
    rows: data?.battery_prices ?? [],
    total: data?.total ?? 0,
    page: filters.page ?? 1,
    pageSize: filters.page_size ?? 10,
    loading: isFetching,
    setPage,
    filters,
    setFilters: setFilters as any,
    createPrice: async (payload: BatteryPriceCreateSchemaRequest) => createMut.mutateAsync(payload),
    updatePrice: async (id: number, payload: BatteryPriceUpdateSchemaRequest) => updateMut.mutateAsync({ id, payload }),
    deletePrice: async (id: number) => deleteMut.mutateAsync(id),
    brands,
    suppliers: supplierNames,
  } as const;
};
