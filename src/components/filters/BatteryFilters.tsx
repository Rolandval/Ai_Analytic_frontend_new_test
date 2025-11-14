import { useState, useEffect, useRef } from 'react';
import { X, GripVertical } from 'lucide-react';
import { BatteryPriceListRequestSchema } from '@/types/batteries';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { getBatteryCities } from '@/services/cities.api';
import { MultiSelectPopover } from './ui/MultiSelectPopover';
import { Badge } from '@/components/ui/Badge';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
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
    const base: string[] = saved ? JSON.parse(saved) : DEFAULT_BATTERY_FILTER_ORDER;
    // Filter out legacy 'actions' tile if present
    return base.filter((id) => id !== 'actions');
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
}

// Draggable filter item component
const DraggableFilterItem: React.FC<DraggableFilterItemProps> = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group pl-6 w-full min-w-0">
      <div
        {...attributes}
        {...listeners}
        className="absolute left-1 top-1/2 -translate-y-1/2 z-10 cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>
      <div className="w-full min-w-0">
        {children}
      </div>
    </div>
  );
};

interface Props {
  current: BatteryPriceListRequestSchema;
  setFilters: (f: BatteryPriceListRequestSchema) => void;
  brands: string[];
  suppliers: string[];
  // Optional actions passed from parent page to render inside a draggable tile
  actionsButtonGroup?: React.ReactNode;
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
  const [localFullName, setLocalFullName] = useState(current.full_name || '');
  const isTypingRef = useRef(false);

  useEffect(() => {
    setLocal(current);
    if (!isTypingRef.current) {
      setLocalFullName(current.full_name || '');
    }
  }, [current]);

  // Debounce full_name input
  useEffect(() => {
    console.log('🔵 [BATTERY FILTER] localFullName changed:', localFullName);
    isTypingRef.current = true;
    const timer = setTimeout(() => {
      console.log('⏰ [BATTERY FILTER] Debounce timer fired, applying filter:', localFullName);
      setLocal(p => ({ ...p, full_name: localFullName || undefined }));
      // Keep isTypingRef true for a bit longer to prevent race conditions
      setTimeout(() => {
        isTypingRef.current = false;
      }, 100);
    }, 300);
    return () => {
      console.log('🧹 [BATTERY FILTER] Cleanup: clearing timer');
      clearTimeout(timer);
    };
  }, [localFullName]);

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
            value={localFullName}
            onChange={(e) => {
              console.log('⌨️ [BATTERY FILTER] Input onChange:', e.target.value);
              setLocalFullName(e.target.value);
            }}
            className="w-64 bg-white text-slate-800 placeholder-slate-400 border border-slate-300 focus-visible:ring-2 focus-visible:ring-primary/40"
          />
        </div>
        
