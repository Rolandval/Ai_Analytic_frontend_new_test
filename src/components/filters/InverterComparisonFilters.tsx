import { useState, useEffect, useRef } from 'react';
import { InverterPriceListRequestSchema } from '@/types/inverters';
import { Input } from '@/components/ui/Input';
import { MultiSelectPopover } from './ui/MultiSelectPopover';
import { getInverterCities } from '@/services/cities.api';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { Button } from '@/components/ui/Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const inverterTypes = ['on_grid', 'off_grid', 'hybrid'];
const generations = ['1G', '2G', '3G'];
const supplierStatuses = ['ME', 'SUPPLIER', 'COMPETITOR'];
const statusLabels: Record<string, string> = {
  ME: 'ми',
  SUPPLIER: 'постачальник',
  COMPETITOR: 'конкурент',
};

interface Props {
  current: InverterPriceListRequestSchema;
  setFilters: (f: InverterPriceListRequestSchema) => void;
  brands: string[];
  suppliers: string[];
}

export const InverterComparisonFilters: React.FC<Props> = ({ current, setFilters, brands, suppliers }) => {
  const debounceRef = useRef<NodeJS.Timeout>();
  const [local, setLocal] = useState<InverterPriceListRequestSchema>({
    ...current
  });
  const [isExpanded, setIsExpanded] = useState(false);

  // Auto-apply filters with debounce
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setFilters({ ...local, page: 1 });
    }, 300);
  }, [local, setFilters]);

  const reset = () => {
    const base = { page: 1, page_size: current.page_size ?? 10 } as InverterPriceListRequestSchema;
    setLocal(base);
    setFilters(base);
  };

  return (
    <>

    <div className="w-full max-w-[1280px] mx-auto flex flex-col gap-2 sm:gap-4">
      {/* Фільтр тогл для мобільних */}
      <div className="flex items-center justify-between md:hidden p-2 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-500" />
          <span className="text-sm font-medium">Параметри фільтрації</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsExpanded(!isExpanded)} 
          className="h-8 w-8 p-0">
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </Button>
      </div>

      {/* active filters chips */}
      {Object.values(local).some((v) => v !== undefined && v !== '' && v !== null) && (
        <div className="flex flex-wrap gap-1 sm:gap-2 items-center">
          <span className="text-xs sm:text-sm font-medium">Фільтри:</span>
          {local.brands?.map((b) => (
            <Badge key={b} variant="secondary" className="text-xs py-0 h-6">
              {b}
              <button 
                onClick={() => setLocal(prev => ({ ...prev, brands: prev.brands?.filter(brand => brand !== b) }))}
                className="ml-1 hover:text-red-500 transition-colors"
              >
                <X size={12} />
              </button>
            </Badge>
          ))}
          {local.full_name && (
            <Badge variant="secondary" className="text-xs py-0 h-6">
              Назва: {local.full_name}
              <button 
                onClick={() => setLocal(prev => ({ ...prev, full_name: undefined }))}
                className="ml-1 hover:text-red-500 transition-colors"
              >
                <X size={12} />
              </button>
            </Badge>
          )}
          {local.suppliers?.map((s) => (
            <Badge key={s} variant="secondary" className="text-xs py-0 h-6">
              {s}
              <button 
                onClick={() => setLocal(prev => ({ ...prev, suppliers: prev.suppliers?.filter(supp => supp !== s) }))}
                className="ml-1 hover:text-red-500 transition-colors"
              >
                <X size={12} />
              </button>
            </Badge>
          ))}
          {(local.power_min !== undefined || local.power_max !== undefined) && (
            <Badge variant="secondary">
              Потужн. {local.power_min ?? 0}-{local.power_max ?? 'max'} кВт
            </Badge>
          )}
          {(local.price_min !== undefined || local.price_max !== undefined) && (
            <Badge variant="secondary">
              Ціна {local.price_min ?? 0}-{local.price_max ?? 'max'}$
            </Badge>
          )}
        </div>
      )}

      {/* grid */}
      <div className={cn(
        "grid gap-3 sm:gap-5 transition-all duration-200",
        isExpanded ? "grid-cols-1 sm:grid-cols-2" : "hidden md:grid",
        "md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      )}>
        {/* === TEXT INPUTS === */}
        <Input
          placeholder="Пошук по назві..."
          value={local.full_name ?? ''}
          onChange={(e) => setLocal(prev => ({ ...prev, full_name: e.target.value || undefined }))}
          className="w-full"
        />

        {/* === DROPDOWNS/SELECTS === */}
        <MultiSelectPopover
          placeholder="+ Виробник"
          options={brands}
          values={local.brands ?? []}
          onChange={(brands: string[] | undefined) => setLocal(prev => ({ ...prev, brands }))} 
          showSelectAll
          selectAllLabel="Вибрати всі бренди"
          clearLabel="Скинути"
        />
        <MultiSelectPopover
          placeholder="+ Постачальник"
          options={suppliers}
          values={local.suppliers}
          onChange={(vals) => setLocal((p) => ({ ...p, suppliers: vals }))}
          showSelectAll
          selectAllLabel="Вибрати всіх постачальників"
          clearLabel="Скинути"
        />

        {/* === RANGE INPUTS === */}

        {/* power - manual inputs */}
        <div className="flex flex-col gap-1">
          <span className="text-[12px] font-medium text-slate-600">Потужність, кВт</span>
          <div className="flex gap-1 items-center">
            <Input
              type="number"
              placeholder="від"
              value={local.power_min ?? ''}
              onChange={(e) => setLocal(p => ({ ...p, power_min: e.target.value ? Number(e.target.value) : undefined }))}
              className="h-8 text-sm border-gray-300"
            />
            <span className="text-xs text-slate-400">-</span>
            <Input
              type="number"
              placeholder="до"
              value={local.power_max ?? ''}
              onChange={(e) => setLocal(p => ({ ...p, power_max: e.target.value ? Number(e.target.value) : undefined }))}
              className="h-8 text-sm border-gray-300"
            />
          </div>
        </div>
        
        {/* === RADIO BUTTONS === */}
        {/* inverter type (radio) */}
        <div className="flex flex-col gap-1 p-1">
          <span className="text-[14px] font-semibold text-slate-700">Тип</span>
          <div className="flex flex-nowrap gap-2 text-[14px] leading-tight overflow-hidden">
            {inverterTypes.map((t) => (
              <label key={t} className="inline-flex items-center gap-1 cursor-pointer text-slate-700 whitespace-nowrap">
                <input
                  type="radio"
                  name="inverter-type"
                  checked={local.inverter_type === t}
                  onChange={() => setLocal((p) => ({ ...p, inverter_type: t }))}
                  className="peer accent-primary"
                />
                <span className="truncate max-w-[80px]" title={t}>{t === 'on_grid' ? 'on-grid' : t === 'off_grid' ? 'off-grid' : t}</span>
              </label>
            ))}
            <label className="inline-flex items-center gap-1 cursor-pointer text-slate-700 whitespace-nowrap">
              <input
                type="radio"
                name="inverter-type"
                checked={local.inverter_type === undefined}
                onChange={() => setLocal((p) => ({ ...p, inverter_type: undefined }))}
                className="peer accent-primary"
              />
              <span>всі</span>
            </label>
          </div>
        </div>
        
        {/* string count - manual inputs */}
        <div className="flex flex-col gap-1">
          <span className="text-[12px] font-medium text-slate-600">Кількість стрінгів</span>
          <div className="flex gap-1 items-center">
            <Input
              type="number"
              placeholder="від"
              value={local.string_count_min ?? ''}
              onChange={(e) => setLocal(p => ({ ...p, string_count_min: e.target.value ? Number(e.target.value) : undefined }))}
              className="h-8 text-sm border-gray-300"
            />
            <span className="text-xs text-slate-400">-</span>
            <Input
              type="number"
              placeholder="до"
              value={local.string_count_max ?? ''}
              onChange={(e) => setLocal(p => ({ ...p, string_count_max: e.target.value ? Number(e.target.value) : undefined }))}
              className="h-8 text-sm border-gray-300"
            />
          </div>
        </div>

        {/* generation (radio) */}
        <div className="flex flex-col gap-1 p-1">
          <span className="text-[14px] font-semibold text-slate-700">Покоління</span>
          <div className="flex flex-nowrap gap-2 text-[14px] leading-tight overflow-hidden">
            {generations.map((g) => (
              <label key={g} className="inline-flex items-center gap-1 cursor-pointer text-slate-700 whitespace-nowrap">
                <input
                  type="radio"
                  name="generation"
                  checked={local.generation === g}
                  onChange={() => setLocal((p) => ({ ...p, generation: g }))}
                  className="peer accent-primary"
                />
                <span className="truncate max-w-[80px]" title={g}>{g}</span>
              </label>
            ))}
            <label className="inline-flex items-center gap-1 cursor-pointer text-slate-700 whitespace-nowrap">
              <input
                type="radio"
                name="generation"
                checked={local.generation === undefined}
                onChange={() => setLocal((p) => ({ ...p, generation: undefined }))}
                className="peer accent-primary"
              />
              <span>всі</span>
            </label>
          </div>
        </div>
        
        {/* firmware */}
        <Input
          placeholder="Firmware"
          value={local.firmware ?? ''}
          onChange={(e) => setLocal((p) => ({ ...p, firmware: e.target.value || undefined }))}
        />

        {/* supplier status multi */}
        <MultiSelectPopover
          placeholder="Статус постачальника"
          options={supplierStatuses}
          values={local.supplier_status}
          onChange={(vals) => setLocal((p) => ({ ...p, supplier_status: vals }))}
          getLabel={(v)=>statusLabels[v] ?? v}
        />

        {/* price - manual inputs */}
        <div className="flex flex-col gap-1">
          <span className="text-[12px] font-medium text-slate-600">Ціна, $</span>
          <div className="flex gap-1 items-center">
            <Input
              type="number"
              placeholder="від"
              value={local.price_min ?? ''}
              onChange={(e) => setLocal(p => ({ ...p, price_min: e.target.value ? Number(e.target.value) : undefined }))}
              className="h-8 text-sm border-gray-300"
            />
            <span className="text-xs text-slate-400">-</span>
            <Input
              type="number"
              placeholder="до"
              value={local.price_max ?? ''}
              onChange={(e) => setLocal(p => ({ ...p, price_max: e.target.value ? Number(e.target.value) : undefined }))}
              className="h-8 text-sm border-gray-300"
            />
          </div>
        </div>

        {/* date range */}
        <DateRangePicker
          startDate={local.date_min}
          endDate={local.date_max}
          onChange={(startDate: string | undefined, endDate: string | undefined) => {
            setLocal((p) => ({ ...p, date_min: startDate, date_max: endDate }));
          }}
          placeholder="Оберіть період"
          className="w-full"
        />

        {/* sorting & page size */}
        <Select
          value={local.price_sort ?? ''}
          onValueChange={(v) => setLocal((p) => ({ ...p, price_sort: v as 'asc' | 'desc' }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Сортувати ціну" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">↑ ціна</SelectItem>
            <SelectItem value="desc">↓ ціна</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* actions */}
      <div className={cn(
        "sticky bottom-0 flex gap-2 sm:gap-3 py-2 bg-background/60 backdrop-blur-lg rounded-b-2xl border-t border-border z-10",
        isExpanded ? "flex" : "hidden md:flex"
      )}>
        <Button size="sm" variant="ghost" onClick={reset} className="text-xs sm:text-sm h-8 sm:h-10">
          Скинути
        </Button>
      </div>
    </div>
    </>
  );
};
