import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listSolarPanelPrices,
  createSolarPanelPrice,
  updateSolarPanelPrice,
  deleteSolarPanelPrice,
  getSolarPanelBrands,
  getSolarPanelSuppliers,
} from '@/services/solarPanelPrices.api';
import {
  SolarPanelPriceListRequestSchema,
  SolarPanelPriceCreateSchemaRequest,
  SolarPanelPriceUpdateSchemaRequest,
  PaginatedSolarPanelPricesResponse,
} from '@/types/solarPanels';
import { useState } from 'react';

export const useSolarPanelPricesCrud = () => {
  const qc = useQueryClient();
  const [filters, setFilters] = useState<SolarPanelPriceListRequestSchema>({ page: 1, page_size: 10 });

  const { data, isFetching } = useQuery<PaginatedSolarPanelPricesResponse>({
    queryKey: ['solar-prices', filters],
    queryFn: () => listSolarPanelPrices(filters),
    placeholderData: (prev) => prev,
  });

  const createMut = useMutation({
    mutationFn: createSolarPanelPrice,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['solar-prices'] }),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: SolarPanelPriceUpdateSchemaRequest }) => updateSolarPanelPrice(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['solar-prices'] }),
  });
  const deleteMut = useMutation({
    mutationFn: deleteSolarPanelPrice,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['solar-prices'] }),
  });

  const { data: brands = [] } = useQuery({ queryKey: ['solar-brands'], queryFn: getSolarPanelBrands });
  const { data: suppliersData = [] } = useQuery({ queryKey: ['solar-suppliers'], queryFn: getSolarPanelSuppliers });

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
    createPrice: async (payload: SolarPanelPriceCreateSchemaRequest) => createMut.mutateAsync(payload),
    updatePrice: async (id: number, payload: SolarPanelPriceUpdateSchemaRequest) => updateMut.mutateAsync({ id, payload }),
    deletePrice: async (id: number) => deleteMut.mutateAsync(id),
    brands,
    suppliers: supplierNames,
  } as const;
};