        {/* Active filters with 2-line clamp and overflow popover */}
        <ActiveBadges
          badges={(() => {
            const items: React.ReactNode[] = [];
            // Бренди
            if (local.brands?.length) {
              local.brands.forEach((brand) => {
                items.push(
                  <Badge key={`brand-${brand}`} variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                    {brand}
                    <X
                      className="w-3 h-3 ml-1 cursor-pointer"
                      onClick={() => setLocal(p => ({ ...p, brands: p.brands?.filter(b => b !== brand) }))}
                    />
                  </Badge>
                );
              });
            }
            // Постачальники
            if (local.suppliers?.length) {
              local.suppliers.forEach((supplier) => {
                items.push(
                  <Badge key={`supplier-${supplier}`} variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                    {supplier}
                    <X
                      className="w-3 h-3 ml-1 cursor-pointer"
                      onClick={() => setLocal(p => ({ ...p, suppliers: p.suppliers?.filter(s => s !== supplier) }))}
                    />
                  </Badge>
                );
              });
            }
            // Міста
            if (local.cities?.length) {
              local.cities.forEach((city) => {
                items.push(
                  <Badge key={`city-${city}`} variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
                    {city}
                    <X
                      className="w-3 h-3 ml-1 cursor-pointer"
                      onClick={() => setLocal(p => ({ ...p, cities: p.cities?.filter(c => c !== city) }))}
                    />
                  </Badge>
                );
              });
            }
            // Регіон
            if (local.region) {
              items.push(
                <Badge key={`region`} variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
                  Регіон: {local.region}
                  <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocal(p => ({ ...p, region: undefined }))} />
                </Badge>
              );
            }
            // Полярність
            if (local.polarity) {
              items.push(
                <Badge key={`polarity`} variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                  Полярність: {local.polarity}
                  <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocal(p => ({ ...p, polarity: undefined }))} />
                </Badge>
              );
            }
            // Електроліт
            if (local.electrolyte?.length) {
              local.electrolyte.forEach((el) => {
                items.push(
                  <Badge key={`electrolyte-${el}`} variant="secondary" className="bg-teal-100 text-teal-800 border-teal-200">
                    Електроліт: {el}
                    <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocal(p => ({ ...p, electrolyte: p.electrolyte?.filter(e => e !== el) }))} />
                  </Badge>
                );
              });
            }
            // Статус постачальника
            if (local.supplier_status?.length) {
              local.supplier_status.forEach((status) => {
                items.push(
                  <Badge key={`status-${status}`} variant="secondary" className="bg-indigo-100 text-indigo-800 border-indigo-200">
                    {status === 'ME' ? 'ми' : status === 'SUPPLIER' ? 'постач.' : 'конкур.'}
                    <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocal(p => ({ ...p, supplier_status: p.supplier_status?.filter(s => s !== status) }))} />
                  </Badge>
                );
              });
            }
            // Обʼєм
            if (local.volume_min || local.volume_max) {
              items.push(
                <Badge key={`volume`} variant="secondary" className="bg-pink-100 text-pink-800 border-pink-200">
                  Обʼєм: {local.volume_min || '∞'}-{local.volume_max || '∞'} Ah
                  <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocal(p => ({ ...p, volume_min: undefined, volume_max: undefined }))} />
                </Badge>
              );
            }
            // Пускові ампери
            if (local.c_amps_min || local.c_amps_max) {
              items.push(
                <Badge key={`c-amps`} variant="secondary" className="bg-cyan-100 text-cyan-800 border-cyan-200">
                  Пуск А: {local.c_amps_min || '∞'}-{local.c_amps_max || '∞'} A
                  <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocal(p => ({ ...p, c_amps_min: undefined, c_amps_max: undefined }))} />
                </Badge>
              );
            }
            // Ціна
            if (local.price_min || local.price_max) {
              items.push(
                <Badge key={`price`} variant="secondary" className="bg-red-100 text-red-800 border-red-200">
                  Ціна: {local.price_min || '∞'}-{local.price_max || '∞'} грн
                  <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocal(p => ({ ...p, price_min: undefined, price_max: undefined }))} />
                </Badge>
              );
            }
            // Націнка
            if (local.markup && local.markup !== 15) {
              items.push(
                <Badge key={`markup`} variant="secondary" className="bg-slate-100 text-slate-800 border-slate-200">
                  Націнка: {local.markup}%
                  <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocal(p => ({ ...p, markup: 15 }))} />
                </Badge>
              );
            }
            // Дати
            if (local.date_min || local.date_max) {
              items.push(
                <Badge key={`dates`} variant="secondary" className="bg-gray-100 text-gray-800 border-gray-200">
                  Дата: {local.date_min || '∞'} - {local.date_max || '∞'}
                  <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocal(p => ({ ...p, date_min: undefined, date_max: undefined }))} />
                </Badge>
              );
            }
            return items;
          })()}
          onReset={onReset}
        />
      </div>
    </div>
  );
};


