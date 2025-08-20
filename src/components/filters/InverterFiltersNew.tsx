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
import { GripVertical, X } from 'lucide-react';
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

const inverterTypes = ['ON_GRID', 'OFF_GRID', 'HYBRID'];
const generations = ['1G', '2G', '3G'];
const supplierStatuses = ['ME', 'SUPPLIER', 'COMPETITOR'];

interface Props {
  current: InverterPriceListRequestSchema;
  setFilters: (f: InverterPriceListRequestSchema) => void;
  brands: string[];
  suppliers: string[];
  cities: string[];
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

export const InverterFilters: React.FC<Props> = ({ current, setFilters, brands, suppliers, cities }) => {
  const [local, setLocal] = useState<InverterPriceListRequestSchema>(current);
  
  // Drag and drop state
  const defaultFilterOrder = [
    'full_name',
    'firmware',
    'brands',
    'suppliers',
    'cities',
    'supplier_status',
    'power',
    'string_count',
    'price',
    'inverter_type',
    'generation',
    'date_range',
    'price_sort'
  ];
  
  const [filterOrder, setFilterOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('inverter-filters-new-order');
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
      localStorage.setItem('inverter-filters-new-order', JSON.stringify(newOrder));
    }
  };
  
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
      const payload = { ...local, page: 1 } as InverterPriceListRequestSchema;
      const signature = JSON.stringify(normalize(payload));
      if (signature !== lastAppliedRef.current) {
        lastAppliedRef.current = signature;
        setFilters(payload);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [local, setFilters]);

  const reset = () => {
    const base = { page: 1, page_size: current.page_size ?? 10 } as InverterPriceListRequestSchema;
    setLocal(base);
    setFilters(base);
  };

  return (
    <div className="w-full max-w-[1280px] mx-auto flex flex-col gap-4">
      {/* Active filters chips */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Brands */}
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
        
        {/* Suppliers */}
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
        
        {/* Cities */}
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
        
        {/* Supplier Status */}
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
        
        {/* Power */}
        {(local.power_min || local.power_max) && (
          <Badge variant="secondary" className="bg-pink-100 text-pink-800 border-pink-200">
            Потужність: {local.power_min || '∞'}-{local.power_max || '∞'} Вт
            <X 
              className="w-3 h-3 ml-1 cursor-pointer" 
              onClick={() => setLocal(p => ({ ...p, power_min: undefined, power_max: undefined }))}
            />
          </Badge>
        )}
        
        {/* String Count */}
        {(local.string_count_min || local.string_count_max) && (
          <Badge variant="secondary" className="bg-cyan-100 text-cyan-800 border-cyan-200">
            Стринги: {local.string_count_min || '∞'}-{local.string_count_max || '∞'}
            <X 
              className="w-3 h-3 ml-1 cursor-pointer" 
              onClick={() => setLocal(p => ({ ...p, string_count_min: undefined, string_count_max: undefined }))}
            />
          </Badge>
        )}
        
        {/* Price */}
        {(local.price_min || local.price_max) && (
          <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">
            Ціна: {local.price_min || '∞'}-{local.price_max || '∞'} $
            <X 
              className="w-3 h-3 ml-1 cursor-pointer" 
              onClick={() => setLocal(p => ({ ...p, price_min: undefined, price_max: undefined }))}
            />
          </Badge>
        )}
        
        {/* Inverter Type */}
        {local.inverter_type && (
          <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
            Тип: {local.inverter_type}
            <X 
              className="w-3 h-3 ml-1 cursor-pointer" 
              onClick={() => setLocal(p => ({ ...p, inverter_type: undefined }))}
            />
          </Badge>
        )}
        
        {/* Generation */}
        {local.generation && (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Покоління: {local.generation}
            <X 
              className="w-3 h-3 ml-1 cursor-pointer" 
              onClick={() => setLocal(p => ({ ...p, generation: undefined }))}
            />
          </Badge>
        )}
        
        {/* Date Range */}
        {(local.date_min || local.date_max) && (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-200">
            Дата: {local.date_min || '∞'} - {local.date_max || '∞'}
            <X 
              className="w-3 h-3 ml-1 cursor-pointer" 
              onClick={() => setLocal(p => ({ ...p, date_min: undefined, date_max: undefined }))}
            />
          </Badge>
        )}
        
        {/* Price Sort */}
        {local.price_sort && (
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200">
            Сортування: {local.price_sort === 'asc' ? '↑ ціна' : '↓ ціна'}
            <X 
              className="w-3 h-3 ml-1 cursor-pointer" 
              onClick={() => setLocal(p => ({ ...p, price_sort: undefined }))}
            />
          </Badge>
        )}
        
        {/* Reset button - show only if there are active filters */}
        {(local.brands?.length || local.suppliers?.length || local.cities?.length || local.supplier_status?.length ||
          local.power_min || local.power_max || local.string_count_min || local.string_count_max ||
          local.price_min || local.price_max || local.inverter_type || local.generation ||
          local.date_min || local.date_max || local.price_sort || local.full_name || local.firmware) && (
          <Button variant="outline" onClick={reset} size="sm">
            <X className="w-4 h-4 mr-2" />
            Скинути
          </Button>
        )}
      </div>

      {/* Filter Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={filterOrder} strategy={verticalListSortingStrategy}>
          <div className="grid gap-5 pl-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {filterOrder.map((filterId) => (
              <DraggableFilterItem key={filterId} id={filterId}>
                {filterComponents[filterId]}
              </DraggableFilterItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>

    </div>
  );
};
