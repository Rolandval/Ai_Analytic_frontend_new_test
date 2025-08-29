import { useEffect, useMemo, useState, useCallback, memo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useGetSupplierSolarPanelComparisonMutation } from '@/services/solarPanelComparison.api';
import { getSolarPanelBrands, getSolarPanelSuppliers } from '@/services/solarPanelPrices.api';
import { SolarPanelPriceListRequestSchema } from '@/types/solarPanels';
import { SolarPanelComparisonFilters } from '@/components/filters/SolarPanelComparisonFilters';
import { PriceUpdateModal } from '@/components/PriceUpdateModal';
import { updateSolarPanelSitePrice, UpdateSitePriceRequest } from '@/services/sitePrice.api';
import { useSortableTable } from '@/hooks/useSortableTable';
import { useToast } from '@/hooks/use-toast';
import { LoadingFallback } from '@/components/ui/LoadingFallback';

// Інтерфейси
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

interface SolarPanelComparisonResponse {
  panels: SolarPanelWithSupplierPrices[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

// Мемоізований компонент рядка таблиці
const VirtualizedPanelRow = memo(({ 
  index, 
  style, 
  data 
}: { 
  index: number; 
  style: React.CSSProperties; 
  data: {
    panels: SolarPanelWithSupplierPrices[];
    visibleColumns: Record<string, boolean>;
    supplierColumns: string[];
    rowMarkup: Record<number, number>;
    selectedRowIds: Set<number>;
    onRowSelection: (id: number, checked: boolean) => void;
    onMarkupChange: (id: number, markup: number) => void;
    onApplyRow: (panel: SolarPanelWithSupplierPrices) => void;
    onOpenPriceModal: (panel: SolarPanelWithSupplierPrices, supplier: string) => void;
    formatPrice: (price: number | null) => string;
    calculateRecommendedPrice: (panel: SolarPanelWithSupplierPrices) => number | null;
    getPriceForSupplier: (panel: SolarPanelWithSupplierPrices, supplier: string) => number | null;
    getTotalAvailability: (panel: SolarPanelWithSupplierPrices) => number;
    isAvailable: (panel: SolarPanelWithSupplierPrices) => boolean;
    canUpdatePriceOnSite: (panel: SolarPanelWithSupplierPrices, supplier: string) => boolean;
    updatingRowIds: Set<number>;
    displayPage: number;
    displayPageSize: number;
  }
}) => {
  const panel = data.panels[index];
  if (!panel) return null;

  const isRowAvailable = data.isAvailable(panel);
  const recommendedPrice = data.calculateRecommendedPrice(panel);
  const totalAvailability = data.getTotalAvailability(panel);

  return (
    <div 
      style={style} 
      className={`flex items-center border-b border-gray-200 hover:bg-gray-50 px-2 ${
        isRowAvailable ? '' : 'opacity-70'
      }`}
    >
      {/* Номер */}
      {data.visibleColumns['index'] !== false && (
        <div className="w-12 text-center text-xs">
          {(data.displayPage - 1) * data.displayPageSize + index + 1}
        </div>
      )}
      
      {/* Назва */}
      {data.visibleColumns['full_name'] !== false && (
        <div className="flex-1 min-w-[180px] text-xs font-medium truncate px-2" title={panel.full_name}>
          {panel.full_name}
        </div>
      )}
      
      {/* Бренд */}
      {data.visibleColumns['brand'] !== false && (
        <div className="w-20 text-xs text-center truncate" title={panel.brand}>
          {panel.brand}
        </div>
      )}
      
      {/* Потужність */}
      {data.visibleColumns['power'] !== false && (
        <div className="w-16 text-xs text-center">
          {panel.power}
        </div>
      )}
      
      {/* Ціни постачальників */}
      {data.supplierColumns.map((supplier) => {
        if (data.visibleColumns[`supplier:${supplier}`] === false) return null;
        const price = data.getPriceForSupplier(panel, supplier);
        const canUpdate = data.canUpdatePriceOnSite(panel, supplier);
        
        return (
          <div key={supplier} className="w-24 text-center">
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-medium">
                {price !== null ? `${data.formatPrice(price)}₴` : '-'}
              </span>
              {canUpdate && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-xs px-1 py-0.5 h-5"
                  onClick={() => data.onOpenPriceModal(panel, supplier)}
                >
                  Онов
                </Button>
              )}
            </div>
          </div>
        );
      })}
      
      {/* Рекомендована ціна */}
      {data.visibleColumns['recommended'] !== false && (
        <div className="w-20 text-center text-xs font-medium text-purple-700">
          {panel.supplier_prices.some(sp => sp.recommended_price !== null) ? (
            `${data.formatPrice(panel.supplier_prices.find(sp => sp.recommended_price !== null)?.recommended_price || null)}₴`
          ) : '-'}
        </div>
      )}
      
      {/* Націнка */}
      {data.visibleColumns['markup'] !== false && (
        <div className="w-16 text-center">
          <input
            type="number"
            min={0}
            max={500}
            step={1}
            value={data.rowMarkup[panel.id] ?? 15}
            onChange={(e) => {
              const val = Number(e.target.value);
              data.onMarkupChange(panel.id, isNaN(val) ? 15 : val);
            }}
            className="w-14 h-6 text-xs text-center border rounded px-1"
          />
        </div>
      )}
      
      {/* Актуальна ціна */}
      {data.visibleColumns['actual'] !== false && (
        <div className="w-24 text-center">
          <div className="flex flex-col items-center gap-1">
            <input
              type="checkbox"
              checked={data.selectedRowIds.has(panel.id)}
              onChange={(e) => data.onRowSelection(panel.id, e.target.checked)}
              className="w-4 h-4"
            />
            {data.selectedRowIds.has(panel.id) && (
              <>
                {recommendedPrice ? (
                  <span className="text-blue-700 font-medium text-xs">
                    {data.formatPrice(recommendedPrice)}₴
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Немає</span>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs px-1 py-0.5 h-5"
                  onClick={() => data.onApplyRow(panel)}
                  disabled={data.updatingRowIds.has(panel.id)}
                >
                  {data.updatingRowIds.has(panel.id) ? '...' : 'Заст'}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Наявність */}
      {data.visibleColumns['totalAvailability'] !== false && (
        <div className="w-20 text-center">
          {totalAvailability > 0 ? (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
              {totalAvailability}
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
              Немає
            </Badge>
          )}
        </div>
      )}
    </div>
  );
});

VirtualizedPanelRow.displayName = 'VirtualizedPanelRow';

export default function SolarPanelPriceComparisonVirtualized() {
  const [pageSize, setPageSize] = useState(100);
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
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});
  const [rowMarkup, setRowMarkup] = useState<Record<number, number>>({});
  const [selectedRowIds, setSelectedRowIds] = useState<Set<number>>(new Set());
  const [updatingRowIds, setUpdatingRowIds] = useState<Set<number>>(new Set());
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [updatePriceModalOpen, setUpdatePriceModalOpen] = useState(false);
  const [selectedPriceInfo, setSelectedPriceInfo] = useState<{
    id: number | null;
    price: number | null;
    promo_price: number | null;
    availability: string | null;
    productName: string;
  }>({ id: null, price: null, promo_price: null, availability: null, productName: '' });

  const { toast } = useToast();
  const [getSolarPanelComparison, { isLoading }] = useGetSupplierSolarPanelComparisonMutation();

  // Мемоізовані функції
  const formatPrice = useCallback((price: number | null) => {
    if (price === null) return '-';
    return Math.round(price).toLocaleString('uk-UA', { maximumFractionDigits: 0 });
  }, []);

  const calculateRecommendedPrice = useCallback((panel: SolarPanelWithSupplierPrices) => {
    const recommended = panel.supplier_prices.find(sp => sp.recommended_price !== null)?.recommended_price ?? null;
    if (recommended === null || typeof recommended !== 'number' || !isFinite(recommended)) return null;
    const m = rowMarkup[panel.id] ?? 15;
    return Math.round(recommended * (1 + m / 100));
  }, [rowMarkup]);

  const getPriceForSupplier = useCallback((panel: SolarPanelWithSupplierPrices, supplierName: string) => {
    const supplierPrice = panel.supplier_prices.find(sp => sp.supplier_name === supplierName);
    return supplierPrice?.price ?? null;
  }, []);

  const getTotalAvailability = useCallback((panel: SolarPanelWithSupplierPrices) => {
    return panel.supplier_prices.reduce((total, sp) => total + (sp.availability || 0), 0);
  }, []);

  const isAvailable = useCallback((panel: SolarPanelWithSupplierPrices) => {
    return panel.supplier_prices.some(sp => sp.availability && sp.availability > 0);
  }, []);

  const canUpdatePriceOnSite = useCallback((panel: SolarPanelWithSupplierPrices, supplierName: string) => {
    const supplierPrice = panel.supplier_prices.find(sp => sp.supplier_name === supplierName);
    return supplierPrice?.site_id !== null && 
           supplierPrice?.site_id !== undefined && 
           supplierPrice?.price !== null && 
           supplierPrice?.price !== undefined;
  }, []);

  // Обробка даних
  useEffect(() => {
    if (comparisonData?.panels) {
      const data = comparisonData.panels.map((panel, idx) => ({
        ...panel,
        totalAvailability: getTotalAvailability(panel),
        recommendedPrice: calculateRecommendedPrice(panel),
        markup: rowMarkup[panel.id] ?? 15,
        supplierPrices: Object.fromEntries(
          panel.supplier_prices.map(sp => [sp.supplier_name, sp.price])
        ),
        originalIndex: idx,
      }));
      setProcessedData(data);
    }
  }, [comparisonData, rowMarkup, getTotalAvailability, calculateRecommendedPrice]);

  // Сортування
  const { items: sortedPanels, requestSort, sortConfig } = useSortableTable<SolarPanelWithSupplierPrices>(
    processedData,
    { key: 'full_name', direction: 'asc' }
  );

  // Віртуалізовані дані для передачі в List
  const virtualizedData = useMemo(() => ({
    panels: sortedPanels,
    visibleColumns,
    supplierColumns,
    rowMarkup,
    selectedRowIds,
    onRowSelection: (panelId: number, checked: boolean) => {
      setSelectedRowIds(prev => {
        const newSet = new Set(prev);
        if (checked) {
          newSet.add(panelId);
        } else {
          newSet.delete(panelId);
        }
        return newSet;
      });
    },
    onMarkupChange: (id: number, markup: number) => {
      setRowMarkup(prev => ({ ...prev, [id]: markup }));
    },
    onApplyRow: async (panel: SolarPanelWithSupplierPrices) => {
      // Логіка застосування ціни
    },
    onOpenPriceModal: (panel: SolarPanelWithSupplierPrices, supplier: string) => {
      // Логіка відкриття модального вікна
    },
    formatPrice,
    calculateRecommendedPrice,
    getPriceForSupplier,
    getTotalAvailability,
    isAvailable,
    canUpdatePriceOnSite,
    updatingRowIds,
    displayPage: comparisonData?.page ?? page,
    displayPageSize: comparisonData?.page_size ?? pageSize,
  }), [
    sortedPanels, visibleColumns, supplierColumns, rowMarkup, selectedRowIds,
    formatPrice, calculateRecommendedPrice, getPriceForSupplier, getTotalAvailability,
    isAvailable, canUpdatePriceOnSite, updatingRowIds, comparisonData, page, pageSize
  ]);

  // Ініціалізація колонок
  useEffect(() => {
    const initial: Record<string, boolean> = {
      index: true,
      full_name: true,
      brand: true,
      power: true,
      recommended: true,
      markup: true,
      actual: true,
      totalAvailability: true
    };
    supplierColumns.forEach(s => { initial[`supplier:${s}`] = true; });
    setVisibleColumns(initial);
  }, [supplierColumns]);

  // Завантаження даних
  const fetchComparisonData = useCallback(async () => {
    try {
      const result = await getSolarPanelComparison({
        ...filters,
        page,
        page_size: pageSize
      }).unwrap();
      
      setComparisonData(result);
      
      if (result.panels.length > 0) {
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
  }, [getSolarPanelComparison, filters, page, pageSize]);

  // Debounced fetch
  useEffect(() => {
    if (filtersApplied) {
      const timeoutId = setTimeout(() => {
        fetchComparisonData();
      }, 250);
      return () => clearTimeout(timeoutId);
    }
  }, [filters, filtersApplied, fetchComparisonData]);

  // Завантаження метаданих
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [brandsData, suppliersData] = await Promise.all([
          getSolarPanelBrands(),
          getSolarPanelSuppliers()
        ]);
        setBrands(brandsData);
        setSuppliers(suppliersData.map((s: { name: string }) => s.name));
      } catch (error) {
        console.error('Error fetching metadata:', error);
      }
    };
    fetchMetadata();
  }, []);

  const handleFiltersChange = useCallback((newFilters: Partial<SolarPanelPriceListRequestSchema>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
    setPage(1);
    setFiltersApplied(true);
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4">
        Порівняння цін на сонячні панелі (Віртуалізовано)
      </h1>
      
      <div className="space-y-4 mb-4">
        <SolarPanelComparisonFilters 
          current={filters}
          setFilters={handleFiltersChange}
          brands={brands}
          suppliers={suppliers}
        />
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
        {!filtersApplied ? (
          <div className="text-center py-10 text-gray-500">
            <p className="font-medium">Застосуйте фільтри для відображення даних</p>
            <p className="text-sm mt-2">Виберіть параметри фільтрації вище для завантаження даних</p>
          </div>
        ) : isLoading ? (
          <LoadingFallback message="Завантаження даних..." />
        ) : comparisonData && comparisonData.panels.length > 0 ? (
          <div className="h-[600px]">
            {/* Заголовки таблиці */}
            <div className="flex items-center bg-gray-50 border-b font-medium text-sm text-gray-700 px-2 py-2">
              {visibleColumns['index'] !== false && <div className="w-12 text-center">№</div>}
              {visibleColumns['full_name'] !== false && <div className="flex-1 min-w-[180px] px-2">Назва</div>}
              {visibleColumns['brand'] !== false && <div className="w-20 text-center">Бренд</div>}
              {visibleColumns['power'] !== false && <div className="w-16 text-center">Вт</div>}
              {supplierColumns.map(supplier => (
                visibleColumns[`supplier:${supplier}`] !== false && (
                  <div key={supplier} className="w-24 text-center text-xs truncate" title={supplier}>
                    {supplier}
                  </div>
                )
              ))}
              {visibleColumns['recommended'] !== false && <div className="w-20 text-center">Рек</div>}
              {visibleColumns['markup'] !== false && <div className="w-16 text-center">Нац</div>}
              {visibleColumns['actual'] !== false && <div className="w-24 text-center">Акт</div>}
              {visibleColumns['totalAvailability'] !== false && <div className="w-20 text-center">Наяв</div>}
            </div>
            
            {/* Віртуалізована таблиця */}
            <List
              height={550}
              itemCount={sortedPanels.length}
              itemSize={60}
              itemData={virtualizedData}
              className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
            >
              {VirtualizedPanelRow}
            </List>
          </div>
        ) : (
          <div className="text-center py-10 text-gray-500">
            <p>Не знайдено сонячних панелей за вашими критеріями</p>
          </div>
        )}
      </div>

      <PriceUpdateModal
        isOpen={updatePriceModalOpen}
        onClose={() => setUpdatePriceModalOpen(false)}
        onSubmit={async (data) => {
          await updateSolarPanelSitePrice(data);
          await fetchComparisonData();
        }}
        currentPrice={selectedPriceInfo.price}
        currentPromoPrice={selectedPriceInfo.promo_price}
        currentAvailability={selectedPriceInfo.availability}
        productName={selectedPriceInfo.productName}
        siteId={selectedPriceInfo.id!}
      />
    </div>
  );
}
