import { useState, useEffect, useRef } from 'react';
import { InverterPriceListRequestSchema } from '@/types/inverters';
import { Input } from '@/components/ui/Input';
import { MultiSelectPopover } from './ui/MultiSelectPopover';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { Button } from '@/components/ui/Button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/Popover';
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

const inverterTypes = ['on_grid', 'off_grid', 'hybrid'];
const generations = ['1G', '2G', '3G'];
const supplierStatuses = ['ME', 'SUPPLIER', 'COMPETITOR'];
const statusLabels: Record<string, string> = {
  ME: 'ми',
  SUPPLIER: 'постачальник',
  COMPETITOR: 'конкурент',
};

interface Props {
  current: InverterPriceListRequestSchema;
  setFilters: (f: InverterPriceListRequestSchema) => void;
  brands: string[];
  suppliers: string[];
}

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
    <div
      ref={setNodeRef}
      style={style}
      className="group relative"
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10"
      >
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>
      {children}
    </div>
  );
};

export const InverterComparisonFilters: React.FC<Props> = ({ current, setFilters, brands, suppliers }) => {
  const debounceRef = useRef<NodeJS.Timeout>();
  const [local, setLocal] = useState<InverterPriceListRequestSchema>({
    ...current
  });
  const [isExpanded, setIsExpanded] = useState(false);
  // Active badges clamped to two rows with popover overflow
  const ActiveBadges: React.FC<{ badges: React.ReactNode[]; onReset: () => void; }> = ({ badges, onReset }) => {
    const displayRef = useRef<HTMLDivElement | null>(null);
    const measureRef = useRef<HTMLDivElement | null>(null);
    const [containerWidth, setContainerWidth] = useState(0);
    const [visibleCount, setVisibleCount] = useState(badges.length);

    useEffect(() => {
      if (!displayRef.current) return;
      const ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContainerWidth(Math.round(entry.contentRect.width));
        }
      });
      ro.observe(displayRef.current);
      return () => ro.disconnect();
    }, []);

    useEffect(() => {
      if (!measureRef.current) return;
      const wrap = measureRef.current;
      const children = Array.from(wrap.children) as HTMLElement[];
      if (children.length === 0) { setVisibleCount(0); return; }
      const tops: number[] = [];
      children.forEach(el => tops.push(el.offsetTop));
      const uniqueTops = Array.from(new Set(tops)).sort((a, b) => a - b);
      const secondRowTop = uniqueTops[1];
      if (secondRowTop === undefined) {
        setVisibleCount(children.length);
      } else {
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
      <div className="flex flex-col gap-2 min-w-0 w-full">
        <div ref={displayRef} className="flex flex-wrap gap-2 items-center min-w-0">
          <div className="relative w-full">
            <div className="flex flex-wrap gap-2 items-center">
              {badges.slice(0, visibleCount)}
            </div>
            {overflow > 0 && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-b from-transparent to-white dark:to-gray-900 z-0"
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
          {hasAny && (
            <Button variant="outline" onClick={onReset} size="xs">
              <X className="w-4 h-4 mr-2" /> Скинути
            </Button>
          )}
        </div>
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
  
  // Drag and drop state
  const defaultFilterOrder = [
    // 'full_name' moved outside of the filters panel
    'brands',
    'suppliers',
    'power',
    'inverter_type',
    'string_count',
    'generation',
    'firmware',
    'supplier_status',
    'price',
    'date_range',
    'price_sort'
  ];
  
  const [filterOrder, setFilterOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('inverter-comparison-filters-order');
    const base: string[] = saved ? JSON.parse(saved) : defaultFilterOrder;
    // Ensure 'full_name' is not rendered in the grid even if present in old saved orders
    return base.filter((id) => id !== 'full_name');
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
      const oldIndex = filterOrder.indexOf(active.id as string);
      const newIndex = filterOrder.indexOf(over.id as string);
      
      const newOrder = arrayMove(filterOrder, oldIndex, newIndex);
      setFilterOrder(newOrder);
      localStorage.setItem('inverter-comparison-filters-order', JSON.stringify(newOrder));
    }
  };

  // Auto-apply filters with debounce
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setFilters({ ...local, page: 1 });
    }, 300);
  }, [local, setFilters]);

  // Keep local.full_name in sync with external current.full_name (controlled outside)
  useEffect(() => {
    setLocal((prev) => ({ ...prev, full_name: current.full_name }));
    // We only care about current.full_name changes here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current.full_name]);

  const reset = () => {
    const base = { page: 1, page_size: current.page_size ?? 10 } as InverterPriceListRequestSchema;
    setLocal(base);
    setFilters(base);
  };

  // Filter components mapping
  const filterComponents: Record<string, React.ReactNode> = {
    // full_name input removed from filters; now rendered externally on the page
    brands: (
      <div className="h-[60px] flex flex-col justify-end">
        <MultiSelectPopover
          placeholder="+ Виробник"
          options={brands}
          values={local.brands ?? []}
          onChange={(brands: string[] | undefined) => setLocal(prev => ({ ...prev, brands }))} 
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
          placeholder="+ Постачальник"
          options={suppliers}
          values={local.suppliers}
          onChange={(vals) => setLocal((p) => ({ ...p, suppliers: vals }))}
          showSelectAll
          selectAllLabel="Вибрати всіх постачальників"
          clearLabel="Скинути"
          className="h-10"
        />
      </div>
    ),
    power: (
      <div className="h-[60px] flex flex-col gap-1">
        <span className="text-[12px] font-medium text-slate-600">Потужність, кВт</span>
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
    inverter_type: (
      <div className="h-[60px] flex flex-col gap-1 p-1 justify-end">
        <span className="text-[12px] font-medium text-slate-600">Тип</span>
        <div className="flex flex-nowrap gap-2 text-[14px] leading-tight overflow-hidden h-[60px] items-end">
          {inverterTypes.map((t) => (
            <label key={t} className="inline-flex items-center gap-1 cursor-pointer text-slate-700">
              <input
                type="radio"
                name="inverter-type-comp"
                checked={local.inverter_type === t}
                onChange={() => setLocal((p) => ({ ...p, inverter_type: t }))}
                className="peer accent-primary"
              />
              <span className="truncate max-w-[80px]" title={t}>
                {t === 'on_grid' ? 'on-grid' : t === 'off_grid' ? 'off-grid' : t}
              </span>
            </label>
          ))}
          <label className="inline-flex items-center gap-1 cursor-pointer text-slate-700">
            <input
              type="radio"
              name="inverter-type-comp"
              checked={local.inverter_type === undefined}
              onChange={() => setLocal((p) => ({ ...p, inverter_type: undefined }))}
              className="peer accent-primary"
            />
            <span>всі</span>
          </label>
        </div>
      </div>
    ),
    string_count: (
      <div className="h-[60px] flex flex-col gap-1">
        <span className="text-[12px] font-medium text-slate-600">Кількість стрінгів</span>
        <div className="flex gap-1 items-center">
          <Input
            type="number"
            placeholder="від"
            value={local.string_count_min ?? ''}
            onChange={(e) => setLocal(p => ({ ...p, string_count_min: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-10 text-sm border-gray-300"
          />
          <span className="text-xs text-slate-400">-</span>
          <Input
            type="number"
            placeholder="до"
            value={local.string_count_max ?? ''}
            onChange={(e) => setLocal(p => ({ ...p, string_count_max: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-10 text-sm border-gray-300"
          />
        </div>
      </div>
    ),
    generation: (
      <div className="h-[60px] flex flex-col gap-1 p-1 justify-end">
        <span className="text-[12px] font-medium text-slate-600">Покоління</span>
        <div className="flex flex-nowrap gap-1 text-[14px] overflow-hidden">
          {generations.map((g) => (
            <label key={g} className="inline-flex items-center gap-1 cursor-pointer text-slate-700">
              <input
                type="radio"
                name="generation-comp"
                checked={local.generation === g}
                onChange={() => setLocal((p) => ({ ...p, generation: g }))}
                className="peer accent-primary"
              />
              <span className="truncate max-w-[80px]" title={g}>{g}</span>
            </label>
          ))}
          <label className="inline-flex items-center gap-1 cursor-pointer text-slate-700">
            <input
              type="radio"
              name="generation-comp"
              checked={local.generation === undefined}
              onChange={() => setLocal((p) => ({ ...p, generation: undefined }))}
              className="peer accent-primary"
            />
            <span>всі</span>
          </label>
        </div>
      </div>
    ),
    firmware: (
      <div className="h-[60px] flex flex-col justify-end">
        <Input
          placeholder="Firmware"
          value={local.firmware ?? ''}
          onChange={(e) => setLocal((p) => ({ ...p, firmware: e.target.value || undefined }))}
          className="h-10"
        />
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
                name="supplier-status-comp"
                checked={local.supplier_status?.[0] === s}
                onChange={() => setLocal((p) => ({ ...p, supplier_status: [s] }))}
                className="peer accent-primary"
              />
              <span className="truncate max-w-[80px]" title={statusLabels[s] || s}>
                {s === 'ME' ? 'ми' : s === 'SUPPLIER' ? 'постач.' : 'конкур.'}
              </span>
            </label>
          ))}
          <label className="inline-flex items-center gap-1 cursor-pointer text-slate-700">
            <input
              type="radio"
              name="supplier-status-comp"
              checked={!local.supplier_status || local.supplier_status.length === 0}
              onChange={() => setLocal((p) => ({ ...p, supplier_status: undefined }))}
              className="peer accent-primary"
            />
            <span>всі</span>
          </label>
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
    price_sort: (
      <div className="h-[60px] flex flex-col gap-1 p-1 justify-end">
        <span className="text-[12px] font-medium text-slate-600">Сортувати ціну</span>
        <div className="flex flex-nowrap gap-1 text-[14px] overflow-hidden">
          <label className="inline-flex items-center gap-1 cursor-pointer text-slate-700">
            <input
              type="radio"
              name="price-sort-comp"
              checked={local.price_sort === 'asc'}
              onChange={() => setLocal((p) => ({ ...p, price_sort: 'asc' }))}
              className="peer accent-primary"
            />
            <span className="truncate max-w-[80px]">↑ ціна</span>
          </label>
          <label className="inline-flex items-center gap-1 cursor-pointer text-slate-700">
            <input
              type="radio"
              name="price-sort-comp"
              checked={local.price_sort === 'desc'}
              onChange={() => setLocal((p) => ({ ...p, price_sort: 'desc' }))}
              className="peer accent-primary"
            />
            <span className="truncate max-w-[80px]">↓ ціна</span>
          </label>
          <label className="inline-flex items-center gap-1 cursor-pointer text-slate-700">
            <input
              type="radio"
              name="price-sort-comp"
              checked={local.price_sort === undefined}
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
    <>

    <div className="w-full max-w-[1280px] mx-auto flex flex-col gap-2 sm:gap-4">
      {/* Фільтр тогл для мобільних */}
      <div className="flex items-center justify-between md:hidden p-2 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="flex items-end gap-1 h-[60px]">
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

      {/* Active filter badges with clamp + popover */}
      {Object.values(local).some((v) => v !== undefined && v !== '' && v !== null) && (
        <div className="w-full flex flex-col gap-2">
          <div className="flex items-start gap-2">
            <span className="text-xs sm:text-sm font-medium flex-shrink-0 pt-1">Фільтри:</span>
            {(() => {
              const badges: React.ReactNode[] = [];
              (local.brands || []).forEach((b) => {
                badges.push(
                  <Badge key={`brand-${b}`} variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 h-6 text-xs">
                    {b}
                    <button onClick={() => setLocal(p => ({ ...p, brands: p.brands?.filter(x => x !== b) }))} className="ml-1">
                      <X size={12} />
                    </button>
                  </Badge>
                );
              });
              (local.suppliers || []).forEach((s) => {
                badges.push(
                  <Badge key={`supplier-${s}`} variant="secondary" className="bg-green-100 text-green-800 border-green-200 h-6 text-xs">
                    {s}
                    <button onClick={() => setLocal(p => ({ ...p, suppliers: p.suppliers?.filter(x => x !== s) }))} className="ml-1">
                      <X size={12} />
                    </button>
                  </Badge>
                );
              });
              if (local.full_name) {
                badges.push(
                  <Badge key={`full_name`} variant="secondary" className="bg-slate-100 text-slate-800 border-slate-200 h-6 text-xs">
                    Назва: {local.full_name}
                    <button onClick={() => setLocal(p => ({ ...p, full_name: undefined }))} className="ml-1">
                      <X size={12} />
                    </button>
                  </Badge>
                );
              }
              if (local.power_min !== undefined || local.power_max !== undefined) {
                badges.push(
                  <Badge key={`power`} variant="secondary" className="bg-pink-100 text-pink-800 border-pink-200 h-6 text-xs">
                    Потужн.: {local.power_min ?? '∞'}-{local.power_max ?? '∞'} кВт
                    <button onClick={() => setLocal(p => ({ ...p, power_min: undefined, power_max: undefined }))} className="ml-1">
                      <X size={12} />
                    </button>
                  </Badge>
                );
              }
              if (local.string_count_min !== undefined || local.string_count_max !== undefined) {
                badges.push(
                  <Badge key={`string_count`} variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200 h-6 text-xs">
                    Стрінги: {local.string_count_min ?? '∞'}-{local.string_count_max ?? '∞'}
                    <button onClick={() => setLocal(p => ({ ...p, string_count_min: undefined, string_count_max: undefined }))} className="ml-1">
                      <X size={12} />
                    </button>
                  </Badge>
                );
              }
              if (local.price_min !== undefined || local.price_max !== undefined) {
                badges.push(
                  <Badge key={`price`} variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200 h-6 text-xs">
                    Ціна: {local.price_min ?? '∞'}-{local.price_max ?? '∞'} $
                    <button onClick={() => setLocal(p => ({ ...p, price_min: undefined, price_max: undefined }))} className="ml-1">
                      <X size={12} />
                    </button>
                  </Badge>
                );
              }
              if (local.inverter_type) {
                badges.push(
                  <Badge key={`inverter_type`} variant="secondary" className="bg-indigo-100 text-indigo-800 border-indigo-200 h-6 text-xs">
                    Тип: {local.inverter_type}
                    <button onClick={() => setLocal(p => ({ ...p, inverter_type: undefined }))} className="ml-1">
                      <X size={12} />
                    </button>
                  </Badge>
                );
              }
              if (local.generation) {
                badges.push(
                  <Badge key={`generation`} variant="secondary" className="bg-indigo-100 text-indigo-800 border-indigo-200 h-6 text-xs">
                    Покоління: {local.generation}
                    <button onClick={() => setLocal(p => ({ ...p, generation: undefined }))} className="ml-1">
                      <X size={12} />
                    </button>
                  </Badge>
                );
              }
              if (local.firmware) {
                badges.push(
                  <Badge key={`firmware`} variant="secondary" className="bg-slate-100 text-slate-800 border-slate-200 h-6 text-xs">
                    Firmware: {local.firmware}
                    <button onClick={() => setLocal(p => ({ ...p, firmware: undefined }))} className="ml-1">
                      <X size={12} />
                    </button>
                  </Badge>
                );
              }
              (local.supplier_status && local.supplier_status.length > 0 ? local.supplier_status : []).forEach((s) => {
                badges.push(
                  <Badge key={`status-${s}`} variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200 h-6 text-xs">
                    Статус постач.: {s === 'ME' ? 'ми' : s === 'SUPPLIER' ? 'постач.' : 'конкур.'}
                    <button onClick={() => setLocal(p => ({ ...p, supplier_status: undefined }))} className="ml-1">
                      <X size={12} />
                    </button>
                  </Badge>
                );
              });
              if (local.date_min || local.date_max) {
                badges.push(
                  <Badge key={`date`} variant="secondary" className="bg-slate-100 text-slate-800 border-slate-200 h-6 text-xs">
                    Період: {local.date_min || '—'} — {local.date_max || '—'}
                    <button onClick={() => setLocal(p => ({ ...p, date_min: undefined, date_max: undefined }))} className="ml-1">
                      <X size={12} />
                    </button>
                  </Badge>
                );
              }
              if (local.price_sort) {
                badges.push(
                  <Badge key={`price_sort`} variant="secondary" className="bg-teal-100 text-teal-800 border-teal-200 h-6 text-xs">
                    Сортування: {local.price_sort === 'asc' ? '↑ ціна' : '↓ ціна'}
                    <button onClick={() => setLocal(p => ({ ...p, price_sort: undefined }))} className="ml-1">
                      <X size={12} />
                    </button>
                  </Badge>
                );
              }
              return <ActiveBadges badges={badges} onReset={reset} />;
            })()}
          </div>
        </div>
      )}

      {/* Filter Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={filterOrder} strategy={verticalListSortingStrategy}>
          <div className={cn(
            "grid gap-3 sm:gap-5 transition-all duration-200 pl-6",
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
    </>
  );
};
