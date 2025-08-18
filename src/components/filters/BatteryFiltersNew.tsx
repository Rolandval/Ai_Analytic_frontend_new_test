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
import { RangeSlider } from './ui/RangeSlider';
import { Badge } from '@/components/ui/Badge';

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
  const [local, setLocal] = useState<BatteryPriceListRequestSchema>(current);

  const apply = () => setFilters({ ...local, page: 1 });
  const reset = () => {
    const base = { page: 1, page_size: current.page_size ?? 10 } as BatteryPriceListRequestSchema;
    setLocal(base);
    setFilters(base);
  };

  return (
    <div className="w-full max-w-[1280px] mx-auto flex flex-col gap-4">
      {/* active filters */}
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
              Ціна {local.price_min ?? 0}-{local.price_max ?? 'max'}$
            </Badge>
          )}
        </div>
      )}

      {/* grid */}
      <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))' }}>
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

        {/* brands & suppliers */}
        <MultiSelectPopover
          placeholder="Бренди"
          options={brands}
          values={local.brands}
          onChange={(vals) => setLocal((p) => ({ ...p, brands: vals }))}
        />
        <MultiSelectPopover
          placeholder="Постачальники"
          options={suppliers}
          values={local.suppliers}
          onChange={(vals) => setLocal((p) => ({ ...p, suppliers: vals }))}
        />

        {/* volume */}
        <RangeSlider
          min={0}
          max={300}
          step={5}
          values={[local.volume_min, local.volume_max]}
          onChange={([min, max]) => setLocal((p) => ({ ...p, volume_min: min, volume_max: max }))}
          format={(v) => `${v}Ah`}
        />

        {/* c_amps */}
        <RangeSlider
          min={0}
          max={1200}
          step={10}
          values={[local.c_amps_min, local.c_amps_max]}
          onChange={([min, max]) => setLocal((p) => ({ ...p, c_amps_min: min, c_amps_max: max }))}
          format={(v) => `${v}A`}
        />

        {/* price */}
        <RangeSlider
          min={0}
          max={1000}
          step={10}
          values={[local.price_min, local.price_max]}
          onChange={([min, max]) => setLocal((p) => ({ ...p, price_min: min, price_max: max }))}
          format={(v) => `$${v}`}
        />

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
      <div className="sticky bottom-0 flex gap-3 py-2 bg-background/60 backdrop-blur-lg rounded-b-2xl border-t border-border">
        <Button onClick={apply}>Застосувати</Button>
        <Button variant="ghost" onClick={reset}>Скинути</Button>
      </div>
    </div>
  );
};
