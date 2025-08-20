import { useState, useEffect, useRef } from 'react';
import { useUsdRate } from '@/hooks/useUsdRate';
import { X, GripVertical } from 'lucide-react';
import { SolarPanelPriceListRequestSchema } from '@/types/solarPanels';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { getSolarPanelCities } from '@/services/cities.api';
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

const panelTypes = ['одностороння', 'двостороння'];
const cellTypes = ['p-type', 'n-type'];
const supplierStatuses = ['ME', 'SUPPLIER', 'COMPETITOR'];
const statusLabels: Record<string, string> = {
  ME: 'ми',
  SUPPLIER: 'постач.',
  COMPETITOR: 'конкур.',
};

// Default filter order
const DEFAULT_FILTER_ORDER = [
  'brands',
  'suppliers', 
  'cities',
  'power',
  'thickness',
  'price',
  'price_per_w',
  'panel_type',
  'cell_type',
  'panel_color',
  'frame_color',
  'supplier_status',
  'date_range',
  'usd_markup'
];

// Get saved filter order from localStorage or use default
const getSavedFilterOrder = (): string[] => {
  try {
    const saved = localStorage.getItem('solarPanelFilterOrder');
    return saved ? JSON.parse(saved) : DEFAULT_FILTER_ORDER;
  } catch {
    return DEFAULT_FILTER_ORDER;
  }
};

// Save filter order to localStorage
const saveFilterOrder = (order: string[]) => {
  try {
    localStorage.setItem('solarPanelFilterOrder', JSON.stringify(order));
  } catch {
    // Ignore localStorage errors
  }
};

interface Props {
  current: SolarPanelPriceListRequestSchema;
  setFilters: (f: SolarPanelPriceListRequestSchema) => void;
  brands: string[];
  suppliers: string[];
}

interface TopSearchProps {
  current: SolarPanelPriceListRequestSchema;
  setFilters: (f: SolarPanelPriceListRequestSchema) => void;
  onReset: () => void;
}

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

