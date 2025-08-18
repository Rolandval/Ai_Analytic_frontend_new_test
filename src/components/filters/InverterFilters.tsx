import { useState, useEffect } from 'react';
import { useUsdRate } from '@/hooks/useUsdRate';
import { InverterPriceListRequestSchema } from '@/types/inverters';
import { Input } from '@/components/ui/Input';
import { getInverterCities } from '@/services/cities.api';
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

const inverterTypes = ['on_grid', 'off_grid', 'hybrid', 'grid-tie'];
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

export const InverterFilters: React.FC<Props> = ({ current, setFilters, brands, suppliers }) => {
  const [shimmer, setShimmer] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [local, setLocal] = useState<InverterPriceListRequestSchema>({
    ...current,
    markup: current.markup !== undefined ? current.markup : 15, // Default markup value 15%
  });
  const { rate, loading: loadingRate } = useUsdRate();
  
  // Отримуємо список міст при першому рендері компоненту
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const citiesData = await getInverterCities();
        setCities(citiesData);
      } catch (error) {
        console.error('Помилка отримання списку міст інверторів:', error);
      }
    };
    
    fetchCities();
  }, []);
  
  // Set the USD rate when it's fetched from the API
  useEffect(() => {
    if (rate?.rate && !local.usd_rate) {
      setLocal(prev => ({ ...prev, usd_rate: rate.rate }));
    }
  }, [rate, local.usd_rate]);

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

    <div className="w-full max-w-[1280px] mx-auto flex flex-col gap-4">
      {/* active filters chips */}
      {Object.values(local).some((v) => v !== undefined && v !== '' && v !== null) && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium">Фільтри</span>
          {local.brands?.map((b) => (
            <Badge key={b} variant="secondary">
              {b}
            </Badge>
          ))}
          {local.suppliers?.map((s) => (
            <Badge key={s} variant="secondary">
              {s}
            </Badge>
          ))}
          {local.cities?.map((c) => (
            <Badge key={c} variant="secondary" className="bg-green-500/10 text-green-400 border-green-400">
              {c}
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
          {local.usd_rate !== undefined && (
            <Badge variant="secondary" className="bg-green-500/10 text-green-400 border-green-400">
              Курс $ {local.usd_rate}
            </Badge>
          )}
          {local.markup !== undefined && (
            <Badge variant="secondary" className="bg-purple-500/10 text-purple-400 border-purple-400">
              Націнка {local.markup}%
            </Badge>
          )}
        </div>
      )}

      {/* grid */}
      <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))' }}>
        {/* name */}
        <Input
          placeholder="Назва"
          value={local.full_name ?? ''}
          onChange={(e) => setLocal((p) => ({ ...p, full_name: e.target.value || undefined }))}
        />

        {/* brands */}
        <MultiSelectPopover
          placeholder="Бренди"
          options={brands}
          values={local.brands}
          onChange={(vals) => setLocal((p) => ({ ...p, brands: vals }))}
        />
        
        {/* suppliers */}
        <MultiSelectPopover
          placeholder="Постачальники"
          options={suppliers}
          values={local.suppliers}
          onChange={(vals) => setLocal((p) => ({ ...p, suppliers: vals }))}
        />
        
        {/* cities */}
        <MultiSelectPopover
          placeholder="Міста"
          options={cities}
          values={local.cities}
          onChange={(vals) => setLocal((p) => ({ ...p, cities: vals }))}
        />

        {/* inverter type */}
        <Select
          value={local.inverter_type ?? ''}
          onValueChange={(v) => setLocal((p) => ({ ...p, inverter_type: v || undefined }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Тип" />
          </SelectTrigger>
          <SelectContent>
            {inverterTypes.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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

        {/* power range */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-slate-400">Потужність, кВт</span>
          <RangeSliderWithInput
            min={0}
            max={50}
            step={1}
            values={[local.power_min, local.power_max]}
            onChange={([min, max]) =>
              setLocal((p) => ({ ...p, power_min: min, power_max: max }))
            }
            format={(v) => `${v} кВт`}
            formatInput={(v) => `${v}`}
            suffix=" кВт"
          />
        </div>

        {/* string count range */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-slate-400">Кількість стрингів</span>
          <RangeSliderWithInput
            min={1}
            max={24}
            step={1}
            values={[local.string_count_min, local.string_count_max]}
            onChange={([min, max]) =>
              setLocal((p) => ({ ...p, string_count_min: min, string_count_max: max }))
            }
            format={(v) => `${v} стр`}
            formatInput={(v) => `${v}`}
            suffix=" стр"
          />
        </div>

        {/* firmware text */}
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
            onChange={([min, max]) => setLocal((p) => ({ ...p, price_min: min, price_max: max }))}
            format={(v) => `$${v}`}
            formatInput={(v) => `${v}`}
            suffix="$"
          />
        </div>
        
        {/* USD rate */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-slate-400">Курс долара</span>
          <Input
            type="number"
            step="0.01"
            placeholder={loadingRate ? "Завантаження..." : "Курс долара"}
            value={local.usd_rate ?? ""}
            onChange={(e) => {
              const value = e.target.value ? parseFloat(e.target.value) : undefined;
              setLocal((p) => ({ ...p, usd_rate: value }));
            }}
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
      <div className="sticky bottom-0 flex gap-3 py-2 bg-background/60 backdrop-blur-lg rounded-b-2xl border-t border-border">
        <Button onClick={apply}>Застосувати</Button>
        <Button variant="ghost" onClick={reset}>Скинути</Button>
      </div>
      {shimmer && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-32 pointer-events-none">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}
    </div>
    </>
  );
};
