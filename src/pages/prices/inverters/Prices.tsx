import { useState } from 'react';
import { useInverterPrices } from '@/hooks/useInverterPrices';
import { useInverterBrands } from '@/hooks/useInverterBrands';
import { InverterPriceListRequest, SupplierStatusEnum, InverterTypeEnum, InverterPriceSchema } from '@/types/inverter';
import Select from 'react-select';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import { Terminal } from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';

export const InverterPrices = () => {
  const [filters, setFilters] = useState<Omit<InverterPriceListRequest, 'page' | 'page_size'>>({});
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useInverterPrices({ ...filters, page, page_size: 10 });
  const { brands: brandOptions } = useInverterBrands();

  const handleFilterChange = (name: keyof Omit<InverterPriceListRequest, 'page' | 'page_size'>, value: any) => {
    setPage(1);
    const finalValue = value === '' || (Array.isArray(value) && value.length === 0) ? undefined : value;
    setFilters(prev => ({ ...prev, [name]: finalValue }));
  };

  const totalPages = data ? Math.ceil(data.total / 10) : 0;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-white">Аналіз цін на інвертори</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
         <input
            type="text"
            placeholder="Пошук за назвою..."
            onChange={(e) => handleFilterChange('full_name', e.target.value)}
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
            options={Object.values(InverterTypeEnum).map(s => ({ value: s, label: s }))}
            onChange={(selected) => handleFilterChange('inverter_types', selected.map(s => s.value))}
            placeholder="Тип інвертора..."
            styles={{ control: (base) => ({...base, backgroundColor: '#334155', borderColor: '#475569'}), multiValue: (base) => ({...base, backgroundColor: '#475569'}), multiValueLabel: (base) => ({...base, color: 'white'}), menu: (base) => ({...base, backgroundColor: '#334155'}), option: (base, state) => ({...base, backgroundColor: state.isFocused ? '#475569' : '#334155', color: 'white'}) }}
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
                                        {data.prices.map((item: InverterPriceSchema) => (
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
