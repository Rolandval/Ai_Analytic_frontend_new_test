import { useState, useEffect, useRef } from 'react';
import { X, GripVertical } from 'lucide-react';
import { InverterPriceListRequestSchema } from '@/types/inverters';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { getInverterCities } from '@/services/cities.api';
import { MultiSelectPopover } from './ui/MultiSelectPopover';
import { useUsdRate } from '@/hooks/useUsdRate';
import { Badge } from '@/components/ui/Badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
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
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const inverterTypes = ['on_grid', 'off_grid', 'hybrid', 'grid-tie'];
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
        className="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing"
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
  brands: string[];
  suppliers: string[];
  cities: string[];
}

const InverterQuickFilters: React.FC<QuickFiltersProps> = ({ local, setLocal, brands, suppliers, cities }) => {
  return (
    <div className="flex flex-wrap gap-4 pt-4 mt-4 border-t border-slate-200 items-end max-w-7xl">
      {/* Бренди */}
      <div className="flex-1 min-w-[200px]">
        <MultiSelectPopover
          placeholder="Бренди"
          options={brands}
          values={local.brands}
          onChange={(vals) => setLocal({ ...local, brands: vals })}
          showSelectAll
          selectAllLabel="Вибрати всі бренди"
          clearLabel="Скинути"
          className="h-10"
        />
      </div>

      {/* Потужність */}
      <div className="flex-1 min-w-[200px]">
        <div className="flex flex-col gap-1 h-full justify-end">
          <span className="text-[12px] font-medium text-slate-600">Потужність, кВт</span>
          <div className="flex gap-1 items-center">
            <Input
              type="number"
              placeholder="від"
              value={local.power_min ?? ''}
              onChange={(e) => setLocal({ ...local, power_min: e.target.value ? Number(e.target.value) : undefined })}
              className="h-10 text-sm border-gray-300"
            />
            <span className="text-xs text-slate-400">-</span>
            <Input
              type="number"
              placeholder="до"
              value={local.power_max ?? ''}
              onChange={(e) => setLocal({ ...local, power_max: e.target.value ? Number(e.target.value) : undefined })}
              className="h-10 text-sm border-gray-300"
            />
          </div>
        </div>
      </div>

      {/* Міста */}
      <div className="flex-1 min-w-[200px]">
        <MultiSelectPopover
          placeholder="Міста"
          options={cities}
          values={local.cities}
          onChange={(vals) => setLocal({ ...local, cities: vals })}
          className="h-10"
        />
      </div>

      {/* Постачальники */}
      <div className="flex-1 min-w-[200px]">
        <MultiSelectPopover
          placeholder="Постачальники"
          options={suppliers}
          values={local.suppliers}
          onChange={(vals) => setLocal({ ...local, suppliers: vals })}
          showSelectAll
          selectAllLabel="Вибрати всіх постачальників"
          clearLabel="Скинути"
          className="h-10"
        />
      </div>

      {/* Ціна */}
      <div className="flex-1 min-w-[200px]">
        <div className="flex flex-col gap-1 h-full justify-end">
          <span className="text-[12px] font-medium text-slate-600">Ціна, $</span>
          <div className="flex gap-1 items-center">
            <Input
              type="number"
              placeholder="від"
              value={local.price_min ?? ''}
              onChange={(e) => setLocal({ ...local, price_min: e.target.value ? Number(e.target.value) : undefined })}
              className="h-10 text-sm border-gray-300"
            />
            <span className="text-xs text-slate-400">-</span>
            <Input
              type="number"
              placeholder="до"
              value={local.price_max ?? ''}
              onChange={(e) => setLocal({ ...local, price_max: e.target.value ? Number(e.target.value) : undefined })}
              className="h-10 text-sm border-gray-300"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

interface TopSearchProps {
  current: InverterPriceListRequestSchema;
  setFilters: (f: InverterPriceListRequestSchema) => void;
  onReset: () => void;
}

// Компонент для верхньої секції з пошуком та активними фільтрами
export const InverterTopSearch: React.FC<TopSearchProps> = ({ current, setFilters, onReset }) => {
  const [, setCities] = useState<string[]>([]);
  const [local, setLocal] = useState<InverterPriceListRequestSchema>({
    ...current,
    usd_rate: current.usd_rate !== undefined ? current.usd_rate : 40,
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
    console.log('🔵 [INVERTER FILTER] localFullName changed:', localFullName);
    isTypingRef.current = true;
    const timer = setTimeout(() => {
      console.log('⏰ [INVERTER FILTER] Debounce timer fired, applying filter:', localFullName);
      setLocal(p => ({ ...p, full_name: localFullName || undefined }));
      // Keep isTypingRef true for a bit longer to prevent race conditions
      setTimeout(() => {
        isTypingRef.current = false;
      }, 100);
    }, 300);
    return () => {
      console.log('🧹 [INVERTER FILTER] Cleanup: clearing timer');
      clearTimeout(timer);
    };
  }, [localFullName]);

  // [removed]: migration placed below after filterOrder is declared

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const citiesData = await getInverterCities();
        setCities(citiesData);
      } catch (error) {
        console.error('Помилка отримання списку міст інверторів:', error);
      }
    };
    fetchCities();
  }, []);

  // total active badges counter for unified "Показати всі"
  const totalActiveBadges = (
    (local.brands?.length || 0) +
    (local.suppliers?.length || 0) +
    (local.cities?.length || 0) +
    (local.inverter_type ? 1 : 0) +
    (local.generation ? 1 : 0) +
    (local.supplier_status?.length || 0) +
    ((local.power_min !== undefined || local.power_max !== undefined) ? 1 : 0) +
    ((local.string_count_min !== undefined || local.string_count_max !== undefined) ? 1 : 0) +
    ((local.price_min !== undefined || local.price_max !== undefined) ? 1 : 0) +
    ((local.usd_rate !== undefined && local.usd_rate !== 40) ? 1 : 0) +
    ((local.markup !== undefined && local.markup !== 15) ? 1 : 0) +
    ((local.date_min !== undefined || local.date_max !== undefined) ? 1 : 0) +
    (local.firmware ? 1 : 0)
  );

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

  const statusLabels = {
    ME: 'ми',
    SUPPLIER: 'постач.',
    COMPETITOR: 'конкур.'
  };

  return (
    <div className="w-full w-auto mx-auto flex flex-col gap-4">
      {/* Top search and active filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Name search input */}
        <div className="flex-shrink-0">
          <Input
            placeholder="Назва"
            value={localFullName}
            onChange={(e) => {
              console.log('⌨️ [INVERTER FILTER] Input onChange:', e.target.value);
              setLocalFullName(e.target.value);
            }}
            className="w-64 bg-white text-slate-800 placeholder-slate-400 border border-slate-300 focus-visible:ring-2 focus-visible:ring-primary/40"
          />
        </div>

        {/* Active filters */}
        <div className="flex flex-col gap-2 w-full">
          {(() => {
            const hasAny = totalActiveBadges > 0;
            const overflow = Math.max(0, totalActiveBadges - 14);
            return (
              <>
                {hasAny && (
                  <div className="relative  max-h-[56px] overflow-hidden">
                    <div className="flex flex-wrap gap-2 items-center">
                      {/* Бейджі активних фільтрів */}
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
                      
                      {/* Тип інвертора */}
                      {local.inverter_type && (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
                          Тип: {local.inverter_type}
                          <X 
                            className="w-3 h-3 ml-1 cursor-pointer" 
                            onClick={() => setLocal(p => ({ ...p, inverter_type: undefined }))}
                          />
                        </Badge>
                      )}
                      
                      {/* Покоління */}
                      {local.generation && (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                          Покоління: {local.generation}
                          <X 
                            className="w-3 h-3 ml-1 cursor-pointer" 
                            onClick={() => setLocal(p => ({ ...p, generation: undefined }))}
                          />
                        </Badge>
                      )}
                      
                      {/* Статус постачальника */}
                      {local.supplier_status && local.supplier_status.length > 0 && (
                        local.supplier_status.map(status => (
                          <Badge key={status} variant="secondary" className="bg-indigo-100 text-indigo-800 border-indigo-200">
                            {statusLabels[status as keyof typeof statusLabels]}
                            <X 
                              className="w-3 h-3 ml-1 cursor-pointer" 
                              onClick={() => setLocal(p => ({ ...p, supplier_status: p.supplier_status?.filter(s => s !== status) }))}
                            />
                          </Badge>
                        ))
                      )}
                      
                      {/* Потужність */}
                      {(local.power_min || local.power_max) && (
                        <Badge variant="secondary" className="bg-pink-100  text-pink-800 border-pink-200">
                          Потужність: {local.power_min || '∞'}-{local.power_max || '∞'} кВт
                          <X 
                            className="w-3 h-3 ml-1 cursor-pointer" 
                            onClick={() => setLocal(p => ({ ...p, power_min: undefined, power_max: undefined }))}
                          />
                        </Badge>
                      )}
                      
                      {/* Кількість стрингів */}
                      {(local.string_count_min || local.string_count_max) && (
                        <Badge variant="secondary" className="bg-cyan-100 text-cyan-800 border-cyan-200">
                          Стринги: {local.string_count_min || '∞'}-{local.string_count_max || '∞'}
                          <X 
                            className="w-3 h-3 ml-1 cursor-pointer" 
                            onClick={() => setLocal(p => ({ ...p, string_count_min: undefined, string_count_max: undefined }))}
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
                      
                      {/* USD курс */}
                      {local.usd_rate && local.usd_rate !== 40 && (
                        <Badge variant="secondary" className="bg-slate-100 text-slate-800 border-slate-200">
                          USD: {local.usd_rate}
                          <X 
                            className="w-3 h-3 ml-1 cursor-pointer" 
                            onClick={() => setLocal(p => ({ ...p, usd_rate: 40 }))}
                          />
                        </Badge>
                      )}
                      
                      {/* Націнка */}
                      {local.markup && local.markup !== 15 && (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
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
                      
                      {/* Firmware */}
                      {local.firmware && (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200">
                          Firmware: {local.firmware}
                          <X 
                            className="w-3 h-3 ml-1 cursor-pointer" 
                            onClick={() => setLocal(p => ({ ...p, firmware: undefined }))}
                          />
                        </Badge>
                      )}
                    </div>
                    {overflow > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 h-7 bg-gradient-to-t from-white to-white/0 pointer-events-none" />
                    )}
                  </div>
                )}

                {(hasAny || overflow > 0) && (
                  <div className="flex items-center gap-2">
                    {overflow > 0 && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="xs" className="h-6 px-2 text-xs">
                            {`Показати всі (+${overflow})`}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[28rem] max-h-96 overflow-auto">
                          <div className="flex flex-wrap gap-2">
                            {(local.brands || []).map((brand) => (
                              <Badge key={`brand-${brand}`} variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                                {brand}
                                <X
                                  className="w-3 h-3 ml-1 cursor-pointer"
                                  onClick={() => setLocal((p) => ({ ...p, brands: p.brands?.filter((b) => b !== brand) }))}
                                />
                              </Badge>
                            ))}
                            {(local.suppliers || []).map((supplier) => (
                              <Badge key={`supplier-${supplier}`} variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                                {supplier}
                                <X
                                  className="w-3 h-3 ml-1 cursor-pointer"
                                  onClick={() => setLocal((p) => ({ ...p, suppliers: p.suppliers?.filter((s) => s !== supplier) }))}
                                />
                              </Badge>
                            ))}
                            {(local.cities || []).map((city) => (
                              <Badge key={`city-${city}`} variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
                                {city}
                                <X
                                  className="w-3 h-3 ml-1 cursor-pointer"
                                  onClick={() => setLocal((p) => ({ ...p, cities: p.cities?.filter((c) => c !== city) }))}
                                />
                              </Badge>
                            ))}
                            {local.inverter_type && (
                              <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
                                Тип: {local.inverter_type}
                                <X
                                  className="w-3 h-3 ml-1 cursor-pointer"
                                  onClick={() => setLocal((p) => ({ ...p, inverter_type: undefined }))}
                                />
                              </Badge>
                            )}
                            {local.generation && (
                              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                Покоління: {local.generation}
                                <X
                                  className="w-3 h-3 ml-1 cursor-pointer"
                                  onClick={() => setLocal((p) => ({ ...p, generation: undefined }))}
                                />
                              </Badge>
                            )}
                            {(local.supplier_status || []).map((s) => (
                              <Badge key={`supplier_status-${s}`} variant="secondary" className="bg-indigo-100 text-indigo-800 border-indigo-200">
                                {statusLabels[s as keyof typeof statusLabels] || s}
                                <X
                                  className="w-3 h-3 ml-1 cursor-pointer"
                                  onClick={() => setLocal((p) => ({ ...p, supplier_status: p.supplier_status?.filter((ss) => ss !== s) }))}
                                />
                              </Badge>
                            ))}
                            {(local.power_min !== undefined || local.power_max !== undefined) && (
                              <Badge variant="secondary" className="bg-pink-100 text-pink-800 border-pink-200">
                                Потужність: {local.power_min || '∞'}-{local.power_max || '∞'} кВт
                                <X
                                  className="w-3 h-3 ml-1 cursor-pointer"
                                  onClick={() => setLocal(p => ({ ...p, power_min: undefined, power_max: undefined }))}
                                />
                              </Badge>
                            )}
                            {(local.string_count_min !== undefined || local.string_count_max !== undefined) && (
                              <Badge variant="secondary" className="bg-cyan-100 text-cyan-800 border-cyan-200">
                                Стринги: {local.string_count_min || '∞'}-{local.string_count_max || '∞'}
                                <X
                                  className="w-3 h-3 ml-1 cursor-pointer"
                                  onClick={() => setLocal(p => ({ ...p, string_count_min: undefined, string_count_max: undefined }))}
                                />
                              </Badge>
                            )}
                              
                            {(local.price_min !== undefined || local.price_max !== undefined) && (
                              <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">
                                Ціна: {local.price_min || '∞'}-{local.price_max || '∞'} $
                                <X
                                  className="w-3 h-3 ml-1 cursor-pointer"
                                  onClick={() => setLocal(p => ({ ...p, price_min: undefined, price_max: undefined }))}
                                />
                              </Badge>
                            )}
                            {(local.usd_rate !== undefined && local.usd_rate !== 40) && (
                              <Badge variant="secondary" className="bg-slate-100 text-slate-800 border-slate-200">
                                USD: {local.usd_rate}
                                <X
                                  className="w-3 h-3 ml-1 cursor-pointer"
                                  onClick={() => setLocal(p => ({ ...p, usd_rate: 40 }))}
                                />
                              </Badge>
                            )}
                            {(local.markup !== undefined && local.markup !== 15) && (
                              <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
                                Націнка: {local.markup}%
                                <X
                                  className="w-3 h-3 ml-1 cursor-pointer"
                                  onClick={() => setLocal(p => ({ ...p, markup: 15 }))}
                                />
                              </Badge>
                            )}
                            {(local.date_min !== undefined || local.date_max !== undefined) && (
                              <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-200">
                                Дата: {local.date_min || '∞'} - {local.date_max || '∞'}
                                <X
                                  className="w-3 h-3 ml-1 cursor-pointer"
                                  onClick={() => setLocal(p => ({ ...p, date_min: undefined, date_max: undefined }))}
                                />
                              </Badge>
                            )}
                            {local.firmware && (
                              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200">
                                Firmware: {local.firmware}
                                <X
                                  className="w-3 h-3 ml-1 cursor-pointer"
                                  onClick={() => setLocal(p => ({ ...p, firmware: undefined }))}
                                />
                              </Badge>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}

                    <Button 
                      variant="outline" 
                      size="xs" 
                      onClick={onReset}
                      className="h-6 px-2 text-xs text-slate-600 hover:text-slate-800"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Скинути все
                    </Button>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
;

// Extend props to optionally accept actions from parent page (PriceHistoryPage)
interface PropsWithActions extends Props {
  actionsButtonGroup?: React.ReactNode;
}

export const InverterFilters: React.FC<PropsWithActions> = ({ current, setFilters, brands, suppliers, actionsButtonGroup }) => {
  const [cities, setCities] = useState<string[]>([]);
  const [local, setLocal] = useState<InverterPriceListRequestSchema>({
    ...current,
    markup: current.markup !== undefined ? current.markup : 15,
  });
  const { rate } = useUsdRate();
  
  // Drag and drop state
  const defaultFilterOrder = [
    'actions',
    'firmware',
    'string_count',
    'inverter_type',
    'generation',
    'supplier_status',
    'date_range',
    'usd_markup'
  ];
  
  const [filterOrder, setFilterOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('inverter-filters-order');
    let base: string[] = saved ? JSON.parse(saved) : defaultFilterOrder;
    // Ensure new tiles like 'actions' are present even with legacy saved orders
    if (!base.includes('actions')) base = ['actions', ...base];
    // Only keep valid filters that exist in defaultFilterOrder
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
      localStorage.setItem('inverter-filters-order', JSON.stringify(newOrder));
    }
  };
  
  useEffect(() => {
    setLocal(current);
  }, [current]);
  
  // Отримуємо список міст при першому рендері компоненту
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const citiesData = await getInverterCities();
        setCities(citiesData);
      } catch (error) {
        console.error('Помилка отримання списку міст інверторів:', error);
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

  // removed unused reset helper

  // Filter components mapping
  const filterComponents: Record<string, React.ReactNode> = {
    actions: (
      <div className="flex flex-col gap-1 h-[60px]">
        <label className="text-[12px] font-medium text-slate-600">Дії</label>
        <div className="flex items-end gap-1 h-[60px]">
          {actionsButtonGroup ?? (
            <>
              <Button
                variant="outline"
                size="xs"
                className="h-8 px-2 text-xs"
                onClick={() => {
                  setFilters({ ...local });
                }}
                title="Оновити дані"
                aria-label="Оновити дані"
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
                      if (Array.isArray(v)) { if (v.length > 0) n[k] = v.slice(); }
                      else if (v !== undefined) { n[k] = v; }
                    });
                    return n;
                  };
                  const payload = normalize({ ...local });
                  const text = JSON.stringify(payload, null, 2);
                  navigator.clipboard.writeText(text).catch(() => {});
                }}
                title="Копіювати налаштування"
                aria-label="Копіювати налаштування"
              >
                Копіювати
              </Button>
            </>
          )}
        </div>
      </div>
    ),
    firmware: (
      <div className="h-[60px]  flex flex-col justify-end">
        <Input
          placeholder="Firmware"
          value={local.firmware ?? ''}
          onChange={(e) => setLocal((p) => ({ ...p, firmware: e.target.value || undefined }))}
          className="h-10 bg-white text-slate-800 placeholder-slate-400 border border-slate-300 focus-visible:ring-2 focus-visible:ring-primary/40"
        />
      </div>
    ),
    string_count: (
      <div className="h-[60px] flex flex-col gap-1">
        <span className="text-[12px] font-medium text-slate-600">Кількість стрингів</span>
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
    inverter_type: (
      <div className="h-[60px] flex flex-col gap-1 p-1 justify-end">
        <span className="text-[12px] font-medium text-slate-600">Тип</span>
        <div className="flex flex-nowrap gap-2 text-[14px] leading-tight overflow-hidden h-[60px] items-end">
          {inverterTypes.map((t) => (
            <label key={t} className="inline-flex items-center gap-1 cursor-pointer text-slate-700">
              <input
                type="radio"
                name="inverter-type"
                checked={local.inverter_type === t}
                onChange={() => setLocal((p) => ({ ...p, inverter_type: t }))}
                className="peer accent-primary"
              />
              <span className="truncate max-w-[80px]" title={t}>
                {t === 'on_grid' ? 'on-grid' : t === 'off_grid' ? 'off-grid' : t === 'grid-tie' ? 'grid-tie' : t}
              </span>
            </label>
          ))}
          <label className="inline-flex items-center gap-1 cursor-pointer text-slate-700">
            <input
              type="radio"
              name="inverter-type"
              checked={local.inverter_type === undefined}
              onChange={() => setLocal((p) => ({ ...p, inverter_type: undefined }))}
              className="peer accent-primary"
            />
            <span>всі</span>
          </label>
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
                name="generation"
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
              name="generation"
              checked={local.generation === undefined}
              onChange={() => setLocal((p) => ({ ...p, generation: undefined }))}
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
              <span className="truncate max-w-[80px]" title={statusLabels[s] || s}>
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
    <div className="w-full   w-auto mx-auto flex flex-col gap-4">

      {/* Filter Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={filterOrder} strategy={verticalListSortingStrategy}>
          <div className="grid gap-8" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {filterOrder.map((filterId) => (
              <DraggableFilterItem key={filterId} id={filterId}>
                {filterComponents[filterId]}
              </DraggableFilterItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Quick Filters Below the Line */}
      <InverterQuickFilters
        local={local}
        setLocal={setLocal}
        brands={brands}
        suppliers={suppliers}
        cities={cities}
      />
    </div>
    </>
  );
};
