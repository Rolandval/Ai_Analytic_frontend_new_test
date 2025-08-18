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
import { RangeSlider } from './ui/RangeSlider';
import { Badge } from '@/components/ui/Badge';

const inverterTypes = ['ON_GRID', 'OFF_GRID', 'HYBRID'];
const generations = ['1G', '2G', '3G'];
const supplierStatuses = ['ME', 'SUPPLIER', 'COMPETITOR'];

interface Props {
  current: InverterPriceListRequestSchema;
  setFilters: (f: InverterPriceListRequestSchema) => void;
  brands: string[];
  suppliers: string[];
}

export const InverterFilters: React.FC<Props> = ({ current, setFilters, brands, suppliers }) => {
  const [local, setLocal] = useState<InverterPriceListRequestSchema>(current);

  const apply = () => setFilters({ ...local, page: 1 });
  const reset = () => {
    const base = { page: 1, page_size: current.page_size ?? 10 } as InverterPriceListRequestSchema;
    setLocal(base);
    setFilters(base);
  };

  return (
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
          {(local.power_min !== undefined || local.power_max !== undefined) && (
            <Badge variant="secondary">
              Потужн. {local.power_min ?? 0}-{local.power_max ?? 'max'} Вт
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
        {/* name */}
        <Input
          placeholder="Назва"
          value={local.full_name ?? ''}
          onChange={(e) => setLocal((p) => ({ ...p, full_name: e.target.value || undefined }))}
        />

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
        <RangeSlider
          min={0}
          max={20000}
          step={100}
          values={[local.power_min, local.power_max]}
          onChange={([min, max]) => setLocal((p) => ({ ...p, power_min: min, power_max: max }))}
          format={(v) => `${v}Вт`}
        />

        {/* string count range */}
        <RangeSlider
          min={1}
          max={24}
          step={1}
          values={[local.string_count_min, local.string_count_max]}
          onChange={([min, max]) =>
            setLocal((p) => ({ ...p, string_count_min: min, string_count_max: max }))
          }
          format={(v) => `${v} стр`}
        />

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
        />

        {/* price range */}
        <RangeSlider
          min={0}
          max={4000}
          step={50}
          values={[local.price_min, local.price_max]}
          onChange={([min, max]) => setLocal((p) => ({ ...p, price_min: min, price_max: max }))}
          format={(v) => `$${v}`}
        />

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