export const BatteryFilters: React.FC<Props> = ({ current, setFilters, brands, suppliers, actionsButtonGroup }) => {
  const [cities, setCities] = useState<string[]>([]);
  const [local, setLocal] = useState<BatteryPriceListRequestSchema>({
    ...current,
    markup: current.markup !== undefined ? current.markup : 15,
  });
  const [filterOrder, setFilterOrder] = useState<string[]>(getSavedBatteryFilterOrder());
  // Remove legacy 'actions' tile from saved order on mount if still present
  useEffect(() => {
    if (filterOrder.includes('actions')) {
      const next = filterOrder.filter((id) => id !== 'actions');
      setFilterOrder(next);
      saveBatteryFilterOrder(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
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
              <span className="whitespace-nowrap" title={s === 'ME' ? 'ми' : s === 'SUPPLIER' ? 'постачальник' : 'конкурент'}>
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
          className="w-full  "
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
    <div className="w-auto mx-auto flex flex-col gap-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={filterOrder} strategy={verticalListSortingStrategy}>
          {/* Filter Grid with drag and drop */}
          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
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

// Helper component: shows badges clamped to 2 rows and a popover with all when overflow
const ActiveBadges: React.FC<{ badges: React.ReactNode[]; onReset: () => void; }> = ({ badges, onReset }) => {
  const displayRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [visibleCount, setVisibleCount] = useState(badges.length);

  // Observe width changes
  useEffect(() => {
    if (!displayRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        setContainerWidth(Math.round(w));
      }
    });
    ro.observe(displayRef.current);
    return () => ro.disconnect();
  }, []);

  // Recompute visible count on size or badges change
  useEffect(() => {
    if (!measureRef.current || !displayRef.current) return;
    const wrap = measureRef.current;
    const children = Array.from(wrap.children) as HTMLElement[];
    if (children.length === 0) { setVisibleCount(0); return; }
    // Determine top offsets to identify rows
    const tops: number[] = [];
    children.forEach(el => tops.push(el.offsetTop));
    const uniqueTops = Array.from(new Set(tops)).sort((a, b) => a - b);
    const secondRowTop = uniqueTops[1];
    if (secondRowTop === undefined) {
      setVisibleCount(children.length);
    } else {
      // Count items whose top is <= second row top
      let count = 0;
      for (let i = 0; i < children.length; i++) {
        if (children[i].offsetTop <= secondRowTop) count++;
      }
      setVisibleCount(count);
    }
  }, [containerWidth, badges]);

  const overflow = Math.max(0, badges.length - visibleCount);

  const hasAny = badges.length > 0;
  return (
    <div className="flex flex-col gap-2 min-w-0">
      <div ref={displayRef} className="flex flex-wrap gap-2 items-center">
        {/* Badges area (2 rows) with gradient inside, full width to push controls to 3rd row */}
        <div className="relative w-full">
          <div className="flex flex-wrap gap-2 items-center">
            {badges.slice(0, visibleCount)}
          </div>
          {/* Bottom fade to hint more content on overflow (only under the badges area) */}
          {overflow > 0 && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-b from-transparent to-white dark:to-gray-900"
            />
          )}
        </div>
        {overflow > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button size="xs" variant="outline" className="h-6 px-2 text-xs">Показати всі (+{overflow})</Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] max-w-[90vw]">
              <div className="flex flex-wrap gap-2 items-center max-h-[240px] overflow-auto">
                {badges}
              </div>
              {hasAny && (
                <div className="mt-3">
                  <Button variant="outline" size="xs" onClick={onReset}>
                    <X className="w-4 h-4 mr-2" /> Скинути всі
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        )}
        {/* Reset button always visible */}
        {hasAny && (
          <Button variant="outline" onClick={onReset} size="xs">
            <X className="w-4 h-4 mr-2" /> Скинути
          </Button>
        )}
      </div>
      {/* Hidden measuring container with same width */}
      <div
        ref={measureRef}
        style={{ position: 'absolute', left: -99999, top: 0, width: containerWidth }}
        className="flex flex-wrap gap-2"
      >
        {badges}
      </div>
    </div>
  );
};
