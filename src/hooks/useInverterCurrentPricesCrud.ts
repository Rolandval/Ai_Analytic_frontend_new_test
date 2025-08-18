import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listInverterCurrentPrices,
  createInverterPrice,
  updateInverterCurrentPrice,
  deleteInverterCurrentPrice,
  getInverterBrands,
  getInverterSuppliers,
} from '@/services/inverterPrices.api';
import {
  InverterPriceListRequestSchema,
  InverterPriceUpdateSchemaRequest,
  PaginatedInverterPricesResponse,
} from '@/types/inverters';

export const useInverterCurrentPricesCrud = () => {
  const qc = useQueryClient();
  const [filters, setFilters] = useState<InverterPriceListRequestSchema>({ page: 1, page_size: 10, supplier_status: ['SUPPLIER'] });

  const { data, isFetching } = useQuery<PaginatedInverterPricesResponse>({
    queryKey: ['inverter-current-prices', filters],
    queryFn: () => listInverterCurrentPrices(filters),
    placeholderData: (prev) => prev,
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: InverterPriceUpdateSchemaRequest }) =>
      updateInverterCurrentPrice(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inverter-current-prices'] }),
  });

  const deleteMut = useMutation({
    mutationFn: deleteInverterCurrentPrice,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inverter-current-prices'] }),
  });

  const { data: brands = [] } = useQuery({ queryKey: ['inverter-brands'], queryFn: getInverterBrands });
  const { data: suppliersData = [] } = useQuery({ queryKey: ['inverter-suppliers'], queryFn: getInverterSuppliers });

  const supplierOptions = (suppliersData as any[])
    .filter((s: any) => typeof s !== 'string' && s.id != null)
    .map((s: any) => ({ id: s.id, name: s.name }));
  const supplierNames = supplierOptions.map((o)=>o.name);

  const setPage = (p: number) => setFilters((f) => ({ ...f, page: p }));

  return {
    rows: data?.prices ?? [],
    total: data?.total ?? 0,
    page: filters.page ?? 1,
    pageSize: filters.page_size ?? 10,
    loading: isFetching,
    setPage,
    filters,
    setFilters: setFilters as any,
    createPrice: async (payload: any) => createInverterPrice(payload),
    updatePrice: async (id: number, payload: InverterPriceUpdateSchemaRequest) =>
      updateMut.mutateAsync({ id, payload }),
    deletePrice: async (id: number) => deleteMut.mutateAsync(id),
    brands,
    suppliers: supplierNames,
    supplierOptions,
    getChart: async (inverterId: number, supplierIds: number[]) =>
      (await import('@/services/priceChart.api')).getInverterPriceChart({ inverter_id: inverterId, include_suppliers: supplierIds }),
  } as const;
};
