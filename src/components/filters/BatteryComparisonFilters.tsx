import { useState } from 'react';
import { BatteryPriceListRequestSchema } from '@/types/batteries';
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

const regions = ['EUROPE', 'ASIA'];
const polarities = ['L+', 'R+'];
const electrolytes = ['AGM', 'EFB', 'GEL'];
const supplierStatuses = ['ME', 'SUPPLIER', 'COMPETITOR'];

interface Props {
  current: BatteryPriceListRequestSchema;
  setFilters: (f: BatteryPriceListRequestSchema) => void;
  brands: string[];
  suppliers: string[];
}

export const BatteryComparisonFilters: React.FC<Props> = ({ current, setFilters, brands, suppliers }) => {
  const [shimmer, setShimmer] = useState(false);
  const [local, setLocal] = useState<BatteryPriceListRequestSchema>({
    ...current
  });
  const [isExpanded, setIsExpanded] = useState(false);

  const apply = () => {
    setShimmer(true);
    setFilters({ ...local, page: 1 });
    setTimeout(() => setShimmer(false), 400);
  };
  const reset = () => {
    const base = { page: 1, page_size: current.page_size ?? 10 } as BatteryPriceListRequestSchema;
    setLocal(base);
    setFilters(base);
  };

  return (
    <>
      {shimmer && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-32 pointer-events-none">
          <div className="h-6 w-6 sm:h-8 sm:w-8 animate-spin rounded-full border-3 sm:border-4 border-primary border-t-transparent" />
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

      {/* active filters */}
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
          {(local.volume_min !== undefined || local.volume_max !== undefined) && (
            <Badge variant="secondary">
              Обʼєм {local.volume_min ?? 0}-{local.volume_max ?? 'max'}Ah
            </Badge>
          )}
          {(local.c_amps_min !== undefined || local.c_amps_max !== undefined) && (
            <Badge variant="secondary">
              Сила {local.c_amps_min ?? 0}-{local.c_amps_max ?? 'max'}A
            </Badge>
          )}
          {(local.price_min !== undefined || local.price_max !== undefined) && (
            <Badge variant="secondary">
              Ціна {local.price_min ?? 0}-{local.price_max ?? 'max'}грн
            </Badge>
          )}
        </div>
      )}

      {/* grid - відображається завжди на десктопі та умовно на мобільних */}
      <div className={cn(
        "grid gap-3 sm:gap-5 transition-all duration-200",
        isExpanded ? "grid-cols-1 sm:grid-cols-2" : "hidden md:grid",
        "md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      )}>
        <Input
          placeholder="Назва"
          value={local.full_name ?? ''}
          onChange={(e) => setLocal((p) => ({ ...p, full_name: e.target.value || undefined }))}
        />

        {/* region / polarity / electrolyte */}
        <Select
          value={local.region ?? ''}
          onValueChange={(v) => setLocal((p) => ({ ...p, region: v || undefined }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Регіон" />
          </SelectTrigger>
          <SelectContent>
            {regions.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={local.polarity ?? ''}
          onValueChange={(v) => setLocal((p) => ({ ...p, polarity: v || undefined }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Полярність" />
          </SelectTrigger>
          <SelectContent>
            {polarities.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={local.electrolyte?.[0] ?? ''}
          onValueChange={(v) => setLocal((p) => ({ ...p, electrolyte: v ? [v] : undefined }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Електроліт" />
          </SelectTrigger>
          <SelectContent>
            {electrolytes.map((e) => (
              <SelectItem key={e} value={e}>
                {e}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* size input removed because it's not in BatteryPriceListRequestSchema */}

        {/* Name search */}
        <Input
          placeholder="Пошук по назві..."
          value={local.full_name ?? ''}
          onChange={(e) => setLocal(prev => ({ ...prev, full_name: e.target.value || undefined }))}
          className="w-full"
        />

        {/* brands & suppliers */}
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

        {/* volume */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-slate-400">Обʼєм, Ah</span>
          <RangeSliderWithInput
            min={0}
            max={300}
            step={5}
            values={[local.volume_min, local.volume_max]}
            onChange={([min, max]) => setLocal((p) => ({ ...p, volume_min: min, volume_max: max }))}
            format={(v) => `${v}Ah`}
            formatInput={(v) => `${v}`}
            suffix="Ah"
          />
        </div>

        {/* c_amps */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-slate-400">Пуск А, A</span>
          <RangeSliderWithInput
            min={0}
            max={1200}
            step={10}
            values={[local.c_amps_min, local.c_amps_max]}
            onChange={([min, max]) => setLocal((p) => ({ ...p, c_amps_min: min, c_amps_max: max }))}
            format={(v) => `${v}A`}
            formatInput={(v) => `${v}`}
            suffix="A"
          />
        </div>

        {/* price */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-slate-400">Ціна, грн</span>
          <RangeSliderWithInput
            min={0}
            max={15000}
            step={100}
            values={[local.price_min, local.price_max]}
            onChange={([min, max]: [number | undefined, number | undefined]) => 
              setLocal((p) => ({ ...p, price_min: min, price_max: max }))}
            format={(v: number) => `${v}грн`}
            formatInput={(v: number) => `${v}`}
            suffix="грн"
          />
        </div>

        {/* supplier status */}
        <Select
          value={local.supplier_status?.[0] ?? ''}
          onValueChange={(v) =>
            setLocal((p) => ({ ...p, supplier_status: v ? [v] : undefined }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Статус постачальника" />
          </SelectTrigger>
          <SelectContent>
            {supplierStatuses.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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
