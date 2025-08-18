import { useState } from 'react';
import { InverterPriceListRequestSchema } from '@/types/inverters';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { MultiSelectPopover } from './ui/MultiSelectPopover';
import { RangeSliderWithInput } from './ui/RangeSliderWithInput';
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
  const [shimmer, setShimmer] = useState(false);
  const [local, setLocal] = useState<InverterPriceListRequestSchema>({
    ...current
  });
  const [isExpanded, setIsExpanded] = useState(false);

  const apply = () => {
    setShimmer(true);
    setFilters({ ...local, page: 1 });
    setTimeout(() => setShimmer(false), 400);
  };
  const reset = () => {
    const base = { page: 1, page_size: current.page_size ?? 10 } as InverterPriceListRequestSchema;
    setLocal(base);
    setFilters(base);
  };

  return (
    <>
      {shimmer && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-32 pointer-events-none">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

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
        {/* name */}
        <Input
          placeholder="Назва"
          value={local.full_name ?? ''}
          onChange={(e) => setLocal((p) => ({ ...p, full_name: e.target.value || undefined }))}
        />

        {/* brand / supplier multiselect */}
        <MultiSelectPopover
          placeholder="Виробник"
          options={brands}
          values={local.brands}
          onChange={(vals) => setLocal((p) => ({ ...p, brands: vals }))}
        />
        <MultiSelectPopover
          placeholder="Постачальник"
          options={suppliers}
          values={local.suppliers}
          onChange={(vals) => setLocal((p) => ({ ...p, suppliers: vals }))}
        />

        {/* power */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-slate-400">Потужність, кВт</span>
          <RangeSliderWithInput
            min={0}
            max={100}
            step={1}
            values={[local.power_min, local.power_max]}
            onChange={([min, max]) => setLocal((p) => ({ ...p, power_min: min, power_max: max }))}
            format={(v) => `${v}кВт`}
            formatInput={(v) => `${v}`}
            suffix="кВт"
          />
        </div>
        
        {/* type */}
        <Select
          value={local.inverter_type ?? ''}
          onValueChange={(v) => setLocal((p) => ({ ...p, inverter_type: v || undefined }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Тип інвертора" />
          </SelectTrigger>
          <SelectContent>
            {inverterTypes.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* string count min/max */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-slate-400">Кількість стрінгів</span>
          <RangeSliderWithInput
            min={0}
            max={20}
            step={1}
            values={[local.string_count_min, local.string_count_max]}
            onChange={([min, max]) => setLocal((p) => ({ ...p, string_count_min: min, string_count_max: max }))}
            format={(v) => `${v}`}
            formatInput={(v) => `${v}`}
            suffix=""
          />
        </div>

        {/* generation */}
        <Select
          value={local.generation ?? ''}
          onValueChange={(v) => setLocal((p) => ({ ...p, generation: v || undefined }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Покоління" />
          </SelectTrigger>
          <SelectContent>
            {generations.map((g) => (
              <SelectItem key={g} value={g}>
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
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

        {/* price range */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-slate-400">Ціна, $</span>
          <RangeSliderWithInput
            min={0}
            max={4000}
            step={50}
            values={[local.price_min, local.price_max]}
            onChange={([min, max]: [number | undefined, number | undefined]) => 
              setLocal((p) => ({ ...p, price_min: min, price_max: max }))}
            format={(v: number) => `$${v}`}
            formatInput={(v: number) => `${v}`}
            suffix="$"
          />
        </div>

        {/* date range */}
        <Input
          type="date"
          value={local.date_min ?? ''}
          onChange={(e) => setLocal((p) => ({ ...p, date_min: e.target.value || undefined }))}
        />
        <Input
          type="date"
          value={local.date_max ?? ''}
          onChange={(e) => setLocal((p) => ({ ...p, date_max: e.target.value || undefined }))}
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
        <Select
          value={String(local.page_size ?? 10)}
          onValueChange={(v) => setLocal((p) => ({ ...p, page_size: Number(v) }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="page size" />
          </SelectTrigger>
          <SelectContent>
            {[10, 20, 50, 100].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* actions */}
      <div className={cn(
        "sticky bottom-0 flex gap-2 sm:gap-3 py-2 bg-background/60 backdrop-blur-lg rounded-b-2xl border-t border-border z-10",
        isExpanded ? "flex" : "hidden md:flex"
      )}>
        <Button size="sm" onClick={apply} className="text-xs sm:text-sm h-8 sm:h-10">
          Застосувати
        </Button>
        <Button size="sm" variant="ghost" onClick={reset} className="text-xs sm:text-sm h-8 sm:h-10">
          Скинути
        </Button>
      </div>
    </div>
    </>
  );
};
