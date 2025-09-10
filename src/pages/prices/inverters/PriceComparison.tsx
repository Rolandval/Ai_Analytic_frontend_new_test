import { useEffect, useMemo, useState } from 'react';
import { useGetSupplierInverterComparisonMutation } from '@/services/inverterComparison.api';
import { getInverterBrands, getInverterSuppliers } from '@/services/inverterPrices.api';
import { refreshInvertersData } from '@/services/dataRefresh.api';
import { updateInverterSitePrice, UpdateSitePriceRequest } from '@/services/sitePrice.api';
import { InverterPriceListRequestSchema } from '@/types/inverters';
import { InverterComparisonFilters } from '@/components/filters/InverterComparisonFilters';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { Checkbox } from '@/components/ui/Checkbox';
import { Label } from '@/components/ui/Label';
import { PriceUpdateModal } from '@/components/PriceUpdateModal';
import { useSortableTable } from '@/hooks/useSortableTable';
import { ChevronUp, ChevronDown, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from '@/components/ui/Select';
// removed radio-group imports; using a single native radio input for unified toggle
// removed page-level name search input; now handled inside InverterComparisonFilters

// Інтерфейс для цін постачальників
interface SupplierPrice {
  supplier_id: number;
  supplier_name: string;
  supplier_url: string | null;
  supplier_status: string;
  price: number | null;
  promo_price: number | null; // Додаємо акційну ціну
  recommended_price: number | null; // Додаємо рекомендовану ціну
  availability: number | null;
  site_id: number | null;
  date: string | null;
  updated_at: string | null;
}

// Інтерфейс для інвертора з цінами постачальників
interface InverterWithSupplierPrices {
  id: number;
  inverter_id: number;
  full_name: string;
  brand: string;
  power: number | null;
  inverter_type: string | null;
  generation: string | null;
  string_count: number | null;
  firmware: string | null;
  supplier_prices: SupplierPrice[];
}

// Інтерфейс для відповіді API
interface InverterComparisonResponse {
  inverters: InverterWithSupplierPrices[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export default function InverterPriceComparison() {
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<InverterPriceListRequestSchema>({
    page: page,
    page_size: pageSize,
    suppliers: []
  });
  const [comparisonData, setComparisonData] = useState<InverterComparisonResponse | null>(null);
  const [processedData, setProcessedData] = useState<InverterWithSupplierPrices[]>([]);
  const [supplierColumns, setSupplierColumns] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  // Column visibility state (persisted per-page)
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  
  // Стани для модального вікна оновлення ціни
  const DEFAULT_MARKUP = 15; // Націнка за замовчуванням, %
  const [rowMarkup, setRowMarkup] = useState<Record<number, number>>({});
  const [updatingRowIds, setUpdatingRowIds] = useState<Set<number>>(new Set());
  const [updatePriceModalOpen, setUpdatePriceModalOpen] = useState(false);
  const [selectedPriceInfo, setSelectedPriceInfo] = useState<{
    id: number | null;
    price: number | null;
    promo_price: number | null;
    availability: string | null;
    productName: string;
  }>({ id: null, price: null, promo_price: null, availability: null, productName: '' });

  const [getInverterComparison, { isLoading }] = useGetSupplierInverterComparisonMutation();
  // removed selectionMode; unified single radio toggle will derive state from selection

  // Прапор для відстеження, чи були застосовані фільтри користувачем
  const [filtersApplied, setFiltersApplied] = useState(false);
  // Name search is handled inside InverterComparisonFilters now

  useEffect(() => {
    // Виконуємо запит тільки якщо фільтри були застосовані
    if (filtersApplied) {
      const timeoutId = setTimeout(() => {
        fetchComparisonData();
      }, 500); // Збільшуємо debounce до 500ms для зменшення мерехтіння
      
      return () => clearTimeout(timeoutId);
    }
  }, [filters, filtersApplied]);

  // removed sync/debounce: full_name is controlled by InverterComparisonFilters

  // Обробляємо дані для сортування, додаючи обчислювані властивості
  useEffect(() => {
    if (comparisonData?.inverters) {
      const data = comparisonData.inverters.map((inverter, idx) => {
        const supplierPrices: Record<string, number | null> = {};
        inverter.supplier_prices.forEach((sp) => {
          const name = (sp.supplier_name ?? '').toString().trim();
          if (name) supplierPrices[name] = sp.price ?? null;
        });

        const recommendedPrice = Math.min(
          ...inverter.supplier_prices
            .map(sp => sp.price)
            .filter((p): p is number => p !== null && p !== undefined && p > 0)
        );
        const finalRecommendedPrice = isFinite(recommendedPrice) ? recommendedPrice : null;

        return {
          ...inverter,
          originalIndex: (comparisonData.page - 1) * comparisonData.page_size + idx + 1,
          totalAvailability: getTotalAvailability(inverter),
          recommendedPrice: finalRecommendedPrice,
          supplierPrices,
        };
      });
      setProcessedData(data);
    }
  }, [comparisonData]);

  // Ініціалізуємо націнку для кожного інвертора при завантаженні даних
  useEffect(() => {
    if (comparisonData?.inverters) {
      setRowMarkup(prev => {
        const next = { ...prev } as Record<number, number>;
        for (const inv of comparisonData.inverters) {
          if (next[inv.id] === undefined) next[inv.id] = DEFAULT_MARKUP;
        }
        return next;
      });
    }
  }, [comparisonData]);

  // Використовуємо хук для сортування
  const { items: sortedInverters, requestSort, sortConfig } = useSortableTable<InverterWithSupplierPrices>(
    processedData,
    { key: 'full_name', direction: 'asc' } // Початкове сортування за назвою
  );

  // Keys for localStorage (namespaced per page)
  const LS_COLUMNS_KEY = 'inverterComparison.columnVisibility';

  // Define static column keys and headers
  const staticColumns = useMemo(() => (
    [
      { key: 'index', header: '№' },
      { key: 'full_name', header: 'Назва' },
      { key: 'brand', header: 'Бренд' },
      { key: 'power', header: 'Вт' },
      { key: 'string_count', header: 'Стр' },
      { key: 'recommended', header: 'Рек' },
      { key: 'markup', header: 'Нац' },
      { key: 'actual', header: 'Акт' },
      { key: 'totalAvailability', header: 'Наяв' },
    ]
  ), []);

  // Initialize column visibility when supplier columns change or on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_COLUMNS_KEY);
      if (stored) {
        setVisibleColumns(JSON.parse(stored));
        return;
      }
    } catch (e) {
      // ignore
    }
    const initial: Record<string, boolean> = {};
    staticColumns.forEach(c => { initial[c.key] = true; });
    supplierColumns.forEach(s => { initial[`supplier:${s}`] = true; });
    setVisibleColumns(initial);
  }, [supplierColumns, staticColumns]);

  const saveVisibleColumns = (cfg: Record<string, boolean>) => {
    setVisibleColumns(cfg);
    try { localStorage.setItem(LS_COLUMNS_KEY, JSON.stringify(cfg)); } catch {}
  };

  // Compact settings popover button to embed into filters actions block
  const settingsButton = (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          size="xs"
          className="h-8 px-2 text-xs"
          title="Налаштування колонок"
          aria-label="Налаштування колонок"
        >
          <Settings className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Налаштування колонок</h4>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const all: Record<string, boolean> = {};
                  staticColumns.forEach(c => all[c.key] = true);
                  supplierColumns.forEach(s => all[`supplier:${s}`] = true);
                  saveVisibleColumns(all);
                }}
              >
                Вибрати всі
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const minimal: Record<string, boolean> = {};
                  ['index','full_name','brand','recommended','actual','totalAvailability'].forEach(k => minimal[k] = true);
                  supplierColumns.slice(0,3).forEach(s => minimal[`supplier:${s}`] = true);
                  saveVisibleColumns(minimal);
                }}
              >
                Необхідні
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            {staticColumns.map(c => (
              <div key={c.key} className="flex items-center gap-2">
                <Checkbox
                  id={`col-${c.key}`}
                  checked={visibleColumns[c.key] !== false}
                  onCheckedChange={(checked: boolean | string) => {
                    const next = { ...visibleColumns, [c.key]: checked === true };
                    saveVisibleColumns(next);
                  }}
                />
                <Label htmlFor={`col-${c.key}`}>{c.header}</Label>
              </div>
            ))}
            <div className="pt-2 font-medium">Постачальники</div>
            {supplierColumns.map(s => {
              const k = `supplier:${s}`;
              return (
                <div key={k} className="flex items-center gap-2">
                  <Checkbox
                    id={`col-${k}`}
                    checked={visibleColumns[k] !== false}
                    onCheckedChange={(checked: boolean | string) => {
                      const next = { ...visibleColumns, [k]: checked === true };
                      saveVisibleColumns(next);
                    }}
                  />
                  <Label htmlFor={`col-${k}`}>{s}</Label>
                </div>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );

  // Apply single row update
  const handleApplyRow = async (inverter: InverterWithSupplierPrices) => {
    if (updatingRowIds.has(inverter.id)) return;
    const priceToApply = calculateRecommendedPrice(inverter);
    if (!priceToApply) {
      toast({ title: 'Немає ціни', description: 'Не вдалося розрахувати актуальну ціну.', variant: 'destructive' });
      return;
    }
    const siteEntry = inverter.supplier_prices.find(sp => sp.site_id);
    if (!siteEntry?.site_id) {
      toast({ title: 'Немає site_id', description: 'Не знайдено товар на сайті для оновлення.', variant: 'destructive' });
      return;
    }
    setUpdatingRowIds(prev => new Set(prev).add(inverter.id));
    const payload: UpdateSitePriceRequest = { site_id: siteEntry.site_id, price: priceToApply };
    try {
      await updateInverterSitePrice(payload);
      toast({ title: 'Успіх', description: 'Ціну оновлено на сайті.' });
      await fetchComparisonData();
    } catch (e) {
      console.error(e);
      toast({ title: 'Помилка', description: 'Не вдалося оновити ціну.', variant: 'destructive' });
    } finally {
      setUpdatingRowIds(prev => {
        const next = new Set(prev);
        next.delete(inverter.id);
        return next;
      });
    }
  };

  // buildExport removed (now unused after consolidating actions into filters)

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        // Fetch brands
        const brandsData = await getInverterBrands();
        setBrands(brandsData);
        
        // Fetch suppliers
        const suppliersData = await getInverterSuppliers();
        // Extract supplier names from supplier objects
        const supplierNames = suppliersData.map((s: { name: string }) => s.name);
        setSuppliers(supplierNames);
      } catch (error) {
        console.error('Error fetching metadata:', error);
      }
    };
    
    fetchMetadata();
  }, []);

  const fetchComparisonData = async () => {
    try {
      const result = await getInverterComparison({
        ...filters,
        page,
        page_size: pageSize
      }).unwrap();
      
      setComparisonData(result);
      
      // Extract unique supplier names to use as columns
      if (result.inverters.length > 0) {
        const uniqueSuppliers = [...new Set(
          result.inverters.flatMap((inverter: InverterWithSupplierPrices) => 
            inverter.supplier_prices.map((sp: SupplierPrice) => (sp.supplier_name ?? '').toString().trim())
          )
        )].filter((n) => n.length > 0) as string[];
        // Move "АКУМУЛЯТОР-Центр" to the end (so it appears just before the recommended column)
        const normalize = (s: string) => s.toLowerCase().replace(/[-\s]+/g, ' ').trim();
        const targetNorm = normalize('АКУМУЛЯТОР-Центр');
        const idx = uniqueSuppliers.findIndex((n) => normalize(n) === targetNorm);
        if (idx !== -1) {
          const [target] = uniqueSuppliers.splice(idx, 1);
          uniqueSuppliers.push(target);
        }
        setSupplierColumns(uniqueSuppliers);
      }
    } catch (error) {
      console.error('Error fetching comparison data:', error);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setFilters((prev: InverterPriceListRequestSchema) => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1);
    setFilters((prev: InverterPriceListRequestSchema) => ({ ...prev, page_size: size, page: 1 }));
  };

  const handleFiltersChange = (newFilters: Partial<InverterPriceListRequestSchema>) => {
    setFilters((prev: InverterPriceListRequestSchema) => ({ ...prev, ...newFilters, page: 1 }));
    setPage(1);
    // Встановлюємо прапор, що фільтри були застосовані
    setFiltersApplied(true);
  };

  // Format price as whole dollars without decimals, with thousands separators (Ukrainian locale)
  const formatPrice = (price: number | null) => {
    if (price === null) return '-';
    const rounded = Math.round(price);
    return rounded.toLocaleString('uk-UA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  // Format date without year
  const formatDateWithTime = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  

  // Calculate actual price from min supplier price with per-row markup
  const calculateRecommendedPrice = (inverter: InverterWithSupplierPrices) => {
    const minPrice = Math.min(
      ...inverter.supplier_prices
        .map(sp => sp.price)
        .filter((p): p is number => p !== null && p !== undefined && p > 0)
    );
    if (!isFinite(minPrice)) return null;
    const m = rowMarkup[inverter.id] ?? DEFAULT_MARKUP;
    return Math.round(minPrice * (1 + m / 100));
  };

  // Determine if any supplier has this inverter available
  const isAvailable = (inverter: InverterWithSupplierPrices) => {
    return inverter.supplier_prices.some(sp => sp.availability && sp.availability > 0);
  };

  // Get price for a specific supplier
  const getPriceForSupplier = (inverter: InverterWithSupplierPrices, supplierName: string) => {
    const supplierPrice = inverter.supplier_prices.find(sp => sp.supplier_name === supplierName);
    return supplierPrice?.price || null;
  };

  // Get supplier price object for a specific supplier
  const getSupplierPriceObject = (inverter: InverterWithSupplierPrices, supplierName: string) => {
    return inverter.supplier_prices.find(sp => sp.supplier_name === supplierName) || null;
  };

  // Check if price can be updated on the site (has site_id and price exists)
  const canUpdatePriceOnSite = (inverter: InverterWithSupplierPrices, supplierName: string) => {
    const supplierPrice = inverter.supplier_prices.find(sp => sp.supplier_name === supplierName);
    return supplierPrice?.site_id !== null && 
           supplierPrice?.site_id !== undefined && 
           supplierPrice?.price !== null && 
           supplierPrice?.price !== undefined;
  };

  // Handle opening the price update modal
  const handleOpenPriceUpdateModal = (inverter: InverterWithSupplierPrices, supplierName: string) => {
    const supplierPrice = getSupplierPriceObject(inverter, supplierName);
    
    if (supplierPrice && supplierPrice.site_id) {
      setSelectedPriceInfo({
        id: supplierPrice.site_id,
        price: supplierPrice.price,
        promo_price: supplierPrice.promo_price || null,
        availability: supplierPrice.availability !== undefined ? String(supplierPrice.availability) : null,
        productName: `${inverter.full_name} (${supplierName})`
      });
      setUpdatePriceModalOpen(true);
    }
  };

  // Handle submitting the price update
  const handlePriceUpdate = async (data: UpdateSitePriceRequest) => {
    try {
      await updateInverterSitePrice(data);
      setUpdatePriceModalOpen(false);
      fetchComparisonData(); // Refresh data after update
    } catch (error) {
      console.error('Error updating price:', error);
    }
  };

  // Calculate total availability for an inverter across all suppliers
  const getTotalAvailability = (inverter: InverterWithSupplierPrices) => {
    return inverter.supplier_prices.reduce((total, sp) => total + (sp.availability || 0), 0);
  };


  return (
    <div className="space-y-4">
      <h1 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4">Порівняння цін на інвертори</h1>
      
      
      
      {/* Top toolbar removed: actions are now inside filters' compact block */}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="overflow-auto">
          <div className="p-2 sm:p-4">
            <div className="mb-4">
              <InverterComparisonFilters 
                current={filters}
                setFilters={handleFiltersChange}
                brands={brands}
                suppliers={suppliers}
                settingsButton={settingsButton}
              />
            </div>
            {!filtersApplied ? (
              <div className="text-center py-10 text-gray-500">
                <p className="font-medium">Застосуйте фільтри для відображення даних</p>
                <p className="text-sm mt-2">Виберіть параметри фільтрації вище для завантаження даних</p>
              </div>
            ) : comparisonData && comparisonData.inverters.length > 0 ? (
              <Table className="text-[11px] leading-4 [&_th]:py-1 [&_td]:py-1 [&_th]:px-1.5 [&_td]:px-1.5" style={{userSelect: 'text'}}>
                <TableHeader className="[&_th]:cursor-pointer" style={{userSelect: 'none'}}>
                  <TableRow>
                    {visibleColumns['index'] !== false && (
                      <TableHead 
                        className="text-center w-8 text-xs"
                        onClick={(e) => requestSort('originalIndex', (e as any).shiftKey)}
                        title="Shift+Клік — додати до сортування"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-xs">№</span>
                          {sortConfig?.key === 'originalIndex' && (
                            <span className="text-primary">
                              {sortConfig.direction === 'asc' ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              )}
                            </span>
                          )}
                        </div>
                      </TableHead>
                    )}
                    {visibleColumns['full_name'] !== false && (
                      <TableHead 
                        className="min-w-[140px] text-center"
                        onClick={(e) => requestSort('full_name', (e as any).shiftKey)}
                        title="Shift+Клік — додати до сортування"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-[11px]" title="Назва">Назва</span>
                          {sortConfig?.key === 'full_name' && (
                            <span className="text-primary">
                              {sortConfig.direction === 'asc' ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              )}
                            </span>
                          )}
                        </div>
                      </TableHead>
                    )}
                    {visibleColumns['brand'] !== false && (
                      <TableHead 
                        className="text-xs text-center"
                        onClick={(e) => requestSort('brand', (e as any).shiftKey)}
                        title="Shift+Клік — додати до сортування"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-xs">Бренд</span>
                          {sortConfig?.key === 'brand' && (
                            <span className="text-primary">
                              {sortConfig.direction === 'asc' ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              )}
                            </span>
                          )}
                        </div>
                      </TableHead>
                    )}
                    {visibleColumns['power'] !== false && (
                      <TableHead 
                        className="hidden sm:table-cell w-12 text-center"
                        onClick={(e) => requestSort('power', (e as any).shiftKey)}
                        title="Shift+Клік — додати до сортування"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-xs" title="Вати">Вт</span>
                          {sortConfig?.key === 'power' && (
                            <span className="text-primary">
                              {sortConfig.direction === 'asc' ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </span>
                          )}
                        </div>
                      </TableHead>
                    )}
                    {visibleColumns['string_count'] !== false && (
                      <TableHead 
                        className="hidden sm:table-cell w-8 text-center"
                        onClick={(e) => requestSort('string_count', (e as any).shiftKey)}
                        title="Shift+Клік — додати до сортування"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-xs" title="Кількість стрингів">Стр</span>
                          {sortConfig?.key === 'string_count' && (
                            <span className="text-primary">
                              {sortConfig.direction === 'asc' ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </span>
                          )}
                        </div>
                      </TableHead>
                    )}
                    {supplierColumns.map((supplier, idx) => (
                      visibleColumns[`supplier:${supplier}`] !== false && (
                        <TableHead
                          key={`sup-head-${idx}-${supplier}`}
                          className="text-center cursor-pointer select-none"
                          onClick={(e) => requestSort(`supplierPrices.${supplier}`, (e as any).shiftKey)}
                          title="Shift+Клік — додати до сортування"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-[11px] truncate max-w-[90px] inline-block align-middle" title={supplier}>
                              {supplier}
                            </span>
                            {sortConfig?.key === `supplierPrices.${supplier}` && (
                              <span className="text-primary">
                                {sortConfig.direction === 'asc' ? (
                                  <ChevronUp className="h-3 w-3" />
                                ) : (
                                  <ChevronDown className="h-3 w-3" />
                                )}
                              </span>
                            )}
                          </div>
                        </TableHead>
                      )
                    ))}
                    {visibleColumns['recommended'] !== false && (
                      <TableHead
                        className="text-center w-12"
                        onClick={(e) => requestSort('recommendedPrice', (e as any).shiftKey)}
                        title="Shift+Клік — додати до сортування"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-xs" title="Рекомендована">Рек</span>
                          {sortConfig?.key === 'recommendedPrice' && (
                            <span className="text-primary">
                              {sortConfig.direction === 'asc' ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              )}
                            </span>
                          )}
                        </div>
                      </TableHead>
                    )}
                    {visibleColumns['markup'] !== false && (
                      <TableHead className="text-center w-12">
                        <div className="flex items-center justify-center">
                          <span className="text-xs" title="Націнка">Нац</span>
                        </div>
                      </TableHead>
                    )}
                    {visibleColumns['actual'] !== false && (
                      <TableHead className="text-center w-12">
                        <div className="flex items-center justify-center">
                          <span className="text-xs" title="Актуальна">Акт</span>
                        </div>
                      </TableHead>
                    )}
                    {visibleColumns['totalAvailability'] !== false && (
                      <TableHead
                        className="text-center w-8"
                        onClick={(e) => requestSort('totalAvailability', (e as any).shiftKey)}
                        title="Shift+Клік — додати до сортування"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-xs" title="Наявність">Наяв</span>
                          {sortConfig?.key === 'totalAvailability' && (
                            <span className="text-primary">
                              {sortConfig.direction === 'asc' ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              )}
                            </span>
                          )}
                        </div>
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Використовуємо відсортований масив замість оригінального */}
                  {sortedInverters.map((inverter, index) => (
                    <TableRow 
                      key={inverter.id}
                      className={
                        isAvailable(inverter)
                          ? "hover:bg-muted/50 dark:hover:bg-muted/70"
                          : "hover:bg-muted/50 dark:hover:bg-muted/70 opacity-70"
                      }
                    >
                      {visibleColumns['index'] !== false && (
                        <TableCell className="text-center w-8 text-xs">{(page - 1) * pageSize + index + 1}</TableCell>
                      )}
                      {visibleColumns['full_name'] !== false && (
                        <TableCell
                          className="font-medium min-w-[140px] text-center truncate"
                          title={inverter.full_name}
                        >
                          {inverter.full_name}
                        </TableCell>
                      )}
                      {visibleColumns['brand'] !== false && (
                        <TableCell className="text-xs text-center">{inverter.brand}</TableCell>
                      )}
                      {visibleColumns['power'] !== false && (
                        <TableCell className="hidden sm:table-cell text-center text-xs w-12">{inverter.power}</TableCell>
                      )}
                      {visibleColumns['string_count'] !== false && (
                        <TableCell className="hidden sm:table-cell text-center text-xs w-8">{inverter.string_count}</TableCell>
                      )}
                      {/* Supplier price columns */}
                      {supplierColumns.map((supplier) => {
                        if (visibleColumns[`supplier:${supplier}`] === false) return null;
                        const price = getPriceForSupplier(inverter, supplier);
                        const canUpdate = canUpdatePriceOnSite(inverter, supplier);
                        return (
                          <TableCell 
                            key={supplier} 
                            className="text-center font-medium w-24"
                          >
                            <div className="flex flex-col items-center gap-0.5">
                              {price !== null ? (
                                <div className="flex items-center gap-1 whitespace-nowrap">
                                  <span className="text-primary dark:text-primary-foreground font-medium text-[11px]">
                                    {formatPrice(price)}$
                                  </span>
                                  {canUpdate && (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="text-[10px] px-1 py-0.5 h-5 bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 hover:text-purple-800"
                                      onClick={() => handleOpenPriceUpdateModal(inverter, supplier)}
                                    >
                                      Онов
                                    </Button>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[11px]">-</span>
                              )}
                              {getSupplierPriceObject(inverter, supplier)?.updated_at && (
                                <span className="text-[10px] text-gray-500 whitespace-nowrap">
                                  {formatDateWithTime(getSupplierPriceObject(inverter, supplier)?.updated_at as string)}
                                </span>
                              )}
                            </div>
                          </TableCell>
                        );
                      })}
                      
                      {/* Recommended price column */}
                      {visibleColumns['recommended'] !== false && (
                        <TableCell className="text-center font-medium">
                          {inverter.recommendedPrice !== null ? (
                            <div className="flex flex-col items-center">
                              <span className="text-purple-700 dark:text-purple-400 font-medium text-[11px]">
                                {formatPrice(inverter.recommendedPrice)}&nbsp;$
                              </span>
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      )}
                      
                      {/* Markup column */}
                      {visibleColumns['markup'] !== false && (
                        <TableCell className="text-center">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={1}
                            value={rowMarkup[inverter.id] ?? DEFAULT_MARKUP}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setRowMarkup(prev => ({ ...prev, [inverter.id]: isNaN(val) ? DEFAULT_MARKUP : val }));
                            }}
                            className="w-14 h-6 text-[11px] border border-gray-300 rounded px-1 text-center"
                          />
                        </TableCell>
                      )}

                      {/* Actual price display column */}
                      {visibleColumns['actual'] !== false && (
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            {calculateRecommendedPrice(inverter) ? (
                              <span className="text-blue-700 font-medium text-sm">
                                {formatPrice(calculateRecommendedPrice(inverter))}&nbsp;$
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">Немає ціни</span>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-[10px] px-1 py-0.5 h-5"
                              onClick={() => handleApplyRow(inverter)}
                              disabled={updatingRowIds.has(inverter.id) || !calculateRecommendedPrice(inverter)}
                            >
                              {updatingRowIds.has(inverter.id) ? '...' : 'Застосувати'}
                            </Button>
                          </div>
                        </TableCell>
                      )}
                      
                      {/* Total availability column */}
                      {visibleColumns['totalAvailability'] !== false && (
                        <TableCell className="text-center">
                          {getTotalAvailability(inverter) > 0 ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              {getTotalAvailability(inverter)}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              Немає
                            </Badge>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-10 text-gray-500">
                {comparisonData?.inverters.length === 0
                  ? "Не знайдено інверторів за вашими критеріями"
                  : "Немає даних для відображення"}
              </div>
            )}
          </div>
        </div>
        
        {comparisonData && (
          <div className="p-2 sm:p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm text-gray-600">Показати:</span>
                <Select value={String(pageSize)} onValueChange={(value) => handlePageSizeChange(Number(value))}>
                  <SelectTrigger className="h-8 w-[80px]">
                    <SelectValue placeholder="10" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="30">30</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-xs sm:text-sm text-gray-600">записів</span>
              </div>

              <div className="flex items-center gap-4 ml-auto">
                <span className="text-xs sm:text-sm text-gray-600">
                  {page} / {Math.max(1, Math.ceil((comparisonData.total || 0) / pageSize))}
                </span>
                <div className="space-x-2">
                  <Button disabled={page === 1} onClick={() => handlePageChange(page - 1)} size="sm">Попередня</Button>
                  <Button disabled={page === Math.ceil((comparisonData.total || 0) / pageSize) || (comparisonData.total || 0) === 0} onClick={() => handlePageChange(page + 1)} size="sm">Наступна</Button>
                </div>
              </div>
            </div>
            <div className="mt-2 text-xs sm:text-sm text-muted-foreground">
              Показано {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, comparisonData.total)} з {comparisonData.total}
            </div>
          </div>
        )}
      </div>
      
      {/* Модальне вікно оновлення ціни */}
      <PriceUpdateModal
        isOpen={updatePriceModalOpen}
        onClose={() => setUpdatePriceModalOpen(false)}
        onSubmit={handlePriceUpdate}
        currentPrice={selectedPriceInfo.price}
        currentPromoPrice={selectedPriceInfo.promo_price}
        currentAvailability={selectedPriceInfo.availability}
        productName={selectedPriceInfo.productName}
        siteId={selectedPriceInfo.id!}
      />
    </div>
  );
}
