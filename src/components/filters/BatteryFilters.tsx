import { useState, useEffect } from 'react';
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
import { getBatteryCities } from '@/services/cities.api';

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

export const BatteryFilters: React.FC<Props> = ({ current, setFilters, brands, suppliers }) => {
  const [shimmer, setShimmer] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [local, setLocal] = useState<BatteryPriceListRequestSchema>({
    ...current,
    markup: current.markup !== undefined ? current.markup : 15, // Default markup value 15%
  });
  
  // Отримуємо список міст при першому рендері компоненту
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const citiesData = await getBatteryCities();
        setCities(citiesData);
      } catch (error) {
        console.error('Помилка отримання списку міст:', error);
      }
    };
    
    fetchCities();
  }, []);

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
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-32 pointer-events-none">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

    <div className="w-full max-w-[1280px] mx-auto flex flex-col gap-4">
      {/* active filters */}
      {Object.values(local).some((v) => v !== undefined && v !== '' && v !== null) && (
        <div className="flex flex-wrap gap-2 items-center overflow-x-auto pb-2">
          <span className="text-sm font-medium whitespace-nowrap sticky left-0 bg-background/80 backdrop-blur-sm p-1">
            Фільтри
          </span>
          {local.brands?.map((b) => (
            <Badge key={b} variant="secondary" className="whitespace-nowrap">
              {b}
            </Badge>
          ))}
          {local.suppliers?.map((s) => (
            <Badge key={s} variant="secondary" className="whitespace-nowrap">
              {s}
            </Badge>
          ))}
          {local.cities?.map((c) => (
            <Badge key={c} variant="secondary" className="whitespace-nowrap bg-green-500/10 text-green-400 border-green-400">
              {c}
            </Badge>
          ))}
          {(local.volume_min !== undefined || local.volume_max !== undefined) && (
            <Badge variant="secondary" className="whitespace-nowrap">
              Обʼєм {local.volume_min ?? 0}-{local.volume_max ?? 'max'}Ah
            </Badge>
          )}
          {(local.c_amps_min !== undefined || local.c_amps_max !== undefined) && (
            <Badge variant="secondary" className="whitespace-nowrap">
              Сила {local.c_amps_min ?? 0}-{local.c_amps_max ?? 'max'}A
            </Badge>
          )}
          {(local.price_min !== undefined || local.price_max !== undefined) && (
            <Badge variant="secondary" className="whitespace-nowrap">
              Ціна {local.price_min ?? 0}-{local.price_max ?? 'max'}грн
            </Badge>
          )}
          {local.markup !== undefined && (
            <Badge variant="secondary" className="bg-purple-500/10 text-purple-400 border-purple-400 whitespace-nowrap">
              Націнка {local.markup}%
            </Badge>
          )}
        </div>
      )}

      {/* grid */}
      <div className="grid gap-4 md:gap-5" 
           style={{ 
             gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))',
           }}>
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
            {polarities.map((pola) => (
              <SelectItem key={pola} value={pola}>
                {pola}
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

        {/* Brands */}
        <div>
          <MultiSelectPopover
            placeholder="Бренди"
            options={brands}
            values={local.brands}
            onChange={(v) => setLocal((p) => ({ ...p, brands: v }))}
          />
        </div>

        {/* Suppliers */}
        <div>
          <MultiSelectPopover
            placeholder="Постачальники"
            options={suppliers}
            values={local.suppliers}
            onChange={(v) => setLocal((p) => ({ ...p, suppliers: v }))}
          />
        </div>
        
        {/* Cities */}
        <div>
          <MultiSelectPopover
            placeholder="Міста"
            options={cities}
            values={local.cities}
            onChange={(v) => setLocal((p) => ({ ...p, cities: v }))}
          />
        </div>

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
            onChange={([min, max]) => setLocal((p) => ({ ...p, price_min: min, price_max: max }))}
            format={(v) => `${v}грн`}
            formatInput={(v) => `${v}`}
            suffix="грн"
          />
        </div>
        
        {/* Markup */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-slate-400">Націнка, %</span>
          <Input
            type="number"
            step="0.1"
            min="0"
            placeholder="Націнка"
            value={local.markup ?? 15}
            onChange={(e) => {
              const value = e.target.value ? parseFloat(e.target.value) : 15;
              setLocal((p) => ({ ...p, markup: value }));
            }}
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

        {/* page size */}
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
      <div className="sticky bottom-0 flex justify-between gap-3 py-3 px-3 md:px-0 bg-background/90 backdrop-blur-lg rounded-b-2xl border-t border-border z-10 shadow-sm">
        <Button onClick={apply} className="flex-1 sm:flex-none" size="lg">
          Застосувати
        </Button>
        <Button variant="outline" onClick={reset} className="flex-1 sm:flex-none" size="lg">
          Скинути
        </Button>
      </div>
    </div>
  </>
  );
};
