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
  availability: number | null;
  site_id: number | null;
  date: string | null;
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

  // Format inverter type for display
  const formatInverterType = (type: string | null) => {
    if (!type) return '-';
    
    const typeMap: Record<string, string> = {
      'on_grid': 'On-Grid',
      'off_grid': 'Off-Grid',
      'hybrid': 'Гібридний'
    };
    
    return typeMap[type] || type;
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
      
      <div className="mb-6">
        <RefreshDataButton onRefresh={refreshInvertersData} />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="overflow-auto">
          <div className="p-2 sm:p-4">
            {!filtersApplied ? (
              <div className="text-center py-10 text-gray-500">
                <p className="font-medium">Застосуйте фільтри для відображення даних</p>
                <p className="text-sm mt-2">Виберіть параметри фільтрації вище для завантаження даних</p>
              </div>
            ) : isLoading ? (
              <div className="space-y-2">
                <Skeleton className="w-full h-10" />
                <Skeleton className="w-full h-10" />
                <Skeleton className="w-full h-10" />
              </div>
            ) : comparisonData && comparisonData.inverters.length > 0 ? (
              <Table>
                <TableHeader className="[&_th]:cursor-pointer [&_th:hover]:bg-muted/50">
                  <TableRow>
                    {/* Використовуємо onClick для сортування */}
                    <TableHead 
                      className="min-w-[180px] relative"
                      onClick={() => requestSort('full_name')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Назва</span>
                        {sortConfig?.key === 'full_name' && (
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
                      onClick={() => requestSort('brand')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Бренд</span>
                        {sortConfig?.key === 'brand' && (
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
                      className="hidden sm:table-cell"
                      onClick={() => requestSort('power')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Потужність</span>
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
                      className="hidden md:table-cell"
                      onClick={() => requestSort('inverter_type')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Тип інвертора</span>
                        {sortConfig?.key === 'inverter_type' && (
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
                      className="hidden md:table-cell"
                      onClick={() => requestSort('generation')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Покоління</span>
                        {sortConfig?.key === 'generation' && (
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
                      className="hidden md:table-cell"
                      onClick={() => requestSort('string_count')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Кількість стрінгів</span>
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
                      <TableHead key={supplier} className="text-right">
                        <span className="hidden md:inline">{supplier}</span>
                        <span className="md:hidden">{supplier.split(' ')[0]}</span>
                      </TableHead>
                    ))}
                    <TableHead 
                      className="text-right"
                      onClick={() => requestSort('totalAvailability')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Наявність</span>
                        {sortConfig?.key === 'totalAvailability' && (
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Використовуємо відсортований масив замість оригінального */}
                  {sortedInverters.map((inverter) => (
                    <TableRow 
                      key={inverter.id}
                      className={
                        isAvailable(inverter)
                          ? "hover:bg-muted/50 dark:hover:bg-muted/70"
                          : "hover:bg-muted/50 dark:hover:bg-muted/70 opacity-70"
                      }
                    >
                      <TableCell className="font-medium" noWrap>{inverter.full_name}</TableCell>
                      <TableCell noWrap>{inverter.brand}</TableCell>
                      <TableCell className="hidden sm:table-cell">{inverter.power ? `${inverter.power} кВт` : '-'}</TableCell>
                      <TableCell className="hidden md:table-cell">{formatInverterType(inverter.inverter_type)}</TableCell>
                      <TableCell className="hidden md:table-cell">{inverter.generation}</TableCell>
                      <TableCell className="hidden md:table-cell">{inverter.string_count}</TableCell>
                      
                      {/* Supplier price columns */}
                      {supplierColumns.map((supplier) => {
                        const price = getPriceForSupplier(inverter, supplier);
                        const canUpdate = canUpdatePriceOnSite(inverter, supplier);
                        return (
                          <TableCell 
                            key={supplier} 
                            className="text-right font-medium"
                          >
                            <div className="flex flex-col items-end space-y-2">
                              {price !== null ? (
                                <span className="text-primary dark:text-primary-foreground font-medium">
                                  {formatPrice(price)}&nbsp;₴
                                </span>
                              ) : (
                                '-'
                              )}
                              
                              {canUpdate && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-xs px-2 py-1 h-auto bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 hover:text-purple-800"
                                  onClick={() => handleOpenPriceUpdateModal(inverter, supplier)}
                                >
                                  <span className="hidden sm:inline">Оновити ціну на сайті</span>
                                  <span className="sm:hidden">Оновити</span>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        );
                      })}
                      
                      {/* Total availability column */}
                      <TableCell className="text-right">
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
