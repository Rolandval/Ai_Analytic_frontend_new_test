import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Skeleton } from '@/components/ui/Skeleton';
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
  const pageSize = 10; // Фіксований розмір сторінки
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
  const [updatePriceModalOpen, setUpdatePriceModalOpen] = useState(false);
  const [selectedPriceInfo, setSelectedPriceInfo] = useState<{
    id: number | null;
    price: number | null;
    productName: string;
  }>({ id: null, price: null, productName: '' });

  const [getSolarPanelComparison, { isLoading }] = useGetSupplierSolarPanelComparisonMutation();

  useEffect(() => {
    fetchComparisonData();
  }, [filters]);

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
        const uniqueSuppliers = [...new Set(
          result.panels.flatMap((panel: SolarPanelWithSupplierPrices) => 
            panel.supplier_prices.map((sp: SupplierPrice) => sp.supplier_name)
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
    setFilters((prev: SolarPanelPriceListRequestSchema) => ({ ...prev, page: newPage }));
  };

  const handleFiltersChange = (newFilters: Partial<SolarPanelPriceListRequestSchema>) => {
    setFilters((prev: SolarPanelPriceListRequestSchema) => ({ ...prev, ...newFilters, page: 1 }));
    setPage(1);
  };
  
  // Ця функція не використовується в поточній реалізації, але залишена для майбутнього використання

  // Format price with comma as a thousands separator
  const formatPrice = (price: number | null) => {
    if (price === null) return '-';
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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
  
  // Check if price can be updated on the site (has site_id and price exists)
  const canUpdatePriceOnSite = (panel: SolarPanelWithSupplierPrices, supplierName: string) => {
    const supplierPrice = panel.supplier_prices.find(sp => sp.supplier_name === supplierName);
    return supplierPrice?.site_id !== null && 
           supplierPrice?.site_id !== undefined && 
           supplierPrice?.price !== null && 
           supplierPrice?.price !== undefined;
  };
  
  // Handle opening the price update modal
  const handleOpenPriceUpdateModal = (panel: SolarPanelWithSupplierPrices, supplierName: string) => {
    const supplierPrice = getSupplierPriceObject(panel, supplierName);
    if (supplierPrice && supplierPrice.site_id) {
      setSelectedPriceInfo({
        id: supplierPrice.site_id,
        price: supplierPrice.price,
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
      
      <div className="mb-6">
        <RefreshDataButton onRefresh={refreshSolarPanelsData} />
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
        <div className="h-[calc(100vh-300px)] max-h-[800px] overflow-auto">
          <div className="p-4">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="w-full h-10" />
                <Skeleton className="w-full h-10" />
                <Skeleton className="w-full h-10" />
              </div>
            ) : comparisonData && comparisonData.panels.length > 0 ? (
              <Table containerClassName="max-h-[70vh]">
                <TableHeader className="[&_th]:cursor-pointer [&_th:hover]:bg-muted/50">
                  <TableRow>
                    {/* Використовуємо onClick для сортування */}
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
                    <TableHead className="hidden md:table-cell">Товщина</TableHead>
                    <TableHead className="hidden md:table-cell">Тип панелі</TableHead>
                    <TableHead className="hidden md:table-cell">Тип комірки</TableHead>
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
                  {sortedPanels.map((panel) => (
                    <TableRow 
                      key={panel.id}
                      className={
                        isAvailable(panel)
                          ? "hover:bg-muted/50 dark:hover:bg-muted/70"
                          : "hover:bg-muted/50 dark:hover:bg-muted/70 opacity-70"
                      }
                    >
                      <TableCell className="font-medium" noWrap>{panel.full_name}</TableCell>
                      <TableCell noWrap>{panel.brand}</TableCell>
                      <TableCell className="hidden sm:table-cell">{panel.power ? `${panel.power} Вт` : '-'}</TableCell>
                      <TableCell className="hidden md:table-cell">{panel.thickness}</TableCell>
                      <TableCell className="hidden md:table-cell">{panel.panel_type}</TableCell>
                      <TableCell className="hidden md:table-cell">{panel.cell_type}</TableCell>
                      
                      {/* Supplier price columns */}
                      {supplierColumns.map((supplier) => {
                        const price = getPriceForSupplier(panel, supplier);
                        const canUpdate = canUpdatePriceOnSite(panel, supplier);
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
                                  onClick={() => handleOpenPriceUpdateModal(panel, supplier)}
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
        siteId={selectedPriceInfo.id!} // Додаємо обов'язковий параметр site_id
      />
    </div>
  );
}
