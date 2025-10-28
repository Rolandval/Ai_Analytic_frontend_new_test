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
  // 'full_name' moved to TopSearch area
  'brands',
  'suppliers', 
  'cities',
  'power',
  'thickness',
  'price',
  'price_per_w',
  'cells_count',
  'width',
  'height',
  'weight',
  'impp',
  'voltage',
  'amperage',
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
    const base: string[] = saved ? JSON.parse(saved) : DEFAULT_FILTER_ORDER;
    // Ensure legacy orders do not include full_name or actions
    return base.filter((id) => id !== 'full_name' && id !== 'actions');
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
    <div
      ref={setNodeRef}
      style={style}
      className="relative group pl-6 w-full min-w-0"
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing"
        title="Перетягніть для зміни порядку"
      >
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>
      <div className="w-full min-w-0">
        {children}
      </div>
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
    <div className="w-auto mx-auto flex flex-col gap-4">
      {/* Top search and active filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Name search input */}
        <div className="w-full sm:w-auto">
          <Input
            placeholder="Пошук по назві..."
            value={local.full_name ?? ''}
            onChange={(e) => setLocal((p) => ({ ...p, full_name: e.target.value || undefined }))}
            className="h-10 w-full sm:w-[280px]"
          />
        </div>
        {/* Active filters */}
        <div className="flex flex-col gap-2 w-full">
          {(() => {
            const nodes: JSX.Element[] = [];
            // Name badge
            if (local.full_name) {
              nodes.push(
                <Badge key={`full_name`} variant="secondary" className="bg-slate-100 text-slate-800 border-slate-200">
                  {local.full_name}
                  <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocal((p) => ({ ...p, full_name: undefined }))} />
                </Badge>
              );
            }
            // Arrays
            (local.brands || []).forEach((brand) => {
              nodes.push(
                <Badge key={`brand-${brand}`} variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                  {brand}
                  <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocal((p) => ({ ...p, brands: p.brands?.filter((b) => b !== brand) }))} />
                </Badge>
              );
            });
            (local.suppliers || []).forEach((supplier) => {
              nodes.push(
                <Badge key={`supplier-${supplier}`} variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                  {supplier}
                  <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocal((p) => ({ ...p, suppliers: p.suppliers?.filter((s) => s !== supplier) }))} />
                </Badge>
              );
            });
            (local.cities || []).forEach((city) => {
              nodes.push(
                <Badge key={`city-${city}`} variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
                  {city}
                  <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocal((p) => ({ ...p, cities: p.cities?.filter((c) => c !== city) }))} />
                </Badge>
              );
            });
            (local.supplier_status || []).forEach((status) => {
              nodes.push(
                <Badge key={`status-${status}`} variant="secondary" className="bg-indigo-100 text-indigo-800 border-indigo-200">
                  {statusLabels[status as keyof typeof statusLabels] || status}
                  <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocal((p) => ({ ...p, supplier_status: p.supplier_status?.filter((s) => s !== status) }))} />
                </Badge>
              );
            });
            // Singles
            if (local.panel_type) nodes.push(
              <Badge key={`panel_type`} variant="secondary" className="bg-teal-100 text-teal-800 border-teal-200">
                Тип панелі: {local.panel_type}
                <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocal((p) => ({ ...p, panel_type: undefined }))} />
              </Badge>
            );
            if (local.cell_type) nodes.push(
              <Badge key={`cell_type`} variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                Тип комірки: {local.cell_type}
                <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocal((p) => ({ ...p, cell_type: undefined }))} />
              </Badge>
            );
            if (local.panel_color) nodes.push(
              <Badge key={`panel_color`} variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
                Колір панелі: {local.panel_color}
                <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocal((p) => ({ ...p, panel_color: undefined }))} />
              </Badge>
            );
            if (local.frame_color) nodes.push(
              <Badge key={`frame_color`} variant="secondary" className="bg-pink-100 text-pink-800 border-pink-200">
                Колір рами: {local.frame_color}
                <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocal((p) => ({ ...p, frame_color: undefined }))} />
              </Badge>
            );
            // Ranges
            if (local.power_min || local.power_max) nodes.push(
              <Badge key={`power`} variant="secondary" className="bg-cyan-100 text-cyan-800 border-cyan-200">
                Потужність: {local.power_min || '∞'}-{local.power_max || '∞'} Вт
                <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocal((p) => ({ ...p, power_min: undefined, power_max: undefined }))} />
              </Badge>
            );
            if (local.thickness_min || local.thickness_max) nodes.push(
              <Badge key={`thickness`} variant="secondary" className="bg-violet-100 text-violet-800 border-violet-200">
                Товщина: {local.thickness_min || '∞'}-{local.thickness_max || '∞'} мм
                <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocal((p) => ({ ...p, thickness_min: undefined, thickness_max: undefined }))} />
              </Badge>
            );
            if (local.price_min || local.price_max) nodes.push(
              <Badge key={`price`} variant="secondary" className="bg-red-100 text-red-800 border-red-200">
                Ціна: {local.price_min || '∞'}-{local.price_max || '∞'} $
                <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocal((p) => ({ ...p, price_min: undefined, price_max: undefined }))} />
              </Badge>
            );
            if (local.price_per_w_min || local.price_per_w_max) nodes.push(
              <Badge key={`price_per_w`} variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
                $/Вт: {local.price_per_w_min || '∞'}-{local.price_per_w_max || '∞'}
                <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocal((p) => ({ ...p, price_per_w_min: undefined, price_per_w_max: undefined }))} />
              </Badge>
            );
            if (local.cells_count_min || local.cells_count_max) nodes.push(
              <Badge key={`cells_count`} variant="secondary" className="bg-indigo-100 text-indigo-800 border-indigo-200">
                Елементи: {local.cells_count_min || '∞'}-{local.cells_count_max || '∞'}
                <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocal((p) => ({ ...p, cells_count_min: undefined, cells_count_max: undefined }))} />
              </Badge>
            );
            if (local.width_min || local.width_max) nodes.push(
              <Badge key={`width`} variant="secondary" className="bg-teal-100 text-teal-800 border-teal-200">
                Ширина: {local.width_min || '∞'}-{local.width_max || '∞'} мм
                <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocal((p) => ({ ...p, width_min: undefined, width_max: undefined }))} />
              </Badge>
            );
            if (local.height_min || local.height_max) nodes.push(
              <Badge key={`height`} variant="secondary" className="bg-lime-100 text-lime-800 border-lime-200">
                Висота: {local.height_min || '∞'}-{local.height_max || '∞'} мм
                <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocal((p) => ({ ...p, height_min: undefined, height_max: undefined }))} />
              </Badge>
            );
            if (local.weight_min || local.weight_max) nodes.push(
              <Badge key={`weight`} variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
                Вага: {local.weight_min || '∞'}-{local.weight_max || '∞'} кг
                <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocal((p) => ({ ...p, weight_min: undefined, weight_max: undefined }))} />
              </Badge>
            );
            if (local.impp_min || local.impp_max) nodes.push(
              <Badge key={`impp`} variant="secondary" className="bg-sky-100 text-sky-800 border-sky-200">
                Impp: {local.impp_min || '∞'}-{local.impp_max || '∞'} А
                <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocal((p) => ({ ...p, impp_min: undefined, impp_max: undefined }))} />
              </Badge>
            );
            if (local.voltage_min || local.voltage_max) nodes.push(
              <Badge key={`voltage`} variant="secondary" className="bg-violet-100 text-violet-800 border-violet-200">
                Вольтаж: {local.voltage_min || '∞'}-{local.voltage_max || '∞'} В
                <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocal((p) => ({ ...p, voltage_min: undefined, voltage_max: undefined }))} />
              </Badge>
            );
            if (local.amperage_min || local.amperage_max) nodes.push(
              <Badge key={`amperage`} variant="secondary" className="bg-rose-100 text-rose-800 border-rose-200">
                Амперраж: {local.amperage_min || '∞'}-{local.amperage_max || '∞'} А
                <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocal((p) => ({ ...p, amperage_min: undefined, amperage_max: undefined }))} />
              </Badge>
            );
            // Others
            if (local.usd_rate) nodes.push(
              <Badge key={`usd_rate`} variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200">
                Курс $: {local.usd_rate}
                <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocal((p) => ({ ...p, usd_rate: undefined }))} />
              </Badge>
            );
            if (local.markup && local.markup !== 15) nodes.push(
              <Badge key={`markup`} variant="secondary" className="bg-slate-100 text-slate-800 border-slate-200">
                Націнка: {local.markup}%
                <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocal((p) => ({ ...p, markup: 15 }))} />
              </Badge>
            );
            if (local.date_min || local.date_max) nodes.push(
              <Badge key={`date_range`} variant="secondary" className="bg-gray-100 text-gray-800 border-gray-200">
                Дата: {local.date_min || '∞'} - {local.date_max || '∞'}
                <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocal((p) => ({ ...p, date_min: undefined, date_max: undefined }))} />
              </Badge>
            );

            return (
              <ActiveBadges
                badges={nodes}
                onReset={() => {
                  // mirror Battery ActiveBadges reset behavior
                  setLocal((p) => ({
                    ...p,
                    brands: [],
                    suppliers: [],
                    cities: [],
                    supplier_status: [],
                    panel_type: undefined,
                    cell_type: undefined,
                    panel_color: undefined,
                    frame_color: undefined,
                    power_min: undefined,
                    power_max: undefined,
                    thickness_min: undefined,
                    thickness_max: undefined,
                    price_min: undefined,
                    price_max: undefined,
                    price_per_w_min: undefined,
                    price_per_w_max: undefined,
                    cells_count_min: undefined,
                    cells_count_max: undefined,
                    width_min: undefined,
                    width_max: undefined,
                    height_min: undefined,
                    height_max: undefined,
                    weight_min: undefined,
                    weight_max: undefined,
                    impp_min: undefined,
                    impp_max: undefined,
                    voltage_min: undefined,
                    voltage_max: undefined,
                    amperage_min: undefined,
                    amperage_max: undefined,
                    usd_rate: undefined,
                    markup: 15,
                    date_min: undefined,
                    date_max: undefined,
                  }));
                  onReset();
                }}
              />
            );
          })()}
        </div>
      </div>
    </div>
  );
};

