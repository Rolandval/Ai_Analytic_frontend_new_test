import { useState, useEffect, useRef } from 'react';
import { BatteryPriceListRequestSchema } from '@/types/batteries';
import { Input } from '@/components/ui/Input';
import { MultiSelectPopover } from './ui/MultiSelectPopover';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { X, GripVertical } from 'lucide-react';
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

export const BatteryFilters: React.FC<Props> = ({ current, setFilters, brands, suppliers }) => {
  const [local, setLocal] = useState<BatteryPriceListRequestSchema>(current);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Auto-apply with debounce
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setFilters({ ...local, page: 1 });
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [local, setFilters]);

  const reset = () => {
    const base = { page: 1, page_size: current.page_size ?? 10 } as BatteryPriceListRequestSchema;
    setLocal(base);
    setFilters(base);
  };

  // Drag and drop functionality
  const [filterOrder, setFilterOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('batteryFiltersNew-order');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback to default order
      }
    }
    return [
      'full_name',
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
        localStorage.setItem('batteryFiltersNew-order', JSON.stringify(newOrder));
        return newOrder;
      });
    }
  };

  // Filter components mapping
  const filterComponents: Record<string, React.ReactNode> = {
    full_name: (
      <Input
        placeholder="Назва"
        value={local.full_name ?? ''}
        onChange={(e) => setLocal((p) => ({ ...p, full_name: e.target.value || undefined }))}
      />
    ),
    brands: (
      <MultiSelectPopover
        placeholder="Бренди"
        options={brands}
        values={local.brands}
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
        values={local.suppliers}
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
            value={local.volume_min ?? ''}
            onChange={(e) => setLocal(p => ({ ...p, volume_min: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-8 text-sm border-gray-300"
          />
          <span className="text-xs text-slate-400">-</span>
          <Input
            type="number"
            placeholder="до"
            value={local.volume_max ?? ''}
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
            value={local.c_amps_min ?? ''}
            onChange={(e) => setLocal(p => ({ ...p, c_amps_min: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-8 text-sm border-gray-300"
          />
          <span className="text-xs text-slate-400">-</span>
          <Input
            type="number"
            placeholder="до"
            value={local.c_amps_max ?? ''}
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
    region: (
      <div className="flex flex-col gap-1 p-1">
        <span className="text-[14px] font-semibold text-slate-700">Регіон</span>
        <div className="flex flex-nowrap gap-2 text-[14px] leading-tight overflow-hidden">
          {regions.map((r) => (
            <label key={r} className="inline-flex items-center gap-1 cursor-pointer text-slate-700 whitespace-nowrap">
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
          <label className="inline-flex items-center gap-1 cursor-pointer text-slate-700 whitespace-nowrap">
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
        <div className="flex flex-nowrap gap-2 text-[14px] leading-tight overflow-hidden">
          {polarities.map((pola) => (
            <label key={pola} className="inline-flex items-center gap-1 cursor-pointer text-slate-700 whitespace-nowrap">
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
          <label className="inline-flex items-center gap-1 cursor-pointer text-slate-700 whitespace-nowrap">
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
        <div className="flex flex-nowrap gap-2 text-[14px] leading-tight overflow-hidden">
          {electrolytes.map((e) => (
            <label key={e} className="inline-flex items-center gap-1 cursor-pointer text-slate-700 whitespace-nowrap">
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
          <label className="inline-flex items-center gap-1 cursor-pointer text-slate-700 whitespace-nowrap">
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
              name="price-sort"
              checked={local.price_sort === 'asc'}
              onChange={() => setLocal((p) => ({ ...p, price_sort: 'asc' }))}
              className="peer accent-primary"
            />
            <span>↑ ціна</span>
          </label>
          <label className="inline-flex items-center gap-1 cursor-pointer text-slate-700 whitespace-nowrap">
            <input
              type="radio"
              name="price-sort"
              checked={local.price_sort === 'desc'}
              onChange={() => setLocal((p) => ({ ...p, price_sort: 'desc' }))}
              className="peer accent-primary"
            />
            <span>↓ ціна</span>
          </label>
          <label className="inline-flex items-center gap-1 cursor-pointer text-slate-700 whitespace-nowrap">
            <input
              type="radio"
              name="price-sort"
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
    <>
    <div className="w-full max-w-[1280px] mx-auto flex flex-col gap-4">
      {/* active filters */}
      {Object.values(local).some((v) => v !== undefined && v !== '' && v !== null) && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium">Фільтри</span>
          {local.brands?.map((b) => (
            <Badge key={b} variant="secondary">
              {b}
            </Badge>
          ))}
          {local.suppliers?.map((s) => (
            <Badge key={s} variant="secondary">
              {s}
            </Badge>
          ))}
          {(local.volume_min !== undefined || local.volume_max !== undefined) && (
            <Badge variant="secondary">
              Обʼєм {local.volume_min ?? 0}-{local.volume_max ?? 'max'}Ah
            </Badge>
          )}
          {(local.c_amps_min !== undefined || local.c_amps_max !== undefined) && (
            <Badge variant="secondary">
              Сила {local.c_amps_min ?? 0}-{local.c_amps_max ?? 'max'}A
            </Badge>
          )}
          {(local.price_min !== undefined || local.price_max !== undefined) && (
            <Badge variant="secondary">
              Ціна {local.price_min ?? 0}-{local.price_max ?? 'max'}$
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={reset} className="h-6 px-2">
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={filterOrder} strategy={verticalListSortingStrategy}>
          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))' }}>
            {filterOrder.map((filterId) => (
              <DraggableFilterItem key={filterId} id={filterId}>
                {filterComponents[filterId]}
              </DraggableFilterItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
    </>
  );
};
