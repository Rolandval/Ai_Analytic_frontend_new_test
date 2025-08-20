import { useState, useEffect, useRef } from 'react';
import { InverterPriceListRequestSchema } from '@/types/inverters';
import { Input } from '@/components/ui/Input';
import { MultiSelectPopover } from './ui/MultiSelectPopover';
import { getInverterCities } from '@/services/cities.api';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { Button } from '@/components/ui/Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
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
  
  // Drag and drop state
  const defaultFilterOrder = [
    'full_name',
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
    return saved ? JSON.parse(saved) : defaultFilterOrder;
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

  const reset = () => {
    const base = { page: 1, page_size: current.page_size ?? 10 } as InverterPriceListRequestSchema;
    setLocal(base);
    setFilters(base);
  };

  // Filter components mapping
  const filterComponents: Record<string, React.ReactNode> = {
    full_name: (
      <Input
        placeholder="Пошук по назві..."
        value={local.full_name ?? ''}
        onChange={(e) => setLocal(prev => ({ ...prev, full_name: e.target.value || undefined }))}
        className="w-full"
      />
    ),
    brands: (
      <MultiSelectPopover
        placeholder="+ Виробник"
        options={brands}
        values={local.brands ?? []}
        onChange={(brands: string[] | undefined) => setLocal(prev => ({ ...prev, brands }))} 
        showSelectAll
        selectAllLabel="Вибрати всі бренди"
        clearLabel="Скинути"
      />
    ),
    suppliers: (
      <MultiSelectPopover
        placeholder="+ Постачальник"
        options={suppliers}
        values={local.suppliers}
        onChange={(vals) => setLocal((p) => ({ ...p, suppliers: vals }))}
        showSelectAll
        selectAllLabel="Вибрати всіх постачальників"
        clearLabel="Скинути"
      />
    ),
    power: (
      <div className="flex flex-col gap-1">
        <span className="text-[12px] font-medium text-slate-600">Потужність, кВт</span>
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
    inverter_type: (
      <div className="flex flex-col gap-1 p-1">
        <span className="text-[13px] font-semibold text-slate-700">Тип</span>
        <div className="flex flex-nowrap gap-1 text-[14px] overflow-hidden">
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
      <div className="flex flex-col gap-1">
        <span className="text-[12px] font-medium text-slate-600">Кількість стрінгів</span>
        <div className="flex gap-1 items-center">
          <Input
            type="number"
            placeholder="від"
            value={local.string_count_min ?? ''}
            onChange={(e) => setLocal(p => ({ ...p, string_count_min: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-8 text-sm border-gray-300"
          />
          <span className="text-xs text-slate-400">-</span>
          <Input
            type="number"
            placeholder="до"
            value={local.string_count_max ?? ''}
            onChange={(e) => setLocal(p => ({ ...p, string_count_max: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-8 text-sm border-gray-300"
          />
        </div>
      </div>
    ),
    generation: (
      <div className="flex flex-col gap-1 p-1">
        <span className="text-[13px] font-semibold text-slate-700">Покоління</span>
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
      <Input
        placeholder="Firmware"
        value={local.firmware ?? ''}
        onChange={(e) => setLocal((p) => ({ ...p, firmware: e.target.value || undefined }))}
      />
    ),
    supplier_status: (
      <div className="flex flex-col gap-1 p-1">
        <span className="text-[13px] font-semibold text-slate-700">Статус постач.</span>
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
    price_sort: (
      <div className="flex flex-col gap-1 p-1">
        <span className="text-[13px] font-semibold text-slate-700">Сортувати ціну</span>
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

      {/* active filters chips */}
      {Object.values(local).some((v) => v !== undefined && v !== '' && v !== null) && (
        <div className="flex flex-wrap gap-1 sm:gap-2 items-center">
          <span className="text-xs sm:text-sm font-medium">Фільтри:</span>
          {local.brands?.map((b) => (
            <Badge key={b} variant="secondary" className="text-xs py-0 h-6">
              {b}
              <button 
                onClick={() => setLocal(prev => ({ ...prev, brands: prev.brands?.filter(brand => brand !== b) }))}
                className="ml-1 hover:text-red-500 transition-colors"
              >
                <X size={12} />
              </button>
            </Badge>
          ))}
          {local.full_name && (
            <Badge variant="secondary" className="text-xs py-0 h-6">
              Назва: {local.full_name}
              <button 
                onClick={() => setLocal(prev => ({ ...prev, full_name: undefined }))}
                className="ml-1 hover:text-red-500 transition-colors"
              >
                <X size={12} />
              </button>
            </Badge>
          )}
          {local.suppliers?.map((s) => (
            <Badge key={s} variant="secondary" className="text-xs py-0 h-6">
              {s}
              <button 
                onClick={() => setLocal(prev => ({ ...prev, suppliers: prev.suppliers?.filter(supp => supp !== s) }))}
                className="ml-1 hover:text-red-500 transition-colors"
              >
                <X size={12} />
              </button>
            </Badge>
          ))}
          {(local.power_min !== undefined || local.power_max !== undefined) && (
            <Badge variant="secondary">
              Потужн. {local.power_min ?? 0}-{local.power_max ?? 'max'} кВт
            </Badge>
          )}
          {(local.price_min !== undefined || local.price_max !== undefined) && (
            <Badge variant="secondary">
              Ціна {local.price_min ?? 0}-{local.price_max ?? 'max'}$
            </Badge>
          )}
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