// Helper component: identical 2-row clamp and popover logic as in Battery filters
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

  // Основні фільтри, які завжди внизу
  const mainFilters = ['power', 'brands', 'cities', 'suppliers'];
  
  // Решта фільтрів (без основних)
  const otherFilters = filterOrder.filter(id => !mainFilters.includes(id));

  // Handle drag end (тільки для решти фільтрів)
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = otherFilters.indexOf(active.id as string);
      const newIndex = otherFilters.indexOf(over.id as string);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOtherFilters = arrayMove(otherFilters, oldIndex, newIndex);
        // Зберігаємо повний порядок: решта фільтрів + основні фільтри
        const newOrder = [...newOtherFilters, ...mainFilters];
        setFilterOrder(newOrder);
        saveFilterOrder(newOrder);
      }
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
    // full_name moved to TopSearch
    brands: (
      <div className="h-[60px] flex flex-col justify-end">
        <MultiSelectPopover
          placeholder="Бренди"
          options={brands}
          values={local.brands}
          onChange={(vals) => setLocal(p=>({...p,brands:vals}))}
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
          onChange={(vals) => setLocal(p=>({...p,suppliers:vals}))}
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
          onChange={(vals) => setLocal(p=>({...p,cities:vals}))}
          className="h-10"
        />
      </div>
    ),
    power: (
      <div className="h-[60px] flex flex-col gap-1">
        <span className="text-[12px] font-medium text-slate-600">Потужність, Вт</span>
        <div className="flex gap-1 items-center">
          <Input
            type="number"
            placeholder="від"
            value={local.power_min ?? ''}
            onChange={(e) => setLocal(p => ({ ...p, power_min: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-10 text-sm border-gray-300"
          />
          <span className="text-xs text-slate-400">-</span>
          <Input
            type="number"
            placeholder="до"
            value={local.power_max ?? ''}
            onChange={(e) => setLocal(p => ({ ...p, power_max: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-10 text-sm border-gray-300"
          />
        </div>
      </div>
    ),
    thickness: (
      <div className="h-[60px] flex flex-col gap-1">
        <span className="text-[12px] font-medium text-slate-600">Товщина, мм</span>
        <div className="flex gap-1 items-center">
          <Input
            type="number"
            placeholder="від"
            value={local.thickness_min ?? ''}
            onChange={(e) => setLocal(p => ({ ...p, thickness_min: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-10 text-sm border-gray-300"
          />
          <span className="text-xs text-slate-400">-</span>
          <Input
            type="number"
            placeholder="до"
            value={local.thickness_max ?? ''}
            onChange={(e) => setLocal(p => ({ ...p, thickness_max: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-10 text-sm border-gray-300"
          />
        </div>
      </div>
    ),
    price: (
      <div className="h-[60px] flex flex-col gap-1">
        <span className="text-[12px] font-medium text-slate-600">Ціна, $</span>
        <div className="flex gap-1 items-center">
          <Input
            type="number"
            placeholder="від"
            value={local.price_min ?? ''}
            onChange={(e) => setLocal(p => ({ ...p, price_min: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-10 text-sm border-gray-300"
          />
          <span className="text-xs text-slate-400">-</span>
          <Input
            type="number"
            placeholder="до"
            value={local.price_max ?? ''}
            onChange={(e) => setLocal(p => ({ ...p, price_max: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-10 text-sm border-gray-300"
          />
        </div>
      </div>
    ),
    price_per_w: (
      <div className="h-[60px] flex flex-col gap-1">
        <span className="text-[12px] font-medium text-slate-600">Ціна за Вт, $/Вт</span>
        <div className="flex gap-1 items-center">
          <Input
            type="number"
            placeholder="від"
            value={local.price_per_w_min ?? ''}
            onChange={(e) => setLocal(p => ({ ...p, price_per_w_min: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-10 text-sm border-gray-300"
            step="0.01"
          />
          <span className="text-xs text-slate-400">-</span>
          <Input
            type="number"
            placeholder="до"
            value={local.price_per_w_max ?? ''}
            onChange={(e) => setLocal(p => ({ ...p, price_per_w_max: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-10 text-sm border-gray-300"
            step="0.01"
          />
        </div>
      </div>
    ),
    cells_count: (
      <div className="h-[60px] flex flex-col gap-1">
        <span className="text-[12px] font-medium text-slate-600">Кількість елементів</span>
        <div className="flex gap-1 items-center">
          <Input
            type="number"
            placeholder="від"
            value={local.cells_count_min ?? ''}
            onChange={(e) => setLocal(p => ({ ...p, cells_count_min: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-10 text-sm border-gray-300"
          />
          <span className="text-xs text-slate-400">-</span>
          <Input
            type="number"
            placeholder="до"
            value={local.cells_count_max ?? ''}
            onChange={(e) => setLocal(p => ({ ...p, cells_count_max: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-10 text-sm border-gray-300"
          />
        </div>
      </div>
    ),
    width: (
      <div className="h-[60px] flex flex-col gap-1">
        <span className="text-[12px] font-medium text-slate-600">Ширина, мм</span>
        <div className="flex gap-1 items-center">
          <Input
            type="number"
            placeholder="від"
            value={local.width_min ?? ''}
            onChange={(e) => setLocal(p => ({ ...p, width_min: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-10 text-sm border-gray-300"
          />
          <span className="text-xs text-slate-400">-</span>
          <Input
            type="number"
            placeholder="до"
            value={local.width_max ?? ''}
            onChange={(e) => setLocal(p => ({ ...p, width_max: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-10 text-sm border-gray-300"
          />
        </div>
      </div>
    ),
    height: (
      <div className="h-[60px] flex flex-col gap-1">
        <span className="text-[12px] font-medium text-slate-600">Висота, мм</span>
        <div className="flex gap-1 items-center">
          <Input
            type="number"
            placeholder="від"
            value={local.height_min ?? ''}
            onChange={(e) => setLocal(p => ({ ...p, height_min: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-10 text-sm border-gray-300"
          />
          <span className="text-xs text-slate-400">-</span>
          <Input
            type="number"
            placeholder="до"
            value={local.height_max ?? ''}
            onChange={(e) => setLocal(p => ({ ...p, height_max: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-10 text-sm border-gray-300"
          />
        </div>
      </div>
    ),
    weight: (
      <div className="h-[60px] flex flex-col gap-1">
        <span className="text-[12px] font-medium text-slate-600">Вага, кг</span>
        <div className="flex gap-1 items-center">
          <Input
            type="number"
            placeholder="від"
            value={local.weight_min ?? ''}
            onChange={(e) => setLocal(p => ({ ...p, weight_min: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-10 text-sm border-gray-300"
            step="0.1"
          />
          <span className="text-xs text-slate-400">-</span>
          <Input
            type="number"
            placeholder="до"
            value={local.weight_max ?? ''}
            onChange={(e) => setLocal(p => ({ ...p, weight_max: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-10 text-sm border-gray-300"
            step="0.1"
          />
        </div>
      </div>
    ),
    impp: (
      <div className="h-[60px] flex flex-col gap-1">
        <span className="text-[12px] font-medium text-slate-600">Impp, А</span>
        <div className="flex gap-1 items-center">
          <Input
            type="number"
            placeholder="від"
            value={local.impp_min ?? ''}
            onChange={(e) => setLocal(p => ({ ...p, impp_min: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-10 text-sm border-gray-300"
            step="0.1"
          />
          <span className="text-xs text-slate-400">-</span>
          <Input
            type="number"
            placeholder="до"
            value={local.impp_max ?? ''}
            onChange={(e) => setLocal(p => ({ ...p, impp_max: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-10 text-sm border-gray-300"
            step="0.1"
          />
        </div>
      </div>
    ),
    voltage: (
      <div className="h-[60px] flex flex-col gap-1">
        <span className="text-[12px] font-medium text-slate-600">Вольтаж, В</span>
        <div className="flex gap-1 items-center">
          <Input
            type="number"
            placeholder="від"
            value={local.voltage_min ?? ''}
            onChange={(e) => setLocal(p => ({ ...p, voltage_min: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-10 text-sm border-gray-300"
            step="0.1"
          />
          <span className="text-xs text-slate-400">-</span>
          <Input
            type="number"
            placeholder="до"
            value={local.voltage_max ?? ''}
            onChange={(e) => setLocal(p => ({ ...p, voltage_max: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-10 text-sm border-gray-300"
            step="0.1"
          />
        </div>
      </div>
    ),
    amperage: (
      <div className="h-[60px] flex flex-col gap-1">
        <span className="text-[12px] font-medium text-slate-600">Амперраж, А</span>
        <div className="flex gap-1 items-center">
          <Input
            type="number"
            placeholder="від"
            value={local.amperage_min ?? ''}
            onChange={(e) => setLocal(p => ({ ...p, amperage_min: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-10 text-sm border-gray-300"
            step="0.1"
          />
          <span className="text-xs text-slate-400">-</span>
          <Input
            type="number"
            placeholder="до"
            value={local.amperage_max ?? ''}
            onChange={(e) => setLocal(p => ({ ...p, amperage_max: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-10 text-sm border-gray-300"
            step="0.1"
          />
        </div>
      </div>
    ),
    panel_type: (
      <div className="h-[60px] flex flex-col gap-1 p-1 justify-end">
        <span className="text-[12px] font-medium text-slate-600">Тип панелі</span>
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
      <div className="h-[60px] flex flex-col gap-1 p-1 justify-end">
        <span className="text-[12px] font-medium text-slate-600">Тип елементу</span>
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
      <div className="h-[60px] flex flex-col gap-1 p-1 justify-end">
        <span className="text-[12px] font-medium text-slate-600">Колір панелі</span>
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
      <div className="h-[60px] flex flex-col gap-1 p-1 justify-end">
        <span className="text-[12px] font-medium text-slate-600">Колір рами</span>
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
      <div className="h-[60px] flex flex-col gap-1 p-1 justify-end">
        <span className="text-[12px] font-medium text-slate-600">Статус постач.</span>
        <div className="flex flex-nowrap gap-2 text-[14px] leading-tight overflow-hidden h-[60px] items-end">
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
      <div className="h-[60px] flex flex-col gap-1">
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
            onChange={(e) => {
              const value = e.target.value ? parseFloat(e.target.value) : undefined;
              setLocal((p) => ({ ...p, markup: value }));
            }}
            className="h-10 text-sm border-gray-300"
            min="0"
            step="0.1"
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
        <SortableContext items={otherFilters} strategy={verticalListSortingStrategy}>
          {/* Решта фільтрів з drag and drop */}
          <div className="grid gap-5" style={{gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))'}}>
            {otherFilters.map((filterId) => {
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
      
      {/* Основні фільтри в одну лінію з кнопками (без drag and drop) */}
      <div className="flex flex-wrap gap-3 items-center justify-between mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {mainFilters.map((filterId) => {
          const component = filterComponents[filterId];
          if (!component) return null;
          
          return (
            <div key={filterId}>
              {component}
            </div>
          );
        })}
      </div>
    </div>
    </>
  );
};