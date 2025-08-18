import { useState, useEffect } from 'react';
import { useUsdRate } from '@/hooks/useUsdRate';
import { X } from 'lucide-react';
import { SolarPanelPriceListRequestSchema } from '@/types/solarPanels';
import { Input } from '@/components/ui/Input';
import { getSolarPanelCities } from '@/services/cities.api';
import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { MultiSelectPopover } from './ui/MultiSelectPopover';
import { Badge } from '@/components/ui/Badge';
import { RangeSliderWithInput } from './ui/RangeSliderWithInput';

const panelTypes = ['одностороння', 'двостороння'];
const cellTypes = ['p-type', 'n-type'];
const supplierStatuses = ['ME', 'SUPPLIER', 'COMPETITOR'];
const statusLabels: Record<string, string> = {
  ME: 'ми',
  SUPPLIER: 'постачальник',
  COMPETITOR: 'конкурент',
};

interface Props {
  current: SolarPanelPriceListRequestSchema;
  setFilters: (f: SolarPanelPriceListRequestSchema) => void;
  brands: string[];
  suppliers: string[];
}

export const SolarPanelFilters: React.FC<Props> = ({ current, setFilters, brands, suppliers }) => {
  const [shimmer, setShimmer] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [local, setLocal] = useState<SolarPanelPriceListRequestSchema>({
    ...current,
    markup: current.markup !== undefined ? current.markup : 15, // Default markup value 15%
  });
  const { rate, loading: loadingRate } = useUsdRate();
  
  // Отримуємо список міст при першому рендері компоненту
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const citiesData = await getSolarPanelCities();
        setCities(citiesData);
      } catch (error) {
        console.error('Помилка отримання списку міст сонячних панелей:', error);
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
    const base = { page: 1, page_size: current.page_size ?? 10 };
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
      {Object.values(local).some(v=>v!==undefined && v!=='') && (
        <div className="flex flex-wrap gap-2 items-center sticky top-4 z-20 bg-background/80 backdrop-blur-lg px-2 py-1 rounded-xl border border-border">
          <span className="text-sm font-medium">Фільтри</span>
          {local.brands?.map(b=>(<Badge key={b} className="bg-blue-500/10 text-blue-400 border-blue-400">{b}</Badge>))}
          {local.suppliers?.map(s=>(<Badge key={s} className="bg-violet-500/10 text-violet-400 border-violet-400">{s}</Badge>))}
          {local.cities?.map(c=>(<Badge key={c} className="bg-green-500/10 text-green-400 border-green-400">{c}</Badge>))}
          {local.supplier_status?.map(st => (
            <Badge key={st} className="bg-teal-500/10 text-teal-400 border-teal-400">{statusLabels[st]}</Badge>
          ))}
          {local.power_min!==undefined || local.power_max!==undefined ? (
            <Badge variant="secondary">Потужн. {local.power_min??0}-{local.power_max??'max'}Вт</Badge>
          ):null}
          {local.thickness_min!==undefined || local.thickness_max!==undefined ? (
            <Badge variant="secondary">Товщ. {local.thickness_min??0}-{local.thickness_max??'max'}мм</Badge>
          ):null}
          {local.price_min!==undefined || local.price_max!==undefined ? (
            <Badge variant="secondary" className="bg-orange-500/10 text-orange-400 border-orange-400">Ціна {local.price_min??0}-{local.price_max??'max'}$</Badge>
          ):null}
          {local.price_per_w_min!==undefined || local.price_per_w_max!==undefined ? (
            <Badge variant="secondary" className="bg-orange-500/10 text-orange-400 border-orange-400">$/Вт {local.price_per_w_min??0}-{local.price_per_w_max??'max'}</Badge>
          ):null}
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
          {/* clear & apply */}
          <button onClick={reset} className="ml-auto mr-1 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
          <Button size="sm" onClick={apply} className="whitespace-nowrap">Застосувати</Button>
        </div>
      )}

      {/* filters grid */}
      <div className="grid gap-5" style={{gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))'}}>
        <Input placeholder="Назва" value={local.full_name ?? ''} onChange={e=>setLocal(p=>({...p,full_name:e.target.value||undefined}))} />

        {/* brands */}
        <MultiSelectPopover
          placeholder="Бренди"
          options={brands}
          values={local.brands}
          onChange={(vals) => setLocal(p=>({...p,brands:vals}))}
        />

        {/* suppliers */}
        <MultiSelectPopover
          placeholder="Постачальники"
          options={suppliers}
          values={local.suppliers}
          onChange={(vals) => setLocal(p=>({...p,suppliers:vals}))}
        />

        {/* cities */}
        <MultiSelectPopover
          placeholder="Міста"
          options={cities}
          values={local.cities}
          onChange={(vals) => setLocal(p=>({...p,cities:vals}))}
        />

        {/* power range */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-slate-400">Потужність, Вт</span>
          <RangeSliderWithInput
            min={0}
            max={1000}
            step={10}
            values={[local.power_min, local.power_max]}
            onChange={([min,max])=>setLocal(p=>({...p,power_min:min,power_max:max}))}
            format={(v)=>`${v}Вт`}
            formatInput={(v) => `${v}`}
            suffix="Вт"
          />
        </div>
        {/* thickness range */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-slate-400">Товщина, мм</span>
          <RangeSliderWithInput
            min={0}
            max={100}
            step={1}
            values={[local.thickness_min, local.thickness_max]}
            onChange={([min,max])=>setLocal(p=>({...p,thickness_min:min,thickness_max:max}))}
            format={(v)=>`${v}мм`}
            formatInput={(v) => `${v}`}
            suffix="мм"
          />
        </div>
        {/* price range */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-slate-400">Ціна, $</span>
          <RangeSliderWithInput
            min={0}
            max={1500}
            step={10}
            values={[local.price_min, local.price_max]}
            onChange={([min,max])=>setLocal(p=>({...p,price_min:min,price_max:max}))}
            format={(v)=>`$${v}`}
            formatInput={(v) => `${v}`}
            suffix="$"
          />
        </div>
        {/* price per watt range */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-slate-400">Ціна за Вт, $/Вт</span>
          <RangeSliderWithInput
            min={0}
            max={1}
            step={0.01}
            values={[local.price_per_w_min, local.price_per_w_max]}
            onChange={([min,max])=>setLocal(p=>({...p,price_per_w_min:min,price_per_w_max:max}))}
            format={(v)=>v.toFixed(2)}
            formatInput={(v) => `${v}`}
            suffix="$/Вт"
          />
        </div>

        {/* panel type */}
        <Select value={local.panel_type ?? ''} onValueChange={(v)=>setLocal(p=>({...p,panel_type:v||undefined}))}>
          <SelectTrigger><SelectValue placeholder="Тип панелі" /></SelectTrigger>
          <SelectContent>
            {panelTypes.map(t=>(<SelectItem key={t} value={t}>{t}</SelectItem>))}
          </SelectContent>
        </Select>

        {/* cell type */}
        <Select value={local.cell_type ?? ''} onValueChange={(v)=>setLocal(p=>({...p,cell_type:v||undefined}))}>
          <SelectTrigger><SelectValue placeholder="Тип елементу" /></SelectTrigger>
          <SelectContent>
            {cellTypes.map(t=>(<SelectItem key={t} value={t}>{t}</SelectItem>))}
          </SelectContent>
        </Select>

        {/* frame & panel color */}
        <Select value={local.panel_color ?? ''} onValueChange={(v)=>setLocal(p=>({...p,panel_color:v||undefined}))}>
          <SelectTrigger><SelectValue placeholder="Колір панелі" /></SelectTrigger>
          <SelectContent>
            {['Default','All Black'].map(c=>(<SelectItem key={c} value={c}>{c}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={local.frame_color ?? ''} onValueChange={(v)=>setLocal(p=>({...p,frame_color:v||undefined}))}>
          <SelectTrigger><SelectValue placeholder="Колір рами" /></SelectTrigger>
          <SelectContent>
            {['black','silver'].map(c=>(<SelectItem key={c} value={c}>{c}</SelectItem>))}
          </SelectContent>
        </Select>

        {/* supplier status */}
        <Select value={local.supplier_status?.[0] ?? ''} onValueChange={(v)=>setLocal(p=>({...p,supplier_status:v?[v]:undefined}))}>
          <SelectTrigger><SelectValue placeholder="Статус постачальника" /></SelectTrigger>
          <SelectContent>
            {supplierStatuses.map(s=> (
              <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

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
        
        {/* date range simple */}
        <Input type="date" value={local.date_min ?? ''} onChange={e=>setLocal(p=>({...p,date_min:e.target.value||undefined}))} />
        <Input type="date" value={local.date_max ?? ''} onChange={e=>setLocal(p=>({...p,date_max:e.target.value||undefined}))} />

        {/* page size */}
        <Select value={String(local.page_size ?? 10)} onValueChange={(v)=>setLocal(p=>({...p,page_size:Number(v)}))}>
          <SelectTrigger><SelectValue placeholder="page size" /></SelectTrigger>
          <SelectContent>
            {[10,20,50,100].map(n=>(<SelectItem key={n} value={String(n)}>{n}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>
    </div>
    {shimmer && (
      <style>
        {`
          @keyframes shimmer {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }
          .animate-shimmer {
            animation: shimmer 2s infinite linear;
          }
        `}
      </style>
    )}
    </>
   );
};