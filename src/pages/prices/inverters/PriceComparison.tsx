import { useEffect, useState } from 'react';
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

import { Pagination } from '@/components/ui/Pagination';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { RefreshDataButton } from '@/components/ui/RefreshDataButton';
import { PriceUpdateModal } from '@/components/PriceUpdateModal';
import { useSortableTable } from '@/hooks/useSortableTable';
import { ChevronUp, ChevronDown } from 'lucide-react';

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
  const pageSize = 10; // Фіксований розмір сторінки
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
  
  // Стани для модального вікна оновлення ціни
  const markup = 15; // Фіксована націнка 15%
  const [selectedRowIds, setSelectedRowIds] = useState<Set<number>>(new Set());
  const [updatePriceModalOpen, setUpdatePriceModalOpen] = useState(false);
  const [selectedPriceInfo, setSelectedPriceInfo] = useState<{
    id: number | null;
    price: number | null;
    promo_price: number | null;
    availability: string | null;
    productName: string;
  }>({ id: null, price: null, promo_price: null, availability: null, productName: '' });

  const [getInverterComparison, { isLoading }] = useGetSupplierInverterComparisonMutation();

  // Прапор для відстеження, чи були застосовані фільтри користувачем
  const [filtersApplied, setFiltersApplied] = useState(false);

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
    if (comparisonData?.inverters) {
      const data = comparisonData.inverters.map(inverter => ({
        ...inverter,
        totalAvailability: getTotalAvailability(inverter)
      }));
      setProcessedData(data);
    }
  }, [comparisonData]);

  // Використовуємо хук для сортування
  const { items: sortedInverters, requestSort, sortConfig } = useSortableTable<InverterWithSupplierPrices>(
    processedData,
    { key: 'full_name', direction: 'asc' } // Початкове сортування за назвою
  );

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
            inverter.supplier_prices.map((sp: SupplierPrice) => sp.supplier_name)
          )
        )] as string[];
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

  // Функція зміни розміру сторінки не використовується в поточній реалізації
  // з фіксованим розміром сторінки

  const handleFiltersChange = (newFilters: Partial<InverterPriceListRequestSchema>) => {
    setFilters((prev: InverterPriceListRequestSchema) => ({ ...prev, ...newFilters, page: 1 }));
    setPage(1);
    // Встановлюємо прапор, що фільтри були застосовані
    setFiltersApplied(true);
  };

  // Format price with comma as a thousands separator
  const formatPrice = (price: number | null) => {
    if (price === null) return '-';
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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
  const handleRowSelection = (inverterId: number, checked: boolean) => {
    setSelectedRowIds(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(inverterId);
      } else {
        newSet.delete(inverterId);
      }
      return newSet;
    });
  };

  // Select all rows currently in the dataset
  const handleSelectAll = () => {
    if (!comparisonData?.inverters) return;
    const allIds = new Set(comparisonData.inverters.map(i => i.id));
    setSelectedRowIds(allIds);
  };

  // Clear selection
  const handleDeselectAll = () => {
    setSelectedRowIds(new Set());
  };

  // Bulk apply: update site prices for selected rows with calculated recommended price
  const handleBulkPriceUpdate = async () => {
    if (!comparisonData?.inverters || selectedRowIds.size === 0) return;

    const selectedItems = comparisonData.inverters.filter(i => selectedRowIds.has(i.id));
    const updates = selectedItems.map(async (inverter) => {
      const priceToApply = calculateRecommendedPrice(inverter);
      if (!priceToApply) return Promise.resolve('skip');
      const siteEntry = inverter.supplier_prices.find(sp => sp.site_id);
      if (!siteEntry?.site_id) return Promise.resolve('skip');
      const payload: UpdateSitePriceRequest = { site_id: siteEntry.site_id, price: priceToApply };
      try {
        await updateInverterSitePrice(payload);
        return 'ok';
      } catch (e) {
        console.error('Bulk update error (inverter)', inverter.id, e);
        return 'error';
      }
    });

    const results = await Promise.allSettled(updates);
    const okCount = results.filter(r => r.status === 'fulfilled').length;
    // eslint-disable-next-line no-alert
    alert(`Оновлено цін: ${okCount} / ${selectedItems.length}`);
    setSelectedRowIds(new Set());
    fetchComparisonData();
  };

  // Calculate recommended price with markup
  const calculateRecommendedPrice = (inverter: InverterWithSupplierPrices) => {
    const recommendedPrice = inverter.supplier_prices.find(sp => sp.recommended_price !== null)?.recommended_price;
    if (recommendedPrice) {
      return Math.round(recommendedPrice * (1 + markup / 100));
    }
    return null;
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
      
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <RefreshDataButton onRefresh={refreshInvertersData} />
        <Button
          size="sm"
          variant="outline"
          onClick={handleSelectAll}
          className="text-xs px-2 py-1 h-7"
        >
          Обрати всі
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleDeselectAll}
          className="text-xs px-2 py-1 h-7"
        >
          Зняти всі
        </Button>
        {selectedRowIds.size > 0 && (
          <>
            <span className="text-xs text-blue-700 ml-2">Вибрано: {selectedRowIds.size}</span>
            <Button 
              onClick={handleBulkPriceUpdate}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-xs px-2 py-1 h-7"
            >
              Застосувати всі обрані
            </Button>
          </>
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
              <Table style={{userSelect: 'text'}}>
                <TableHeader className="[&_th]:cursor-pointer" style={{userSelect: 'none'}}>
                  <TableRow>
                    <TableHead className="text-center w-8 text-xs">№</TableHead>
                    <TableHead 
                      className="min-w-[120px] text-center"
                      onClick={() => requestSort('full_name')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-xs">Назва</span>
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
                    <TableHead className="text-xs w-16 truncate text-center">Бренд</TableHead>
                    <TableHead 
                      className="hidden sm:table-cell w-12 text-center"
                      onClick={() => requestSort('power')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-xs">Вт</span>
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
                    <TableHead 
                      className="hidden sm:table-cell w-8 text-center"
                      onClick={() => requestSort('string_count')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-xs">Стр</span>
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
                    {supplierColumns.map((supplier) => (
                      <TableHead key={supplier} className="text-center w-16">
                        <span className="text-xs truncate">{supplier.length > 4 ? supplier.substring(0, 4) + '...' : supplier}</span>
                      </TableHead>
                    ))}
                    <TableHead
                      className="text-center w-12"
                      onClick={() => requestSort('recommendedPrice')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-xs">Рек</span>
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
                    <TableHead className="text-center w-12">
                      <span className="text-xs">Акт</span>
                    </TableHead>
                    <TableHead
                      className="text-center w-8"
                      onClick={() => requestSort('totalAvailability')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-xs">Нав</span>
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
                      <TableCell className="text-center w-8 text-xs">{(page - 1) * pageSize + index + 1}</TableCell>
                      <TableCell className="font-medium text-xs min-w-[120px] text-center">{inverter.full_name}</TableCell>
                      <TableCell className="text-xs w-16 truncate text-center">{inverter.brand}</TableCell>
                      <TableCell className="hidden sm:table-cell text-center text-xs w-12">{inverter.power}</TableCell>
                      <TableCell className="hidden sm:table-cell text-center text-xs w-8">{inverter.string_count}</TableCell>
                      {/* Supplier price columns */}
                      {supplierColumns.map((supplier) => {
                        const price = getPriceForSupplier(inverter, supplier);
                        const canUpdate = canUpdatePriceOnSite(inverter, supplier);
                        return (
                          <TableCell 
                            key={supplier} 
                            className="text-center font-medium w-16"
                          >
                            <div className="flex flex-col items-center space-y-1">
                              {price !== null ? (
                                <div className="flex flex-col items-center whitespace-nowrap">
                                  <span className="text-primary dark:text-primary-foreground font-medium text-xs">
                                    {formatPrice(price)}$
                                  </span>
                                  {getSupplierPriceObject(inverter, supplier)?.updated_at && (
                                    <span className="text-[10px] text-gray-500 whitespace-nowrap">
                                      {formatDateWithTime(getSupplierPriceObject(inverter, supplier)?.updated_at as string)}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs">-</span>
                              )}
                              
                              {canUpdate && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-xs px-1 py-0.5 h-5 bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 hover:text-purple-800"
                                  onClick={() => handleOpenPriceUpdateModal(inverter, supplier)}
                                >
                                  <span className="text-xs">Онов</span>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        );
                      })}
                      
                      {/* Recommended price column */}
                      <TableCell className="text-center font-medium">
                        {inverter.supplier_prices.some(sp => sp.recommended_price !== null) ? (
                          <div className="flex flex-col items-center">
                            <span className="text-purple-700 dark:text-purple-400 font-medium">
                              {formatPrice(inverter.supplier_prices.find(sp => sp.recommended_price !== null)?.recommended_price || null)}&nbsp;$
                            </span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      
                      {/* Actual price display column */}
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedRowIds.has(inverter.id)}
                            onChange={(e) => handleRowSelection(inverter.id, e.target.checked)}
                            className="w-4 h-4"
                          />
                          {selectedRowIds.has(inverter.id) && calculateRecommendedPrice && calculateRecommendedPrice(inverter) && (
                            <span className="text-blue-700 font-medium text-sm">
                              {formatPrice(calculateRecommendedPrice(inverter))}&nbsp;$
                            </span>
                          )}
                        </div>
                      </TableCell>
                      
                      {/* Total availability column */}
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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="text-xs sm:text-sm text-muted-foreground">
                Показано {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, comparisonData.total)} з {comparisonData.total}
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
