import { useEffect, useState } from 'react';
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
  availability: number | null;
  site_id: number | null;
  date: string | null;
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
  const [pageSize, setPageSize] = useState(10);
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
  
  // Стани для модального вікна оновлення ціни
  const [updatePriceModalOpen, setUpdatePriceModalOpen] = useState(false);
  const [selectedPriceInfo, setSelectedPriceInfo] = useState<{
    id: number | null;
    price: number | null;
    productName: string;
  }>({ id: null, price: null, productName: '' });

  const [getBatteryComparison, { isLoading }] = useGetSupplierBatteryComparisonMutation();

  useEffect(() => {
    fetchComparisonData();
  }, [filters]);

  // Обробляємо дані для сортування, додаючи обчислювані властивості
  useEffect(() => {
    if (comparisonData?.batteries) {
      const data = comparisonData.batteries.map(battery => ({
        ...battery,
        totalAvailability: getTotalAvailability(battery)
      }));
      setProcessedData(data);
    }
  }, [comparisonData]);

  // Використовуємо хук для сортування
  const { items: sortedBatteries, requestSort, sortConfig } = useSortableTable<BatteryWithSupplierPrices>(
    processedData,
    { key: 'full_name', direction: 'asc' } // Початкове сортування за назвою
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
      
      // Extract unique supplier names to use as columns
      if (result.batteries.length > 0) {
        const uniqueSuppliers = [...new Set(
          result.batteries.flatMap((battery: BatteryWithSupplierPrices) => 
            battery.supplier_prices.map((sp: SupplierPrice) => sp.supplier_name)
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
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  // Function is defined but currently not used in the UI
  // Kept for future implementation of page size selector
  // const handlePageSizeChange = (newSize: number) => {
  //   setPageSize(newSize);
  //   setPage(1);
  //   setFilters(prev => ({ ...prev, page: 1, page_size: newSize }));
  // };

  const handleFiltersChange = (newFilters: Partial<BatteryPriceListRequestSchema>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
    setPage(1);
  };

  // Format price with comma as a thousands separator
  const formatPrice = (price: number | null) => {
    if (price === null) return '-';
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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
        productName: battery.full_name
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
      
      <div className="space-y-4 mb-4">
        <BatteryComparisonFilters 
          current={filters}
          setFilters={handleFiltersChange}
          brands={brands}
          suppliers={suppliers}
        />
      </div>
      
      <div className="mb-6">
        <RefreshDataButton onRefresh={refreshBatteriesData} />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="h-[calc(100vh-300px)] overflow-auto">
          <div className="p-4">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="w-full h-10" />
                <Skeleton className="w-full h-10" />
                <Skeleton className="w-full h-10" />
              </div>
            ) : comparisonData && comparisonData.batteries.length > 0 ? (
              <Table containerClassName="max-h-[70vh]">
                <TableHeader className="[&_th]:cursor-pointer [&_th:hover]:bg-muted/50">
                  <TableRow>
                    <TableHead 
                      className="w-[180px] sm:w-[300px]"
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
                      onClick={() => requestSort('volume')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Ah</span>
                        {sortConfig?.key === 'volume' && (
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
                      onClick={() => requestSort('c_amps')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Пуск A</span>
                        {sortConfig?.key === 'c_amps' && (
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
                      onClick={() => requestSort('region')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Тип корпусу</span>
                        {sortConfig?.key === 'region' && (
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
                      onClick={() => requestSort('polarity')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Полярність</span>
                        {sortConfig?.key === 'polarity' && (
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
                      onClick={() => requestSort('electrolyte')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Електроліт</span>
                        {sortConfig?.key === 'electrolyte' && (
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
                  {/* Використовуємо відсортований масив */}
                  {sortedBatteries.map((battery) => (
                    <TableRow 
                      key={battery.id}
                      className={
                        isAvailable(battery)
                          ? "hover:bg-muted/50 dark:hover:bg-muted/70"
                          : "hover:bg-muted/50 dark:hover:bg-muted/70 opacity-70"
                      }
                    >
                      <TableCell className="font-medium" noWrap>{battery.full_name}</TableCell>
                      <TableCell noWrap>{battery.brand}</TableCell>
                      <TableCell className="hidden sm:table-cell">{battery.volume}</TableCell>
                      <TableCell className="hidden sm:table-cell">{battery.c_amps}</TableCell>
                      <TableCell className="hidden md:table-cell">{battery.region}</TableCell>
                      <TableCell className="hidden md:table-cell">{battery.polarity}</TableCell>
                      <TableCell className="hidden md:table-cell">{battery.electrolyte}</TableCell>
                      
                      {/* Supplier price columns */}
                      {supplierColumns.map((supplier) => {
                        const price = getPriceForSupplier(battery, supplier);
                        const canUpdate = canUpdatePriceOnSite(battery, supplier);
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
                                  onClick={() => handleOpenPriceUpdateModal(battery, supplier)}
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
        productName={selectedPriceInfo.productName}
        siteId={selectedPriceInfo.id!}
      />
    </div>
  );
}
