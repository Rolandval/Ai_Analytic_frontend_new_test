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
  const [filters, setFilters] = useState<InverterPriceListRequestSchema>({ page: 1, page_size: 10 });
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // Не викликаємо API до першої взаємодії користувача
  const shouldFetchData = hasUserInteracted;

  const { data, isFetching, refetch } = useQuery<PaginatedInverterPricesResponse>({
    queryKey: ['inverter-current-prices', filters, hasUserInteracted],
    queryFn: () => listInverterCurrentPrices({ ...filters, supplier_status: ['SUPPLIER'] }), // Додаємо supplier_status тільки при запиті
    placeholderData: (prev) => prev,
    enabled: false, // ПОВНІСТЮ ВІДКЛЮЧАЄМО до взаємодії
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

  // Wrap setFilters to normalize payload and trigger refetch
  const applyFilters = (f: InverterPriceListRequestSchema) => {
    setHasUserInteracted(true);
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
      return n as InverterPriceListRequestSchema;
    };
    const normalized = { ...normalize(f as any), supplier_status: ['SUPPLIER'] };
    setFilters(normalized);
    refetch();
  };

  const refresh = () => qc.invalidateQueries({ queryKey: ['inverter-current-prices'] });

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
    createPrice: async (payload: any) => createInverterPrice(payload),
    updatePrice: async (id: number, payload: InverterPriceUpdateSchemaRequest) =>
      updateMut.mutateAsync({ id, payload }),
    deletePrice: async (id: number) => deleteMut.mutateAsync(id),
    brands,
    suppliers: supplierNames,
    supplierOptions,
    getChart: async (inverterId: number, supplierIds: number[]) =>
      (await import('@/services/priceChart.api')).getInverterPriceChart({ inverter_id: inverterId, include_suppliers: supplierIds }),
    refresh,
  } as const;
};
