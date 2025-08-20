import { useState, useEffect, useRef } from 'react';
import { SolarPanelPriceListRequestSchema } from '@/types/solarPanels';
import { Input } from '@/components/ui/Input';
import { MultiSelectPopover } from './ui/MultiSelectPopover';
import { getSolarPanelCities } from '@/services/cities.api';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const panelTypes = ['одностороння', 'двостороння'];
const cellTypes = ['p-type', 'n-type'];
const panelColors = ['Default', 'All Black'];
const frameColors = ['black', 'silver'];
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

  // Auto-apply filters with debounce
  const lastAppliedRef = useRef<string>('');
  
  useEffect(() => {
    const initial = JSON.stringify({ ...local, page: 1 });
    lastAppliedRef.current = initial;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      const normalize = (o: Record<string, any>) => {
        const n: Record<string, any> = {};
        Object.entries(o).forEach(([k, v]) => {
          if (v === '' || v === null) return;
          if (Array.isArray(v)) {
            if (v.length > 0) n[k] = v.slice();
          } else if (v !== undefined) {
            n[k] = v;
          }
        });
        return n;
      };
      const payload = { ...local, page: 1 } as SolarPanelPriceListRequestSchema;
      const signature = JSON.stringify(normalize(payload));
      if (signature !== lastAppliedRef.current) {
        lastAppliedRef.current = signature;
        setFilters(payload);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [local, setFilters]);
  
  const reset = () => {
    const base = { page: 1, page_size: current.page_size ?? 10 };
    setLocal(base);
    setFilters(base);
  };

  // Active filters count
  const activeFiltersCount = Object.keys(local).filter(key => {
    const value = local[key as keyof SolarPanelPriceListRequestSchema];
    return value !== undefined && value !== null && value !== '' && 
           !(Array.isArray(value) && value.length === 0) &&
           key !== 'page' && key !== 'page_size';
  }).length;

  return (
    <div className="w-full max-w-[1280px] mx-auto flex flex-col gap-4">
      {/* Top search and active filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Name search input */}
        <div className="flex-shrink-0">
          <Input
            placeholder="Назва"
            value={local.full_name || ''}
            onChange={e => setLocal(p => ({ ...p, full_name: e.target.value || undefined }))}
            className="w-64 bg-white text-slate-800 placeholder-slate-400 border border-slate-300 focus-visible:ring-2 focus-visible:ring-primary/40"
          />
        </div>
        
        {/* Active filters */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Бренди */}
          {local.brands && local.brands.length > 0 && (
            local.brands.map(brand => (
              <Badge key={brand} variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                {brand}
                <X 
                  className="w-3 h-3 ml-1 cursor-pointer" 
                  onClick={() => setLocal(p => ({ ...p, brands: p.brands?.filter(b => b !== brand) }))}
                />
              </Badge>
            ))
          )}
          
          {/* Постачальники */}
          {local.suppliers && local.suppliers.length > 0 && (
            local.suppliers.map(supplier => (
              <Badge key={supplier} variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                {supplier}
                <X 
                  className="w-3 h-3 ml-1 cursor-pointer" 
                  onClick={() => setLocal(p => ({ ...p, suppliers: p.suppliers?.filter(s => s !== supplier) }))}
                />
              </Badge>
            ))
          )}
          
          {/* Міста */}
          {local.cities && local.cities.length > 0 && (
            local.cities.map(city => (
              <Badge key={city} variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
                {city}
                <X 
                  className="w-3 h-3 ml-1 cursor-pointer" 
                  onClick={() => setLocal(p => ({ ...p, cities: p.cities?.filter(c => c !== city) }))}
                />
              </Badge>
            ))
          )}
          
          {/* Потужність */}
          {(local.power_min || local.power_max) && (
            <Badge variant="secondary" className="bg-pink-100 text-pink-800 border-pink-200">
              Потужність: {local.power_min || '∞'}-{local.power_max || '∞'} Вт
              <X 
                className="w-3 h-3 ml-1 cursor-pointer" 
                onClick={() => setLocal(p => ({ ...p, power_min: undefined, power_max: undefined }))}
              />
            </Badge>
          )}
          
          {/* Ціна */}
          {(local.price_min || local.price_max) && (
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200">
              Ціна: {local.price_min || '∞'}-{local.price_max || '∞'} $
              <X 
                className="w-3 h-3 ml-1 cursor-pointer" 
                onClick={() => setLocal(p => ({ ...p, price_min: undefined, price_max: undefined }))}
              />
            </Badge>
          )}
          
          {/* Ціна за Вт */}
          {(local.price_per_w_min || local.price_per_w_max) && (
            <Badge variant="secondary" className="bg-cyan-100 text-cyan-800 border-cyan-200">
              Ціна/Вт: {local.price_per_w_min || '∞'}-{local.price_per_w_max || '∞'} $/Вт
              <X 
                className="w-3 h-3 ml-1 cursor-pointer" 
                onClick={() => setLocal(p => ({ ...p, price_per_w_min: undefined, price_per_w_max: undefined }))}
              />
            </Badge>
          )}
          
          {/* Товщина */}
          {(local.thickness_min || local.thickness_max) && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
              Товщина: {local.thickness_min || '∞'}-{local.thickness_max || '∞'} мм
              <X 
                className="w-3 h-3 ml-1 cursor-pointer" 
                onClick={() => setLocal(p => ({ ...p, thickness_min: undefined, thickness_max: undefined }))}
              />
            </Badge>
          )}
          
          {/* Reset button */}
          {Object.values(local).some(v => v !== undefined && v !== '' && v !== null && !(Array.isArray(v) && v.length === 0)) && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={reset}
              className="text-slate-500 hover:text-slate-700"
            >
              <X className="w-4 h-4 mr-1" />
              Скинути все
            </Button>
          )}
        </div>
      </div>

      {/* Mobile filter toggle */}
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

      {/* Filter inputs */}
      <div className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3",
        isExpanded ? "grid" : "hidden md:grid"
      )}>

        {/* Brands */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-600">Бренди</label>
          <MultiSelectPopover
            options={brands}
            values={local.brands || []}
            onChange={(values) => setLocal(p => ({ ...p, brands: values }))}
            placeholder="Вибрати бренди"
            className="h-8 text-sm"
            showSelectAll={true}
            selectAllLabel="Вибрати всі бренди"
            clearLabel="Скинути"
          />
        </div>

        {/* Suppliers */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-600">Постачальники</label>
          <MultiSelectPopover
            options={suppliers}
            values={local.suppliers || []}
            onChange={(values) => setLocal(p => ({ ...p, suppliers: values }))}
            placeholder="Вибрати постачальників"
            className="h-8 text-sm"
            showSelectAll={true}
            selectAllLabel="Вибрати всіх постачальників"
            clearLabel="Скинути"
          />
        </div>

        {/* Cities */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-600">Міста</label>
          <MultiSelectPopover
            options={cities}
            values={local.cities || []}
            onChange={(values) => setLocal(p => ({ ...p, cities: values }))}
            placeholder="Вибрати міста"
            className="h-8 text-sm"
          />
        </div>

        {/* Power range */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-600">Потужність, Вт</label>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              placeholder="від"
              value={local.power_min || ''}
              onChange={(e) => setLocal(p => ({ ...p, power_min: e.target.value ? Number(e.target.value) : undefined }))}
              className="h-8 text-sm border-gray-300"
            />
            <span className="text-muted-foreground">-</span>
            <Input
              type="number"
              placeholder="до"
              value={local.power_max || ''}
              onChange={(e) => setLocal(p => ({ ...p, power_max: e.target.value ? Number(e.target.value) : undefined }))}
              className="h-8 text-sm border-gray-300"
            />
          </div>
        </div>

        {/* Price range */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-600">Ціна, $</label>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              placeholder="від"
              value={local.price_min || ''}
              onChange={(e) => setLocal(p => ({ ...p, price_min: e.target.value ? Number(e.target.value) : undefined }))}
              className="h-8 text-sm border-gray-300"
            />
            <span className="text-muted-foreground">-</span>
            <Input
              type="number"
              placeholder="до"
              value={local.price_max || ''}
              onChange={(e) => setLocal(p => ({ ...p, price_max: e.target.value ? Number(e.target.value) : undefined }))}
              className="h-8 text-sm border-gray-300"
            />
          </div>
        </div>

        {/* Price per watt range */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-600">Ціна за Вт, $</label>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              placeholder="від"
              value={local.price_per_w_min || ''}
              onChange={(e) => setLocal(p => ({ ...p, price_per_w_min: e.target.value ? Number(e.target.value) : undefined }))}
              className="h-8 text-sm border-gray-300"
            />
            <span className="text-muted-foreground">-</span>
            <Input
              type="number"
              placeholder="до"
              value={local.price_per_w_max || ''}
              onChange={(e) => setLocal(p => ({ ...p, price_per_w_max: e.target.value ? Number(e.target.value) : undefined }))}
              className="h-8 text-sm border-gray-300"
            />
          </div>
        </div>

        {/* Thickness range */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-600">Товщина, мм</label>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              placeholder="від"
              value={local.thickness_min || ''}
              onChange={(e) => setLocal(p => ({ ...p, thickness_min: e.target.value ? Number(e.target.value) : undefined }))}
              className="h-8 text-sm border-gray-300"
            />
            <span className="text-muted-foreground">-</span>
            <Input
              type="number"
              placeholder="до"
              value={local.thickness_max || ''}
              onChange={(e) => setLocal(p => ({ ...p, thickness_max: e.target.value ? Number(e.target.value) : undefined }))}
              className="h-8 text-sm border-gray-300"
            />
          </div>
        </div>

        {/* Panel type */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-600">Тип панелі</label>
          <div className="flex flex-nowrap gap-2 text-[14px] leading-tight overflow-hidden">
            {panelTypes.map((type) => (
              <label key={type} className="inline-flex items-center gap-1 cursor-pointer text-slate-700 whitespace-nowrap">
                <input
                  type="radio"
                  name="panel_type"
                  checked={local.panel_type === type}
                  onChange={() => setLocal(p => ({ ...p, panel_type: type }))}
                  className="peer accent-primary"
                />
                <span className="truncate max-w-[80px]" title={type}>{type}</span>
              </label>
            ))}
            <label className="inline-flex items-center gap-1 cursor-pointer text-slate-700 whitespace-nowrap">
              <input
                type="radio"
                name="panel_type"
                checked={!local.panel_type}
                onChange={() => setLocal(p => ({ ...p, panel_type: undefined }))}
                className="peer accent-primary"
              />
              <span className="max-w-[80px] truncate">всі</span>
            </label>
          </div>
        </div>

        {/* Cell type */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-600">Тип комірки</label>
          <div className="flex flex-nowrap gap-2 text-[14px] leading-tight overflow-hidden">
            {cellTypes.map((type) => (
              <label key={type} className="inline-flex items-center gap-1 cursor-pointer text-slate-700 whitespace-nowrap">
                <input
                  type="radio"
                  name="cell_type"
                  checked={local.cell_type === type}
                  onChange={() => setLocal(p => ({ ...p, cell_type: type }))}
                  className="peer accent-primary"
                />
                <span className="truncate max-w-[80px]" title={type}>{type}</span>
              </label>
            ))}
            <label className="inline-flex items-center gap-1 cursor-pointer text-slate-700 whitespace-nowrap">
              <input
                type="radio"
                name="cell_type"
                checked={!local.cell_type}
                onChange={() => setLocal(p => ({ ...p, cell_type: undefined }))}
                className="peer accent-primary"
              />
              <span className="max-w-[80px] truncate">всі</span>
            </label>
          </div>
        </div>

        {/* Panel color */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-600">Колір панелі</label>
          <div className="flex flex-nowrap gap-2 text-[14px] leading-tight overflow-hidden">
            {panelColors.map((color) => (
              <label key={color} className="inline-flex items-center gap-1 cursor-pointer text-slate-700 whitespace-nowrap">
                <input
                  type="radio"
                  name="panel_color"
                  checked={local.panel_color === color}
                  onChange={() => setLocal(p => ({ ...p, panel_color: color }))}
                  className="peer accent-primary"
                />
                <span className="truncate max-w-[80px]" title={color}>{color}</span>
              </label>
            ))}
            <label className="inline-flex items-center gap-1 cursor-pointer text-slate-700 whitespace-nowrap">
              <input
                type="radio"
                name="panel_color"
                checked={!local.panel_color}
                onChange={() => setLocal(p => ({ ...p, panel_color: undefined }))}
                className="peer accent-primary"
              />
              <span className="max-w-[80px] truncate">всі</span>
            </label>
          </div>
        </div>

        {/* Frame color */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-600">Колір рами</label>
          <div className="flex flex-nowrap gap-2 text-[14px] leading-tight overflow-hidden">
            {frameColors.map((color) => (
              <label key={color} className="inline-flex items-center gap-1 cursor-pointer text-slate-700 whitespace-nowrap">
                <input
                  type="radio"
                  name="frame_color"
                  checked={local.frame_color === color}
                  onChange={() => setLocal(p => ({ ...p, frame_color: color }))}
                  className="peer accent-primary"
                />
                <span className="truncate max-w-[80px]" title={color}>{color}</span>
              </label>
            ))}
            <label className="inline-flex items-center gap-1 cursor-pointer text-slate-700 whitespace-nowrap">
              <input
                type="radio"
                name="frame_color"
                checked={!local.frame_color}
                onChange={() => setLocal(p => ({ ...p, frame_color: undefined }))}
                className="peer accent-primary"
              />
              <span className="max-w-[80px] truncate">всі</span>
            </label>
          </div>
        </div>

        {/* Supplier status */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-600">Статус постач.</label>
          <div className="flex flex-nowrap gap-2 text-[14px] leading-tight overflow-hidden">
            {supplierStatuses.map((status) => (
              <label key={status} className="inline-flex items-center gap-1 cursor-pointer text-slate-700 whitespace-nowrap">
                <input
                  type="radio"
                  name="supplier_status"
                  checked={local.supplier_status === status}
                  onChange={() => setLocal(p => ({ ...p, supplier_status: status }))}
                  className="peer accent-primary"
                />
                <span className="truncate max-w-[80px]" title={statusLabels[status]}>{statusLabels[status]}</span>
              </label>
            ))}
            <label className="inline-flex items-center gap-1 cursor-pointer text-slate-700 whitespace-nowrap">
              <input
                type="radio"
                name="supplier_status"
                checked={!local.supplier_status}
                onChange={() => setLocal(p => ({ ...p, supplier_status: undefined }))}
                className="peer accent-primary"
              />
              <span className="max-w-[80px] truncate">всі</span>
            </label>
          </div>
        </div>

        {/* Date range */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-600">Період</label>
          <DateRangePicker
            startDate={local.date_min}
            endDate={local.date_max}
            onDateChange={(start, end) => {
              setLocal(p => ({
                ...p,
                date_min: start,
                date_max: end
              }));
            }}
            className="h-8 text-sm"
          />
        </div>
      </div>

      {/* Actions */}
      <div className={cn(
        "sticky bottom-0 flex gap-2 sm:gap-3 py-2 bg-background/60 backdrop-blur-lg rounded-b-2xl border-t border-border z-10 mt-4",
        isExpanded ? "flex" : "hidden md:flex"
      )}>
        <Button size="sm" variant="ghost" onClick={reset} className="text-xs sm:text-sm h-8 sm:h-10">
          Скинути
        </Button>
      </div>
    </div>
  );
};
