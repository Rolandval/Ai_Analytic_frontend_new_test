import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { useGetSupplierSolarPanelComparisonMutation } from '@/services/solarPanelComparison.api';
import { getSolarPanelBrands, getSolarPanelSuppliers } from '@/services/solarPanelPrices.api';
import { SolarPanelPriceListRequestSchema } from '@/types/solarPanels';
import { SolarPanelComparisonFilters } from '@/components/filters/SolarPanelComparisonFilters';
import { Pagination } from '@/components/ui/Pagination';
import { RefreshDataButton } from '@/components/ui/RefreshDataButton';
import { refreshSolarPanelsData } from '@/services/dataRefresh.api';
import { PriceUpdateModal } from '@/components/PriceUpdateModal';
import { updateSolarPanelSitePrice, UpdateSitePriceRequest } from '@/services/sitePrice.api';
import { useSortableTable } from '@/hooks/useSortableTable';
import { ChevronUp, ChevronDown, Settings, Copy, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { Checkbox } from '@/components/ui/Checkbox';
import { Label } from '@/components/ui/Label';
import { useToast } from '@/hooks/use-toast';
// removed radio-group imports; using a single native radio input for unified toggle

// Інтерфейс для цін постачальників
interface SupplierPrice {
  supplier_id: number;
  supplier_name: string;
  supplier_url: string | null;
  supplier_status: string;
  price: number | null;
  availability: number | null;
  site_id: number | null;
  date: string | null;
  updated_at: string | null;
  recommended_price: number | null;
  promo_price: number | null;
}

// Інтерфейс для сонячної панелі з цінами постачальників
interface SolarPanelWithSupplierPrices {
  id: number;
  panel_id: number;
  full_name: string;
  brand: string;
  power: number | null;
  thickness: number | null;
  panel_type: string | null;
  cell_type: string | null;
  panel_color: string | null;
  frame_color: string | null;
  supplier_prices: SupplierPrice[];
}

// Інтерфейс для відповіді API
interface SolarPanelComparisonResponse {
  panels: SolarPanelWithSupplierPrices[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export default function SolarPanelPriceComparison() {
  const [pageSize, setPageSize] = useState(10); // Динамічний розмір сторінки
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<SolarPanelPriceListRequestSchema>({
    page: page,
    page_size: pageSize,
    suppliers: [],
    power_min: undefined,
    power_max: undefined,
    thickness_min: undefined,
    thickness_max: undefined
  });
  const [comparisonData, setComparisonData] = useState<SolarPanelComparisonResponse | null>(null);
  const [processedData, setProcessedData] = useState<SolarPanelWithSupplierPrices[]>([]);
  const [supplierColumns, setSupplierColumns] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});
  // Copying state
  const [copying, setCopying] = useState(false);
  const { toast } = useToast();
  const [updatePriceModalOpen, setUpdatePriceModalOpen] = useState(false);
  const [selectedPriceInfo, setSelectedPriceInfo] = useState<{
    id: number | null;
    price: number | null;
    promo_price: number | null;
    availability: string | null;
    productName: string;
  }>({ id: null, price: null, promo_price: null, availability: null, productName: '' });

  const [getSolarPanelComparison, { isLoading }] = useGetSupplierSolarPanelComparisonMutation();
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  // removed selectionMode; unified single radio toggle will derive state from selection

  // Прапор для відстеження, чи були застосовані фільтри користувачем
  const [filtersApplied, setFiltersApplied] = useState(false);

  // Стан для актуальних цін
  const markup = 15; // Фіксована націнка 15%
  const [selectedRowIds, setSelectedRowIds] = useState<Set<number>>(new Set());
  const [updatingRowIds, setUpdatingRowIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Виконуємо запит тільки якщо фільтри були застосовані
    if (filtersApplied) {
      const timeoutId = setTimeout(() => {
        fetchComparisonData();
      }, 500); // Збільшуємо debounce до 500ms для зменшення мерехтіння
      
      return () => clearTimeout(timeoutId);
    }
  }, [filters, filtersApplied]);

  // Обробляємо дані для сортування, додаючи обчислювані властивості
  useEffect(() => {
    if (comparisonData?.panels) {
      const data = comparisonData.panels.map(panel => ({
        ...panel,
        totalAvailability: getTotalAvailability(panel)
      }));
      setProcessedData(data);
    }
  }, [comparisonData]);

  // Використовуємо хук для сортування
  const { items: sortedPanels, requestSort, sortConfig } = useSortableTable<SolarPanelWithSupplierPrices>(
    processedData,
    { key: 'full_name', direction: 'asc' } // Початкове сортування за назвою
  );

  // LS key
  const LS_COLUMNS_KEY = 'solarPanelComparison.columnVisibility';

  // Define static columns list and headers
  const staticColumns = useMemo(() => ([
    { key: 'index', header: '№' },
    { key: 'full_name', header: 'Назва' },
    { key: 'brand', header: 'Бренд' },
    { key: 'power', header: 'Вт' },
    { key: 'thickness', header: 'Товщ' },
    { key: 'panel_type', header: 'Тип' },
    { key: 'cell_type', header: 'Ком' },
    { key: 'recommended', header: 'Рек' },
    { key: 'actual', header: 'Акт' },
    { key: 'totalAvailability', header: 'Наяв' },
  ]), []);

  // Initialize column visibility
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_COLUMNS_KEY);
      if (stored) {
        setVisibleColumns(JSON.parse(stored));
        return;
      }
    } catch {}
    const initial: Record<string, boolean> = {};
    staticColumns.forEach(c => { initial[c.key] = true; });
    supplierColumns.forEach(s => { initial[`supplier:${s}`] = true; });
    setVisibleColumns(initial);
  }, [supplierColumns, staticColumns]);

  const saveVisibleColumns = (cfg: Record<string, boolean>) => {
    setVisibleColumns(cfg);
    try { localStorage.setItem(LS_COLUMNS_KEY, JSON.stringify(cfg)); } catch {}
  };

  // Apply single row update
  const handleApplyRow = async (panel: SolarPanelWithSupplierPrices) => {
    if (updatingRowIds.has(panel.id)) return;
    const priceToApply = calculateRecommendedPrice(panel);
    if (!priceToApply) {
      toast({ title: 'Немає ціни', description: 'Не вдалося розрахувати актуальну ціну.', variant: 'destructive' });
      return;
    }
    const siteEntry = panel.supplier_prices.find(sp => sp.site_id);
    if (!siteEntry?.site_id) {
      toast({ title: 'Немає site_id', description: 'Не знайдено товар на сайті для оновлення.', variant: 'destructive' });
      return;
    }
    setUpdatingRowIds(prev => new Set(prev).add(panel.id));
    const payload: UpdateSitePriceRequest = { site_id: siteEntry.site_id, price: priceToApply };
    try {
      await updateSolarPanelSitePrice(payload);
      toast({ title: 'Успіх', description: 'Ціну оновлено на сайті.' });
      await fetchComparisonData();
    } catch (e) {
      console.error(e);
      toast({ title: 'Помилка', description: 'Не вдалося оновити ціну.', variant: 'destructive' });
    } finally {
      setUpdatingRowIds(prev => {
        const next = new Set(prev);
        next.delete(panel.id);
        return next;
      });
    }
  };

  // Build export of visible headers and rows
  const buildExport = () => {
    if (!comparisonData || !comparisonData.panels || comparisonData.panels.length === 0) return '';
    const headers: string[] = [];
    staticColumns.forEach(c => { if (visibleColumns[c.key] !== false) headers.push(c.header); });
    supplierColumns.forEach(s => { if (visibleColumns[`supplier:${s}`] !== false) headers.push(s); });

    const rows = sortedPanels.map((panel, idx) => {
      const cells: string[] = [];
      if (visibleColumns['index'] !== false) cells.push(String((page - 1) * pageSize + idx + 1));
      if (visibleColumns['full_name'] !== false) cells.push(panel.full_name ?? '');
      if (visibleColumns['brand'] !== false) cells.push(panel.brand ?? '');
      if (visibleColumns['power'] !== false) cells.push(panel.power?.toString() ?? '');
      if (visibleColumns['thickness'] !== false) cells.push(panel.thickness?.toString() ?? '');
      if (visibleColumns['panel_type'] !== false) cells.push(panel.panel_type ?? '');
      if (visibleColumns['cell_type'] !== false) cells.push(panel.cell_type ?? '');
      supplierColumns.forEach(s => {
        if (visibleColumns[`supplier:${s}`] === false) return;
        const price = getPriceForSupplier(panel, s);
        cells.push(price !== null ? `${formatPrice(price)}₴` : '-');
      });
      if (visibleColumns['recommended'] !== false) {
        const r = panel.supplier_prices.find(sp => sp.recommended_price !== null)?.recommended_price ?? null;
        cells.push(r !== null ? `${formatPrice(r)}₴` : '-');
      }
      if (visibleColumns['actual'] !== false) {
        const v = calculateRecommendedPrice(panel);
        cells.push(v ? `${formatPrice(v)}₴` : '-');
      }
      if (visibleColumns['totalAvailability'] !== false) cells.push(String(getTotalAvailability(panel)));
      return cells.join('\t');
    });

    return `${headers.join('\t')}\n${rows.join('\n')}`;
  };

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        // Fetch brands
        const brandsData = await getSolarPanelBrands();
        setBrands(brandsData);
        
        // Fetch suppliers
        const suppliersData = await getSolarPanelSuppliers();
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
      const result = await getSolarPanelComparison({
        ...filters,
        page,
        page_size: pageSize
      }).unwrap();
      
      setComparisonData(result);
      
      // Extract unique supplier names to use as columns
      if (result.panels.length > 0) {
        // Normalize, filter falsy, and deduplicate supplier names
        const rawNames = result.panels.flatMap((panel: SolarPanelWithSupplierPrices) =>
          panel.supplier_prices.map((sp: SupplierPrice) => (sp.supplier_name ?? '').toString().trim())
        );
        const cleaned = rawNames.filter((n) => n.length > 0);
        const uniqueSuppliers = Array.from(new Set(cleaned));
        setSupplierColumns(uniqueSuppliers);
      }
    } catch (error) {
      console.error('Error fetching comparison data:', error);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setFilters((prev: SolarPanelPriceListRequestSchema) => ({ ...prev, page: newPage }));
  };

  const handleFiltersChange = (newFilters: Partial<SolarPanelPriceListRequestSchema>) => {
    setFilters((prev: SolarPanelPriceListRequestSchema) => ({ ...prev, ...newFilters, page: 1 }));
    setPage(1);
    // Встановлюємо прапор, що фільтри були застосовані
    setFiltersApplied(true);
  };
  
  // Ця функція не використовується в поточній реалізації, але залишена для майбутнього використання

  // Format price in UAH without kopecks (no fractional digits)
  const formatPrice = (price: number | null) => {
    if (price === null) return '-';
    return Math.round(price).toLocaleString('uk-UA', { maximumFractionDigits: 0 });
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

  // Determine price color based on recommended price comparison
  const getPriceColorClass = (price: number | null, recommendedPrice: number | null) => {
    if (price === null || recommendedPrice === null) return '';
    
    // Calculate percentage difference
    const percentDiff = ((price - recommendedPrice) / recommendedPrice) * 100;
    
    if (percentDiff <= 15) return 'text-green-600 font-medium';
    if (percentDiff <= 20) return 'text-yellow-600 font-medium';
    if (percentDiff <= 25) return 'text-orange-500 font-medium';
    return 'text-red-600 font-medium';
  };


  // Determine if any supplier has this panel available
  const isAvailable = (panel: SolarPanelWithSupplierPrices) => {
    return panel.supplier_prices.some(sp => sp.availability && sp.availability > 0);
  };

  // Get price for a specific supplier
  const getPriceForSupplier = (panel: SolarPanelWithSupplierPrices, supplierName: string) => {
    const supplierPrice = panel.supplier_prices.find(sp => sp.supplier_name === supplierName);
    return supplierPrice?.price ?? null;
  };
  
  // Get supplier price object for a specific supplier
  const getSupplierPriceObject = (panel: SolarPanelWithSupplierPrices, supplierName: string) => {
    return panel.supplier_prices.find(sp => sp.supplier_name === supplierName) || null;
  };
  
  // Calculate recommended price with markup
  const calculateRecommendedPrice = (panel: SolarPanelWithSupplierPrices) => {
    const minPrice = Math.min(...panel.supplier_prices
      .map(sp => sp.price)
      .filter(price => price !== null && price > 0) as number[]);
    
    if (!isFinite(minPrice)) return null;
    
    return Math.round(minPrice * (1 + markup / 100));
  };

  // Handle row selection for bulk update
  const handleRowSelection = (panelId: number, checked: boolean) => {
    setSelectedRowIds(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(panelId);
      } else {
        newSet.delete(panelId);
      }
      return newSet;
    });
  };

  // Check if price can be updated on the site (has site_id and price exists)
  const canUpdatePriceOnSite = (panel: SolarPanelWithSupplierPrices, supplierName: string) => {
    const supplierPrice = panel.supplier_prices.find(sp => sp.supplier_name === supplierName);
    return supplierPrice?.site_id !== null && 
           supplierPrice?.site_id !== undefined && 
           supplierPrice?.price !== null && 
           supplierPrice?.price !== undefined;
  };

  // Handle select all
  const handleSelectAll = () => {
    if (!comparisonData?.panels) return;
    const allPanelIds = new Set(comparisonData.panels.map(panel => panel.id));
    setSelectedRowIds(allPanelIds);
  };

  // removed handleDeselectAll (no longer used)

  // Handle bulk price update (per selected rows)
  const handleBulkPriceUpdate = async () => {
    if (!comparisonData?.panels || selectedRowIds.size === 0) return;
    setIsBulkUpdating(true);
    const selectedPanels = comparisonData.panels.filter(p => selectedRowIds.has(p.id));
    const updates = selectedPanels.map(async (panel) => {
      const priceToApply = calculateRecommendedPrice(panel);
      if (!priceToApply) return Promise.resolve('skip');
      // find any supplier entry with site_id to update
      const siteEntry = panel.supplier_prices.find(sp => sp.site_id);
      if (!siteEntry?.site_id) return Promise.resolve('skip');
      const payload: UpdateSitePriceRequest = { site_id: siteEntry.site_id, price: priceToApply };
      try {
        await updateSolarPanelSitePrice(payload);
        return 'ok';
      } catch (e) {
        console.error('Bulk update error (panel)', panel.id, e);
        return 'error';
      }
    });
    const results = await Promise.allSettled(updates);
    const okCount = results.filter(r => r.status === 'fulfilled').length;
    // eslint-disable-next-line no-alert
    alert(`Оновлено цін: ${okCount} / ${selectedPanels.length}`);
    setSelectedRowIds(new Set());
    await fetchComparisonData();
    setIsBulkUpdating(false);
  };
  
  // Handle opening the price update modal
  const handleOpenPriceUpdateModal = (panel: SolarPanelWithSupplierPrices, supplierName: string) => {
    const supplierPrice = getSupplierPriceObject(panel, supplierName);
    if (supplierPrice && supplierPrice.site_id) {
      setSelectedPriceInfo({
        id: supplierPrice.site_id,
        price: supplierPrice.price,
        promo_price: supplierPrice.promo_price || null,
        availability: supplierPrice.availability !== undefined ? String(supplierPrice.availability) : null,
        productName: `${panel.full_name} (${supplierName})`,
      });
      setUpdatePriceModalOpen(true);
    }
  };
  
  // Handle submitting the price update
  const handlePriceUpdate = async (data: UpdateSitePriceRequest) => {
    if (selectedPriceInfo.id === null) return;
    
    try {
      // Виклик API з правильним форматом даних - об'єкт UpdateSitePriceRequest
      await updateSolarPanelSitePrice(data); // Передаємо об'єкт повністю
      await fetchComparisonData(); // Refresh data after update
      return Promise.resolve();
    } catch (error) {
      console.error('Error updating price:', error);
      return Promise.reject(error);
    }
  };

  // Calculate total availability for a panel across all suppliers
  const getTotalAvailability = (panel: SolarPanelWithSupplierPrices) => {
    return panel.supplier_prices.reduce((total, sp) => total + (sp.availability || 0), 0);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4">Порівняння цін на сонячні панелі</h1>
      
      <div className="space-y-4 mb-4">
        <SolarPanelComparisonFilters 
          current={filters}
          setFilters={handleFiltersChange}
          brands={brands}
          suppliers={suppliers}
        />
      </div>
      
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <RefreshDataButton onRefresh={refreshSolarPanelsData} />
        {/* Copy */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setCopying(true);
            const text = buildExport();
            if (!text) { setCopying(false); return; }
            navigator.clipboard.writeText(text)
              .then(() => toast({ title: 'Скопійовано!', description: 'Дані таблиці скопійовані в буфер обміну.', duration: 2500 }))
              .catch(() => toast({ title: 'Помилка', description: 'Не вдалося скопіювати дані таблиці.', variant: 'destructive', duration: 3000 }))
              .finally(() => setCopying(false));
          }}
        >
          {copying ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>

        {/* Settings */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
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
                      ['index','full_name','brand','power','recommended','actual','totalAvailability'].forEach(k => minimal[k] = true);
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
        
        {selectedRowIds.size > 0 && (
          <>
            <span className="text-xs text-blue-700 ml-2">
              Вибрано: {selectedRowIds.size}
            </span>
            <Button 
              onClick={handleBulkPriceUpdate}
              disabled={isBulkUpdating}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-xs px-2 py-1 h-7"
            >
              {isBulkUpdating ? 'Оновлення...' : 'Застосувати всі обрані'}
            </Button>
          </>
        )}
      </div>

      {!isLoading && comparisonData && comparisonData.panels.length === 0 && (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
          <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200">
              Нічого не знайдено
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Змініть параметри фільтрації або оновіть дані про наявність.
            </p>
          </div>
        </div>
      )}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-auto">
          <div className="p-4">
            {!filtersApplied ? (
              <div className="text-center py-10 text-gray-500">
                <p className="font-medium">Застосуйте фільтри для відображення даних</p>
                <p className="text-sm mt-2">Виберіть параметри фільтрації вище для завантаження даних</p>
              </div>
            ) : comparisonData && comparisonData.panels.length > 0 ? (
              <Table
                className="text-[11px] leading-4 [&_th]:py-1 [&_td]:py-1 [&_th]:px-1.5 [&_td]:px-1.5"
                style={{ userSelect: 'text' }}
              >
                <TableHeader className="[&_th]:cursor-pointer" style={{userSelect: 'none'}}>
                  <TableRow>
                    {visibleColumns['index'] !== false && (
                      <TableHead className="text-center w-8 text-xs" title="Номер">№</TableHead>
                    )}
                    {visibleColumns['full_name'] !== false && (
                      <TableHead 
                        className="min-w-[180px] text-center"
                        onClick={() => requestSort('full_name')}
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
                      <TableHead className="text-xs w-16 truncate text-center" title="Бренд">
                        <span className="whitespace-nowrap">Бренд</span>
                      </TableHead>
                    )}
                    {visibleColumns['power'] !== false && (
                      <TableHead 
                        className="hidden sm:table-cell w-8 text-center"
                        onClick={() => requestSort('power')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-[11px]" title="Вати">Вт</span>
                          {sortConfig?.key === 'power' && (
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
                    {visibleColumns['thickness'] !== false && (
                      <TableHead className="hidden lg:table-cell w-8 text-center text-xs" title="Товщина">Товщ</TableHead>
                    )}
                    {visibleColumns['panel_type'] !== false && (
                      <TableHead className="hidden lg:table-cell w-8 text-center text-xs">Тип</TableHead>
                    )}
                    {visibleColumns['cell_type'] !== false && (
                      <TableHead className="hidden lg:table-cell w-8 text-center text-xs" title="Комірки">Ком</TableHead>
                    )}
                    {supplierColumns.map((supplier, idx) => (
                      visibleColumns[`supplier:${supplier}`] !== false && (
                        <TableHead
                          key={`sup-head-${idx}-${supplier}`}
                          className="text-center"
                          title={supplier}
                        >
                          <span className="text-[11px] truncate max-w-[90px] inline-block align-middle" title={supplier}>
                            {supplier}
                          </span>
                        </TableHead>
                      )
                    ))}
                    {visibleColumns['recommended'] !== false && (
                      <TableHead
                        className="text-center w-12"
                        onClick={() => requestSort('recommendedPrice')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-[11px]" title="Рекомендована">Рек</span>
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
                    {visibleColumns['actual'] !== false && (
                      <TableHead className="text-center w-12">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[11px]" title="Актуальна">Акт</span>
                          <div className="flex items-center gap-2">
                            {(() => {
                              const totalCount = comparisonData?.panels?.length ?? 0;
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
                        className="text-center w-8"
                        onClick={() => requestSort('totalAvailability')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-[11px]" title="Наявність">Наяв</span>
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
                  {/* Використовуємо відсортований масив */}
                  {sortedPanels.map((panel, index) => (
                    <TableRow 
                      key={panel.id}
                      className={
                        isAvailable(panel)
                          ? "hover:bg-muted/50 dark:hover:bg-muted/70"
                          : "hover:bg-muted/50 dark:hover:bg-muted/70 opacity-70"
                      }
                    >
                      {visibleColumns['index'] !== false && (
                        <TableCell className="text-center w-8 text-xs">{(page - 1) * pageSize + index + 1}</TableCell>
                      )}
                      {visibleColumns['full_name'] !== false && (
                        <TableCell
                          className="font-medium text-xs min-w-[180px] text-center"
                          title={panel.full_name}
                        >
                          <div className="truncate">
                            {panel.full_name}
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns['brand'] !== false && (
                        <TableCell className="text-xs text-center" title={panel.brand}>{panel.brand}</TableCell>
                      )}
                      {visibleColumns['power'] !== false && (
                        <TableCell className="hidden sm:table-cell text-center text-xs w-8">{panel.power}</TableCell>
                      )}
                      {visibleColumns['thickness'] !== false && (
                        <TableCell className="hidden lg:table-cell text-center text-xs w-8">{panel.thickness}</TableCell>
                      )}
                      {visibleColumns['panel_type'] !== false && (
                        <TableCell className="hidden lg:table-cell text-center text-xs w-8">{panel.panel_type}</TableCell>
                      )}
                      {visibleColumns['cell_type'] !== false && (
                        <TableCell className="hidden lg:table-cell text-center text-xs w-8">
                          <span className="whitespace-nowrap">{panel.cell_type}</span>
                        </TableCell>
                      )}
                      
                      {/* Supplier price columns */}
                      {supplierColumns.map((supplier, sIdx) => {
                        if (visibleColumns[`supplier:${supplier}`] === false) return null;
                        const price = getPriceForSupplier(panel, supplier);
                        const canUpdate = canUpdatePriceOnSite(panel, supplier);
                        const updatedAt = getSupplierPriceObject(panel, supplier)?.updated_at as string | undefined;
                        const priceClass = panel.supplier_prices.some(sp => sp.recommended_price !== null)
                          ? getPriceColorClass(price, panel.supplier_prices.find(sp => sp.recommended_price !== null)?.recommended_price || null)
                          : 'text-primary dark:text-primary-foreground font-medium';
                        return (
                          <TableCell 
                            key={`sup-cell-${panel.id}-${sIdx}-${supplier}`} 
                            className="text-center font-medium w-24"
                          >
                            <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                              {price !== null ? (
                                <span className={`${priceClass} text-xs`}>
                                  {formatPrice(price)}₴
                                </span>
                              ) : (
                                <span className="text-xs">-</span>
                              )}
                              {canUpdate && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-xs px-1 py-0.5 h-5 bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 hover:text-purple-800"
                                  onClick={() => handleOpenPriceUpdateModal(panel, supplier)}
                                >
                                  <span className="text-xs">Онов</span>
                                </Button>
                              )}
                            </div>
                            {updatedAt && (
                              <div className="mt-1 text-[10px] text-gray-500 whitespace-nowrap text-center">
                                {formatDateWithTime(updatedAt)}
                              </div>
                            )}
                          </TableCell>
                        );
                      })}
                      
                      {/* Recommended price column */}
                      {visibleColumns['recommended'] !== false && (
                        <TableCell className="text-center font-medium">
                          {panel.supplier_prices.some(sp => sp.recommended_price !== null) ? (
                            <div className="flex flex-col items-center">
                              <span className="text-purple-700 dark:text-purple-400 font-medium">
                                {formatPrice(panel.supplier_prices.find(sp => sp.recommended_price !== null)?.recommended_price || null)}&nbsp;₴
                              </span>
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      )}
                      
                      {/* Actual price display column */}
                      {visibleColumns['actual'] !== false && (
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedRowIds.has(panel.id)}
                              onChange={(e) => handleRowSelection(panel.id, e.target.checked)}
                              className="w-4 h-4"
                            />
                            {selectedRowIds.has(panel.id) && (
                              <>
                                {calculateRecommendedPrice(panel) ? (
                                  <span className="text-blue-700 font-medium text-sm">
                                    {formatPrice(calculateRecommendedPrice(panel))}&nbsp;₴
                                  </span>
                                ) : (
                                  <span className="text-xs text-muted-foreground">Немає ціни</span>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-[10px] px-1 py-0.5 h-5"
                                  onClick={() => handleApplyRow(panel)}
                                  disabled={updatingRowIds.has(panel.id)}
                                >
                                  {updatingRowIds.has(panel.id) ? '...' : 'Застосувати'}
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      )}
                      
                      {/* Total availability column */}
                      {visibleColumns['totalAvailability'] !== false && (
                        <TableCell className="text-center">
                          {getTotalAvailability(panel) > 0 ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              {getTotalAvailability(panel)}
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
                {comparisonData?.panels.length === 0
                  ? "Не знайдено сонячних панелей за вашими критеріями"
                  : "Немає даних для відображення"}
              </div>
            )}
          </div>
        </div>
        
        {comparisonData && (
          <div className="p-2 sm:p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Показано {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, comparisonData.total)} з {comparisonData.total}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs sm:text-sm text-muted-foreground">На сторінці:</span>
                  <select
                    className="p-1 text-xs sm:text-sm rounded border border-gray-300 dark:border-gray-600 bg-background"
                    value={pageSize}
                    onChange={(e) => {
                      const newSize = Number(e.target.value);
                      setPageSize(newSize);
                      setFilters(prev => ({ ...prev, page: 1, page_size: newSize }));
                      setPage(1);
                    }}
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
        siteId={selectedPriceInfo.id!} // Додаємо обов'язковий параметр site_id
      />
    </div>
  );
}
