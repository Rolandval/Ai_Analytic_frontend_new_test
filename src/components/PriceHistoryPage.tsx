import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Settings, Copy, Check, ArrowUp, ArrowDown, ArrowUpDown, Phone, Edit3, Trash2, LineChart } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { Checkbox } from '@/components/ui/Checkbox';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { useToast } from '@/hooks/use-toast';
import { RefreshDataButton } from '@/components/ui/RefreshDataButton';

// Minimal column definition for a generic table
export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  headerTitle?: string; // Текст підказки (title) для заголовка, якщо відрізняється від header
  render?: (row: T) => React.ReactNode;
  sortable?: boolean; // Вказує, чи можна сортувати за цією колонкою
  sortKey?: string; // Ключ для сортування, якщо відрізняється від key
}

export interface PricesHookReturn<T, CreatePayload, UpdatePayload> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  setPage: (p: number) => void;
  setPageSize?: (size: number) => void;
  filters: Record<string, unknown>;
  setFilters: (f: Record<string, unknown>) => void;
  createPrice: (payload: CreatePayload) => Promise<void>;
  updatePrice: (id: number, payload: UpdatePayload) => Promise<void>;
  deletePrice: (id: number) => Promise<void>;
  brands: string[];
  suppliers: string[];
}

interface SupplierOption {
  id: number;
  name: string;
}

interface ChartConfig {
  // backend call that returns base64 string
  getChart: (productId: number, supplierIds: number[]) => Promise<string>;
  suppliers: SupplierOption[];
}

interface PriceHistoryPageProps<T, CreatePayload = any, UpdatePayload = any> {
  title: string;
  currencySymbol: string; // "₴" | "$"
  columns: TableColumn<T>[];
  hook: PricesHookReturn<T, CreatePayload, UpdatePayload>;
  filterComponent?: React.ReactNode;
  createFormComponent?: React.ReactNode;
  chartConfig?: ChartConfig; // optional chart support
  topSearchComponent?: React.ReactNode; // новий компонент для пошуку зверху
  compact?: boolean; // щільний режим відображення без горизонтального скролу
  onRefresh?: () => Promise<any>; // опційне оновлення даних
  showCreateButton?: boolean; // показувати кнопку "Додати" у верхньому тулбарі
}

