import { useEffect, useMemo, useState } from 'react';
import { useGetSupplierBatteryComparisonMutation } from '@/services/batteryComparison.api';
import { getBatteryBrands, getBatterySuppliers } from '@/services/batteryPrices.api';
import { refreshBatteriesData } from '@/services/dataRefresh.api';
import { updateBatterySitePrice, UpdateSitePriceRequest } from '@/services/sitePrice.api';
import { BatteryPriceListRequestSchema } from '@/types/batteries';
import { BatteryComparisonFilters } from '@/components/filters/BatteryComparisonFilters';
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
import { RefreshDataButton } from '@/components/ui/RefreshDataButton';
import { Pagination } from '@/components/ui/Pagination';
import { PriceUpdateModal } from '@/components/PriceUpdateModal';
import { useSortableTable } from '@/hooks/useSortableTable';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Settings, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
// removed radio-group imports; using a single native radio input for unified toggle
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';

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

// Інтерфейс для акумулятора з цінами постачальників
interface BatteryWithSupplierPrices {
  id: number;
  battery_id: number;
  full_name: string;
  brand: string;
  volume: number | null;
  c_amps: number | null;
  region: string | null;
  polarity: string | null;
  electrolyte: string | null;
  supplier_prices: SupplierPrice[];
}

// Інтерфейс для відповіді API
interface BatteryComparisonResponse {
  batteries: BatteryWithSupplierPrices[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export default function BatteryPriceComparison() {
  const [pageSize, setPageSize] = useState(100);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<BatteryPriceListRequestSchema>({
    page: page,
    page_size: pageSize,
    suppliers: []
  });
  const [comparisonData, setComparisonData] = useState<BatteryComparisonResponse | null>(null);
  const [processedData, setProcessedData] = useState<BatteryWithSupplierPrices[]>([]);
  const [supplierColumns, setSupplierColumns] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  // Column visibility state (persisted per-page)
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});
  // Copying state
  const [copying, setCopying] = useState(false);
  const { toast } = useToast();
  
  // Стан для актуальних цін
  // Націнка по рядках (за замовчуванням 15%)
  const DEFAULT_MARKUP = 15;
  const [rowMarkup, setRowMarkup] = useState<Record<number, number>>({});
  const [selectedRowIds, setSelectedRowIds] = useState<Set<number>>(new Set());
  const [updatingRowIds, setUpdatingRowIds] = useState<Set<number>>(new Set());
  const [updatePriceModalOpen, setUpdatePriceModalOpen] = useState(false);
  const [selectedPriceInfo, setSelectedPriceInfo] = useState<{
    id: number | null;
    price: number | null;
    promo_price: number | null;
    availability: string | null;
    productName: string;
  }>({ id: null, price: null, promo_price: null, availability: null, productName: '' });

  const [getBatteryComparison] = useGetSupplierBatteryComparisonMutation();
  // removed selectionMode; unified single radio toggle will derive state from selection

  // Прапор для відстеження, чи були застосовані фільтри користувачем
  const [filtersApplied, setFiltersApplied] = useState(false);

  // Використовуємо ефективні значення пагінації з відповіді сервера, якщо доступні
  const effectivePage = comparisonData?.page ?? page;
  const effectivePageSize = comparisonData?.page_size ?? pageSize;

  // Debounce для змін фільтрів (коротший, щоб UI реагував швидше)
  useEffect(() => {
    if (filtersApplied) {
      const timeoutId = setTimeout(() => {
        fetchComparisonData();
      }, 250);
      return () => clearTimeout(timeoutId);
    }
  }, [filters, filtersApplied]);

