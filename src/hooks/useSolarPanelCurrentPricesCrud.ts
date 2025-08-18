import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listSolarPanelCurrentPrices,
  createSolarPanelPrice,
  updateSolarPanelCurrentPrice,
  deleteSolarPanelCurrentPrice,
  getSolarPanelBrands,
  getSolarPanelSuppliers,
} from '@/services/solarPanelPrices.api';
import {
  SolarPanelPriceListRequestSchema,
  SolarPanelPriceUpdateSchemaRequest,
  PaginatedSolarPanelPricesResponse,
} from '@/types/solarPanels';

export const useSolarPanelCurrentPricesCrud = () => {
  const qc = useQueryClient();
  const [filters, setFilters] = useState<SolarPanelPriceListRequestSchema>({ page: 1, page_size: 10, supplier_status: ['SUPPLIER'] });

  const { data, isFetching } = useQuery<PaginatedSolarPanelPricesResponse>({
    queryKey: ['solar-current-prices', filters],
    queryFn: () => listSolarPanelCurrentPrices(filters),
    placeholderData: (prev) => prev,
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: SolarPanelPriceUpdateSchemaRequest }) =>
      updateSolarPanelCurrentPrice(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['solar-current-prices'] }),
  });

  const deleteMut = useMutation({
    mutationFn: deleteSolarPanelCurrentPrice,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['solar-current-prices'] }),
  });

  const { data: brands = [] } = useQuery({ queryKey: ['solar-brands'], queryFn: getSolarPanelBrands });
  const { data: suppliersData = [] } = useQuery({ queryKey: ['solar-suppliers'], queryFn: getSolarPanelSuppliers });

  const supplierOptions = (suppliersData as any[])
    .filter((s: any) => typeof s !== 'string' && s.id != null)
    .map((s: any) => ({ id: s.id, name: s.name }));
  const supplierNames = supplierOptions.map(o=>o.name);

  const setPage = (p: number) => setFilters((f) => ({ ...f, page: p }));

  // Wrap setFilters to also invalidate the relevant query so that POST re-executes immediately
  const applyFilters = (f: SolarPanelPriceListRequestSchema) => {
    setFilters(f);
    qc.invalidateQueries({ queryKey: ['solar-current-prices'] });
  };

  return {
    rows: data?.prices ?? [],
    total: data?.total ?? 0,
    page: filters.page ?? 1,
    pageSize: filters.page_size ?? 10,
    loading: isFetching,
    setPage,
    filters,
    setFilters: applyFilters as any,
    createPrice: async (payload: any) => createSolarPanelPrice(payload),
    updatePrice: async (id: number, payload: SolarPanelPriceUpdateSchemaRequest) =>
      updateMut.mutateAsync({ id, payload }),
    deletePrice: async (id: number) => deleteMut.mutateAsync(id),
    brands,
    suppliers: supplierNames,
    supplierOptions,
    getChart: async (panelId: number, supplierIds: number[]) =>
      (await import('@/services/priceChart.api')).getSolarPanelPriceChart({ solar_panel_id: panelId, include_suppliers: supplierIds }),
  } as const;
};
