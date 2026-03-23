import { useState, useEffect, useRef } from 'react';
import { useSolarPanelPrices } from '@/hooks/useSolarPanelPrices';
import { useSolarPanelBrands } from '@/hooks/useSolarPanelBrands';
import { SolarPanelPriceListRequest, SupplierStatusEnum, SolarPanelPriceSchema, PanelTypeEnum, CellTypeEnum } from '@/types/solarPanel';
import Select from 'react-select';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import { Terminal } from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';

export const SolarPanelPrices = () => {
  const [filters, setFilters] = useState<Omit<SolarPanelPriceListRequest, 'page' | 'page_size'>>({});
  const [page, setPage] = useState(1);
  const [localFullName, setLocalFullName] = useState('');
  const isTypingRef = useRef(false);
  const { data, isLoading, error } = useSolarPanelPrices({ ...filters, page, page_size: 10 });
  const { brands: brandOptions } = useSolarPanelBrands();

  const handleFilterChange = (name: keyof Omit<SolarPanelPriceListRequest, 'page' | 'page_size'>, value: any) => {
    setPage(1);
    const finalValue = value === '' || (Array.isArray(value) && value.length === 0) ? undefined : value;
    setFilters(prev => ({ ...prev, [name]: finalValue }));
  };

  // Debounce full_name filter
  useEffect(() => {
    console.log('🔵 [SOLAR] localFullName changed:', localFullName);
    isTypingRef.current = true;
    const timer = setTimeout(() => {
      console.log('⏰ [SOLAR] Debounce timer fired, applying filter:', localFullName);
      handleFilterChange('full_name', localFullName || undefined);
      isTypingRef.current = false;
    }, 300);
    return () => {
      console.log('🧹 [SOLAR] Cleanup: clearing timer');
      clearTimeout(timer);
      isTypingRef.current = false;
    };
   
  }, [localFullName]);

  // Sync localFullName with filters only when not typing
  useEffect(() => {
    console.log('🔄 [SOLAR] filters.full_name changed:', filters.full_name, 'isTyping:', isTypingRef.current, 'localFullName:', localFullName);
    if (!isTypingRef.current && filters.full_name !== localFullName) {
      console.log('⚠️ [SOLAR] RESETTING localFullName to:', filters.full_name || '');
      setLocalFullName(filters.full_name || '');
    }
  }, [filters.full_name, localFullName]);

  const totalPages = data ? Math.ceil(data.total / 10) : 0;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-white">Аналіз цін на сонячні панелі</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
         <input
            type="text"
            placeholder="Пошук за назвою..."
            value={localFullName}
            onChange={(e) => {
              console.log('⌨️ [SOLAR] Input onChange:', e.target.value);
              setLocalFullName(e.target.value);
            }}
            className="p-2 bg-slate-700 rounded-md text-white placeholder-slate-400"
          />
        <div className="grid grid-cols-2 gap-2">
          <input type="number" placeholder="Ціна від" onChange={(e) => handleFilterChange('price_min', e.target.valueAsNumber || undefined)} className="p-2 bg-slate-700 rounded-md text-white placeholder-slate-400" />
          <input type="number" placeholder="Ціна до" onChange={(e) => handleFilterChange('price_max', e.target.valueAsNumber || undefined)} className="p-2 bg-slate-700 rounded-md text-white placeholder-slate-400" />
        </div>
        <Select
            isMulti
            options={brandOptions.map(b => ({ value: b, label: b }))}
            onChange={(selected) => handleFilterChange('brands', selected.map(s => s.value))}
            placeholder="Виберіть бренди..."
            styles={{ control: (base) => ({...base, backgroundColor: '#334155', borderColor: '#475569'}), multiValue: (base) => ({...base, backgroundColor: '#475569'}), multiValueLabel: (base) => ({...base, color: 'white'}), menu: (base) => ({...base, backgroundColor: '#334155'}), option: (base, state) => ({...base, backgroundColor: state.isFocused ? '#475569' : '#334155', color: 'white'}) }}
        />
        <Select
            isMulti
            options={Object.values(SupplierStatusEnum).map(s => ({ value: s, label: s }))}
            onChange={(selected) => handleFilterChange('supplier_status', selected.map(s => s.value))}
            placeholder="Статус постачальника..."
            styles={{ control: (base) => ({...base, backgroundColor: '#334155', borderColor: '#475569'}), multiValue: (base) => ({...base, backgroundColor: '#475569'}), multiValueLabel: (base) => ({...base, color: 'white'}), menu: (base) => ({...base, backgroundColor: '#334155'}), option: (base, state) => ({...base, backgroundColor: state.isFocused ? '#475569' : '#334155', color: 'white'}) }}
        />
        <Select
            isMulti
            options={Object.values(PanelTypeEnum).map(s => ({ value: s, label: s }))}
            onChange={(selected) => handleFilterChange('panel_types', selected.map(s => s.value))}
            placeholder="Тип панелі..."
            styles={{ control: (base) => ({...base, backgroundColor: '#334155', borderColor: '#475569'}), multiValue: (base) => ({...base, backgroundColor: '#475569'}), multiValueLabel: (base) => ({...base, color: 'white'}), menu: (base) => ({...base, backgroundColor: '#334155'}), option: (base, state) => ({...base, backgroundColor: state.isFocused ? '#475569' : '#334155', color: 'white'}) }}
        />
        <Select
            isMulti
            options={Object.values(CellTypeEnum).map(s => ({ value: s, label: s }))}
            onChange={(selected) => handleFilterChange('cell_types', selected.map(s => s.value))}
            placeholder="Тип комірок..."
            styles={{ control: (base) => ({...base, backgroundColor: '#334155', borderColor: '#475569'}), multiValue: (base) => ({...base, backgroundColor: '#475569'}), multiValueLabel: (base) => ({...base, color: 'white'}), menu: (base) => ({...base, backgroundColor: '#334155'}), option: (base, state) => ({...base, backgroundColor: state.isFocused ? '#475569' : '#334155', color: 'white'}) }}
        />
        {/* Sorting by price per watt */}
        <Select
            isClearable
            options={[
              { value: 'asc', label: 'Ціна/Вт ↑' },
              { value: 'desc', label: 'Ціна/Вт ↓' },
            ]}
            onChange={(selected) => handleFilterChange('price_per_w_sort', selected ? selected.value : undefined)}
            placeholder="Сортувати за ціною/Вт"
            styles={{ control: (base) => ({...base, backgroundColor: '#334155', borderColor: '#475569'}), menu: (base) => ({...base, backgroundColor: '#334155'}), option: (base, state) => ({...base, backgroundColor: state.isFocused ? '#475569' : '#334155', color: 'white'}) }}
        />
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      )}
      {error && (
         <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Помилка!</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}
      {!isLoading && !error && data && (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-800">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Назва</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Бренд</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Постачальник</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Статус</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Ціна</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Дата</th>
                    </tr>
                </thead>
                <tbody className="bg-gray-900 divide-y divide-gray-700">
                                        {data.prices.map((item: SolarPanelPriceSchema) => (
                        <tr key={item.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{item.full_name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{item.brand}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{item.supplier}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{item.supplier_status}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{item.price}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{new Date(item.date).toLocaleDateString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
};
