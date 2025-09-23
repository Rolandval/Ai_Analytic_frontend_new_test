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
  const [filters, setFilters] = useState<SolarPanelPriceListRequestSchema>({ page: 1, page_size: 10 });
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // Не викликаємо API до першої взаємодії користувача
  const shouldFetchData = hasUserInteracted;

  const { data, isFetching, refetch } = useQuery<PaginatedSolarPanelPricesResponse>({
    queryKey: ['solar-panel-current-prices', filters, hasUserInteracted],
    queryFn: () => listSolarPanelCurrentPrices({ ...filters, supplier_status: ['SUPPLIER'] }), // Додаємо supplier_status тільки при запиті
    placeholderData: (prev) => prev,
    enabled: false, // ПОВНІСТЮ ВІДКЛЮЧАЄМО до взаємодії
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: SolarPanelPriceUpdateSchemaRequest }) =>
      updateSolarPanelCurrentPrice(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['solar-panel-current-prices'] }),
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

  // Wrap setFilters to also invalidate the relevant query so that POST re-executes immediately
  const applyFilters = (f: SolarPanelPriceListRequestSchema) => {
    setHasUserInteracted(true);
    // Normalize payload to avoid 422 from backend: drop empty strings, null/undefined, and empty arrays
    const normalize = (o: Record<string, any>) => {
      const n: Record<string, any> = {};
      Object.entries(o).forEach(([k, v]) => {
        if (v === '' || v === null || v === undefined) return;
        if (Array.isArray(v)) {
          if (v.length > 0) n[k] = v.slice();
          return;
        }
        n[k] = v;
      });
      return n as SolarPanelPriceListRequestSchema;
    };
    const normalized = { ...normalize(f as any), supplier_status: ['SUPPLIER'] };
    setFilters(normalized);
    refetch();
  };

  return {
    rows: data?.prices ?? [],
    total: data?.total ?? 0,
    page: filters.page ?? 1,
    pageSize: filters.page_size ?? 10,
    loading: isFetching && shouldFetchData,
    setPage,
    setPageSize,
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
