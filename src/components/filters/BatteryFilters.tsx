import { useState, useEffect, useRef } from 'react';
import { X, GripVertical } from 'lucide-react';
import { BatteryPriceListRequestSchema } from '@/types/batteries';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { getBatteryCities } from '@/services/cities.api';
import { MultiSelectPopover } from './ui/MultiSelectPopover';
import { Badge } from '@/components/ui/Badge';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
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
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';

const regions = ['EUROPE', 'ASIA'];
const polarities = ['L+', 'R+'];
const electrolytes = ['AGM', 'EFB', 'GEL'];
const supplierStatuses = ['ME', 'SUPPLIER', 'COMPETITOR'];

// Default filter order for batteries
const DEFAULT_BATTERY_FILTER_ORDER = [
  'brands',
  'suppliers',
  'cities',
  'volume',
  'c_amps',
  'price',
  'region',
  'polarity',
  'electrolyte',
  'supplier_status',
  'date_range',
  'markup'
];

// Get saved filter order from localStorage or use default
const getSavedBatteryFilterOrder = (): string[] => {
  try {
    const saved = localStorage.getItem('batteryFilterOrder');
    return saved ? JSON.parse(saved) : DEFAULT_BATTERY_FILTER_ORDER;
  } catch {
    return DEFAULT_BATTERY_FILTER_ORDER;
  }
};

// Save filter order to localStorage
const saveBatteryFilterOrder = (order: string[]) => {
  try {
    localStorage.setItem('batteryFilterOrder', JSON.stringify(order));
  } catch {
    // Ignore localStorage errors
  }
};

interface DraggableFilterItemProps {
  id: string;
  children: React.ReactNode;
  isDragOverlay?: boolean;
}

