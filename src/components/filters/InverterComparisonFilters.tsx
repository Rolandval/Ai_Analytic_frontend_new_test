import { useState, useEffect, useRef } from 'react';

import { InverterPriceListRequestSchema } from '@/types/inverters';
import { Input } from '@/components/ui/Input';
import { MultiSelectPopover } from './ui/MultiSelectPopover';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/Popover';
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

const inverterTypes = ['on_grid', 'off_grid', 'hybrid'];
const generations = ['1G', '2G', '3G'];
const supplierStatuses = ['ME', 'SUPPLIER', 'COMPETITOR'];
const statusLabels: Record<string, string> = {
  ME: 'ми',
  SUPPLIER: 'постач.',
  COMPETITOR: 'конкур.',
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
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative pl-6 w-full min-w-0"
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>
      <div className="w-full min-w-0">
        {children}
      </div>
    </div>
  );
};

// Quick filters component (non-draggable, displayed below the line)
interface QuickFiltersProps {
  local: InverterPriceListRequestSchema;
  setLocal: (f: InverterPriceListRequestSchema) => void;
  setFilters: (f: InverterPriceListRequestSchema) => void;
  brands: string[];
  suppliers: string[];
}

const InverterComparisonQuickFilters: React.FC<QuickFiltersProps> = ({ local, setLocal, setFilters, brands, suppliers }) => {
  return (
    <div className="flex flex-wrap gap-3 pt-4 mt-4 border-t border-slate-200 items-end">
      {/* Бренди */}
      <div className="w-auto">
        <MultiSelectPopover
          placeholder="+ Виробник"
          options={brands}
          values={local.brands ?? []}
          onChange={(brands: string[] | undefined) => {
            const newLocal = { ...local, brands, page: 1 };
            setLocal(newLocal);
            setFilters(newLocal);
          }}
          showSelectAll
          selectAllLabel="Вибрати всі бренди"
          clearLabel="Скинути"
          className="h-10"
        />
      </div>

      {/* Потужність */}
      <div className="w-auto">
        <div className="flex flex-col gap-1 h-full justify-end">
          <span className="text-[12px] font-medium text-slate-600">Потужність, кВт</span>
          <div className="flex gap-1 items-center">
            <Input
              type="number"
              placeholder="від"
              value={local.power_min ?? ''}
              onChange={(e) => {
                const newLocal = { ...local, power_min: e.target.value ? Number(e.target.value) : undefined, page: 1 };
                setLocal(newLocal);
                setFilters(newLocal);
              }}
              className="h-10 text-sm border-gray-300 w-20"
            />
            <span className="text-xs text-slate-400">-</span>
            <Input
              type="number"
              placeholder="до"
              value={local.power_max ?? ''}
              onChange={(e) => {
                const newLocal = { ...local, power_max: e.target.value ? Number(e.target.value) : undefined, page: 1 };
                setLocal(newLocal);
                setFilters(newLocal);
              }}
              className="h-10 text-sm border-gray-300 w-20"
            />
          </div>
        </div>
      </div>

      {/* Постачальники */}
      <div className="w-auto">
        <MultiSelectPopover
          placeholder="+ Постачальник"
          options={suppliers}
          values={local.suppliers}
          onChange={(vals) => {
            const newLocal = { ...local, suppliers: vals, page: 1 };
            setLocal(newLocal);
            setFilters(newLocal);
          }}
          showSelectAll
          selectAllLabel="Вибрати всіх постачальників"
          clearLabel="Скинути"
          enablePagination
          pageSize={100}
          className="h-10"
        />
      </div>

      {/* Ціна */}
      <div className="w-auto">
        <div className="flex flex-col gap-1 h-full justify-end">
          <span className="text-[12px] font-medium text-slate-600">Ціна, $</span>
          <div className="flex gap-1 items-center">
            <Input
              type="number"
              placeholder="від"
              value={local.price_min ?? ''}
              onChange={(e) => {
                const newLocal = { ...local, price_min: e.target.value ? Number(e.target.value) : undefined, page: 1 };
                setLocal(newLocal);
                setFilters(newLocal);
              }}
              className="h-10 text-sm border-gray-300 w-20"
            />
            <span className="text-xs text-slate-400">-</span>
            <Input
              type="number"
              placeholder="до"
              value={local.price_max ?? ''}
              onChange={(e) => {
                const newLocal = { ...local, price_max: e.target.value ? Number(e.target.value) : undefined, page: 1 };
                setLocal(newLocal);
                setFilters(newLocal);
              }}
              className="h-10 text-sm border-gray-300 w-20"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export const InverterComparisonFilters: React.FC<Props> = ({ current, setFilters, brands, suppliers }) => {
  const [local, setLocal] = useState<InverterPriceListRequestSchema>({
    ...current
  });
  const [localFullName, setLocalFullName] = useState(current.full_name || '');
  const isTypingRef = useRef(false);
  // const [isExpanded, setIsExpanded] = useState(false);
  // Active badges: simple full render without clamping/popover
  
  // Drag and drop state
  const defaultFilterOrder = [
    'inverter_type',
    'string_count',
    'generation',
    'firmware',
    'supplier_status',
    'date_range',
    'price_sort'
  ];
  
  const [filterOrder, setFilterOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('inverter-comparison-filters-order');
    const base: string[] = saved ? JSON.parse(saved) : defaultFilterOrder;
    // Ensure legacy keys are removed and only valid filters are kept
    return base.filter((id) => defaultFilterOrder.includes(id));
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

  // Keep local.full_name in sync with external current.full_name (controlled outside)
  useEffect(() => {
    setLocal((prev) => ({ ...prev, full_name: current.full_name }));
    if (!isTypingRef.current) {
      setLocalFullName(current.full_name || '');
    }
    // We only care about current.full_name changes here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current.full_name]);

  // Debounce full_name input
  useEffect(() => {
    console.log('🔵 [INVERTER COMPARISON] localFullName changed:', localFullName);
    isTypingRef.current = true;
    const timer = setTimeout(() => {
      console.log('⏰ [INVERTER COMPARISON] Debounce timer fired, applying filter:', localFullName);
      setLocal(p => ({ ...p, full_name: localFullName || undefined }));
      // Keep isTypingRef true for a bit longer to prevent race conditions
      setTimeout(() => {
        isTypingRef.current = false;
      }, 100);
    }, 300);
    return () => {
      console.log('🧹 [INVERTER COMPARISON] Cleanup: clearing timer');
      clearTimeout(timer);
    };
  }, [localFullName]);

  // Debounced sync of local state to filters
  useEffect(() => {
    const timeoutId = setTimeout(() => setFilters(local), 300);
    return () => clearTimeout(timeoutId);
  }, [local, setFilters]);

  const reset = () => {
    const base = { page: 1, page_size: current.page_size ?? 10 } as InverterPriceListRequestSchema;
    setLocal(base);
    setFilters(base);
  };

  // Filter components mapping
  const filterComponents: Record<string, React.ReactNode> = {
    // full_name input removed from filters; now rendered externally on the page
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
                onChange={() => {
                  const newLocal = { ...local, inverter_type: t, page: 1 };
                  setLocal(newLocal);
                  setFilters(newLocal);
                }}
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
              onChange={() => {
                const newLocal = { ...local, inverter_type: undefined, page: 1 };
                setLocal(newLocal);
                setFilters(newLocal);
              }}
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
            onChange={(e) => {
              const newLocal = { ...local, string_count_min: e.target.value ? Number(e.target.value) : undefined, page: 1 };
              setLocal(newLocal);
              setFilters(newLocal);
            }}
            className="h-10 text-sm border-gray-300"
          />
          <span className="text-xs text-slate-400">-</span>
          <Input
            type="number"
            placeholder="до"
            value={local.string_count_max ?? ''}
            onChange={(e) => {
              const newLocal = { ...local, string_count_max: e.target.value ? Number(e.target.value) : undefined, page: 1 };
              setLocal(newLocal);
              setFilters(newLocal);
            }}
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
                onChange={() => {
                  const newLocal = { ...local, generation: g, page: 1 };
                  setLocal(newLocal);
                  setFilters(newLocal);
                }}
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
              onChange={() => {
                const newLocal = { ...local, generation: undefined, page: 1 };
                setLocal(newLocal);
                setFilters(newLocal);
              }}
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
          onChange={(e) => {
            const newLocal = { ...local, firmware: e.target.value || undefined, page: 1 };
            setLocal(newLocal);
            setFilters(newLocal);
          }}
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
                onChange={() => {
                  const newLocal = { ...local, supplier_status: [s], page: 1 };
                  setLocal(newLocal);
                  setFilters(newLocal);
                }}
                className="peer accent-primary"
              />
              <span className="whitespace-nowrap" title={statusLabels[s] || s}>
                {s === 'ME' ? 'ми' : s === 'SUPPLIER' ? 'постач.' : 'конкур.'}
              </span>
            </label>
          ))}
          <label className="inline-flex items-center gap-1 cursor-pointer text-slate-700">
            <input
              type="radio"
              name="supplier-status-comp"
              checked={!local.supplier_status || local.supplier_status.length === 0}
              onChange={() => {
                const newLocal = { ...local, supplier_status: undefined, page: 1 };
                setLocal(newLocal);
                setFilters(newLocal);
              }}
              className="peer accent-primary"
            />
            <span>всі</span>
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
            const newLocal = { ...local, date_min: startDate, date_max: endDate, page: 1 };
            setLocal(newLocal);
            setFilters(newLocal);
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
              onChange={() => {
                const newLocal = { ...local, price_sort: 'asc' as const, page: 1 };
                setLocal(newLocal);
                setFilters(newLocal);
              }}
              className="peer accent-primary"
            />
            <span className="truncate max-w-[80px]">↑ ціна</span>
          </label>
          <label className="inline-flex items-center gap-1 cursor-pointer text-slate-700">
            <input
              type="radio"
              name="price-sort-comp"
              checked={local.price_sort === 'desc'}
              onChange={() => {
                const newLocal = { ...local, price_sort: 'desc' as const, page: 1 };
                setLocal(newLocal);
                setFilters(newLocal);
              }}
              className="peer accent-primary"
            />
            <span className="truncate max-w-[80px]">↓ ціна</span>
          </label>
          <label className="inline-flex items-center gap-1 cursor-pointer text-slate-700">
            <input
              type="radio"
              name="price-sort-comp"
              checked={local.price_sort === undefined}
              onChange={() => {
                const newLocal = { ...local, price_sort: undefined, page: 1 };
                setLocal(newLocal);
                setFilters(newLocal);
              }}
              className="peer accent-primary"
            />
            <span>без сорт.</span>
          </label>
        </div>
      </div>
    ),
  };

  const totalActiveBadges = 
    (local.brands?.length || 0) +
    (local.suppliers?.length || 0) +
    (local.power_min || local.power_max ? 1 : 0) +
    (local.string_count_min || local.string_count_max ? 1 : 0) +
    (local.price_min || local.price_max ? 1 : 0) +
    (local.inverter_type ? 1 : 0) +
    (local.generation ? 1 : 0) +
    (local.firmware ? 1 : 0) +
    (local.supplier_status?.length || 0) +
    (local.date_min || local.date_max ? 1 : 0) +
    (local.price_sort ? 1 : 0);

  return (
    <>

    <div className="w-full  flex flex-col gap-2 sm:gap-4">
      {/* Top search and active filters */}
      <div className="flex flex-col   sm:flex-row gap-3 items-start sm:items-center">
        {/* Name search input */}
        <div className="flex-shrink-0">
          <Input
            placeholder="Пошук по назві..."
            value={localFullName}
            onChange={(e) => {
              console.log('⌨️ [INVERTER COMPARISON] Input onChange:', e.target.value);
              setLocalFullName(e.target.value);
            }}
            className="h-8 w-[220px] sm:w-[280px]"
          />
        </div>
        
        {/* Active filters */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Visible badges area (clamped to 2 rows with fade overlay) */}
          <div className="relative overflow-hidden max-h-[56px]">
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
              
              {/* Потужність */}
              {(local.power_min || local.power_max) && (
                <Badge variant="secondary" className="bg-pink-100 text-pink-800 border-pink-200">
                  Потужність: {local.power_min || '∞'}-{local.power_max || '∞'} кВт
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer" 
                    onClick={() => setLocal(p => ({ ...p, power_min: undefined, power_max: undefined }))}
                  />
                </Badge>
              )}
              
              {/* Стрінги */}
              {(local.string_count_min || local.string_count_max) && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                  Стрінги: {local.string_count_min || '∞'}-{local.string_count_max || '∞'}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer" 
                    onClick={() => setLocal(p => ({ ...p, string_count_min: undefined, string_count_max: undefined }))}
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
              
              {/* Тип інвертора */}
              {local.inverter_type && (
                <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 border-indigo-200">
                  Тип: {local.inverter_type}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer" 
                    onClick={() => setLocal(p => ({ ...p, inverter_type: undefined }))}
                  />
                </Badge>
              )}
              
              {/* Покоління */}
              {local.generation && (
                <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 border-indigo-200">
                  Покоління: {local.generation}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer" 
                    onClick={() => setLocal(p => ({ ...p, generation: undefined }))}
                  />
                </Badge>
              )}
              
              {/* Firmware */}
              {local.firmware && (
                <Badge variant="secondary" className="bg-slate-100 text-slate-800 border-slate-200">
                  Firmware: {local.firmware}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer" 
                    onClick={() => setLocal(p => ({ ...p, firmware: undefined }))}
                  />
                </Badge>
              )}
              
              {/* Статус постачальника */}
              {(local.supplier_status && local.supplier_status.length > 0 ? local.supplier_status : []).map((s) => (
                <Badge key={`status-${s}`} variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
                  Статус постач.: {s === 'ME' ? 'ми' : s === 'SUPPLIER' ? 'постач.' : 'конкур.'}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer" 
                    onClick={() => setLocal(p => ({ ...p, supplier_status: undefined }))}
                  />
                </Badge>
              ))}
              
              {/* Дата */}
              {(local.date_min || local.date_max) && (
                <Badge variant="secondary" className="bg-slate-100 text-slate-800 border-slate-200">
                  Період: {local.date_min || '—'} — {local.date_max || '—'}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer" 
                    onClick={() => setLocal(p => ({ ...p, date_min: undefined, date_max: undefined }))}
                  />
                </Badge>
              )}
              
              {/* Сортування */}
              {local.price_sort && (
                <Badge variant="secondary" className="bg-teal-100 text-teal-800 border-teal-200">
                  Сортування: {local.price_sort === 'asc' ? '↑ ціна' : '↓ ціна'}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer" 
                    onClick={() => setLocal(p => ({ ...p, price_sort: undefined }))}
                  />
                </Badge>
              )}
            </div>
            {totalActiveBadges > 14 && (
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-7 bg-gradient-to-t from-white to-white/0 dark:hidden" />
            )}
          </div>

          {/* Unified compact controls: show-all and reset-all */}
          {Object.values(local).some(v => v !== undefined && v !== '' && v !== null && !(Array.isArray(v) && v.length === 0)) && (
            <div className="flex items-center gap-2">
              {totalActiveBadges > 14 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="xs" className="h-6 px-2 text-xs">
                      {`Показати всі (+${totalActiveBadges})`}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[28rem] max-h-96 overflow-auto">
                    <div className="flex flex-wrap gap-2">
                      {(local.brands || []).map((brand) => (
                        <Badge key={`brand-${brand}`} variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                          {brand}
                          <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocal(p => ({ ...p, brands: p.brands?.filter(b => b !== brand) }))} />
                        </Badge>
                      ))}
                      {(local.suppliers || []).map((s) => (
                        <Badge key={`supplier-${s}`} variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                          {s}
                          <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocal(p => ({ ...p, suppliers: p.suppliers?.filter(x => x !== s) }))} />
                        </Badge>
                      ))}
                      {(local.power_min !== undefined || local.power_max !== undefined) && (
                        <Badge variant="secondary" className="bg-pink-100 text-pink-800 border-pink-200">
                          Потужність: {local.power_min || '∞'}-{local.power_max || '∞'} кВт
                          <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocal(p => ({ ...p, power_min: undefined, power_max: undefined }))} />
                        </Badge>
                      )}
                      {(local.string_count_min !== undefined || local.string_count_max !== undefined) && (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                          Стрінги: {local.string_count_min || '∞'}-{local.string_count_max || '∞'}
                          <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocal(p => ({ ...p, string_count_min: undefined, string_count_max: undefined }))} />
                        </Badge>
                      )}
                      {(local.price_min !== undefined || local.price_max !== undefined) && (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200">
                          Ціна: {local.price_min || '∞'}-{local.price_max || '∞'} $
                          <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocal(p => ({ ...p, price_min: undefined, price_max: undefined }))} />
                        </Badge>
                      )}
                      {local.inverter_type && (
                        <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 border-indigo-200">
                          Тип: {local.inverter_type}
                          <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocal(p => ({ ...p, inverter_type: undefined }))} />
                        </Badge>
                      )}
                      {local.generation && (
                        <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 border-indigo-200">
                          Покоління: {local.generation}
                          <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocal(p => ({ ...p, generation: undefined }))} />
                        </Badge>
                      )}
                      {local.firmware && (
                        <Badge variant="secondary" className="bg-slate-100 text-slate-800 border-slate-200">
                          Firmware: {local.firmware}
                          <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocal(p => ({ ...p, firmware: undefined }))} />
                        </Badge>
                      )}
                      {(local.supplier_status && local.supplier_status.length > 0 ? local.supplier_status : []).map((s) => (
                        <Badge key={`status-${s}`} variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
                          Статус постач.: {s === 'ME' ? 'ми' : s === 'SUPPLIER' ? 'постач.' : 'конкур.'}
                          <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocal(p => ({ ...p, supplier_status: undefined }))} />
                        </Badge>
                      ))}
                      {(local.date_min || local.date_max) && (
                        <Badge variant="secondary" className="bg-slate-100 text-slate-800 border-slate-200">
                          Період: {local.date_min || '—'} — {local.date_max || '—'}
                          <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocal(p => ({ ...p, date_min: undefined, date_max: undefined }))} />
                        </Badge>
                      )}
                      {local.price_sort && (
                        <Badge variant="secondary" className="bg-teal-100 text-teal-800 border-teal-200">
                          Сортування: {local.price_sort === 'asc' ? '↑ ціна' : '↓ ціна'}
                          <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocal(p => ({ ...p, price_sort: undefined }))} />
                        </Badge>
                      )}
                    </div>
                    <div className="mt-3 flex justify-end">
                      <Button className="h-6 px-2 text-xs" variant="ghost" size="xs" onClick={reset}>
                        Скинути все
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
              <Button variant="outline" size="xs" onClick={reset} className="h-6 px-2 text-xs">
                <X className="w-4 h-4 mr-1" />
                Скинути
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Filter Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={filterOrder} strategy={verticalListSortingStrategy}>
          <div
            className={
              "grid gap-3 sm:gap-5 transition-all duration-200 " +
              "[grid-template-columns:repeat(auto-fit,minmax(220px,1fr))] [grid-auto-rows:minmax(60px,auto)]"
            }
          >
            {filterOrder.map((filterId) => (
              <DraggableFilterItem key={filterId} id={filterId}>
                {filterComponents[filterId]}
              </DraggableFilterItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Quick Filters Below the Line */}
      <InverterComparisonQuickFilters
        local={local}
        setLocal={setLocal}
        setFilters={setFilters}
        brands={brands}
        suppliers={suppliers}
      />
    </div>
    </>
  );
};
