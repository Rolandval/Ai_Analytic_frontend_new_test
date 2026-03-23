import React, { useState } from 'react';
import {
  Input
} from '@/components/ui/Input';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { BatteryPriceCreateSchemaRequest } from '@/types/batteries';

interface Props {
  brands: string[];
  suppliers: string[];
  currencySymbol: string;
  onSubmit: (payload: BatteryPriceCreateSchemaRequest) => Promise<void> | void;
}

const regions = ['EUROPE', 'ASIA'];
const polarities = ['L+', 'R+'];
const electrolytes = ['LAB', 'AGM', 'GEL', 'EFB'];
const supplierStatuses = ['ME', 'SUPPLIER', 'COMPETITOR'];

export const CreateBatteryPriceForm: React.FC<Props> = ({ brands, suppliers, currencySymbol, onSubmit }) => {
  const [form, setForm] = useState<BatteryPriceCreateSchemaRequest>({
    full_name: '',
    brand: '',
    supplier: '',
    supplier_status: 'SUPPLIER' as any,
    price: 0,
  } as BatteryPriceCreateSchemaRequest);

  const handle = (field: keyof BatteryPriceCreateSchemaRequest) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setForm((p) => ({ ...p, [field]: v }));
    };

  const valid = form.full_name && form.brand && form.supplier && form.price > 0;

  return (
    <form
      className="grid grid-cols-2 gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        await onSubmit({
          ...form,
          volume: form.volume === undefined || form.volume === null || (form.volume as unknown) === '' ? undefined : Number(form.volume),
          c_amps: form.c_amps === undefined || form.c_amps === null || (form.c_amps as unknown) === '' ? undefined : Number(form.c_amps),
          price: Number(form.price),
        } as any);
      }}
    >
      <Input
        value={form.full_name}
        onChange={handle('full_name')}
        placeholder="Назва"
        required
        className="col-span-2"
      />

      {/* Brand */}
      <Select value={form.brand} onValueChange={(v) => setForm((p) => ({ ...p, brand: v }))}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Бренд" />
        </SelectTrigger>
        <SelectContent>
          {brands.map((b) => (
            <SelectItem key={b} value={b}>
              {b}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Supplier */}
      <Select value={form.supplier} onValueChange={(v) => setForm((p) => ({ ...p, supplier: v }))}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Постачальник" />
        </SelectTrigger>
        <SelectContent>
          {suppliers.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Supplier status */}
      <Select value={form.supplier_status as string} onValueChange={(v) => setForm((p) => ({ ...p, supplier_status: v as any }))}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Статус постачальника" />
        </SelectTrigger>
        <SelectContent>
          {supplierStatuses.map((st) => (
            <SelectItem key={st} value={st}>
              {st}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input type="number" placeholder="Обʼєм" value={form.volume ?? ''} onChange={handle('volume')} />
      <Input type="number" placeholder="Сила струму" value={form.c_amps ?? ''} onChange={handle('c_amps')} />

      {/* Region */}
      <Select value={form.region ?? ''} onValueChange={(v) => setForm((p) => ({ ...p, region: v as any }))}>
        <SelectTrigger className="w-full">
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

      {/* Polarity */}
      <Select value={form.polarity ?? ''} onValueChange={(v) => setForm((p) => ({ ...p, polarity: v as any }))}>
        <SelectTrigger className="w-full">
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

      {/* Electrolyte */}
      <Select value={form.electrolyte ?? ''} onValueChange={(v) => setForm((p) => ({ ...p, electrolyte: v as any }))}>
        <SelectTrigger className="w-full">
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

      {/* Price */}
      <Input
        type="number"
        placeholder={`Ціна (${currencySymbol})`}
        value={form.price}
        onChange={handle('price')}
        required
        className="col-span-2"
      />

      <Button
        type="submit"
        disabled={!valid}
        className={`col-span-2 ${valid ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-slate-700 text-slate-400'}`}
      >
        Створити
      </Button>
    </form>
  );
};
