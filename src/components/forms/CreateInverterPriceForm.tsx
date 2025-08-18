import React, { useState } from 'react';
import { Input } from '@/components/ui/Input';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { InverterPriceCreateSchemaRequest } from '@/types/inverters';

interface Props {
  brands: string[];
  suppliers: string[];
  currencySymbol: string;
  onSubmit: (payload: InverterPriceCreateSchemaRequest) => Promise<void> | void;
}

const supplierStatuses = ['ME', 'SUPPLIER', 'COMPETITOR'];
const inverterTypes = ['ON_GRID', 'OFF_GRID', 'HYBRID'];
const generations = ['1G', '2G', '3G'];

export const CreateInverterPriceForm: React.FC<Props> = ({ brands, suppliers, currencySymbol, onSubmit }) => {
  const [form, setForm] = useState<InverterPriceCreateSchemaRequest>({
    full_name: '',
    brand: '',
    supplier: '',
    supplier_status: 'SUPPLIER',
    price: 0,
  } as InverterPriceCreateSchemaRequest);

  const handle = (field: keyof InverterPriceCreateSchemaRequest) => (e: React.ChangeEvent<HTMLInputElement>) => {
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
          power: form.power === undefined || form.power === null || form.power === '' ? undefined : Number(form.power),
          string_count: form.string_count === undefined || form.string_count === null || form.string_count === '' ? undefined : Number(form.string_count),
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

      <Input type="number" placeholder="Потужність, Вт" value={form.power ?? ''} onChange={handle('power')} />

      {/* Inverter type */}
      <Select value={form.inverter_type ?? ''} onValueChange={(v) => setForm((p) => ({ ...p, inverter_type: v }))}>
        <SelectTrigger className="w-full">
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

      {/* Generation */}
      <Select value={form.generation ?? ''} onValueChange={(v) => setForm((p) => ({ ...p, generation: v }))}>
        <SelectTrigger className="w-full">
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

      <Input type="number" placeholder="К-сть стрінгів" value={form.string_count ?? ''} onChange={handle('string_count')} />
      <Input placeholder="Прошивка" value={form.firmware ?? ''} onChange={handle('firmware')} />

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