// Компонент для верхньої секції з пошуком та активними фільтрами
export const SolarPanelTopSearch: React.FC<TopSearchProps> = ({ current, setFilters, onReset }) => {
  const [, setCities] = useState<string[]>([]);
  const [local, setLocal] = useState<SolarPanelPriceListRequestSchema>({
    ...current,
    markup: current.markup !== undefined ? current.markup : 15,
  });

  useEffect(() => {
    setLocal(current);
  }, [current]);

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
    }, 400);
    return () => clearTimeout(t);
  }, [local, setFilters]);

  const statusLabels = {
    ME: 'ми',
    SUPPLIER: 'постач.',
    COMPETITOR: 'конкур.'
  };

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
          
          {/* Статус постачальника */}
          {local.supplier_status && local.supplier_status.length > 0 && (
            local.supplier_status.map(status => (
              <Badge key={status} variant="secondary" className="bg-indigo-100 text-indigo-800 border-indigo-200">
                {statusLabels[status as keyof typeof statusLabels] || status}
                <X 
                  className="w-3 h-3 ml-1 cursor-pointer" 
                  onClick={() => setLocal(p => ({ ...p, supplier_status: p.supplier_status?.filter(s => s !== status) }))}
                />
              </Badge>
            ))
          )}
          
          {/* Тип панелі */}
          {local.panel_type && (
            <Badge variant="secondary" className="bg-teal-100 text-teal-800 border-teal-200">
              Тип панелі: {local.panel_type}
              <X 
                className="w-3 h-3 ml-1 cursor-pointer" 
                onClick={() => setLocal(p => ({ ...p, panel_type: undefined }))}
              />
            </Badge>
          )}
          
          {/* Тип комірки */}
          {local.cell_type && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
              Тип комірки: {local.cell_type}
              <X 
                className="w-3 h-3 ml-1 cursor-pointer" 
                onClick={() => setLocal(p => ({ ...p, cell_type: undefined }))}
              />
            </Badge>
          )}
          
          {/* Колір панелі */}
          {local.panel_color && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
              Колір панелі: {local.panel_color}
              <X 
                className="w-3 h-3 ml-1 cursor-pointer" 
                onClick={() => setLocal(p => ({ ...p, panel_color: undefined }))}
              />
            </Badge>
          )}
          
          {/* Колір рами */}
          {local.frame_color && (
            <Badge variant="secondary" className="bg-pink-100 text-pink-800 border-pink-200">
              Колір рами: {local.frame_color}
              <X 
                className="w-3 h-3 ml-1 cursor-pointer" 
                onClick={() => setLocal(p => ({ ...p, frame_color: undefined }))}
              />
            </Badge>
          )}
          
          {/* Потужність */}
          {(local.power_min || local.power_max) && (
            <Badge variant="secondary" className="bg-cyan-100 text-cyan-800 border-cyan-200">
              Потужність: {local.power_min || '∞'}-{local.power_max || '∞'} Вт
              <X 
                className="w-3 h-3 ml-1 cursor-pointer" 
                onClick={() => setLocal(p => ({ ...p, power_min: undefined, power_max: undefined }))}
              />
            </Badge>
          )}
          
          {/* Товщина */}
          {(local.thickness_min || local.thickness_max) && (
            <Badge variant="secondary" className="bg-violet-100 text-violet-800 border-violet-200">
              Товщина: {local.thickness_min || '∞'}-{local.thickness_max || '∞'} мм
              <X 
                className="w-3 h-3 ml-1 cursor-pointer" 
                onClick={() => setLocal(p => ({ ...p, thickness_min: undefined, thickness_max: undefined }))}
              />
            </Badge>
          )}
          
          {/* Ціна */}
          {(local.price_min || local.price_max) && (
            <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">
              Ціна: {local.price_min || '∞'}-{local.price_max || '∞'} $
              <X 
                className="w-3 h-3 ml-1 cursor-pointer" 
                onClick={() => setLocal(p => ({ ...p, price_min: undefined, price_max: undefined }))}
              />
            </Badge>
          )}
          
          {/* Ціна за Вт */}
          {(local.price_per_w_min || local.price_per_w_max) && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
              $/Вт: {local.price_per_w_min || '∞'}-{local.price_per_w_max || '∞'}
              <X 
                className="w-3 h-3 ml-1 cursor-pointer" 
                onClick={() => setLocal(p => ({ ...p, price_per_w_min: undefined, price_per_w_max: undefined }))}
              />
            </Badge>
          )}
          
          {/* Курс долара */}
          {local.usd_rate && (
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200">
              Курс $: {local.usd_rate}
              <X 
                className="w-3 h-3 ml-1 cursor-pointer" 
                onClick={() => setLocal(p => ({ ...p, usd_rate: undefined }))}
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
          {(local.brands?.length || local.suppliers?.length || local.cities?.length || local.supplier_status?.length || 
            local.panel_type || local.cell_type || local.panel_color || local.frame_color ||
            local.power_min || local.power_max || local.thickness_min || local.thickness_max ||
            local.price_min || local.price_max || local.price_per_w_min || local.price_per_w_max ||
            local.usd_rate || (local.markup && local.markup !== 15) || local.date_min || local.date_max) && (
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

export const SolarPanelFilters: React.FC<Props> = ({ current, setFilters, brands, suppliers }) => {
  const [cities, setCities] = useState<string[]>([]);
  const [local, setLocal] = useState<SolarPanelPriceListRequestSchema>({
    ...current,
    markup: current.markup !== undefined ? current.markup : 15, // Default markup value 15%
  });
  const [filterOrder, setFilterOrder] = useState<string[]>(getSavedFilterOrder());
  const { rate } = useUsdRate();
  
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
      saveFilterOrder(newOrder);
    }
  };
  
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
  // Автозастосування фільтрів з короткою затримкою, щоб уникнути зайвих викликів під час набору
  const lastAppliedRef = useRef<string>('');
  // Ініціалізуємо сигнатуру на монтуванні, щоб уникнути зайвого першого повторного застосування
  useEffect(() => {
    const initial = JSON.stringify({ ...local, page: 1 });
    lastAppliedRef.current = initial;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const t = setTimeout(() => {
      // Нормалізуємо payload: прибираємо порожні строки, залишаємо undefined як відсутні значення
      const normalize = (o: Record<string, any>) => {
        const n: Record<string, any> = {};
        Object.entries(o).forEach(([k, v]) => {
          if (v === '') return;
          if (Array.isArray(v)) n[k] = v.slice();
          else if (v !== undefined) n[k] = v;
        });
        return n;
      };
      const payload = { ...local, page: 1 } as SolarPanelPriceListRequestSchema;
      const signature = JSON.stringify(normalize(payload));
      if (signature !== lastAppliedRef.current) {
        lastAppliedRef.current = signature;
        setFilters(payload);
      }
    }, 400); // більша затримка для зменшення мерехтіння таблиці при наборі
    return () => clearTimeout(t);
  }, [local, setFilters]);

  // Filter components mapping
  const filterComponents: Record<string, React.ReactNode> = {
    brands: (
      <MultiSelectPopover
        placeholder="Бренди"
        options={brands}
        values={local.brands}
        onChange={(vals) => setLocal(p=>({...p,brands:vals}))}
        showSelectAll
        selectAllLabel="Вибрати всі бренди"
        clearLabel="Скинути"
      />
    ),
    suppliers: (
      <MultiSelectPopover
        placeholder="Постачальники"
        options={suppliers}
        values={local.suppliers}
        onChange={(vals) => setLocal(p=>({...p,suppliers:vals}))}
        showSelectAll
        selectAllLabel="Вибрати всіх постачальників"
        clearLabel="Скинути"
      />
    ),
    cities: (
      <MultiSelectPopover
        placeholder="Міста"
        options={cities}
        values={local.cities}
        onChange={(vals) => setLocal(p=>({...p,cities:vals}))}
      />
    ),
    power: (
      <div className="flex flex-col gap-1">
        <span className="text-[12px] font-medium text-slate-600">Потужність, Вт</span>
        <div className="flex gap-1 items-center">
          <Input
            type="number"
            placeholder="від"
            value={local.power_min ?? ''}
            onChange={(e) => setLocal(p => ({ ...p, power_min: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-8 text-sm border-gray-300"
          />
          <span className="text-xs text-slate-400">-</span>
          <Input
            type="number"
            placeholder="до"
            value={local.power_max ?? ''}
            onChange={(e) => setLocal(p => ({ ...p, power_max: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-8 text-sm border-gray-300"
          />
        </div>
      </div>
    ),
    thickness: (
      <div className="flex flex-col gap-1">
        <span className="text-[12px] font-medium text-slate-600">Товщина, мм</span>
        <div className="flex gap-1 items-center">
          <Input
            type="number"
            placeholder="від"
            value={local.thickness_min ?? ''}
            onChange={(e) => setLocal(p => ({ ...p, thickness_min: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-8 text-sm border-gray-300"
          />
          <span className="text-xs text-slate-400">-</span>
          <Input
            type="number"
            placeholder="до"
            value={local.thickness_max ?? ''}
            onChange={(e) => setLocal(p => ({ ...p, thickness_max: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-8 text-sm border-gray-300"
          />
        </div>
      </div>
    ),
    price: (
      <div className="flex flex-col gap-1">
        <span className="text-[12px] font-medium text-slate-600">Ціна, $</span>
        <div className="flex gap-1 items-center">
          <Input
            type="number"
            placeholder="від"
            value={local.price_min ?? ''}
            onChange={(e) => setLocal(p => ({ ...p, price_min: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-8 text-sm border-gray-300"
          />
          <span className="text-xs text-slate-400">-</span>
          <Input
            type="number"
            placeholder="до"
            value={local.price_max ?? ''}
            onChange={(e) => setLocal(p => ({ ...p, price_max: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-8 text-sm border-gray-300"
          />
        </div>
      </div>
    ),
    price_per_w: (
      <div className="flex flex-col gap-1">
        <span className="text-[12px] font-medium text-slate-600">Ціна за Вт, $/Вт</span>
        <div className="flex gap-1 items-center">
          <Input
            type="number"
            placeholder="від"
            value={local.price_per_w_min ?? ''}
            onChange={(e) => setLocal(p => ({ ...p, price_per_w_min: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-8 text-sm border-gray-300"
            step="0.01"
          />
          <span className="text-xs text-slate-400">-</span>
          <Input
            type="number"
            placeholder="до"
            value={local.price_per_w_max ?? ''}
            onChange={(e) => setLocal(p => ({ ...p, price_per_w_max: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-8 text-sm border-gray-300"
            step="0.01"
          />
        </div>
      </div>
    ),
    panel_type: (
      <div className="flex flex-col gap-1 p-1">
        <span className="text-[13px] font-semibold text-slate-700">Тип панелі</span>
        <div className="flex flex-nowrap gap-1 text-[14px] overflow-hidden">
          {panelTypes.map((t) => (
            <label key={t} className="inline-flex items-center gap-1 cursor-pointer text-slate-700">
              <input
                type="radio"
                name="panel-type"
                checked={local.panel_type === t}
                onChange={() => setLocal((p) => ({ ...p, panel_type: t }))}
                className="peer accent-primary"
              />
              <span className="max-w-[80px] truncate">{t}</span>
            </label>
          ))}
          <label className="inline-flex items-center gap-1 cursor-pointer text-slate-700">
            <input
              type="radio"
              name="panel-type"
              checked={local.panel_type === undefined}
              onChange={() => setLocal((p) => ({ ...p, panel_type: undefined }))}
              className="peer accent-primary"
            />
            <span className="max-w-[80px] truncate">всі</span>
          </label>
        </div>
      </div>
    ),
    cell_type: (
      <div className="flex flex-col gap-1 p-1">
        <span className="text-[13px] font-semibold text-slate-700">Тип елементу</span>
        <div className="flex flex-nowrap gap-1 text-[14px] overflow-hidden">
          {cellTypes.map((t) => (
            <label key={t} className="inline-flex items-center gap-1 cursor-pointer text-slate-700">
              <input
                type="radio"
                name="cell-type"
                checked={local.cell_type === t}
                onChange={() => setLocal((p) => ({ ...p, cell_type: t }))}
                className="peer accent-primary"
              />
              <span className="max-w-[80px] truncate">{t}</span>
            </label>
          ))}
          <label className="inline-flex items-center gap-1 cursor-pointer text-slate-700">
            <input
              type="radio"
              name="cell-type"
              checked={local.cell_type === undefined}
              onChange={() => setLocal((p) => ({ ...p, cell_type: undefined }))}
              className="peer accent-primary"
            />
            <span className="max-w-[80px] truncate">всі</span>
          </label>
        </div>
      </div>
    ),
    panel_color: (
      <div className="flex flex-col gap-1 p-1">
        <span className="text-[13px] font-semibold text-slate-700">Колір панелі</span>
        <div className="flex flex-nowrap gap-1 text-[14px] overflow-hidden">
          {['Default','All Black'].map((c) => (
            <label key={c} className="inline-flex items-center gap-1 cursor-pointer text-slate-700">
              <input
                type="radio"
                name="panel-color"
                checked={local.panel_color === c}
                onChange={() => setLocal((p) => ({ ...p, panel_color: c }))}
                className="peer accent-primary"
              />
              <span className="max-w-[80px] truncate">{c}</span>
            </label>
          ))}
          <label className="inline-flex items-center gap-1 cursor-pointer text-slate-700">
            <input
              type="radio"
              name="panel-color"
              checked={local.panel_color === undefined}
              onChange={() => setLocal((p) => ({ ...p, panel_color: undefined }))}
              className="peer accent-primary"
            />
            <span className="max-w-[80px] truncate">всі</span>
          </label>
        </div>
      </div>
    ),
    frame_color: (
      <div className="flex flex-col gap-1 p-1">
        <span className="text-[13px] font-semibold text-slate-700">Колір рами</span>
        <div className="flex flex-nowrap gap-1 text-[14px] overflow-hidden">
          {['black','silver'].map((c) => (
            <label key={c} className="inline-flex items-center gap-1 cursor-pointer text-slate-700">
              <input
                type="radio"
                name="frame-color"
                checked={local.frame_color === c}
                onChange={() => setLocal((p) => ({ ...p, frame_color: c }))}
                className="peer accent-primary"
              />
              <span className="max-w-[80px] truncate">{c}</span>
            </label>
          ))}
          <label className="inline-flex items-center gap-1 cursor-pointer text-slate-700">
            <input
              type="radio"
              name="frame-color"
              checked={local.frame_color === undefined}
              onChange={() => setLocal((p) => ({ ...p, frame_color: undefined }))}
              className="peer accent-primary"
            />
            <span className="max-w-[80px] truncate">всі</span>
          </label>
        </div>
      </div>
    ),
    supplier_status: (
      <div className="flex flex-col gap-1 p-1">
        <span className="text-[13px] font-semibold text-slate-700">Статус постач.</span>
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
              <span className="max-w-[80px] truncate">{statusLabels[s]}</span>
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
            <span className="max-w-[80px] truncate">всі</span>
          </label>
        </div>
      </div>
    ),
    date_range: (
      <div className="flex flex-col gap-1">
        <span className="text-[12px] font-medium text-slate-600">Період</span>
        <DateRangePicker
          startDate={local.date_min}
          endDate={local.date_max}
          onChange={(startDate: string | undefined, endDate: string | undefined) => {
            setLocal((p) => ({ ...p, date_min: startDate, date_max: endDate }));
          }}
          placeholder="Оберіть період"
          className="w-full"
        />
      </div>
    ),
    usd_markup: (
      <div className="flex flex-col gap-1">
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
            className="h-8 text-sm border-gray-300"
            min="1"
            step="0.1"
          />
          <span className="text-xs text-slate-400">/</span>
          <Input
            type="number"
            placeholder="15"
            value={local.markup ?? ''}
            onChange={(e) => {
              const value = e.target.value ? parseFloat(e.target.value) : undefined;
              setLocal((p) => ({ ...p, markup: value }));
            }}
            className="h-8 text-sm border-gray-300"
            min="0"
            step="0.1"
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
          {/* filters grid with drag and drop */}
          <div className="grid gap-5 pl-6" style={{gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))'}}>
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