  // Миттєве завантаження при зміні сторінки/розміру сторінки
  useEffect(() => {
    if (filtersApplied) {
      fetchComparisonData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  // Ініціалізуємо націнку 15% для кожного товару при завантаженні даних
  useEffect(() => {
    if (comparisonData?.batteries) {
      setRowMarkup(prev => {
        const next = { ...prev };
        for (const b of comparisonData.batteries) {
          if (next[b.id] === undefined) next[b.id] = DEFAULT_MARKUP;
        }
        return next;
      });
    }
  }, [comparisonData]);

  // Обробляємо дані для сортування, додаючи обчислювані властивості
  useEffect(() => {
    if (comparisonData?.batteries) {
      // De-duplicate by id to avoid duplicate rows if backend or state merges return repeated items
      const uniqueBatteries = Array.from(
        new Map(comparisonData.batteries.map(b => [b.id, b])).values()
      );
      const data = uniqueBatteries.map((battery, idx) => ({
        ...battery,
        totalAvailability: getTotalAvailability(battery),
        // Для сортування за рекомендованою ціною: БЕРЕМО ЯВНУ ЦІНУ ПОСТАЧАЛЬНИКА (як на панелях)
        recommendedPrice: (() => {
          const raw = battery.supplier_prices.find(sp => sp.recommended_price !== null)?.recommended_price as unknown;
          const n = raw == null ? null : Number(raw);
          return n != null && Number.isFinite(n) ? n : null;
        })(),
        // Поточна націнка рядка (для можливості сортування)
        markup: rowMarkup[battery.id] ?? DEFAULT_MARKUP,
        // Для сортування за цінами постачальників: supplierPrices.[supplierName]
        supplierPrices: Object.fromEntries(
          battery.supplier_prices.map(sp => [sp.supplier_name, sp.price])
        ),
        // Для сортування за початковим порядком (№)
        originalIndex: idx,
      }));
      setProcessedData(data);
    }
  }, [comparisonData, rowMarkup]);

  // Keys for localStorage (namespaced per page)
  const LS_COLUMNS_KEY = 'batteryComparison.columnVisibility';

  // Define static column keys and headers
  const staticColumns = useMemo(() => (
    [
      { key: 'index', header: '№' },
      { key: 'full_name', header: 'Назва' },
      { key: 'brand', header: 'Бренд' },
      { key: 'volume', header: 'Ah' },
      { key: 'c_amps', header: 'A' },
      { key: 'region', header: 'Рег' },
      { key: 'polarity', header: 'Пол' },
      { key: 'electrolyte', header: 'Ел' },
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

  // Compact Settings button to place inside filters' draggable actions block
  const settingsButton = (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary" size="xs" className="h-8 px-2 text-xs" title="Налаштування колонок" aria-label="Налаштування колонок">
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
  const handleApplyRow = async (battery: BatteryWithSupplierPrices) => {
    if (updatingRowIds.has(battery.id)) return;
    const priceToApply = calculateRecommendedPrice(battery);
    if (!priceToApply) {
      toast({ title: 'Немає ціни', description: 'Не вдалося розрахувати актуальну ціну.', variant: 'destructive' });
      return;
    }
    const siteEntry = battery.supplier_prices.find(sp => sp.site_id);
    if (!siteEntry?.site_id) {
      toast({ title: 'Немає site_id', description: 'Не знайдено товар на сайті для оновлення.', variant: 'destructive' });
      return;
    }
    setUpdatingRowIds(prev => new Set(prev).add(battery.id));
    const payload: UpdateSitePriceRequest = { site_id: siteEntry.site_id, price: priceToApply };
    try {
      await updateBatterySitePrice(payload);
      toast({ title: 'Успіх', description: 'Ціну оновлено на сайті.' });
      await fetchComparisonData();
    } catch (e) {
      console.error(e);
      toast({ title: 'Помилка', description: 'Не вдалося оновити ціну.', variant: 'destructive' });
    } finally {
      setUpdatingRowIds(prev => {
        const next = new Set(prev);
        next.delete(battery.id);
        return next;
      });
    }
  };

  // Handle bulk price update (per selected rows) — aligned with solar panels logic
  const handleBulkPriceUpdate = async () => {
    if (selectedRowIds.size === 0) return;
    const selectedBatteries = processedData.filter(b => selectedRowIds.has(b.id));
    const updates = selectedBatteries.map(async (battery) => {
      const priceToApply = calculateRecommendedPrice(battery);
      if (!priceToApply) return Promise.resolve('skip');
      const siteEntry = battery.supplier_prices.find(sp => sp.site_id);
      if (!siteEntry?.site_id) return Promise.resolve('skip');
      const payload: UpdateSitePriceRequest = { site_id: siteEntry.site_id, price: priceToApply };
      try {
        await updateBatterySitePrice(payload);
        return 'ok';
      } catch (e) {
        console.error('Bulk update error (battery)', battery.id, e);
        return 'error';
      }
    });
    const results = await Promise.allSettled(updates);
    const okCount = results.filter(r => r.status === 'fulfilled').length;
    // eslint-disable-next-line no-alert
    alert(`Оновлено цін: ${okCount} / ${selectedBatteries.length}`);
    setSelectedRowIds(new Set());
    await fetchComparisonData();
  };

  // Build export of visible headers and rows (tab-separated)
  const buildExport = () => {
    if (!comparisonData || !comparisonData.batteries || comparisonData.batteries.length === 0) return '';
    const headers: string[] = [];
    staticColumns.forEach(c => { if (visibleColumns[c.key] !== false) headers.push(c.header); });
    supplierColumns.forEach(s => { if (visibleColumns[`supplier:${s}`] !== false) headers.push(s); });

    const rows = sortedBatteries.map((battery, idx) => {
      const cells: string[] = [];
      if (visibleColumns['index'] !== false) cells.push(String(idx + 1));
      if (visibleColumns['full_name'] !== false) cells.push(battery.full_name ?? '');
      if (visibleColumns['brand'] !== false) cells.push(battery.brand ?? '');
      if (visibleColumns['volume'] !== false) cells.push(battery.volume?.toString() ?? '');
      if (visibleColumns['c_amps'] !== false) cells.push(battery.c_amps?.toString() ?? '');
      if (visibleColumns['region'] !== false) cells.push(battery.region ?? '');
      if (visibleColumns['polarity'] !== false) cells.push(battery.polarity ?? '');
      if (visibleColumns['electrolyte'] !== false) cells.push(battery.electrolyte ?? '');
      supplierColumns.forEach(s => {
        if (visibleColumns[`supplier:${s}`] === false) return;
        const price = getPriceForSupplier(battery, s);
        cells.push(price !== null ? `${formatPrice(price)}₴` : '-');
      });
      if (visibleColumns['recommended'] !== false) {
        const r = battery.supplier_prices.find(sp => sp.recommended_price !== null)?.recommended_price ?? null;
        cells.push(r !== null ? `${formatPrice(r)}₴` : '-');
      }
      if (visibleColumns['actual'] !== false) {
        const v = calculateRecommendedPrice(battery);
        cells.push(v ? `${formatPrice(v)}₴` : '-');
      }
      if (visibleColumns['totalAvailability'] !== false) cells.push(String(getTotalAvailability(battery)));
      return cells.join('\t');
    });

    return `${headers.join('\t')}\n${rows.join('\n')}`;
  };

  // Використовуємо хук для сортування
  const { items: sortedBatteries, requestSort, sortConfig } = useSortableTable<BatteryWithSupplierPrices>(
    processedData,
    { key: 'full_name', direction: 'asc' } // Початкове сортування за назвою
  );

  // Compact Copy button to place inside filters' draggable actions block
  const copyTableButton = (
    <Button
      variant="outline"
      size="xs"
      className="h-8 px-2 text-xs"
      title="Копіювати таблицю"
      aria-label="Копіювати таблицю"
      onClick={() => {
        setCopying(true);
        const text = buildExport();
        if (!text) {
          toast({ title: 'Немає даних', description: 'Немає рядків для копіювання.', variant: 'destructive' });
          setCopying(false);
          return;
        }
        navigator.clipboard.writeText(text)
          .then(() => toast({ title: 'Скопійовано', description: 'Таблицю скопійовано в буфер обміну.', duration: 2000 }))
          .catch(() => toast({ title: 'Помилка', description: 'Не вдалося скопіювати таблицю.', variant: 'destructive' }))
          .finally(() => setCopying(false));
      }}
    >
      {copying ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        // Fetch brands
        const brandsData = await getBatteryBrands();
        setBrands(brandsData);
        
        // Fetch suppliers
        const suppliersData = await getBatterySuppliers();
        // Extract supplier names from supplier objects
        const supplierNames = suppliersData.map(s => s.name);
        setSuppliers(supplierNames);
      } catch (error) {
        console.error('Error fetching metadata:', error);
      }
    };
    
    fetchMetadata();
  }, []);

  const fetchComparisonData = async () => {
    try {
      const result = await getBatteryComparison({
        ...filters,
        page,
        page_size: pageSize
      }).unwrap();
      
      setComparisonData(result);
      // Не перезаписуємо локальні page/pageSize значення відповіддю сервера.
      // Якщо поточна сторінка виходить за межі доступних — зменшуємо її до максимальної.
      if (typeof result.total === 'number') {
        const maxPages = Math.max(1, Math.ceil(result.total / pageSize));
        if (page > maxPages) {
          setPage(maxPages);
          setFilters(prev => ({ ...prev, page: maxPages }));
        }
      }
      
      // Extract unique supplier names to use as columns
      if (result.batteries.length > 0) {
        const uniqueSuppliers = [...new Set(
          result.batteries.flatMap((battery: BatteryWithSupplierPrices) => 
            battery.supplier_prices.map((sp: SupplierPrice) => sp.supplier_name)
          )
        )] as string[];
        // Move any 'АКУМУЛЯТОР-Центр' / 'АКБ-ЦЕНТР' variants to the end, keep relative order
        const isTarget = (s: string) => {
          const lower = s.toLowerCase();
          return lower.includes('акумулятор') || lower.includes('акб-центр');
        };
        const others = uniqueSuppliers.filter(s => !isTarget(s));
        const targets = uniqueSuppliers.filter(s => isTarget(s));
        setSupplierColumns([...others, ...targets]);
      }
    } catch (error) {
      console.error('Error fetching comparison data:', error);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  // Page size change handler for footer pagination
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
    setFilters(prev => ({ ...prev, page: 1, page_size: newSize }));
  };

  const handleFiltersChange = (newFilters: Partial<BatteryPriceListRequestSchema>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
    setPage(1);
    // Встановлюємо прапор, що фільтри були застосовані
    setFiltersApplied(true);
  };

  // Format price with comma as a thousands separator
  const formatPrice = (price: number | null) => {
    if (price === null) return '-';
    // Round to whole hryvnias and format without kopecks
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

  // Handle row selection for bulk update
  const handleRowSelection = (batteryId: number, checked: boolean) => {
    setSelectedRowIds(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(batteryId);
      } else {
        newSet.delete(batteryId);
      }
      return newSet;
    });
  };

  // Select all rows currently in the dataset
  const handleSelectAll = () => {
    if (!processedData || processedData.length === 0) return;
    const allIds = new Set(processedData.map(b => b.id));
    setSelectedRowIds(allIds);
  };

  // Рекомендована ціна (як у сонячних панелях):
  // мінімальна додатна ціна серед постачальників + націнка рядка
  const calculateRecommendedPrice = (battery: BatteryWithSupplierPrices) => {
    const m = rowMarkup[battery.id] ?? DEFAULT_MARKUP;
    const prices = battery.supplier_prices
      .map(sp => sp.price)
      .filter((p): p is number => p !== null && p !== undefined && p > 0);
    if (prices.length === 0) return null;
    const minPrice = Math.min(...prices);
    return Math.round(minPrice * (1 + m / 100));
  };

  // Determine if any supplier has this battery available
  const isAvailable = (battery: BatteryWithSupplierPrices) => {
    return battery.supplier_prices.some(sp => sp.availability && sp.availability > 0);
  };

  // Get price for a specific supplier
  const getPriceForSupplier = (battery: BatteryWithSupplierPrices, supplierName: string) => {
    const supplierPrice = battery.supplier_prices.find(sp => sp.supplier_name === supplierName);
    return supplierPrice?.price || null;
  };

  // Get supplier price object for a specific supplier
  const getSupplierPriceObject = (battery: BatteryWithSupplierPrices, supplierName: string) => {
    return battery.supplier_prices.find(sp => sp.supplier_name === supplierName) || null;
  };

  // Check if price can be updated on the site (has site_id and price exists)
  const canUpdatePriceOnSite = (battery: BatteryWithSupplierPrices, supplierName: string) => {
    const supplierPrice = battery.supplier_prices.find(sp => sp.supplier_name === supplierName);
    return supplierPrice?.site_id !== null && 
           supplierPrice?.site_id !== undefined && 
           supplierPrice?.price !== null && 
           supplierPrice?.price !== undefined;
  };

  // Handle opening the price update modal
  const handleOpenPriceUpdateModal = (battery: BatteryWithSupplierPrices, supplierName: string) => {
    const supplierPrice = getSupplierPriceObject(battery, supplierName);
    
    if (supplierPrice && supplierPrice.site_id) {
      setSelectedPriceInfo({
        id: supplierPrice.site_id,
        price: supplierPrice.price,
        promo_price: supplierPrice.promo_price || null,
        availability: supplierPrice.availability !== undefined ? String(supplierPrice.availability) : null,
        productName: `${battery.full_name}${battery.region ? ` (${battery.region})` : ''} — ${supplierName}`
      });
      setUpdatePriceModalOpen(true);
    }
  };

  // Handle submitting the price update
  const handlePriceUpdate = async (data: UpdateSitePriceRequest) => {
    try {
      await updateBatterySitePrice(data);
      setUpdatePriceModalOpen(false);
      fetchComparisonData(); // Refresh data after update
    } catch (error) {
      console.error('Error updating price:', error);
    }
  };

  // Calculate total availability for a battery across all suppliers
  const getTotalAvailability = (battery: BatteryWithSupplierPrices) => {
    return battery.supplier_prices.reduce((total, sp) => total + (sp.availability || 0), 0);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4">Порівняння цін на акумулятори</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-4">
          <div className="mb-4">
            <BatteryComparisonFilters 
              current={filters}
              setFilters={handleFiltersChange}
              brands={brands}
              suppliers={suppliers}
            />
          </div>
          {/* Top-right actions toolbar (outside of filter drags) */}
          <div className="w-full flex items-center justify-end gap-2 mb-2">
            <RefreshDataButton
              variant="outline"
              onRefresh={async () => {
                await refreshBatteriesData();
                await fetchComparisonData();
              }}
            />
            {copyTableButton}
            {settingsButton}
          </div>
          {filtersApplied ? (
            <Table className="text-[11px] leading-4 [&_th]:py-1 [&_td]:py-1 [&_th]:px-1.5 [&_td]:px-1.5">
              <TableHeader>
                <TableRow>
                  {visibleColumns['index'] !== false && (
                    <TableHead 
                      className="text-center w-8 text-xs cursor-pointer select-none" 
                      title="№"
                      onClick={() => requestSort('originalIndex')}
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
                      className="min-w-[140px] text-center cursor-pointer select-none"
                      onClick={(e) => requestSort('full_name', (e as any).shiftKey)} 
                      title="Shift+Клік — додати до сортування"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-[11px]">Назва</span>
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
                      className="text-center w-16 cursor-pointer select-none"
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
                  {visibleColumns['volume'] !== false && (
                    <TableHead 
                      className="hidden sm:table-cell w-8 text-center cursor-pointer select-none"
                      onClick={(e) => requestSort('volume', (e as any).shiftKey)} 
                      title="Shift+Клік — додати до сортування"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-xs">Ah</span>
                        {sortConfig?.key === 'volume' && (
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
                  {visibleColumns['c_amps'] !== false && (
                    <TableHead 
                      className="hidden sm:table-cell w-8 text-center cursor-pointer select-none"
                      onClick={(e) => requestSort('c_amps', (e as any).shiftKey)} 
                      title="Shift+Клік — додати до сортування"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-xs">A</span>
                        {sortConfig?.key === 'c_amps' && (
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
                  {visibleColumns['region'] !== false && (
                    <TableHead 
                      className="hidden lg:table-cell w-8 text-center text-xs cursor-pointer select-none"
                      onClick={(e) => requestSort('region', (e as any).shiftKey)} 
                      title="Shift+Клік — додати до сортування"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-xs">Рег</span>
                        {sortConfig?.key === 'region' && (
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
                  {visibleColumns['polarity'] !== false && (
                    <TableHead 
                      className="hidden lg:table-cell w-8 text-center text-xs cursor-pointer select-none" 
                      onClick={(e) => requestSort('polarity', (e as any).shiftKey)} 
                      title="Shift+Клік — додати до сортування"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-xs">Пол</span>
                        {sortConfig?.key === 'polarity' && (
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
                  {visibleColumns['electrolyte'] !== false && (
                    <TableHead 
                      className="hidden lg:table-cell w-8 text-center text-xs cursor-pointer select-none" 
                      onClick={(e) => requestSort('electrolyte', (e as any).shiftKey)} 
                      title="Shift+Клік — додати до сортування"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-xs">Ел</span>
                        {sortConfig?.key === 'electrolyte' && (
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
                  {/* Dynamic supplier headers */}
                  {supplierColumns.map((supplier, idx) => (
                  visibleColumns[`supplier:${supplier}`] !== false && (
                    <TableHead
                      key={`sup-head-${idx}-${supplier}`}
                      className="text-center cursor-pointer select-none"
                      onClick={(e) => requestSort(`supplierPrices.${supplier}`, (e as any).shiftKey)}
                      title="Shift+Клік — додати до сортування"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-xs truncate max-w-[88px]">{supplier}</span>
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
                      className="text-center w-12 cursor-pointer select-none"
                      onClick={(e) => requestSort('recommendedPrice', (e as any).shiftKey)} 
                      title="Shift+Клік — додати до сортування"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-[11px]">Рек</span>
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
                    <TableHead
                      className="text-center w-12 cursor-pointer select-none"
                      onClick={(e) => requestSort('markup', (e as any).shiftKey)}
                      title="Націнка, % (Shift+Клік — додати до сортування)"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-xs">Націнка</span>
                        {sortConfig?.key === 'markup' && (
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
                  {visibleColumns['actual'] !== false && (
                    <TableHead className="text-center w-12 select-none">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[11px]" title="Актуальна">Акт</span>
                        <div className="flex items-center gap-2">
                          {(() => {
                            const totalCount = processedData?.length ?? 0;
                            const allSelected = totalCount > 0 && selectedRowIds.size === totalCount;
                            return (
                              <label className="inline-flex items-center gap-1 cursor-pointer select-none">
                                <input
                                  type="radio"
                                  checked={allSelected}
                                  onClick={() => (allSelected ? setSelectedRowIds(new Set()) : handleSelectAll())}
                                  onChange={() => (allSelected ? setSelectedRowIds(new Set()) : handleSelectAll())}
                                  className="accent-primary focus:ring-0 w-3 h-3"
                                />
                                <span className="text-[10px]">Всі</span>
                              </label>
                            );
                          })()}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleBulkPriceUpdate}
                            disabled={selectedRowIds.size === 0}
                            className="text-[10px] px-1 py-0.5 h-5"
                          >
                            Заст
                          </Button>
                        </div>
                      </div>
                    </TableHead>
                  )}
                  {visibleColumns['totalAvailability'] !== false && (
                    <TableHead
                      className="text-center w-8 cursor-pointer select-none"
                      onClick={(e) => requestSort('totalAvailability', (e as any).shiftKey)} 
                      title="Shift+Клік — додати до сортування"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-xs">Наяв</span>
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
                  {sortedBatteries.map((battery, index) => (
                    <TableRow 
                      key={`battery-${battery.id}-${index}`}
                      className={
                        isAvailable(battery)
                          ? "hover:bg-muted/50 dark:hover:bg-muted/70"
                          : "hover:bg-muted/50 dark:hover:bg-muted/70 opacity-70"
                      }
                    >
                      {visibleColumns['index'] !== false && (
                        <TableCell className="text-center w-8 text-xs">{index + 1}</TableCell>
                      )}
                      {visibleColumns['full_name'] !== false && (
                        <TableCell
                          className="font-medium min-w-[140px] text-center truncate"
                          title={`${battery.full_name}${battery.region ? ` (${battery.region})` : ''}`}
                        >
                          {battery.full_name}{battery.region ? ` (${battery.region})` : ''}
                        </TableCell>
                      )}
                      {visibleColumns['brand'] !== false && (
                        <TableCell className="text-xs w-16 truncate text-center">{battery.brand}</TableCell>
                      )}
                      {visibleColumns['volume'] !== false && (
                        <TableCell className="hidden sm:table-cell text-center text-xs w-8">{battery.volume}</TableCell>
                      )}
                      {visibleColumns['c_amps'] !== false && (
                        <TableCell className="hidden sm:table-cell text-center text-xs w-8">{battery.c_amps}</TableCell>
                      )}
                      {visibleColumns['region'] !== false && (
                        <TableCell className="hidden lg:table-cell text-center text-xs w-8">{battery.region}</TableCell>
                      )}
                      {visibleColumns['polarity'] !== false && (
                        <TableCell className="hidden lg:table-cell text-center text-xs w-8">{battery.polarity}</TableCell>
                      )}
                      {visibleColumns['electrolyte'] !== false && (
                        <TableCell className="hidden lg:table-cell text-center text-xs w-8">{battery.electrolyte}</TableCell>
                      )}
                      
                      {/* Supplier price columns */}
                      {supplierColumns.map((supplier) => {
                        if (visibleColumns[`supplier:${supplier}`] === false) return null;
                        const price = getPriceForSupplier(battery, supplier);
                        const canUpdate = canUpdatePriceOnSite(battery, supplier);
                        return (
                          <TableCell 
                            key={supplier} 
                            className="text-center font-medium w-24"
                          >
                            <div className="flex flex-col items-center gap-0.5">
                              {price !== null ? (
                                <div className="flex items-center gap-1 whitespace-nowrap">
                                  <span className="text-primary dark:text-primary-foreground font-medium text-[11px]">
                                    {formatPrice(price)}₴
                                  </span>
                                  {canUpdate && (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="text-[10px] px-1 py-0.5 h-5 bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 hover:text-purple-800"
                                      onClick={() => handleOpenPriceUpdateModal(battery, supplier)}
                                    >
                                      Онов
                                    </Button>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[11px]">-</span>
                              )}
                              {getSupplierPriceObject(battery, supplier)?.updated_at && (
                                <span className="text-[10px] text-gray-500 whitespace-nowrap">
                                  {formatDateWithTime(getSupplierPriceObject(battery, supplier)?.updated_at as string)}
                                </span>
                              )}
                            </div>
                          </TableCell>
                        );
                      })}
                      
                      {/* Recommended price column */}
                      {visibleColumns['recommended'] !== false && (
                        <TableCell className="text-center font-medium">
                          {battery.supplier_prices.some(sp => sp.recommended_price !== null) ? (
                            <div className="flex flex-col items-center">
                              <span className="text-purple-700 dark:text-purple-400 font-medium text-[11px]">
                                {formatPrice(battery.supplier_prices.find(sp => sp.recommended_price !== null)?.recommended_price || null)}&nbsp;₴
                              </span>
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      )}
                      {visibleColumns['markup'] !== false && (
                        <TableCell className="text-center">
                          <input
                            type="number"
                            min={0}
                            max={500}
                            step={1}
                            value={rowMarkup[battery.id] ?? DEFAULT_MARKUP}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setRowMarkup(prev => ({ ...prev, [battery.id]: isNaN(val) ? DEFAULT_MARKUP : val }));
                            }}
                            className="w-14 h-6 text-xs text-center border rounded px-1"
                            title="Націнка, %"
                          />
                        </TableCell>
                      )}
                      
                      {/* Actual price display column */}
                      {visibleColumns['actual'] !== false && (
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedRowIds.has(battery.id)}
                              onChange={(e) => handleRowSelection(battery.id, e.target.checked)}
                              className="w-4 h-4"
                            />
                            {selectedRowIds.has(battery.id) && (
                              <>
                                {calculateRecommendedPrice && calculateRecommendedPrice(battery) ? (
                                  <span className="text-blue-700 font-medium text-sm">
                                    {formatPrice(calculateRecommendedPrice(battery))}&nbsp;₴
                                  </span>
                                ) : (
                                  <span className="text-xs text-muted-foreground">Немає ціни</span>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-[10px] px-1 py-0.5 h-5"
                                  onClick={() => handleApplyRow(battery)}
                                  disabled={updatingRowIds.has(battery.id)}
                                >
                                  {updatingRowIds.has(battery.id) ? '...' : 'Застосувати'}
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      )}
                      
                      {/* Total availability column */}
                      {visibleColumns['totalAvailability'] !== false && (
                        <TableCell className="text-center">
                          {getTotalAvailability(battery) > 0 ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              {getTotalAvailability(battery)}
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
                {comparisonData?.batteries.length === 0
                  ? "Не знайдено акумуляторів за вашими критеріями"
                  : "Немає даних для відображення"}
              </div>
            )}
        </div>
        
        {comparisonData && (
          <div className="p-2 sm:p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Показано {(effectivePage - 1) * effectivePageSize + 1} - {Math.min(effectivePage * effectivePageSize, comparisonData.total)} з {comparisonData.total}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs sm:text-sm text-muted-foreground">На сторінці:</span>
                  <select
                    className="p-1 text-xs sm:text-sm rounded border border-gray-300 dark:border-gray-600 bg-background"
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
              <Pagination
                currentPage={page}
                totalPages={Math.ceil(comparisonData.total / pageSize)}
                onPageChange={handlePageChange}
              />
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
