import { useState, useRef, useEffect } from 'react';
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
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Не викликаємо API до першої взаємодії користувача
  const shouldFetchData = hasUserInteracted;

  const { data, isFetching } = useQuery<PaginatedInverterPricesResponse>({
    queryKey: ['inverter-current-prices', filters, hasUserInteracted],
    queryFn: () => listInverterCurrentPrices({ ...filters, supplier_status: ['SUPPLIER'] }), // Додаємо supplier_status тільки при запиті
    enabled: shouldFetchData, // Використовуємо shouldFetchData замість false
    staleTime: 0, // Дані завжди застарілі, щоб перезавантажувалися при кожній зміні
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

  // Wrap setFilters to normalize payload and trigger refetch with debounce
  const applyFilters = (f: InverterPriceListRequestSchema) => {
    setHasUserInteracted(true);
    
    // Очищуємо попередній таймер
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Встановлюємо новий таймер з debounce 500ms
    debounceTimerRef.current = setTimeout(() => {
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
      // Query автоматично перезапуститься через зміну filters та hasUserInteracted
    }, 500);
  };
  
  // Cleanup таймера при розмонтуванні
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

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
