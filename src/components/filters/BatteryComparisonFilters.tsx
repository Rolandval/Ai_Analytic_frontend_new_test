import { useState, useEffect, useRef } from 'react';
import { BatteryPriceListRequestSchema } from '@/types/batteries';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { MultiSelectPopover } from './ui/MultiSelectPopover';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { Badge } from '@/components/ui/Badge';
import { Filter, X, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const regions = ['EUROPE', 'ASIA'];
const polarities = ['L+', 'R+'];
const electrolytes = ['AGM', 'EFB', 'GEL'];
const supplierStatuses = ['ME', 'SUPPLIER', 'COMPETITOR'];

// DraggableFilterItem component
interface DraggableFilterItemProps {
  id: string;
  children: React.ReactNode;
}

const DraggableFilterItem: React.FC<DraggableFilterItemProps> = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div
        {...attributes}
        {...listeners}
        className="absolute -left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10"
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>
      {children}
    </div>
  );
};

interface Props {
  current: BatteryPriceListRequestSchema;
  setFilters: (f: BatteryPriceListRequestSchema) => void;
  brands: string[];
  suppliers: string[];
}

export const BatteryComparisonFilters: React.FC<Props> = ({ current, setFilters, brands, suppliers }) => {
  const [local, setLocal] = useState<BatteryPriceListRequestSchema>({
    ...current
  });
  const [isExpanded, setIsExpanded] = useState(false);

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
      const payload = { ...local, page: 1 } as BatteryPriceListRequestSchema;
      const signature = JSON.stringify(normalize(payload));
      if (signature !== lastAppliedRef.current) {
        lastAppliedRef.current = signature;
        setFilters(payload);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [local, setFilters]);

  const reset = () => {
    const base = { page: 1, page_size: current.page_size ?? 10 } as BatteryPriceListRequestSchema;
    setLocal(base);
    setFilters(base);
  };

  // Drag and drop functionality
  const [filterOrder, setFilterOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('batteryComparisonFilters-order');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback to default order
      }
    }
    return [
      'brands',
      'suppliers',
      'volume',
      'c_amps',
      'price',
      'region',
      'polarity',
      'electrolyte',
      'supplier_status',
      'date_range',
      'price_sort'
    ];
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFilterOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        localStorage.setItem('batteryComparisonFilters-order', JSON.stringify(newOrder));
        return newOrder;
      });
    }
  };

  // Filter components mapping
  const filterComponents: Record<string, React.ReactNode> = {
    brands: (
      <MultiSelectPopover
        placeholder="Виробник"
        options={brands}
        values={local.brands || []}
        onChange={(vals) => setLocal((p) => ({ ...p, brands: vals }))}
        showSelectAll
        selectAllLabel="Вибрати всі бренди"
        clearLabel="Скинути"
      />
    ),
    suppliers: (
      <MultiSelectPopover
        placeholder="Постачальники"
        options={suppliers}
        values={local.suppliers || []}
        onChange={(vals) => setLocal((p) => ({ ...p, suppliers: vals }))}
        showSelectAll
        selectAllLabel="Вибрати всіх постачальників"
        clearLabel="Скинути"
      />
    ),
    volume: (
      <div className="flex flex-col gap-1">
        <span className="text-[12px] font-medium text-slate-600">Обʼєм, Ah</span>
        <div className="flex gap-1 items-center">
          <Input
            type="number"
            placeholder="від"
            value={local.volume_min?.toString() || ''}
            onChange={(e) => setLocal(p => ({ ...p, volume_min: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-8 text-sm border-gray-300"
          />
          <span className="text-xs text-slate-400">-</span>
          <Input
            type="number"
            placeholder="до"
            value={local.volume_max?.toString() || ''}
            onChange={(e) => setLocal(p => ({ ...p, volume_max: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-8 text-sm border-gray-300"
          />
        </div>
      </div>
    ),
    c_amps: (
      <div className="flex flex-col gap-1">
        <span className="text-[12px] font-medium text-slate-600">Пуск А, A</span>
        <div className="flex gap-1 items-center">
          <Input
            type="number"
            placeholder="від"
            value={local.c_amps_min?.toString() || ''}
            onChange={(e) => setLocal(p => ({ ...p, c_amps_min: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-8 text-sm border-gray-300"
          />
          <span className="text-xs text-slate-400">-</span>
          <Input
            type="number"
            placeholder="до"
            value={local.c_amps_max?.toString() || ''}
            onChange={(e) => setLocal(p => ({ ...p, c_amps_max: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-8 text-sm border-gray-300"
          />
        </div>
      </div>
    ),
    price: (
      <div className="flex flex-col gap-1">
        <span className="text-[12px] font-medium text-slate-600">Ціна, грн</span>
        <div className="flex gap-1 items-center">
          <Input
            type="number"
            placeholder="від"
            value={local.price_min?.toString() || ''}
            onChange={(e) => setLocal(p => ({ ...p, price_min: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-8 text-sm border-gray-300"
          />
          <span className="text-xs text-slate-400">-</span>
          <Input
            type="number"
            placeholder="до"
            value={local.price_max?.toString() || ''}
            onChange={(e) => setLocal(p => ({ ...p, price_max: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-8 text-sm border-gray-300"
          />
        </div>
      </div>
    ),
    region: (
      <div className="flex flex-col gap-1 p-1">
        <span className="text-[14px] font-semibold text-slate-700">Регіон</span>
        <div className="flex flex-nowrap gap-1 text-[14px] overflow-hidden">
          {regions.map((r) => (
            <label key={r} className="inline-flex items-center gap-1 cursor-pointer text-slate-700">
              <input
                type="radio"
                name="region"
                checked={local.region === r}
                onChange={() => setLocal((p) => ({ ...p, region: r }))}
                className="peer accent-primary"
              />
              <span className="truncate max-w-[80px]" title={r}>{r}</span>
            </label>
          ))}
          <label className="inline-flex items-center gap-1 cursor-pointer text-slate-700">
            <input
              type="radio"
              name="region"
              checked={local.region === undefined}
              onChange={() => setLocal((p) => ({ ...p, region: undefined }))}
              className="peer accent-primary"
            />
            <span>всі</span>
          </label>
        </div>
      </div>
    ),
    polarity: (
      <div className="flex flex-col gap-1 p-1">
        <span className="text-[14px] font-semibold text-slate-700">Полярність</span>
        <div className="flex flex-nowrap gap-1 text-[14px] overflow-hidden">
          {polarities.map((pola) => (
            <label key={pola} className="inline-flex items-center gap-1 cursor-pointer text-slate-700">
              <input
                type="radio"
                name="polarity"
                checked={local.polarity === pola}
                onChange={() => setLocal((p) => ({ ...p, polarity: pola }))}
                className="peer accent-primary"
              />
              <span className="truncate max-w-[80px]" title={pola}>{pola}</span>
            </label>
          ))}
          <label className="inline-flex items-center gap-1 cursor-pointer text-slate-700">
            <input
              type="radio"
              name="polarity"
              checked={local.polarity === undefined}
              onChange={() => setLocal((p) => ({ ...p, polarity: undefined }))}
              className="peer accent-primary"
            />
            <span>всі</span>
          </label>
        </div>
      </div>
    ),
    electrolyte: (
      <div className="flex flex-col gap-1 p-1">
        <span className="text-[14px] font-semibold text-slate-700">Електроліт</span>
        <div className="flex flex-nowrap gap-1 text-[14px] overflow-hidden">
          {electrolytes.map((e) => (
            <label key={e} className="inline-flex items-center gap-1 cursor-pointer text-slate-700">
              <input
                type="radio"
                name="electrolyte"
                checked={local.electrolyte?.[0] === e}
                onChange={() => setLocal((p) => ({ ...p, electrolyte: [e] }))}
                className="peer accent-primary"
              />
              <span className="truncate max-w-[80px]" title={e}>{e}</span>
            </label>
          ))}
          <label className="inline-flex items-center gap-1 cursor-pointer text-slate-700">
            <input
              type="radio"
              name="electrolyte"
              checked={!local.electrolyte || local.electrolyte.length === 0}
              onChange={() => setLocal((p) => ({ ...p, electrolyte: undefined }))}
              className="peer accent-primary"
            />
            <span>всі</span>
          </label>
        </div>
      </div>
    ),
    supplier_status: (
      <div className="flex flex-col gap-1 p-1">
        <span className="text-[14px] font-semibold text-slate-700">Статус постач.</span>
        <div className="flex flex-nowrap gap-1 text-[14px] overflow-hidden">
          {supplierStatuses.map((s) => (
            <label key={s} className="inline-flex items-center gap-1 cursor-pointer text-slate-700">
              <input
                type="radio"
                name="supplier_status"
                checked={local.supplier_status?.[0] === s}
                onChange={() => setLocal((p) => ({ ...p, supplier_status: [s] }))}
                className="peer accent-primary"
              />
              <span className="truncate max-w-[80px]" title={s === 'ME' ? 'ми' : s === 'SUPPLIER' ? 'постачальник' : 'конкурент'}>
                {s === 'ME' ? 'ми' : s === 'SUPPLIER' ? 'постач.' : 'конкур.'}
              </span>
            </label>
          ))}
          <label className="inline-flex items-center gap-1 cursor-pointer text-slate-700">
            <input
              type="radio"
              name="supplier_status"
              checked={!local.supplier_status || local.supplier_status.length === 0}
              onChange={() => setLocal((p) => ({ ...p, supplier_status: undefined }))}
              className="peer accent-primary"
            />
            <span>всі</span>
          </label>
        </div>
      </div>
    ),
    date_range: (
      <DateRangePicker
        startDate={local.date_min}
        endDate={local.date_max}
        onChange={(startDate: string | undefined, endDate: string | undefined) => {
          setLocal((p) => ({ ...p, date_min: startDate, date_max: endDate }));
        }}
        placeholder="Оберіть період"
        className="w-full"
      />
    ),
    price_sort: (
      <div className="flex flex-col gap-1 p-1">
        <span className="text-[14px] font-semibold text-slate-700">Сортувати ціну</span>
        <div className="flex flex-nowrap gap-2 text-[14px] leading-tight overflow-hidden">
          <label className="inline-flex items-center gap-1 cursor-pointer text-slate-700 whitespace-nowrap">
            <input
              type="radio"
              name="price_sort"
              checked={local.price_sort === 'asc'}
              onChange={() => setLocal((p) => ({ ...p, price_sort: 'asc' }))}
              className="peer accent-primary"
            />
            <span>↑ ціна</span>
          </label>
          <label className="inline-flex items-center gap-1 cursor-pointer text-slate-700 whitespace-nowrap">
            <input
              type="radio"
              name="price_sort"
              checked={local.price_sort === 'desc'}
              onChange={() => setLocal((p) => ({ ...p, price_sort: 'desc' }))}
              className="peer accent-primary"
            />
            <span>↓ ціна</span>
          </label>
          <label className="inline-flex items-center gap-1 cursor-pointer text-slate-700 whitespace-nowrap">
            <input
              type="radio"
              name="price_sort"
              checked={!local.price_sort}
              onChange={() => setLocal((p) => ({ ...p, price_sort: undefined }))}
              className="peer accent-primary"
            />
            <span>без сорт.</span>
          </label>
        </div>
      </div>
    ),
  };

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
          
          {/* Регіон */}
          {Array.isArray(local.region) && local.region.length > 0 && (
            local.region.map(region => (
              <Badge key={region} variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
                Регіон: {region}
                <X 
                  className="w-3 h-3 ml-1 cursor-pointer" 
                  onClick={() => setLocal(p => ({ ...p, region: Array.isArray(p.region) ? p.region.filter(r => r !== region) : undefined }))}
                />
              </Badge>
            ))
          )}
          
          {/* Полярність */}
          {Array.isArray(local.polarity) && local.polarity.length > 0 && (
            local.polarity.map(polarity => (
              <Badge key={polarity} variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                Полярність: {polarity}
                <X 
                  className="w-3 h-3 ml-1 cursor-pointer" 
                  onClick={() => setLocal(p => ({ ...p, polarity: Array.isArray(p.polarity) ? p.polarity.filter(pol => pol !== polarity) : undefined }))}
                />
              </Badge>
            ))
          )}
          
          {/* Обʼєм */}
          {(local.volume_min || local.volume_max) && (
            <Badge variant="secondary" className="bg-pink-100 text-pink-800 border-pink-200">
              Обʼєм: {local.volume_min || '∞'}-{local.volume_max || '∞'} Ah
              <X 
                className="w-3 h-3 ml-1 cursor-pointer" 
                onClick={() => setLocal(p => ({ ...p, volume_min: undefined, volume_max: undefined }))}
              />
            </Badge>
          )}
          
          {/* Пуск А */}
          {(local.c_amps_min || local.c_amps_max) && (
            <Badge variant="secondary" className="bg-cyan-100 text-cyan-800 border-cyan-200">
              Пуск А: {local.c_amps_min || '∞'}-{local.c_amps_max || '∞'} A
              <X 
                className="w-3 h-3 ml-1 cursor-pointer" 
                onClick={() => setLocal(p => ({ ...p, c_amps_min: undefined, c_amps_max: undefined }))}
              />
            </Badge>
          )}
          
          {/* Ціна */}
          {(local.price_min || local.price_max) && (
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200">
              Ціна: {local.price_min || '∞'}-{local.price_max || '∞'} грн
              <X 
                className="w-3 h-3 ml-1 cursor-pointer" 
                onClick={() => setLocal(p => ({ ...p, price_min: undefined, price_max: undefined }))}
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

      {/* grid - відображається завжди на десктопі та умовно на мобільних */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={filterOrder} strategy={verticalListSortingStrategy}>
          <div className={cn(
            "grid gap-3 sm:gap-5 transition-all duration-200",
            isExpanded ? "grid-cols-1 sm:grid-cols-2" : "hidden md:grid",
            "md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          )}>
            {filterOrder.map((filterId) => (
              <DraggableFilterItem key={filterId} id={filterId}>
                {filterComponents[filterId]}
              </DraggableFilterItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* actions */}
      <div className={cn(
        "sticky bottom-0 flex gap-2 sm:gap-3 py-2 bg-background/60 backdrop-blur-lg rounded-b-2xl border-t border-border z-10",
        isExpanded ? "flex" : "hidden md:flex"
      )}>
        <Button size="sm" variant="ghost" onClick={reset} className="text-xs sm:text-sm h-8 sm:h-10">
          Скинути
        </Button>
      </div>
    </div>
  );
};
