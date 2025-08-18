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
import { SolarPanelPriceCreateSchemaRequest } from '@/types/solarPanels';

interface Props {
  brands: string[];
  suppliers: string[];
  currencySymbol: string;
  onSubmit: (payload: SolarPanelPriceCreateSchemaRequest) => Promise<void> | void;
}

const supplierStatuses = ['ME', 'SUPPLIER', 'COMPETITOR'];
const panelTypes = ['MONO', 'POLY', 'THIN'];
const cellTypes = ['PERC', 'TOPCON', 'SHINGLED'];
const panelColors = ['black', 'silver', 'transparent'];
const frameColors = ['black', 'silver'];

export const CreateSolarPanelPriceForm: React.FC<Props> = ({ brands, suppliers, currencySymbol, onSubmit }) => {
  const [form, setForm] = useState<SolarPanelPriceCreateSchemaRequest>({
    full_name: '',
    brand: '',
    supplier: '',
    supplier_status: 'SUPPLIER',
    price: 0,
    price_per_w: 0,
  } as SolarPanelPriceCreateSchemaRequest);

  const handle = (field: keyof SolarPanelPriceCreateSchemaRequest) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setForm((p) => ({ ...p, [field]: v }));
  };

  const valid =
    !!form.full_name &&
    !!form.brand &&
    !!form.supplier &&
    form.price > 0 &&
    form.price_per_w > 0;

  return (
    <form
      className="grid grid-cols-2 gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        await onSubmit({
          ...form,
          power: form.power === undefined || form.power === null || form.power === '' ? undefined : Number(form.power),
          thickness: form.thickness === undefined || form.thickness === null || form.thickness === '' ? undefined : Number(form.thickness),
          price: Number(form.price),
          price_per_w: Number(form.price_per_w),
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

      <Input type="number" placeholder="Товщина, мм" value={form.thickness ?? ''} onChange={handle('thickness')} />

      {/* Panel type */}
      <Select value={form.panel_type ?? ''} onValueChange={(v) => setForm((p) => ({ ...p, panel_type: v }))}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Тип панелі" />
        </SelectTrigger>
        <SelectContent>
          {panelTypes.map((t) => (
            <SelectItem key={t} value={t}>
              {t}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Cell type */}
      <Select value={form.cell_type ?? ''} onValueChange={(v) => setForm((p) => ({ ...p, cell_type: v }))}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Тип елементу" />
        </SelectTrigger>
        <SelectContent>
          {cellTypes.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Panel color */}
      <Select value={form.panel_color ?? ''} onValueChange={(v)=>setForm(p=>({...p,panel_color:v}))}>
        <SelectTrigger className="w-full"><SelectValue placeholder="Колір панелі" /></SelectTrigger>
        <SelectContent>
          {panelColors.map(c=>(<SelectItem key={c} value={c}>{c}</SelectItem>))}
        </SelectContent>
      </Select>

      {/* Frame color */}
      <Select value={form.frame_color ?? ''} onValueChange={(v)=>setForm(p=>({...p,frame_color:v}))}>
        <SelectTrigger className="w-full"><SelectValue placeholder="Колір рами" /></SelectTrigger>
        <SelectContent>
          {frameColors.map(c=>(<SelectItem key={c} value={c}>{c}</SelectItem>))}
        </SelectContent>
      </Select>

      {/* Price */}
      <Input
        type="number"
        placeholder={`Ціна (${currencySymbol})`}
        value={form.price}
        onChange={handle('price')}
        required
      />
      {/* Price per W */}
      <Input
        type="number"
        placeholder="Ціна/Вт"
        value={form.price_per_w}
        onChange={handle('price_per_w')}
        required
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
