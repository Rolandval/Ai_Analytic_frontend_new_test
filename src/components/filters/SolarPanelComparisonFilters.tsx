import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { refreshSolarPanelsData } from '@/services/dataRefresh.api';
import { SolarPanelPriceListRequestSchema } from '@/types/solarPanels';
import { Input } from '@/components/ui/Input';
import { MultiSelectPopover } from './ui/MultiSelectPopover';
import { getSolarPanelCities } from '@/services/cities.api';
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

const panelTypes = ['одностороння', 'двостороння'];
const cellTypes = ['p-type', 'n-type'];
const panelColors = ['Default', 'All Black'];
const frameColors = ['black', 'silver'];
const supplierStatuses = ['ME', 'SUPPLIER', 'COMPETITOR'];
const statusLabels: Record<string, string> = {
  ME: 'ми',
  SUPPLIER: 'постач.',
  COMPETITOR: 'конкур.',
};

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
        className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10"
      >
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>
      {children}
    </div>
  );
};

interface Props {
  current: SolarPanelPriceListRequestSchema;
  setFilters: (f: SolarPanelPriceListRequestSchema) => void;
  brands: string[];
  suppliers: string[];
  settingsButton?: React.ReactNode;
}

export const SolarPanelComparisonFilters: React.FC<Props> = ({ current, setFilters, brands, suppliers, settingsButton }) => {
  const [cities, setCities] = useState<string[]>([]);
  const [local, setLocal] = useState<SolarPanelPriceListRequestSchema>({
    ...current
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();
  // total active badges counter for unified "Показати всі"
  const totalActiveBadges = (
    (local.brands?.length || 0) +
    (local.suppliers?.length || 0) +
    (local.cities?.length || 0) +
    ((local.power_min !== undefined || local.power_max !== undefined) ? 1 : 0) +
    ((local.price_min !== undefined || local.price_max !== undefined) ? 1 : 0) +
    ((local.price_per_w_min !== undefined || local.price_per_w_max !== undefined) ? 1 : 0) +
    ((local.thickness_min !== undefined || local.thickness_max !== undefined) ? 1 : 0) +
    (local.panel_type ? 1 : 0) +
    (local.cell_type ? 1 : 0) +
    (local.panel_color ? 1 : 0) +
    (local.frame_color ? 1 : 0) +
    ((local.supplier_status && local.supplier_status.length > 0) ? local.supplier_status.length : 0) +
    ((local.date_min !== undefined || local.date_max !== undefined) ? 1 : 0)
  );

  // Drag and drop setup
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filter order state
  const defaultFilterOrder = [
    'actions',
    'brands', 'suppliers', 'cities', 'power', 'price', 'price_per_w', 'thickness',
    'panel_type', 'cell_type', 'panel_color', 'frame_color', 'supplier_status', 'date_range'
  ];

  const [filterOrder, setFilterOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('solarPanelComparisonFiltersOrder');
    return saved ? JSON.parse(saved) : defaultFilterOrder;
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setFilterOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        localStorage.setItem('solarPanelComparisonFiltersOrder', JSON.stringify(newOrder));
        return newOrder;
      });
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
    }, 300);
    return () => clearTimeout(t);
  }, [local, setFilters]);
  
  const reset = () => {
    const base = { page: 1, page_size: current.page_size ?? 10 };
    setLocal(base);
    setFilters(base);
  };

  // Filter components mapping
  const filterComponents: Record<string, React.ReactNode> = {
    actions: (
      <div className="flex flex-col gap-1 h-[60px]">
        <label className="text-[12px] font-medium text-slate-600">Дії</label>
        <div className="flex items-end gap-1 h-[60px]">
          <Button
            variant="outline"
            size="xs"
            className="h-8 px-2 text-xs"
            onClick={async () => {
              try {
                await refreshSolarPanelsData();
                toast({ title: 'Оновлено', description: 'Дані про наявність оновлено.', duration: 2000 });
              } catch (e) {
                toast({ title: 'Помилка', description: 'Не вдалося оновити дані про наявність.', variant: 'destructive' });
              }
            }}
            title="Оновити дані про наявність"
            aria-label="Оновити дані про наявність"
          >
            Оновити
          </Button>
          <Button
            variant="outline"
            size="xs"
            className="h-8 px-2 text-xs"
            onClick={() => {
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
              const payload = normalize({ ...local });
              const text = JSON.stringify(payload, null, 2);
              navigator.clipboard.writeText(text)
                .then(() => toast({ title: 'Скопійовано', description: 'Налаштування фільтрів скопійовано в буфер обміну.', duration: 2000 }))
                .catch(() => toast({ title: 'Помилка', description: 'Не вдалося скопіювати налаштування.', variant: 'destructive' }));
            }}
            title="Копіювати налаштування"
            aria-label="Копіювати налаштування"
          >
            Копіювати
          </Button>
          {settingsButton}
        </div>
      </div>
    ),
    brands: (
      <div className="flex flex-col gap-1 h-[60px]">
        <label className="text-[12px] font-medium text-slate-600">Бренди</label>
        <div className="h-[60px] flex items-end justify-center">
          <MultiSelectPopover
            options={brands}
            values={local.brands || []}
            onChange={(values) => setLocal(p => ({ ...p, brands: values }))}
            placeholder="Вибрати бренди"
            className="w-full h-10 text-sm"
            showSelectAll={true}
            selectAllLabel="Вибрати всі бренди"
            clearLabel="Скинути"
          />
        </div>
      </div>
    ),
    suppliers: (
      <div className="flex flex-col gap-1 h-[60px]">
        <label className="text-[12px] font-medium text-slate-600">Постачальники</label>
        <div className="h-[60px] flex items-end justify-center">
          <MultiSelectPopover
            options={suppliers}
            values={local.suppliers || []}
            onChange={(values) => setLocal(p => ({ ...p, suppliers: values }))}
            placeholder="Вибрати постачальників"
            className="w-full h-10 text-sm"
            showSelectAll={true}
            selectAllLabel="Вибрати всіх постачальників"
            clearLabel="Скинути"
          />
        </div>
      </div>
    ),
    cities: (
      <div className="flex flex-col gap-1 h-[60px]">
        <label className="text-[12px] font-medium text-slate-600">Міста</label>
        <div className="h-[60px] flex items-end justify-center">
          <MultiSelectPopover
            options={cities}
            values={local.cities || []}
            onChange={(values) => setLocal(p => ({ ...p, cities: values }))}
            placeholder="Вибрати міста"
            className="w-full h-10 text-sm"
          />
        </div>
      </div>
    ),
    power: (
      <div className="flex flex-col gap-1 h-[60px]">
        <label className="text-[12px] font-medium text-slate-600">Потужність, Вт</label>
        <div className="flex items-end gap-1 h-[60px]">
          <Input
            type="number"
            placeholder="від"
            value={local.power_min || ''}
            onChange={(e) => setLocal(p => ({ ...p, power_min: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-10 text-sm border-gray-300"
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="number"
            placeholder="до"
            value={local.power_max || ''}
            onChange={(e) => setLocal(p => ({ ...p, power_max: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-10 text-sm border-gray-300"
          />
        </div>
      </div>
    ),
    price: (
      <div className="flex flex-col gap-1 h-[60px]">
        <label className="text-[12px] font-medium text-slate-600">Ціна, $</label>
        <div className="flex items-end gap-1 h-[60px]">
          <Input
            type="number"
            placeholder="від"
            value={local.price_min || ''}
            onChange={(e) => setLocal(p => ({ ...p, price_min: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-10 text-sm border-gray-300"
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="number"
            placeholder="до"
            value={local.price_max || ''}
            onChange={(e) => setLocal(p => ({ ...p, price_max: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-10 text-sm border-gray-300"
          />
        </div>
      </div>
    ),
    price_per_w: (
      <div className="flex flex-col gap-1 h-[60px]">
        <label className="text-[12px] font-medium text-slate-600">Ціна за Вт, $</label>
        <div className="flex items-end gap-1 h-[60px]">
          <Input
            type="number"
            placeholder="від"
            value={local.price_per_w_min || ''}
            onChange={(e) => setLocal(p => ({ ...p, price_per_w_min: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-10 text-sm border-gray-300"
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="number"
            placeholder="до"
            value={local.price_per_w_max || ''}
            onChange={(e) => setLocal(p => ({ ...p, price_per_w_max: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-10 text-sm border-gray-300"
          />
        </div>
      </div>
    ),
    thickness: (
      <div className="flex flex-col gap-1 h-[60px]">
        <label className="text-[12px] font-medium text-slate-600">Товщина, мм</label>
        <div className="flex items-end gap-1 h-[60px]">
          <Input
            type="number"
            placeholder="від"
            value={local.thickness_min || ''}
            onChange={(e) => setLocal(p => ({ ...p, thickness_min: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-10 text-sm border-gray-300"
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="number"
            placeholder="до"
            value={local.thickness_max || ''}
            onChange={(e) => setLocal(p => ({ ...p, thickness_max: e.target.value ? Number(e.target.value) : undefined }))}
            className="h-10 text-sm border-gray-300"
          />
        </div>
      </div>
    ),
    panel_type: (
      <div className="flex flex-col gap-1 h-[60px]">
        <label className="text-[12px] font-medium text-slate-600">Тип панелі</label>
        <div className="flex flex-nowrap gap-2 text-[14px] leading-tight overflow-hidden h-[60px] items-end">
          {panelTypes.map((type) => (
            <label key={type} className="inline-flex items-center gap-1 cursor-pointer text-slate-700 whitespace-nowrap">
              <input
                type="radio"
                name="panel_type"
                checked={local.panel_type === type}
                onChange={() => setLocal(p => ({ ...p, panel_type: type }))}
                className="peer accent-primary"
              />
              <span className="truncate max-w-[80px]" title={type}>{type}</span>
            </label>
          ))}
          <label className="inline-flex items-center gap-1 cursor-pointer text-slate-700 whitespace-nowrap">
            <input
              type="radio"
              name="panel_type"
              checked={!local.panel_type}
              onChange={() => setLocal(p => ({ ...p, panel_type: undefined }))}
              className="peer accent-primary"
            />
            <span className="max-w-[80px] truncate">всі</span>
          </label>
        </div>
      </div>
    ),
    cell_type: (
      <div className="flex flex-col gap-1 h-[60px]">
        <label className="text-[12px] font-medium text-slate-600">Тип комірки</label>
        <div className="flex flex-nowrap gap-2 text-[14px] leading-tight overflow-hidden h-[60px] items-end">
          {cellTypes.map((type) => (
            <label key={type} className="inline-flex items-center gap-1 cursor-pointer text-slate-700 whitespace-nowrap">
              <input
                type="radio"
                name="cell_type"
                checked={local.cell_type === type}
                onChange={() => setLocal(p => ({ ...p, cell_type: type }))}
                className="peer accent-primary"
              />
              <span className="truncate max-w-[80px]" title={type}>{type}</span>
            </label>
          ))}
          <label className="inline-flex items-center gap-1 cursor-pointer text-slate-700 whitespace-nowrap">
            <input
              type="radio"
              name="cell_type"
              checked={!local.cell_type}
              onChange={() => setLocal(p => ({ ...p, cell_type: undefined }))}
              className="peer accent-primary"
            />
            <span className="max-w-[80px] truncate">всі</span>
          </label>
        </div>
      </div>
    ),
    panel_color: (
      <div className="flex flex-col gap-1 h-[60px]">
        <label className="text-[12px] font-medium text-slate-600">Колір панелі</label>
        <div className="flex flex-nowrap gap-2 text-[14px] leading-tight overflow-hidden h-[60px] items-end">
          {panelColors.map((color) => (
            <label key={color} className="inline-flex items-center gap-1 cursor-pointer text-slate-700 whitespace-nowrap">
              <input
                type="radio"
                name="panel_color"
                checked={local.panel_color === color}
                onChange={() => setLocal(p => ({ ...p, panel_color: color }))}
                className="peer accent-primary"
              />
              <span className="truncate max-w-[80px]" title={color}>{color}</span>
            </label>
          ))}
          <label className="inline-flex items-center gap-1 cursor-pointer text-slate-700 whitespace-nowrap">
            <input
              type="radio"
              name="panel_color"
              checked={!local.panel_color}
              onChange={() => setLocal(p => ({ ...p, panel_color: undefined }))}
              className="peer accent-primary"
            />
            <span className="max-w-[80px] truncate">всі</span>
          </label>
        </div>
      </div>
    ),
    frame_color: (
      <div className="flex flex-col gap-1 h-[60px]">
        <label className="text-[12px] font-medium text-slate-600">Колір рами</label>
        <div className="flex flex-nowrap gap-2 text-[14px] leading-tight overflow-hidden h-[60px] items-end">
          {frameColors.map((color) => (
            <label key={color} className="inline-flex items-center gap-1 cursor-pointer text-slate-700 whitespace-nowrap">
              <input
                type="radio"
                name="frame_color"
                checked={local.frame_color === color}
                onChange={() => setLocal(p => ({ ...p, frame_color: color }))}
                className="peer accent-primary"
              />
              <span className="truncate max-w-[80px]" title={color}>{color}</span>
            </label>
          ))}
          <label className="inline-flex items-center gap-1 cursor-pointer text-slate-700 whitespace-nowrap">
            <input
              type="radio"
              name="frame_color"
              checked={!local.frame_color}
              onChange={() => setLocal(p => ({ ...p, frame_color: undefined }))}
              className="peer accent-primary"
            />
            <span className="max-w-[80px] truncate">всі</span>
          </label>
        </div>
      </div>
    ),
    supplier_status: (
      <div className="flex flex-col gap-1 h-[60px]">
        <label className="text-[12px] font-medium text-slate-600">Статус постач.</label>
        <div className="flex flex-nowrap gap-1 text-[14px] leading-tight overflow-hidden h-[60px] items-end">
          {supplierStatuses.map((status) => (
            <label key={status} className="inline-flex items-center gap-1 cursor-pointer text-slate-700 whitespace-nowrap">
              <input
                type="radio"
                name="supplier_status"
                checked={local.supplier_status?.includes(status)}
                onChange={() => setLocal(p => ({ ...p, supplier_status: [status] }))}
                className="peer accent-primary"
              />
              <span className="whitespace-nowrap" title={statusLabels[status]}>{statusLabels[status]}</span>
            </label>
          ))}
          <label className="inline-flex items-center gap-1 cursor-pointer text-slate-700 whitespace-nowrap">
            <input
              type="radio"
              name="supplier_status"
              checked={!local.supplier_status || local.supplier_status.length === 0}
              onChange={() => setLocal(p => ({ ...p, supplier_status: undefined }))}
              className="peer accent-primary"
            />
            <span className="whitespace-nowrap">всі</span>
          </label>
        </div>
      </div>
    ),
    date_range: (
      <div className="flex flex-col gap-1 h-[60px]  align-end">
        <label className="text-[12px] font-medium text-slate-600">Період</label>
        <div className="h-[60px] flex items-end justify-center">
          <DateRangePicker
            startDate={local.date_min}
            endDate={local.date_max}
            onChange={(start, end) => {
              setLocal(p => ({
                ...p,
                date_min: start,
                date_max: end
              }));
            }}
            className="w-full text-sm"
          />
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
          
          {/* Потужність */}
          {(local.power_min || local.power_max) && (
            <Badge variant="secondary" className="bg-pink-100 text-pink-800 border-pink-200">
              Потужність: {local.power_min || '∞'}-{local.power_max || '∞'} Вт
              <X 
                className="w-3 h-3 ml-1 cursor-pointer" 
                onClick={() => setLocal(p => ({ ...p, power_min: undefined, power_max: undefined }))}
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
          
          {/* Ціна за Вт */}
          {(local.price_per_w_min || local.price_per_w_max) && (
            <Badge variant="secondary" className="bg-cyan-100 text-cyan-800 border-cyan-200">
              Ціна/Вт: {local.price_per_w_min || '∞'}-{local.price_per_w_max || '∞'} $/Вт
              <X 
                className="w-3 h-3 ml-1 cursor-pointer" 
                onClick={() => setLocal(p => ({ ...p, price_per_w_min: undefined, price_per_w_max: undefined }))}
              />
            </Badge>
          )}
          
          {/* Товщина */}
          {(local.thickness_min || local.thickness_max) && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
              Товщина: {local.thickness_min || '∞'}-{local.thickness_max || '∞'} мм
              <X 
                className="w-3 h-3 ml-1 cursor-pointer" 
                onClick={() => setLocal(p => ({ ...p, thickness_min: undefined, thickness_max: undefined }))}
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
                      {(local.cities || []).map((c) => (
                        <Badge key={`city-${c}`} variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
                          {c}
                          <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocal(p => ({ ...p, cities: p.cities?.filter(x => x !== c) }))} />
                        </Badge>
                      ))}
                      {(local.power_min !== undefined || local.power_max !== undefined) && (
                        <Badge variant="secondary" className="bg-pink-100 text-pink-800 border-pink-200">
                          Потужність: {local.power_min || '∞'}-{local.power_max || '∞'} Вт
                          <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocal(p => ({ ...p, power_min: undefined, power_max: undefined }))} />
                        </Badge>
                      )}
                      {(local.price_min !== undefined || local.price_max !== undefined) && (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200">
                          Ціна: {local.price_min || '∞'}-{local.price_max || '∞'} $
                          <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocal(p => ({ ...p, price_min: undefined, price_max: undefined }))} />
                        </Badge>
                      )}
                      {(local.price_per_w_min !== undefined || local.price_per_w_max !== undefined) && (
                        <Badge variant="secondary" className="bg-cyan-100 text-cyan-800 border-cyan-200">
                          Ціна/Вт: {local.price_per_w_min || '∞'}-{local.price_per_w_max || '∞'} $/Вт
                          <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocal(p => ({ ...p, price_per_w_min: undefined, price_per_w_max: undefined }))} />
                        </Badge>
                      )}
                      {(local.thickness_min !== undefined || local.thickness_max !== undefined) && (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
                          Товщина: {local.thickness_min || '∞'}-{local.thickness_max || '∞'} мм
                          <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocal(p => ({ ...p, thickness_min: undefined, thickness_max: undefined }))} />
                        </Badge>
                      )}
                      {local.panel_type && (
                        <Badge variant="secondary" className="bg-slate-100 text-slate-800 border-slate-200">
                          Тип панелі: {local.panel_type}
                          <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocal(p => ({ ...p, panel_type: undefined }))} />
                        </Badge>
                      )}
                      {local.cell_type && (
                        <Badge variant="secondary" className="bg-slate-100 text-slate-800 border-slate-200">
                          Тип комірки: {local.cell_type}
                          <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocal(p => ({ ...p, cell_type: undefined }))} />
                        </Badge>
                      )}
                      {local.panel_color && (
                        <Badge variant="secondary" className="bg-slate-100 text-slate-800 border-slate-200">
                          Колір панелі: {local.panel_color}
                          <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocal(p => ({ ...p, panel_color: undefined }))} />
                        </Badge>
                      )}
                      {local.frame_color && (
                        <Badge variant="secondary" className="bg-slate-100 text-slate-800 border-slate-200">
                          Колір рами: {local.frame_color}
                          <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocal(p => ({ ...p, frame_color: undefined }))} />
                        </Badge>
                      )}
                      {(local.supplier_status && local.supplier_status.length > 0 ? local.supplier_status : []).map((s) => (
                        <Badge key={`status-${s}`} variant="secondary" className="bg-indigo-100 text-indigo-800 border-indigo-200">
                          Статус постач.: {s === 'ME' ? 'ми' : s === 'SUPPLIER' ? 'постач.' : 'конкур.'}
                          <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocal(p => ({ ...p, supplier_status: undefined }))} />
                        </Badge>
                      ))}
                      {(local.date_min || local.date_max) && (
                        <Badge variant="secondary" className="bg-slate-100 text-slate-800 border-slate-200">
                          Період : {local.date_min || '—'} — {local.date_max || '—'}
                          <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocal(p => ({ ...p, date_min: undefined, date_max: undefined }))} />
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

      {/* Mobile filter toggle */}
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

      {/* Filter inputs with drag and drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={filterOrder} strategy={verticalListSortingStrategy}>
          <div className={cn(
            "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pl-6",
            isExpanded ? "grid" : "hidden md:grid"
          )}>
            {filterOrder.map((filterId) => (
              <DraggableFilterItem key={filterId} id={filterId}>
                {filterComponents[filterId]}
              </DraggableFilterItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Actions */}
      <div className={cn(
        "flex gap-2 sm:gap-3 py-2 bg-background/60 backdrop-blur-lg rounded-b-2xl border-t border-border z-10 mt-4",
        isExpanded ? "flex" : "hidden md:flex"
      )}>
        
      </div>
    </div>
  );
};
