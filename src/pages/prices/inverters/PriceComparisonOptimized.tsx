import { useEffect, useMemo, useState, useCallback, memo } from 'react';
import { useGetSupplierInverterComparisonMutation } from '@/services/inverterComparison.api';
import { getInverterBrands, getInverterSuppliers } from '@/services/inverterPrices.api';
import { InverterPriceListRequestSchema } from '@/types/inverters';
import { InverterComparisonFilters } from '@/components/filters/InverterComparisonFilters';
import { useSortableTable } from '@/hooks/useSortableTable';
import { useToast } from '@/hooks/use-toast';

// Винесені інтерфейси в окремий файл types/inverterComparison.ts
interface SupplierPrice {
  supplier_id: number;
  supplier_name: string;
  supplier_url: string | null;
  supplier_status: string;
  price: number | null;
  promo_price: number | null;
  recommended_price: number | null;
  availability: number | null;
  site_id: number | null;
  date: string | null;
  updated_at: string | null;
}

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

interface InverterComparisonResponse {
  inverters: InverterWithSupplierPrices[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

// Мемоізований компонент для рядка таблиці
const InverterTableRow = memo(({ 
  inverter, 
  index, 
  page, 
  pageSize, 
  visibleColumns, 
  supplierColumns,
  rowMarkup,
  onMarkupChange,
  onApplyRow,
  onOpenPriceModal,
  isUpdating 
}: {
  inverter: InverterWithSupplierPrices & { 
    recommendedPrice: number | null;
    totalAvailability: number;
  };
  index: number;
  page: number;
  pageSize: number;
  visibleColumns: Record<string, boolean>;
  supplierColumns: string[];
  rowMarkup: Record<number, number>;
  onMarkupChange: (id: number, markup: number) => void;
  onApplyRow: (inverter: any) => void;
  onOpenPriceModal: (inverter: any, supplier: string) => void;
  isUpdating: boolean;
}) => {
  const isAvailable = useMemo(() => 
    inverter.supplier_prices.some(sp => sp.availability && sp.availability > 0),
    [inverter.supplier_prices]
  );

  const calculateRecommendedPrice = useCallback(() => {
    const minPrice = Math.min(
      ...inverter.supplier_prices
        .map(sp => sp.price)
        .filter((p): p is number => p !== null && p !== undefined && p > 0)
    );
    if (!isFinite(minPrice)) return null;
    const m = rowMarkup[inverter.id] ?? 15;
    return Math.round(minPrice * (1 + m / 100));
  }, [inverter.supplier_prices, inverter.id, rowMarkup]);

  const formatPrice = useCallback((price: number | null) => {
    if (price === null) return '-';
    const rounded = Math.round(price);
    return rounded.toLocaleString('uk-UA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }, []);

  return (
    <tr className={isAvailable ? "hover:bg-muted/50" : "hover:bg-muted/50 opacity-70"}>
      {visibleColumns['index'] !== false && (
        <td className="text-center w-8 text-xs">{(page - 1) * pageSize + index + 1}</td>
      )}
      {visibleColumns['full_name'] !== false && (
        <td className="font-medium min-w-[140px] text-center truncate" title={inverter.full_name}>
          {inverter.full_name}
        </td>
      )}
      {visibleColumns['brand'] !== false && (
        <td className="text-xs text-center">{inverter.brand}</td>
      )}
      {visibleColumns['power'] !== false && (
        <td className="hidden sm:table-cell text-center text-xs w-12">{inverter.power}</td>
      )}
      {visibleColumns['recommended'] !== false && (
        <td className="text-center w-12 text-xs font-medium">
          {formatPrice(inverter.recommendedPrice)}
        </td>
      )}
      {visibleColumns['actual'] !== false && (
        <td className="text-center w-12 text-xs font-medium text-green-600">
          {formatPrice(calculateRecommendedPrice())}
        </td>
      )}
    </tr>
  );
});

InverterTableRow.displayName = 'InverterTableRow';

// Головний компонент
export default function InverterPriceComparisonOptimized() {
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<InverterPriceListRequestSchema>({
    page: page,
    page_size: pageSize,
    suppliers: []
  });
  
  const [comparisonData, setComparisonData] = useState<InverterComparisonResponse | null>(null);
  const [brands, setBrands] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});
  const [rowMarkup, setRowMarkup] = useState<Record<number, number>>({});
  const [updatingRowIds, setUpdatingRowIds] = useState<Set<number>>(new Set());
  const [filtersApplied, setFiltersApplied] = useState(false);

  const { toast } = useToast();
  const [getInverterComparison, { isLoading }] = useGetSupplierInverterComparisonMutation();

  // Мемоізовані обчислення
  const processedData = useMemo(() => {
    if (!comparisonData?.inverters) return [];
    
    return comparisonData.inverters.map((inverter, idx) => {
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
        totalAvailability: inverter.supplier_prices.reduce((total, sp) => total + (sp.availability || 0), 0),
        recommendedPrice: finalRecommendedPrice,
        supplierPrices,
      };
    });
  }, [comparisonData]);

  const supplierColumns = useMemo(() => {
    if (!comparisonData?.inverters.length) return [];
    
    const uniqueSuppliers = [...new Set(
      comparisonData.inverters.flatMap((inverter: InverterWithSupplierPrices) => 
        inverter.supplier_prices.map((sp: SupplierPrice) => (sp.supplier_name ?? '').toString().trim())
      )
    )].filter((n) => n.length > 0) as string[];
    
    // Оптимізація: переміщуємо "АКУМУЛЯТОР-Центр" в кінець
    const normalize = (s: string) => s.toLowerCase().replace(/[-\s]+/g, ' ').trim();
    const targetNorm = normalize('АКУМУЛЯТОР-Центр');
    const idx = uniqueSuppliers.findIndex((n) => normalize(n) === targetNorm);
    if (idx !== -1) {
      const [target] = uniqueSuppliers.splice(idx, 1);
      uniqueSuppliers.push(target);
    }
    return uniqueSuppliers;
  }, [comparisonData]);

  // Використовуємо хук для сортування з мемоізацією
  const { items: sortedInverters, requestSort, sortConfig } = useSortableTable(
    processedData,
    { key: 'full_name', direction: 'asc' }
  );

  // Оптимізований debounce effect
  useEffect(() => {
    if (!filtersApplied) return;
    
    const timeoutId = setTimeout(() => {
      fetchComparisonData();
    }, 300); // Зменшуємо debounce до 300ms
    
    return () => clearTimeout(timeoutId);
  }, [filters, filtersApplied]);

  // Мемоізовані callback функції
  const fetchComparisonData = useCallback(async () => {
    try {
      const result = await getInverterComparison({
        ...filters,
        page,
        page_size: pageSize
      }).unwrap();
      
      setComparisonData(result);
    } catch (error) {
      console.error('Error fetching comparison data:', error);
    }
  }, [getInverterComparison, filters, page, pageSize]);

  const handleFiltersChange = useCallback((newFilters: Partial<InverterPriceListRequestSchema>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
    setPage(1);
    setFiltersApplied(true);
  }, []);

  const handleMarkupChange = useCallback((id: number, markup: number) => {
    setRowMarkup(prev => ({ ...prev, [id]: markup }));
  }, []);

  // Завантаження метаданих з мемоізацією
  useEffect(() => {
    let isMounted = true;
    
    const fetchMetadata = async () => {
      try {
        const [brandsData, suppliersData] = await Promise.all([
          getInverterBrands(),
          getInverterSuppliers()
        ]);
        
        if (isMounted) {
          setBrands(brandsData);
          setSuppliers(suppliersData.map((s: { name: string }) => s.name));
        }
      } catch (error) {
        console.error('Error fetching metadata:', error);
      }
    };
    
    fetchMetadata();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4">Порівняння цін на інвертори</h1>

      <div className="space-y-4 mb-4">
        <InverterComparisonFilters 
          current={filters}
          setFilters={handleFiltersChange}
          brands={brands}
          suppliers={suppliers}
        />
        
        {!isLoading && comparisonData && comparisonData.inverters.length === 0 && (
          <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200">
              Нічого не знайдено
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Змініть параметри фільтрації або оновіть дані про наявність.
            </p>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="overflow-auto">
          <div className="p-2 sm:p-4">
            {!filtersApplied ? (
              <div className="text-center py-10 text-gray-500">
                <p className="font-medium">Застосуйте фільтри для відображення даних</p>
                <p className="text-sm mt-2">Виберіть параметри фільтрації вище для завантаження даних</p>
              </div>
            ) : comparisonData && comparisonData.inverters.length > 0 ? (
              <table className="w-full text-[11px] leading-4">
                <thead>
                  <tr>
                    {visibleColumns['index'] !== false && (
                      <th className="text-center w-8 text-xs cursor-pointer" 
                          onClick={(e) => requestSort('originalIndex', (e as any).shiftKey)}>
                        №
                      </th>
                    )}
                    {visibleColumns['full_name'] !== false && (
                      <th className="min-w-[140px] text-center cursor-pointer"
                          onClick={(e) => requestSort('full_name', (e as any).shiftKey)}>
                        Назва
                      </th>
                    )}
                    {visibleColumns['brand'] !== false && (
                      <th className="text-xs text-center cursor-pointer"
                          onClick={(e) => requestSort('brand', (e as any).shiftKey)}>
                        Бренд
                      </th>
                    )}
                    {visibleColumns['power'] !== false && (
                      <th className="hidden sm:table-cell w-12 text-center cursor-pointer"
                          onClick={(e) => requestSort('power', (e as any).shiftKey)}>
                        Вт
                      </th>
                    )}
                    {visibleColumns['recommended'] !== false && (
                      <th className="text-center w-12 cursor-pointer"
                          onClick={(e) => requestSort('recommendedPrice', (e as any).shiftKey)}>
                        Рек
                      </th>
                    )}
                    {visibleColumns['actual'] !== false && (
                      <th className="text-center w-12">Акт</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {sortedInverters.map((inverter, index) => (
                    <InverterTableRow
                      key={inverter.id}
                      inverter={inverter}
                      index={index}
                      page={page}
                      pageSize={pageSize}
                      visibleColumns={visibleColumns}
                      supplierColumns={supplierColumns}
                      rowMarkup={rowMarkup}
                      onMarkupChange={handleMarkupChange}
                      onApplyRow={() => {}}
                      onOpenPriceModal={() => {}}
                      isUpdating={updatingRowIds.has(inverter.id)}
                    />
                  ))}
                </tbody>
              </table>
            ) : isLoading ? (
              <div className="text-center py-10">
                <p>Завантаження...</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