// Draggable filter item component
const DraggableFilterItem: React.FC<DraggableFilterItemProps> = ({ id, children, isDragOverlay = false }) => {
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
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${isDragOverlay ? 'z-50' : ''}`}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10 p-1 hover:bg-gray-100 rounded"
        title="Перетягніть для зміни порядку"
      >
        <GripVertical className="w-4 h-4 text-gray-400" />
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

interface TopSearchProps {
  current: BatteryPriceListRequestSchema;
  setFilters: (f: BatteryPriceListRequestSchema) => void;
  onReset: () => void;
}

// Компонент для верхньої секції з пошуком та активними фільтрами
export const BatteryTopSearch: React.FC<TopSearchProps> = ({ current, setFilters, onReset }) => {
  const [cities, setCities] = useState<string[]>([]);
  const [local, setLocal] = useState<BatteryPriceListRequestSchema>({
    ...current,
    markup: current.markup !== undefined ? current.markup : 15,
  });

  useEffect(() => {
    setLocal(current);
  }, [current]);

  useEffect(() => {
    const loadCities = async () => {
      try {
        const citiesData = await getBatteryCities();
        setCities(citiesData);
      } catch (error) {
        console.error('Failed to load cities:', error);
      }
    };
    loadCities();
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
      const payload = { ...local, page: 1 } as BatteryPriceListRequestSchema;
      const signature = JSON.stringify(normalize(payload));
      if (signature !== lastAppliedRef.current) {
        lastAppliedRef.current = signature;
        setFilters(payload);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [local, setFilters]);

  return (
    <div className="w-full max-w-[1280px] mx-auto flex flex-col gap-4">
      {/* Top search and active filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Name search input */}
        <div className="flex-shrink-0">
          <Input
            placeholder="Назва"
            value={local.full_name ?? ''}
            onChange={e => setLocal(p => ({ ...p, full_name: e.target.value || undefined }))}
            className="w-64 bg-white text-slate-800 placeholder-slate-400 border border-slate-300 focus-visible:ring-2 focus-visible:ring-primary/40"
          />
        </div>
        
        {/* Active filters */}
        <div className="flex  flex-wrap gap-2 items-center">
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
          
          {/* Регіон */}
          {local.region && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
              Регіон: {local.region}
              <X 
                className="w-3 h-3 ml-1 cursor-pointer" 
                onClick={() => setLocal(p => ({ ...p, region: undefined }))}
              />
            </Badge>
          )}
          
          {/* Полярність */}
          {local.polarity && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
              Полярність: {local.polarity}
              <X 
                className="w-3 h-3 ml-1 cursor-pointer" 
                onClick={() => setLocal(p => ({ ...p, polarity: undefined }))}
              />
            </Badge>
          )}
          
          {/* Електроліт */}
          {local.electrolyte && local.electrolyte.length > 0 && (
            local.electrolyte.map(electrolyte => (
              <Badge key={electrolyte} variant="secondary" className="bg-teal-100 text-teal-800 border-teal-200">
                Електроліт: {electrolyte}
                <X 
                  className="w-3 h-3 ml-1 cursor-pointer" 
                  onClick={() => setLocal(p => ({ ...p, electrolyte: p.electrolyte?.filter(e => e !== electrolyte) }))}
                />
              </Badge>
            ))
          )}
          
          {/* Статус постачальника */}
          {local.supplier_status && local.supplier_status.length > 0 && (
            local.supplier_status.map(status => (
              <Badge key={status} variant="secondary" className="bg-indigo-100 text-indigo-800 border-indigo-200">
                {status === 'ME' ? 'ми' : status === 'SUPPLIER' ? 'постач.' : 'конкур.'}
                <X 
                  className="w-3 h-3 ml-1 cursor-pointer" 
                  onClick={() => setLocal(p => ({ ...p, supplier_status: p.supplier_status?.filter(s => s !== status) }))}
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
          
          {/* Пускові ампери */}
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
            <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">
              Ціна: {local.price_min || '∞'}-{local.price_max || '∞'} грн
              <X 
                className="w-3 h-3 ml-1 cursor-pointer" 
                onClick={() => setLocal(p => ({ ...p, price_min: undefined, price_max: undefined }))}
              />
            </Badge>
          )}
          
          {/* Націнка */}
          {local.markup && local.markup !== 15 && (
            <Badge variant="secondary" className="bg-slate-100 text-slate-800 border-slate-200">
              Націнка: {local.markup}%
              <X 
                className="w-3 h-3 ml-1 cursor-pointer" 
                onClick={() => setLocal(p => ({ ...p, markup: 15 }))}
              />
            </Badge>
          )}
          
          {/* Дати */}
          {(local.date_min || local.date_max) && (
            <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-200">
              Дата: {local.date_min || '∞'} - {local.date_max || '∞'}
              <X 
                className="w-3 h-3 ml-1 cursor-pointer" 
                onClick={() => setLocal(p => ({ ...p, date_min: undefined, date_max: undefined }))}
              />
            </Badge>
          )}
          
          {/* Reset button - показувати тільки якщо є активні фільтри */}
          {(local.brands?.length || local.suppliers?.length || local.cities?.length || local.region || 
            local.polarity || local.electrolyte?.length || local.supplier_status?.length ||
            local.volume_min || local.volume_max || local.c_amps_min || local.c_amps_max ||
            local.price_min || local.price_max || (local.markup && local.markup !== 15) ||
            local.date_min || local.date_max) && (
            <Button variant="outline" onClick={onReset} size="sm">
              <X className="w-4 h-4 mr-2" />
              Скинути
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};


export const BatteryFilters: React.FC<Props> = ({ current, setFilters, brands, suppliers }) => {
  const [cities, setCities] = useState<string[]>([]);
  const [local, setLocal] = useState<BatteryPriceListRequestSchema>({
    ...current,
    markup: current.markup !== undefined ? current.markup : 15,
  });
  const [filterOrder, setFilterOrder] = useState<string[]>(getSavedBatteryFilterOrder());
  
  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = filterOrder.indexOf(active.id as string);
      const newIndex = filterOrder.indexOf(over.id as string);
      
      const newOrder = arrayMove(filterOrder, oldIndex, newIndex);
      setFilterOrder(newOrder);
      saveBatteryFilterOrder(newOrder);
    }
  };

  useEffect(() => {
    setLocal(current);
  }, [current]);

  useEffect(() => {
    const loadCities = async () => {
      try {
        const citiesData = await getBatteryCities();
        setCities(citiesData);
      } catch (error) {
        console.error('Failed to load cities:', error);
      }
    };
    loadCities();
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
    const resetFilters: BatteryPriceListRequestSchema = {
      page: 1,
      markup: 15,
    };
    setLocal(resetFilters);
    setFilters(resetFilters);
  };

  // Filter components mapping
  const filterComponents: Record<string, React.ReactNode> = {
    brands: (
      <div className="h-[60px] flex flex-col justify-end">
        <MultiSelectPopover
          placeholder="Бренди"
          options={brands}
          values={local.brands}
          onChange={(vals) => setLocal(p => ({ ...p, brands: vals }))}
          showSelectAll
          selectAllLabel="Вибрати всі бренди"
          clearLabel="Скинути"
          className="h-10"
        />
      </div>
    ),
    suppliers: (
      <div className="h-[60px] flex flex-col justify-end">
        <MultiSelectPopover
          placeholder="Постачальники"
          options={suppliers}
          values={local.suppliers}
          onChange={(vals) => setLocal(p => ({ ...p, suppliers: vals }))}
          showSelectAll
          selectAllLabel="Вибрати всіх постачальників"
          clearLabel="Скинути"
          className="h-10"
        />
      </div>
    ),
    cities: (
      <div className="h-[60px] flex flex-col justify-end">
        <MultiSelectPopover
          placeholder="Міста"
          options={cities}
          values={local.cities}
          onChange={(vals) => setLocal(p => ({ ...p, cities: vals }))}
          className="h-10"
        />
      </div>
    ),
    volume: (
      <div className="h-[60px] flex flex-col gap-1">
        <span className="text-[12px] font-medium text-slate-600">Обʼєм, Ah</span>
        <div className="flex gap-1 items-center">
          <Input
            type="number"
            placeholder="від"
            value={local.volume_min ?? ''}
            onChange={e => setLocal(p => ({ ...p, volume_min: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-10 text-sm border-gray-300"
          />
          <span className="text-xs text-slate-400">-</span>
          <Input
            type="number"
            placeholder="до"
            value={local.volume_max ?? ''}
            onChange={e => setLocal(p => ({ ...p, volume_max: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-10 text-sm border-gray-300"
          />
        </div>
      </div>
    ),
    c_amps: (
      <div className="h-[60px] flex flex-col gap-1">
        <span className="text-[12px] font-medium text-slate-600">Пуск А, A</span>
        <div className="flex gap-1 items-center">
          <Input
            type="number"
            placeholder="від"
            value={local.c_amps_min ?? ''}
            onChange={e => setLocal(p => ({ ...p, c_amps_min: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-10 text-sm border-gray-300"
          />
          <span className="text-xs text-slate-400">-</span>
          <Input
            type="number"
            placeholder="до"
            value={local.c_amps_max ?? ''}
            onChange={e => setLocal(p => ({ ...p, c_amps_max: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-10 text-sm border-gray-300"
          />
        </div>
      </div>
    ),
    price: (
      <div className="h-[60px] flex flex-col gap-1">
        <span className="text-[12px] font-medium text-slate-600">Ціна, грн</span>
        <div className="flex gap-1 items-center">
          <Input
            type="number"
            placeholder="від"
            value={local.price_min ?? ''}
            onChange={e => setLocal(p => ({ ...p, price_min: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-10 text-sm border-gray-300"
          />
          <span className="text-xs text-slate-400">-</span>
          <Input
            type="number"
            placeholder="до"
            value={local.price_max ?? ''}
            onChange={e => setLocal(p => ({ ...p, price_max: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-10 text-sm border-gray-300"
          />
        </div>
      </div>
    ),
    region: (
      <div className="h-[60px] flex flex-col gap-1 p-1 justify-end">
        <span className="text-[12px] font-medium text-slate-600">Регіон</span>
        <div className="flex flex-wrap gap-1 text-[13px] leading-tight">
          {regions.map((r) => (
            <label key={r} className="inline-flex items-center gap-1 cursor-pointer text-slate-700">
              <input
                type="radio"
                name="region"
                checked={local.region === r}
                onChange={() => setLocal((p) => ({ ...p, region: r }))}
                className="peer accent-primary"
              />
              <span>{r}</span>
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
      <div className="h-[60px] flex flex-col gap-1 p-1 justify-end">
        <span className="text-[12px] font-medium text-slate-600">Полярність</span>
        <div className="flex flex-wrap gap-1 text-[13px] leading-tight">
          {polarities.map((pola) => (
            <label key={pola} className="inline-flex items-center gap-1 cursor-pointer text-slate-700">
              <input
                type="radio"
                name="polarity"
                checked={local.polarity === pola}
                onChange={() => setLocal((p) => ({ ...p, polarity: pola }))}
                className="peer accent-primary"
              />
              <span>{pola}</span>
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
      <div className="h-[60px] flex flex-col gap-1 p-1 justify-end">
        <span className="text-[12px] font-medium text-slate-600">Електроліт</span>
        <div className="flex flex-wrap gap-1 text-[13px] leading-tight">
          {electrolytes.map((e) => (
            <label key={e} className="inline-flex items-center gap-1 cursor-pointer text-slate-700">
              <input
                type="radio"
                name="electrolyte"
                checked={local.electrolyte?.[0] === e}
                onChange={() => setLocal((p) => ({ ...p, electrolyte: [e] }))}
                className="peer accent-primary"
              />
              <span>{e}</span>
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
      <div className="h-[60px] flex flex-col gap-1 p-1 justify-end">
        <span className="text-[12px] font-medium text-slate-600">Статус постач.</span>
        <div className="flex flex-nowrap gap-1 text-[14px] overflow-hidden">
          {supplierStatuses.map((s) => (
            <label key={s} className="inline-flex items-center gap-1 cursor-pointer text-slate-700">
              <input
                type="radio"
                name="supplier-status"
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
              name="supplier-status"
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
      <div className="h-[60px] flex flex-col gap-1 justify-end">
        <span className="text-[12px] font-medium text-slate-600">Період</span>
        <DateRangePicker
          startDate={local.date_min}
          endDate={local.date_max}
          onChange={(startDate, endDate) => {
            setLocal((p) => ({ ...p, date_min: startDate, date_max: endDate }));
          }}
          placeholder="Оберіть період"
          className="w-full h-10"
        />
      </div>
    ),
    markup: (
      <div className="h-[60px] flex flex-col gap-1">
        <span className="text-[12px] font-medium text-slate-600">Курс $ / Націнка %</span>
        <div className="flex gap-1 items-center">
          <Input
            type="number"
            placeholder="40"
            value={local.usd_rate ?? ''}
            onChange={(e) => {
              const value = e.target.value ? parseFloat(e.target.value) : undefined;
              setLocal((p) => ({ ...p, usd_rate: value }));
            }}
            className="h-10 text-sm border-gray-300"
            min="1"
            step="0.1"
          />
          <span className="text-xs text-slate-400">/</span>
          <Input
            type="number"
            placeholder="15"
            value={local.markup ?? ''}
            onChange={e => setLocal(p => ({ ...p, markup: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-10 text-sm border-gray-300"
          />
        </div>
      </div>
    ),
  };

  return (
    <>
    <div className="w-full max-w-[1280px] mx-auto flex flex-col gap-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={filterOrder} strategy={verticalListSortingStrategy}>
          {/* Filter Grid with drag and drop */}
          <div className="grid gap-5 pl-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {filterOrder.map((filterId) => {
              const component = filterComponents[filterId];
              if (!component) return null;
              
              return (
                <DraggableFilterItem key={filterId} id={filterId}>
                  {component}
                </DraggableFilterItem>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
    </>
  );
};
