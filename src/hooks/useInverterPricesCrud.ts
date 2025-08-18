import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listInverterPrices,
  createInverterPrice,
  updateInverterPrice,
  deleteInverterPrice,
  getInverterBrands,
  getInverterSuppliers,
} from '@/services/inverterPrices.api';
import {
  InverterPriceListRequestSchema,
  InverterPriceCreateSchemaRequest,
  InverterPriceUpdateSchemaRequest,
  PaginatedInverterPricesResponse,
} from '@/types/inverters';
import { useState } from 'react';

export const useInverterPricesCrud = () => {
  const qc = useQueryClient();
  const [filters, setFilters] = useState<InverterPriceListRequestSchema>({ page: 1, page_size: 10 });

  const { data, isFetching } = useQuery<PaginatedInverterPricesResponse>({
    queryKey: ['inverter-prices', filters],
    queryFn: () => listInverterPrices(filters),
    placeholderData: (prev) => prev,
  });

  const createMut = useMutation({
    mutationFn: createInverterPrice,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inverter-prices'] }),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: InverterPriceUpdateSchemaRequest }) => updateInverterPrice(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inverter-prices'] }),
  });
  const deleteMut = useMutation({
    mutationFn: deleteInverterPrice,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inverter-prices'] }),
  });

  const { data: brands = [] } = useQuery({ queryKey: ['inverter-brands'], queryFn: getInverterBrands });
  const { data: suppliersData = [] } = useQuery({ queryKey: ['inverter-suppliers'], queryFn: getInverterSuppliers });

  const supplierOptions = (suppliersData as any[]).map((s:any,idx)=> typeof s==='string'?{id:idx+1,name:s}:{id:s.id,name:s.name});
  const supplierNames = supplierOptions.map(o=>o.name);
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
    createPrice: async (payload: InverterPriceCreateSchemaRequest) => createMut.mutateAsync(payload),
    updatePrice: async (id: number, payload: InverterPriceUpdateSchemaRequest) => updateMut.mutateAsync({ id, payload }),
    deletePrice: async (id: number) => deleteMut.mutateAsync(id),
    brands,
    suppliers: supplierNames,
  } as const;
};
