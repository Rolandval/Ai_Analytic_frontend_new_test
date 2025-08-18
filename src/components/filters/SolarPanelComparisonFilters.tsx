import { useState, useEffect } from 'react';
import { X, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { SolarPanelPriceListRequestSchema } from '@/types/solarPanels';
import { getSolarPanelCities } from '@/services/cities.api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { MultiSelectPopover } from './ui/MultiSelectPopover';
import { Badge } from '@/components/ui/Badge';
import { RangeSliderWithInput } from './ui/RangeSliderWithInput';
import { cn } from '@/lib/utils';

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

export const SolarPanelComparisonFilters: React.FC<Props> = ({ current, setFilters, brands, suppliers }) => {
  const [shimmer, setShimmer] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [local, setLocal] = useState<SolarPanelPriceListRequestSchema>({
    ...current
  });
  const [isExpanded, setIsExpanded] = useState(false);
  
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
      {Object.values(local).some(v=>v!==undefined && v!=='') && (
        <div className="flex flex-wrap gap-1 sm:gap-2 items-center sticky top-4 z-20 bg-background/80 backdrop-blur-lg px-2 py-1 rounded-xl border border-border">
          <span className="text-xs sm:text-sm font-medium">Фільтри:</span>
          {local.brands?.map(b=>(<Badge key={b} className="bg-blue-500/10 text-blue-400 border-blue-400 text-xs py-0 h-6">
            {b}
            <button 
              onClick={() => setLocal(prev => ({ ...prev, brands: prev.brands?.filter(brand => brand !== b) }))}
              className="ml-1 hover:text-red-500 transition-colors"
            >
              <X size={12} />
            </button>
          </Badge>))}
          {local.cities?.map(city=>(<Badge key={city} className="bg-green-500/10 text-green-400 border-green-400 text-xs py-0 h-6">
            {city}
            <button 
              onClick={() => setLocal(prev => ({ ...prev, cities: prev.cities?.filter(c => c !== city) }))} 
              className="ml-1 hover:text-red-500 transition-colors"
            >
              <X size={12} />
            </button>
          </Badge>))}
          {local.full_name && (
            <Badge className="bg-green-500/10 text-green-400 border-green-400 text-xs py-0 h-6">
              Назва: {local.full_name}
              <button 
                onClick={() => setLocal(prev => ({ ...prev, full_name: undefined }))}
                className="ml-1 hover:text-red-500 transition-colors"
              >
                <X size={12} />
              </button>
            </Badge>
          )}
          {local.suppliers?.map(s=>(<Badge key={s} className="bg-violet-500/10 text-violet-400 border-violet-400 text-xs py-0 h-6">
            {s}
            <button 
              onClick={() => setLocal(prev => ({ ...prev, suppliers: prev.suppliers?.filter(supp => supp !== s) }))}
              className="ml-1 hover:text-red-500 transition-colors"
            >
              <X size={12} />
            </button>
          </Badge>))}
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
          {/* clear & apply */}
          <button onClick={reset} className="ml-auto mr-1 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
          <Button size="sm" onClick={apply} className="text-xs sm:text-sm h-6 sm:h-8">Застосувати</Button>
        </div>
      )}

      {/* grid */}
      <div className={cn(
        "grid gap-3 sm:gap-5 transition-all duration-200",
        isExpanded ? "grid-cols-1 sm:grid-cols-2" : "hidden md:grid",
        "md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      )}>
        {/* Name search */}
        <Input
          placeholder="Пошук по назві..."
          value={local.full_name ?? ''}
          onChange={(e) => setLocal(prev => ({ ...prev, full_name: e.target.value || undefined }))}
          className="w-full"
        />

        {/* brands & suppliers */}
        <MultiSelectPopover
          placeholder="+ Виробник"
          options={brands}
          values={local.brands ?? []}
          onChange={(brands: string[] | undefined) => setLocal(prev => ({ ...prev, brands }))} 
        />
        <MultiSelectPopover
          placeholder="+ Постачальник"
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

        {/* power */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-slate-400">Потужність, Вт</span>
          <RangeSliderWithInput
            min={100}
            max={700}
            step={10}
            values={[local.power_min, local.power_max]}
            onChange={([min, max]) => setLocal(p=>({...p,power_min:min,power_max:max}))}
            format={v=>`${v}Вт`}
            formatInput={(v) => `${v}`}
            suffix="Вт"
          />
        </div>
        
        {/* price */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-slate-400">Ціна, $</span>
          <RangeSliderWithInput
            min={0}
            max={600}
            step={10}
            values={[local.price_min, local.price_max]}
            onChange={([min, max]) => setLocal(p=>({...p,price_min:min,price_max:max}))}
            format={v=>`$${v}`}
            formatInput={(v) => `${v}`}
            suffix="$"
          />
        </div>

        {/* price per watt */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-slate-400">Ціна за ват, $/Вт</span>
          <RangeSliderWithInput
            min={0}
            max={1}
            step={0.01}
            values={[local.price_per_w_min, local.price_per_w_max]}
            onChange={([min, max]) => setLocal(p=>({...p,price_per_w_min:min,price_per_w_max:max}))}
            format={v=>`$${v}`}
            formatInput={(v) => `${v}`}
            suffix="$/Вт"
          />
        </div>

        {/* thickness */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-slate-400">Товщина, мм</span>
          <RangeSliderWithInput
            min={0}
            max={50}
            step={1}
            values={[local.thickness_min, local.thickness_max]}
            onChange={([min, max]) => setLocal(p=>({...p,thickness_min:min,thickness_max:max}))}
            format={v=>`${v}мм`}
            formatInput={(v) => `${v}`}
            suffix="мм"
          />
        </div>

        {/* No efficiency field in schema */}

        {/* technology filters */}
        <Select value={local.panel_type ?? ''} onValueChange={(v)=>setLocal(p=>({...p,panel_type:v||undefined}))}>
          <SelectTrigger><SelectValue placeholder="Тип панелі" /></SelectTrigger>
          <SelectContent>
            {panelTypes.map(t=>(<SelectItem key={t} value={t}>{t}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={local.cell_type ?? ''} onValueChange={(v)=>setLocal(p=>({...p,cell_type:v||undefined}))}>
          <SelectTrigger><SelectValue placeholder="Тип комірки" /></SelectTrigger>
          <SelectContent>
            {cellTypes.map(c=>(<SelectItem key={c} value={c}>{c}</SelectItem>))}
          </SelectContent>
        </Select>
        {/* No cell_count field in schema */}
        {/* No color field in schema - use panel_color instead */}
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
        
        {/* date range simple */}
        <Input type="date" value={local.date_min ?? ''} onChange={e=>setLocal(p=>({...p,date_min:e.target.value||undefined}))} />
        <Input type="date" value={local.date_max ?? ''} onChange={e=>setLocal(p=>({...p,date_max:e.target.value||undefined}))} />

        {/* sorting & page size remain */}
        <Select value={local.price_sort ?? ''} onValueChange={(v)=>setLocal(p=>({...p,price_sort:v as 'asc'|'desc'}))}>
          <SelectTrigger><SelectValue placeholder="Сортувати ціну" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">↑ ціна</SelectItem>
            <SelectItem value="desc">↓ ціна</SelectItem>
          </SelectContent>
        </Select>
        <Select value={local.price_per_w_sort ?? ''} onValueChange={(v)=>setLocal(p=>({...p,price_per_w_sort:v as 'asc'|'desc'}))}>
          <SelectTrigger><SelectValue placeholder="Сортувати $/Вт" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">↑ $/Вт</SelectItem>
            <SelectItem value="desc">↓ $/Вт</SelectItem>
          </SelectContent>
        </Select>
        <Select value={String(local.page_size ?? 10)} onValueChange={(v)=>setLocal(p=>({...p,page_size:Number(v)}))}>
          <SelectTrigger><SelectValue placeholder="page size" /></SelectTrigger>
          <SelectContent>
            {[10,20,50,100].map(n=>(<SelectItem key={n} value={String(n)}>{n}</SelectItem>))}
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