export function PriceHistoryPage<T, CreatePayload = any, UpdatePayload = any>(
  props: PriceHistoryPageProps<T, CreatePayload, UpdatePayload>
) {
  const { title, currencySymbol, columns, hook, filterComponent, createFormComponent, chartConfig } = props;
  const { rows, total, page, pageSize, setPage, setPageSize, loading } = hook;
  const compact = Boolean((props as any).compact);

  // Логування для дебагу таблиці (тільки при розробці)
  if (process.env.NODE_ENV === 'development') {
    console.log('📋 PriceHistoryPage render:', {
      title,
      rowsCount: rows?.length ?? 0,
      total,
      page,
      pageSize,
      loading,
      hasRows: Array.isArray(rows),
      firstRow: rows?.[0] || null
    });
  }
  
  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState<{ id: number; price: number } | null>(null);
  const [copying, setCopying] = useState(false);
  const { toast } = useToast();
  
  // Стан для керування видимістю колонок та кнопок
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({}); // Заповниться пізніше у useEffect
  const [buttonsVisibility, setButtonsVisibility] = useState({
    contact: true,
    edit: true,
    delete: true,
    chart: true
  });

  // Page-specific storage keys (so each page remembers its own settings)
  const columnVisibilityKey = React.useMemo(() => `columnVisibility:${title}`, [title]);
  const buttonsVisibilityKey = React.useMemo(() => `buttonsVisibility:${title}`, [title]);
  const pageSizeKey = React.useMemo(() => `pageSize:${title}`, [title]);

  // Стан для сортування з збереженням в localStorage
  const sortConfigKey = React.useMemo(() => `sortConfig:${title}`, [title]);
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' | null }>(() => {
    try {
      const stored = localStorage.getItem(sortConfigKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load sort config', e);
    }
    return { key: null, direction: null };
  });
  
  // Стан для графіку
  const [chartOpen, setChartOpen] = useState(false);
  const [chartRowId, setChartRowId] = useState<number | null>(null);
  const [chartSrc, setChartSrc] = useState<string>('');
  const [chartLoading, setChartLoading] = useState(false);
  const [selectedSuppliers, setSelectedSuppliers] = useState<number[]>([]);
  
  // Застосувати тільки необхідні фільтри (модель, бренди, постачальники, Вт/Ah, $/Вт/$/Ah, ₴ з нац, контакт), зберегти usd_rate/markup
  const applyEssentialFilters = () => {
    const f = (hook.filters as any) || {};
    hook.setFilters({
      full_name: f.full_name || undefined,
      brands: Array.isArray(f.brands) && f.brands.length ? f.brands : undefined,
      suppliers: Array.isArray(f.suppliers) && f.suppliers.length ? f.suppliers : undefined,
      // Power fields for solar panels and inverters
      power_min: f.power_min !== undefined ? f.power_min : undefined,
      power_max: f.power_max !== undefined ? f.power_max : undefined,
      price_per_w_min: f.price_per_w_min !== undefined ? f.price_per_w_min : undefined,
      price_per_w_max: f.price_per_w_max !== undefined ? f.price_per_w_max : undefined,
      // Battery-specific fields (Ah, A)
      volume_min: f.volume_min !== undefined ? f.volume_min : undefined,
      volume_max: f.volume_max !== undefined ? f.volume_max : undefined,
      c_amps_min: f.c_amps_min !== undefined ? f.c_amps_min : undefined,
      c_amps_max: f.c_amps_max !== undefined ? f.c_amps_max : undefined,
      // Price fields
      price_min: f.price_min !== undefined ? f.price_min : undefined,
      price_max: f.price_max !== undefined ? f.price_max : undefined,
      price_markup_uah_min: f.price_markup_uah_min !== undefined ? f.price_markup_uah_min : undefined,
      price_markup_uah_max: f.price_markup_uah_max !== undefined ? f.price_markup_uah_max : undefined,
      // Contact fields
      contact: f.contact || undefined,
      phone: f.phone || undefined,
      telegram: f.telegram || undefined,
      // Essential settings
      usd_rate: f.usd_rate,
      markup: f.markup,
      page: 1,
    });
  };
  
  // Функція для збереження налаштувань видимості колонок в localStorage
  const saveColumnSettings = (newVisibility: Record<string, boolean>) => {
    try {
      localStorage.setItem(columnVisibilityKey, JSON.stringify(newVisibility));
    } catch (e) {
      console.error('Failed to save column settings', e);
    }
  };
  
  // Функція для збереження налаштувань видимості кнопок в localStorage
  const saveButtonsSettings = (newVisibility: typeof buttonsVisibility) => {
    try {
      localStorage.setItem(buttonsVisibilityKey, JSON.stringify(newVisibility));
    } catch (e) {
      console.error('Failed to save buttons settings', e);
    }
  };

  // Функція для збереження налаштувань сортування в localStorage
  const saveSortConfig = (newSortConfig: typeof sortConfig) => {
    try {
      localStorage.setItem(sortConfigKey, JSON.stringify(newSortConfig));
    } catch (e) {
      console.error('Failed to save sort config', e);
    }
  };

  // Завантаження налаштувань при монтуванні компоненту
  useEffect(() => {
    try {
      // 1) Try to load stored settings (page-specific)
      const storedColumnVisibility = localStorage.getItem(columnVisibilityKey);
      if (storedColumnVisibility) {
        setVisibleColumns(JSON.parse(storedColumnVisibility));
      } else {
        // 2) If nothing stored: in compact mode pick essential; otherwise show all
        if (compact) {
          const defaultVisibility: Record<string, boolean> = {};
          const available = new Set(columns.map(c => c.key as string));
          const desired: string[] = ['full_name', 'brand', 'supplier'];
          const pickFirst = (...names: string[]) => names.find((n) => available.has(n));
          const measure = pickFirst('power', 'volume');
          const priceMain = pickFirst('price_markup_uah', 'price_uah', 'price');
          const date = available.has('date') ? 'date' : undefined;
          if (measure) desired.push(measure);
          if (priceMain) desired.push(priceMain);
          if (date) desired.push(date);
          columns.forEach((col) => {
            const key = col.key as string;
            defaultVisibility[key] = desired.includes(key);
          });
          setVisibleColumns(defaultVisibility);
          // By default in compact mode hide action buttons only if no stored settings exist
          setButtonsVisibility({ contact: false, edit: false, delete: false, chart: false });
        } else {
          const defaultVisibility: Record<string, boolean> = {};
          columns.forEach(col => {
            defaultVisibility[col.key as string] = true;
          });
          setVisibleColumns(defaultVisibility);
        }
      }
      const storedButtonsVisibility = localStorage.getItem(buttonsVisibilityKey);
      if (storedButtonsVisibility) {
        setButtonsVisibility(JSON.parse(storedButtonsVisibility));
      }
      // Load saved page size if available
      const storedPageSize = localStorage.getItem(pageSizeKey);
      if (storedPageSize && hook.setPageSize) {
        const val = parseInt(storedPageSize, 10);
        if (!Number.isNaN(val) && val > 0) {
          hook.setPageSize(val);
        }
      }
    } catch (e) {
      console.error('Failed to load settings', e);
      const defaultVisibility: Record<string, boolean> = {};
      columns.forEach(col => {
        defaultVisibility[col.key as string] = true;
      });
      setVisibleColumns(defaultVisibility);
    }
  }, [compact, columns, columnVisibilityKey, buttonsVisibilityKey, hook, pageSizeKey]);
  
  // Рекурсивна функція для видобування тексту з React елементів
  const extractTextFromReactElement = (element: React.ReactNode): string => {
    if (typeof element === 'string' || typeof element === 'number') {
      return String(element);
    }
    if (React.isValidElement(element)) {
      if (element.props.children) {
        if (Array.isArray(element.props.children)) {
          return element.props.children.map(extractTextFromReactElement).join('');
        } else {
          return extractTextFromReactElement(element.props.children);
        }
      }
      return '';
    }
    return String(element || '');
  };
  
  // Сортовані дані для відображення
  const sortedRows = React.useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction || !rows.length) {
      return rows;
    }
    
    const sortableItems = [...rows];
    const sortKey = sortConfig.key;
    const direction = sortConfig.direction;
    
    return sortableItems.sort((a: any, b: any) => {
      // Визначаємо значення для сортування на основі ключа
      let aValue: any;
      let bValue: any;
      
      // Спеціальна обробка для різних типів полів
      if (sortKey === 'price_sort') {
        // Сортування за ціною
        aValue = parseFloat(a.price) || 0;
        bValue = parseFloat(b.price) || 0;
      } else if (sortKey === 'price_per_watt_sort') {
        // Для акумуляторів це ціна / об'єм
        if ('volume' in a && a.volume) {
          aValue = a.price / a.volume;
        } else if ('power' in a && a.power) {
          // Для інверторів це ціна / потужність
          aValue = a.price / a.power;
        } else {
          aValue = a.price || 0;
        }
        
        if ('volume' in b && b.volume) {
          bValue = b.price / b.volume;
        } else if ('power' in b && b.power) {
          bValue = b.price / b.power;
        } else {
          bValue = b.price || 0;
        }
      } else if (sortKey === 'date') {
        // Спеціальна обробка для дат
        aValue = new Date(a.date || 0).getTime();
        bValue = new Date(b.date || 0).getTime();
      } else if (sortKey === 'price_markup_uah') {
        // Обробка для ціни з націнкою в гривнях
        const filters = hook.filters as any;
        const usdRate = filters?.usd_rate || 1;
        const markup = filters?.markup || 0;
        aValue = (a.price || 0) * usdRate * (1 + markup/100);
        bValue = (b.price || 0) * usdRate * (1 + markup/100);
      } else if (sortKey === 'volume' || sortKey === 'c_amps' || sortKey === 'power') {
        // Спеціальна обробка для числових полів
        aValue = parseFloat(a[sortKey]) || 0;
        bValue = parseFloat(b[sortKey]) || 0;
      } else if (sortKey === 'price') {
        // Обробка для базової ціни
        aValue = parseFloat(a[sortKey]) || 0;
        bValue = parseFloat(b[sortKey]) || 0;
      } else if (sortKey === 'price_per_w' || sortKey === 'price_per_ah') {
        // Обробка для ціни за одиницю (розрахункові поля)
        if (sortKey === 'price_per_w' && 'power' in a && a.power) {
          aValue = (a.price || 0) / a.power;
          bValue = (b.price || 0) / (b.power || 1);
        } else if (sortKey === 'price_per_ah' && 'volume' in a && a.volume) {
          aValue = (a.price || 0) / a.volume;
          bValue = (b.price || 0) / (b.volume || 1);
        } else {
          aValue = parseFloat(a[sortKey]) || 0;
          bValue = parseFloat(b[sortKey]) || 0;
        }
      } else if (sortKey === 'price_per_w_markup' || sortKey === 'price_per_w_uah' || sortKey === 'price_per_w_markup_uah') {
        // Обробка для розрахункових полів ціни за Ват
        const filters = hook.filters as any;
        const usdRate = filters?.usd_rate || 1;
        const markup = filters?.markup || 0;
        
        if ('power' in a && a.power && 'power' in b && b.power) {
          if (sortKey === 'price_per_w_markup') {
            aValue = ((a.price || 0) * (1 + markup/100)) / a.power;
            bValue = ((b.price || 0) * (1 + markup/100)) / b.power;
          } else if (sortKey === 'price_per_w_uah') {
            aValue = ((a.price || 0) * usdRate) / a.power;
            bValue = ((b.price || 0) * usdRate) / b.power;
          } else if (sortKey === 'price_per_w_markup_uah') {
            aValue = ((a.price || 0) * usdRate * (1 + markup/100)) / a.power;
            bValue = ((b.price || 0) * usdRate * (1 + markup/100)) / b.power;
          }
        } else {
          aValue = 0;
          bValue = 0;
        }
      } else if (sortKey === 'price_markup_usd' || sortKey === 'price_uah') {
        // Обробка для розрахункових полів ціни
        const filters = hook.filters as any;
        const usdRate = filters?.usd_rate || 1;
        const markup = filters?.markup || 0;
        
        if (sortKey === 'price_markup_usd') {
          aValue = (a.price || 0) * (1 + markup/100);
          bValue = (b.price || 0) * (1 + markup/100);
        } else if (sortKey === 'price_uah') {
          aValue = (a.price || 0) * usdRate;
          bValue = (b.price || 0) * usdRate;
        }
      } else if (sortKey === 'suppliers_cities') {
        // Обробка для масиву міст - сортуємо за першим містом
        const aCities = Array.isArray(a[sortKey]) ? a[sortKey] : [];
        const bCities = Array.isArray(b[sortKey]) ? b[sortKey] : [];
        aValue = aCities.length > 0 ? String(aCities[0]).toLowerCase() : '';
        bValue = bCities.length > 0 ? String(bCities[0]).toLowerCase() : '';
      } else if (sortKey === 'full_name' || sortKey === 'brand' || sortKey === 'supplier' || sortKey === 'contact' || sortKey === 'phone' || sortKey === 'telegram') {
        // Обробка для текстових полів
        aValue = String(a[sortKey] || '').toLowerCase();
        bValue = String(b[sortKey] || '').toLowerCase();
      } else {
        // Звичайна обробка для інших полів
        aValue = a[sortKey];
        bValue = b[sortKey];
      }
      
      
      // Порівняння рядків
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const result = aValue.localeCompare(bValue);
        return direction === 'asc' ? result : -result;
      }
      
      // Порівняння чисел або інших значень
      if (aValue === bValue) {
        return 0;
      }
      if (direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });
  }, [rows, sortConfig]);

  // Обробка кліка на заголовок для сортування
  const handleSortClick = (key: string, sortKey?: string) => {
    // Використовуємо sortKey якщо він вказаний, інакше використовуємо key
    const effectiveSortKey = sortKey || key;
    
    // Якщо ми вже сортуємо за цим ключем, змінюємо напрямок або скидаємо
    let newSortConfig;
    if (sortConfig.key === effectiveSortKey) {
      if (sortConfig.direction === 'asc') {
        newSortConfig = { key: effectiveSortKey, direction: 'desc' as const };
      } else if (sortConfig.direction === 'desc') {
        newSortConfig = { key: null, direction: null };
      } else {
        newSortConfig = { key: effectiveSortKey, direction: 'asc' as const };
      }
    } else {
      // При зміні колонки сортування, скидаємо попереднє сортування і встановлюємо нове
      newSortConfig = { key: effectiveSortKey, direction: 'asc' as const };
    }
    
    setSortConfig(newSortConfig);
    saveSortConfig(newSortConfig);
  };
  
  // Функція для отримання іконки статусу сортування
  const getSortIcon = (columnKey: string, sortKey?: string) => {
    const effectiveSortKey = sortKey || columnKey;
    
    console.log('🎯 getSortIcon called:', { columnKey, sortKey, effectiveSortKey, sortConfig });
    
    if (sortConfig.key !== effectiveSortKey) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    
    if (sortConfig.direction === 'asc') {
      return <ArrowUp className="h-4 w-4 text-primary" />;
    }
    
    if (sortConfig.direction === 'desc') {
      return <ArrowDown className="h-4 w-4 text-primary" />;
    }
    
    return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
  };

  // Похідні значення для таблиці
  const visibleColsCount = columns.filter(c => visibleColumns[c.key as string] !== false).length;
  const hasAnyActionButtons = (buttonsVisibility.contact || buttonsVisibility.edit || buttonsVisibility.delete || (buttonsVisibility.chart && !!chartConfig));
  const totalCols = visibleColsCount + 1 + (hasAnyActionButtons ? 1 : 0); // +1 за стовпець №, +1 за "Дії" (якщо є)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{title}</h1>
      
      {/* Top search and active filters section */}
      {props.topSearchComponent && (
        <div className="mb-2">
          {props.topSearchComponent}
        </div>
      )}
      
      {/* Top controls (filters), actions moved to a separate top-right toolbar */}
      <div className="w-full mb-2 flex flex-col gap-2">
        {(() => {
          // Build action buttons group to pass into filters as a prop
          const actionButtons = (
            <div className="flex items-center gap-2">
              {/* Rows per page selector */}
            

              {props.onRefresh && (
                <RefreshDataButton
                  variant="outline"
                  onRefresh={async () => {
                    try {
                      await props.onRefresh?.();
                    } finally {
                      // Підштовхнемо оновлення таблиці, перевстановивши ту ж сторінку
                      setPage(page);
                    }
                  }}
                />
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setCopying(true);
                  // Копіювання даних таблиці
                  const tableData = sortedRows
                    .map(row => {
                      const rowData: Record<string, any> = {};
                      columns.forEach(col => {
                        // Перевірка чи колонка видима
                        if (visibleColumns[col.key as string] !== false) {
                          // Отримання значення для цієї комірки
                          let cellValue: any = row[col.key as keyof typeof row];
                          
                          // Використовуємо функцію рендерингу, якщо вона є, для отримання текстового значення
                          if (col.render) {
                            const renderedValue = col.render(row);
                            // Перевіряємо, чи результат рендеру містить текст
                            if (React.isValidElement(renderedValue)) {
                              cellValue = extractTextFromReactElement(renderedValue);
                            } else {
                              cellValue = String(renderedValue || '');
                            }
                          }
                          
                          // Додаємо значення до даних рядка
                          rowData[col.header] = cellValue;
                        }
                      });
                      return rowData;
                    })
                    .map(row => Object.values(row).join('\t'))
                    .join('\n');
                  
                  // Створюємо рядок заголовків для колонок, які є видимими
                  const headers = columns
                    .filter(col => visibleColumns[col.key as string] !== false)
                    .map(col => col.header)
                    .join('\t');
                  
                  // Повний текст таблиці з заголовками та даними
                  const fullTable = `${headers}\n${tableData}`;
                  
                  // Копіюємо в буфер обміну
                  navigator.clipboard.writeText(fullTable)
                    .then(() => {
                      // Показуємо спливаюче повідомлення про успішне копіювання
                      toast({
                        title: "Скопійовано!",
                        description: "Дані таблиці скопійовані в буфер обміну.",
                        duration: 3000
                      });
                    })
                    .catch(err => {
                      console.error('Помилка копіювання: ', err);
                      toast({
                        title: "Помилка",
                        description: "Не вдалося скопіювати дані таблиці.",
                        variant: "destructive",
                        duration: 3000
                      });
                    })
                    .finally(() => {
                      setCopying(false);
                    });
                }}
                title="Копіювати таблицю"
                aria-label="Копіювати таблицю"
              >
                {copying ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" title="Налаштування" aria-label="Налаштування">
                    <Settings className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Налаштування колонок</h4>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const newVisibility: Record<string, boolean> = {};
                        columns.forEach(column => {
                          const columnKey = column.key as string;
                          newVisibility[columnKey] = true;
                        });
                        setVisibleColumns(newVisibility);
                        saveColumnSettings(newVisibility);
                      }}
                    >
                      Вибрати всі
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const newVisibility = {} as Record<string, boolean>;
                        // Базові колонки для всіх сторінок
                        const desired = ['full_name', 'brand', 'supplier'];
                        
                        // Додаємо специфічні колонки залежно від типу продукту
                        const availableColumns = columns.map(col => col.key as string);
                        
                        // Для сонячних панелей та інверторів: +Вт, $/Вт, ₴ з нац.
                        if (availableColumns.includes('power')) {
                          desired.push('power'); // +Вт
                        }
                        if (availableColumns.includes('price_per_w')) {
                          desired.push('price_per_w'); // $/Вт
                        }
                        if (availableColumns.includes('price_markup_uah')) {
                          desired.push('price_markup_uah'); // ₴ з нац.
                        }
                        
                        // Для акумуляторів: +Ah, +A, ₴ з нац.
                        if (availableColumns.includes('volume')) {
                          desired.push('volume'); // +Ah
                        }
                        if (availableColumns.includes('c_amps')) {
                          desired.push('c_amps'); // +A
                        }
                        if (availableColumns.includes('price_uah')) {
                          desired.push('price_uah'); // ₴ з нац. (для акумуляторів)
                        }
                        
                        // +Контакт (завжди включаємо якщо доступний)
                        if (availableColumns.includes('contact') || availableColumns.includes('phone') || availableColumns.includes('telegram')) {
                          if (availableColumns.includes('contact')) desired.push('contact');
                          if (availableColumns.includes('phone')) desired.push('phone');
                          if (availableColumns.includes('telegram')) desired.push('telegram');
                        }
                        
                        columns.forEach(column => {
                          const columnKey = column.key as string;
                          newVisibility[columnKey] = desired.includes(columnKey);
                        });
                        setVisibleColumns(newVisibility);
                        saveColumnSettings(newVisibility);
                        // Також вмикаємо тільки необхідні кнопки
                        const btns = { contact: true, edit: true, delete: false, chart: false };
                        setButtonsVisibility(btns);
                        saveButtonsSettings(btns);
                        // Та застосовуємо тільки необхідні фільтри
                        applyEssentialFilters();
                      }}
                    >
                      Необхідні
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  {columns.map((column) => {
                    const columnKey = column.key as string;
                    return (
                      <div key={columnKey} className="flex items-center gap-2">
                        <Checkbox 
                          id={`col-${columnKey}`} 
                          checked={visibleColumns[columnKey] !== false}
                          onCheckedChange={(checked: boolean | string) => {
                            const newVisibility = { ...visibleColumns };
                            // Перетворюємо 'indeterminate' або інші значення на boolean
                            newVisibility[columnKey] = checked === true;
                            setVisibleColumns(newVisibility);
                            saveColumnSettings(newVisibility);
                          }}  
                        />
                        <Label htmlFor={`col-${columnKey}`}>
                          {column.header}
                        </Label>
                      </div>
                    );
                  })}
                </div>
                
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Налаштування кнопок</h4>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const newVisibility = {
                          contact: true,
                          edit: true,
                          delete: true,
                          chart: true
                        };
                        setButtonsVisibility(newVisibility);
                        saveButtonsSettings(newVisibility);
                      }}
                    >
                      Вибрати всі
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const newVisibility = { contact: true, edit: true, delete: false, chart: false };
                        setButtonsVisibility(newVisibility);
                        saveButtonsSettings(newVisibility);
                        // Узгоджено встановимо і колонки до необхідних
                        const cols: Record<string, boolean> = {};
                        const desired = ['full_name', 'brand', 'supplier', 'power', 'price_per_w', 'price_markup_uah'];
                        columns.forEach(column => {
                          const key = column.key as string;
                          cols[key] = desired.includes(key);
                        });
                        setVisibleColumns(cols);
                        saveColumnSettings(cols);
                        // Та застосуємо тільки необхідні фільтри
                        applyEssentialFilters();
                      }}
                    >
                      Необхідні
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                   
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="button-edit" 
                      checked={buttonsVisibility.edit}
                      onCheckedChange={(checked: boolean) => {
                        const newVisibility = { ...buttonsVisibility, edit: checked };
                        setButtonsVisibility(newVisibility);
                        saveButtonsSettings(newVisibility);
                      }}
                    />
                    <Label htmlFor="button-edit">Редагування</Label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="button-delete" 
                      checked={buttonsVisibility.delete}
                      onCheckedChange={(checked: boolean) => {
                        const newVisibility = { ...buttonsVisibility, delete: checked };
                        setButtonsVisibility(newVisibility);
                        saveButtonsSettings(newVisibility);
                      }}
                    />
                    <Label htmlFor="button-delete">Видалення</Label>
                  </div>
                  
                  {chartConfig && (
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="button-chart" 
                        checked={buttonsVisibility.chart}
                        onCheckedChange={(checked: boolean) => {
                          const newVisibility = { ...buttonsVisibility, chart: checked };
                          setButtonsVisibility(newVisibility);
                          saveButtonsSettings(newVisibility);
                        }}
                      />
                      <Label htmlFor="button-chart">Графік</Label>
                    </div>
                  )}
                </div>
              </div>
                </PopoverContent>
              </Popover>
              {props.showCreateButton && (
                <button
                  className='px-3 py-1 border border-gray-200 rounded rounded-md'
                  onClick={() => setCreateOpen(true)}
                  title="Додати"
                  aria-label="Додати"
                >
                  Додати
                </button>
              )}
            </div>
          );
          // Do not inject actions into filters anymore; render filters as-is
          const filtersNode = React.isValidElement(filterComponent)
            ? React.cloneElement(filterComponent as any, {})
            : filterComponent;
          return (
            <>
              <div className="flex-1 min-w-0 mb-4">
                {filtersNode}
              </div>
              
              {/* Top-right actions toolbar (outside of any dropdowns) */}
              <div className="w-full flex items-center justify-end gap-2">
                {actionButtons}
              </div>
            </>
          );
        })()}
      </div>
      
      {/* Small spacing */}
      <div className="mt-2 mb-2"></div>
      
      {/* Loading state */}
      {loading && (
        <div className="text-center py-10 text-gray-500">
          <p className="font-medium">Завантаження даних...</p>
        </div>
      )}
      
      {/* Table */}
      {!loading && (
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className={`w-full ${compact ? 'text-xs' : ''}`} style={{userSelect: 'text', minWidth: 'max-content', tableLayout: 'auto'}}>
          <thead style={{userSelect: 'none'}} className="[&>tr>th]:bg-[#EBF3F6] dark:[&>tr>th]:bg-gray-900 [&>tr>th:hover]:bg-[#EBF3F6] dark:[&>tr>th:hover]:bg-gray-900 first:[&>tr>th]:rounded-tl-lg last:[&>tr>th]:rounded-tr-lg">
                  <tr>
              <th className={`${compact ? 'py-1 px-1 text-xs' : 'py-2 px-2 text-sm'} text-center font-medium min-w-[3ch] w-[4ch]`} title="№">№</th>
              {columns.map(column => {
                if (visibleColumns[column.key as string] === false) {
                  return null;
                }
                
                const headerAlignment = 'text-center';
                const justifyContent = 'justify-center';

                return (
                  <th
                    key={column.key as string}
                    className={`${compact ? 'py-1 px-2 text-xs' : 'py-2 px-4 text-sm'} ${headerAlignment} font-medium overflow-hidden`}
                    title={column.headerTitle || column.header}
                    style={{ minWidth: compact ? '100px' : '140px', width: compact ? '100px' : '140px' }}
                  >
                    <div className={`flex items-center gap-1 ${justifyContent} w-full`}>
                      {(() => {
                        console.log('🔍 Column check:', { key: column.key, header: column.header, sortable: column.sortable });
                        return column.sortable;
                      })() ? (
                        <button
                          className={`hover:bg-muted/50 flex items-center justify-center gap-1 ${compact ? 'px-1.5 py-0.5' : 'px-2 py-1'} rounded transition-colors flex-nowrap w-full`}
                          onClick={() => handleSortClick(column.key as string, column.sortKey)}
                        >
                          <span className={`truncate whitespace-nowrap ${compact ? 'max-w-[110px]' : 'max-w-[160px]'} min-w-[5ch] block text-center`}>{column.header}</span>
                          <span className="flex items-center flex-none">
                            {getSortIcon(column.key as string, column.sortKey)}
                          </span>
                        </button>
                      ) : (
                        <div className={`flex items-center justify-center gap-1 ${compact ? 'px-1.5 py-0.5' : 'px-2 py-1'} w-full`}>
                          <span className={`truncate whitespace-nowrap ${compact ? 'max-w-[110px]' : 'max-w-[160px]'} min-w-[5ch] block text-center`}>{column.header}</span>
                        </div>
                      )}
                    </div>
                  </th>
                );
              })}
              {hasAnyActionButtons && (
                <th className={`${compact ? 'py-1 px-2 text-xs' : 'py-2 px-4 text-sm'} text-center font-medium border-l`} style={{ minWidth: compact ? '100px' : '140px', width: compact ? '100px' : '140px' }}>
                  Дії
                </th>
              )}
            </tr>
          </thead>
          <tbody className="[&>tr:last-child>td:first-child]:rounded-bl-lg [&>tr:last-child>td:last-child]:rounded-br-lg">
            {loading ? (
              // Skeleton loader з мигаючими стовпцями
              Array.from({ length: 5 }).map((_, rowIndex) => (
                <tr key={`skeleton-${rowIndex}`} className={`h-auto min-h-[2px] odd:bg-[#F5FAFD] even:bg-white odd:dark:bg-gray-900 even:dark:bg-gray-800`}>
                  <td className={`${compact ? 'py-1 px-1 text-xs' : 'py-2 px-2 text-sm'} text-center min-w-[3ch] w-[4ch]`}>
                    <div className="animate-pulse bg-gray-300 dark:bg-gray-600 rounded h-4 w-6 mx-auto"></div>
                  </td>
                  {columns.map((column, colIndex) => {
                    if (visibleColumns[column.key as string] === false) {
                      return null;
                    }
                    return (
                      <td key={`skeleton-col-${colIndex}`} className={`${compact ? 'py-1 px-2 text-xs' : 'py-2 px-4 text-sm'} text-center`} style={{ minWidth: compact ? '100px' : '140px', width: compact ? '100px' : '140px', maxWidth: compact ? '100px' : '140px' }}>
                        <div className="animate-pulse bg-gray-300 dark:bg-gray-600 rounded h-4 w-full"></div>
                      </td>
                    );
                  })}
                  {hasAnyActionButtons && (
                    <td className={`${compact ? 'py-1 px-2 text-xs' : 'py-2 px-4 text-sm'} text-center border-l`} style={{ minWidth: compact ? '100px' : '140px', width: compact ? '100px' : '140px', maxWidth: compact ? '100px' : '140px' }}>
                      <div className="animate-pulse bg-gray-300 dark:bg-gray-600 rounded h-4 w-full"></div>
                    </td>
                  )}
                </tr>
              ))
            ) : sortedRows.length === 0 ? (
              <tr>
                <td colSpan={totalCols} className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <div className="flex flex-col items-center gap-3">
                    <div className="text-5xl">🔍</div>
                    <div className="text-lg font-medium">Виберіть фільтр, щоб показати товари</div>
                    <div className="text-sm text-gray-400 dark:text-gray-500">
                      Використовуйте фільтри вище для пошуку потрібних товарів
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              sortedRows.map((row: any, index: number) => (
                <tr key={row.id} className={`h-auto min-h-[2px] odd:bg-[#F5FAFD] even:bg-white odd:dark:bg-gray-900 even:dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700`}>
                  <td className={`${compact ? 'py-1 px-1 text-xs' : 'py-2 px-2 text-sm'} text-center min-w-[3ch] w-[4ch]`}>{(page - 1) * pageSize + index + 1}</td>
                  {columns.map(column => {
                    if (visibleColumns[column.key as string] === false) {
                      return null;
                    }
                    
                    const value = row[column.key as keyof typeof row];
                    
                    return (
                      <td 
                        key={column.key as string} 
                        className={`${compact ? 'py-1 px-2 text-xs' : 'py-2 px-4 text-sm'} text-center whitespace-nowrap`}
                        style={{ minWidth: compact ? '100px' : '140px', width: compact ? '100px' : '140px', maxWidth: compact ? '100px' : '140px' }}
                      >
                        <div className="truncate mx-auto" title={String(value ?? '')}>
                          {column.render ? column.render(row) : String(value ?? '')}
                        </div>
                      </td>
                    );
                  })}
                  {hasAnyActionButtons && (
                    <td className={`${compact ? 'py-1 px-2 text-xs' : 'py-2 px-4 text-sm'} text-center border-l` } style={{ minWidth: compact ? '100px' : '140px', width: compact ? '100px' : '140px', maxWidth: compact ? '100px' : '140px' }}>
                      <div className={`flex items-center justify-center ${compact ? 'gap-1' : 'gap-2'} flex-nowrap`}>
                      {buttonsVisibility.contact && row.phone && (
                        compact ? (
                          <Button size={"xs" as any} variant="ghost" title="Контакт" asChild>
                            <a href={`tel:${row.phone}`}><Phone className="h-3.5 w-3.5" /></a>
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" asChild>
                            <a href={`tel:${row.phone}`}>Контакт</a>
                          </Button>
                        )
                      )}
                      {buttonsVisibility.edit && (
                        compact ? (
                          <Button size={"xs" as any} variant="ghost" title="Змінити" onClick={() => setEditRow({ id: row.id, price: row.price })}>
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditRow({ id: row.id, price: row.price })}
                          >
                            Змінити
                          </Button>
                        )
                      )}
                      {buttonsVisibility.delete && (
                        compact ? (
                          <Button size={"xs" as any} variant="ghost" title="Видалити" onClick={() => {
                            if (window.confirm('Ви впевнені що хочете видалити цей запис?')) {
                              hook.deletePrice(row.id);
                            }
                          }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (window.confirm('Ви впевнені що хочете видалити цей запис?')) {
                                hook.deletePrice(row.id);
                              }
                            }}
                          >
                            Видалити
                          </Button>
                        )
                      )}
                      {buttonsVisibility.chart && chartConfig && (
                        compact ? (
                          <Button size={"xs" as any} variant="ghost" title="Графік" onClick={() => { setChartRowId(row.id); setChartOpen(true); }}>
                            <LineChart className="h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setChartRowId(row.id);
                              setChartOpen(true);
                            }}
                          >
                            Графік
                          </Button>
                        )
                      )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      )}

      {/* Chart dialog */}
      {chartConfig && (
        <Dialog open={chartOpen} onOpenChange={setChartOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Графік цін</DialogTitle>
            </DialogHeader>
            {chartSrc && <img src={`data:image/png;base64,${chartSrc}`} alt="Price chart" className="w-full" />}
            {chartRowId !== null && (
              <>
                <div className="space-y-2">
                  <div>Виберіть постачальників для порівняння:</div>
                  <div className="grid grid-cols-2 gap-2">
                    {chartConfig.suppliers.map(supplier => (
                      <div key={supplier.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`supplier-${supplier.id}`}
                          checked={selectedSuppliers.includes(supplier.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedSuppliers(prev => [...prev, supplier.id]);
                            } else {
                              setSelectedSuppliers(prev => prev.filter(id => id !== supplier.id));
                            }
                          }}
                        />
                        <Label htmlFor={`supplier-${supplier.id}`}>{supplier.name}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  disabled={selectedSuppliers.length === 0 || chartLoading}
                  onClick={async () => {
                    if (!chartConfig || chartRowId === null) return;
                    try {
                      setChartLoading(true);
                      const img = await chartConfig.getChart(chartRowId, selectedSuppliers);
                      setChartSrc(img);
                    } finally {
                      setChartLoading(false);
                    }
                  }}
                >
                  {chartLoading ? 'Завантаження…' : 'Побудувати'}
                </Button>
              </>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Показати:</span>
          <Select 
            value={String(pageSize)} 
            onValueChange={(value) => setPageSize && setPageSize(Number(value))}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50, 100].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-gray-600">записів</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {page} / {Math.max(1, Math.ceil(total / pageSize))}
          </span>
          <div className="space-x-2">
            <Button disabled={page === 1} onClick={() => setPage(page - 1)} size="sm">
              Попередня
            </Button>
            <Button
              disabled={page === Math.ceil(total / pageSize) || total === 0}
              onClick={() => setPage(page + 1)}
              size="sm"
            >
              Наступна
            </Button>
          </div>
        </div>
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новий прайс</DialogTitle>
          </DialogHeader>
          {createFormComponent
            ? (React.isValidElement(createFormComponent)
                ? React.cloneElement(createFormComponent as any, {
                    onSubmit: async (payload: any) => {
                      await hook.createPrice(payload);
                      setCreateOpen(false);
                    },
                  })
                : createFormComponent)
            : (
              <CreatePriceForm
                currencySymbol={currencySymbol}
                onSubmit={async (payload) => {
                  await hook.createPrice(payload as any);
                  setCreateOpen(false);
                }}
              />
            )}
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editRow} onOpenChange={() => setEditRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редагувати прайс</DialogTitle>
          </DialogHeader>
          {editRow && (
            <EditPriceForm
              initialPrice={editRow.price}
              currencySymbol={currencySymbol}
              onSubmit={async (price) => {
                await hook.updatePrice(editRow.id, { price } as any);
                setEditRow(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface CreatePriceFormProps {
  currencySymbol: string;
  onSubmit: (payload: Record<string, any>) => void | Promise<void>;
}

const CreatePriceForm: React.FC<CreatePriceFormProps> = ({ currencySymbol, onSubmit }) => {
  const [price, setPrice] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ price: Number(price) });
      }}
      className="space-y-4"
    >
      <div>
        <label className="block text-sm mb-1">Ціна ({currencySymbol})</label>
        <Input value={price} onChange={(e) => setPrice(e.target.value)} required />
      </div>
      <Button type="submit">Створити</Button>
    </form>
  );
};

interface EditPriceFormProps {
  initialPrice: number;
  currencySymbol: string;
  onSubmit: (price: number) => void | Promise<void>;
}

const EditPriceForm: React.FC<EditPriceFormProps> = ({ initialPrice, currencySymbol, onSubmit }) => {
  const [price, setPrice] = useState(String(initialPrice));
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(Number(price));
      }}
      className="space-y-4"
    >
      <div>
        <label className="block text-sm mb-1">Нова ціна ({currencySymbol})</label>
        <Input value={price} onChange={(e) => setPrice(e.target.value)} required />
      </div>
      <Button type="submit">Зберегти</Button>
    </form>
  );
};
