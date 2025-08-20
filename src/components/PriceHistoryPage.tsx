import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Settings, Copy, Check, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { Checkbox } from '@/components/ui/Checkbox';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { useToast } from '@/hooks/use-toast';

// Minimal column definition for a generic table
export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
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
}

export function PriceHistoryPage<T, CreatePayload = any, UpdatePayload = any>(
  props: PriceHistoryPageProps<T, CreatePayload, UpdatePayload>
) {
  const { title, currencySymbol, columns, hook, filterComponent, createFormComponent, chartConfig } = props;
  const { rows, total, page, pageSize, setPage, setPageSize, loading } = hook;
  
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

  // Стан для сортування
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' | null }>({ 
    key: null, 
    direction: null 
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
      localStorage.setItem('columnVisibility', JSON.stringify(newVisibility));
    } catch (e) {
      console.error('Failed to save column settings', e);
    }
  };
  
  // Функція для збереження налаштувань видимості кнопок в localStorage
  const saveButtonsSettings = (newVisibility: typeof buttonsVisibility) => {
    try {
      localStorage.setItem('buttonsVisibility', JSON.stringify(newVisibility));
    } catch (e) {
      console.error('Failed to save buttons settings', e);
    }
  };

  // Завантаження налаштувань при монтуванні компоненту
  useEffect(() => {
    try {
      const storedColumnVisibility = localStorage.getItem('columnVisibility');
      if (storedColumnVisibility) {
        setVisibleColumns(JSON.parse(storedColumnVisibility));
      } else {
        // Якщо немає збережених налаштувань, всі колонки видимі за замовчуванням
        const defaultVisibility: Record<string, boolean> = {};
        columns.forEach(col => {
          defaultVisibility[col.key as string] = true;
        });
        setVisibleColumns(defaultVisibility);
      }
      
      const storedButtonsVisibility = localStorage.getItem('buttonsVisibility');
      if (storedButtonsVisibility) {
        setButtonsVisibility(JSON.parse(storedButtonsVisibility));
      }
    } catch (e) {
      console.error('Failed to load settings', e);
      // Резервний варіант - всі колонки видимі
      const defaultVisibility: Record<string, boolean> = {};
      columns.forEach(col => {
        defaultVisibility[col.key as string] = true;
      });
      setVisibleColumns(defaultVisibility);
    }
  }, []);
  
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
      if (sortKey === 'price_per_watt_sort') {
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
      } else if (sortKey === 'volume' || sortKey === 'c_amps' || sortKey === 'power') {
        // Спеціальна обробка для числових полів
        aValue = parseFloat(a[sortKey]) || 0;
        bValue = parseFloat(b[sortKey]) || 0;
      } else if (sortKey === 'full_name') {
        // Обробка для назв
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
    if (sortConfig.key === effectiveSortKey) {
      if (sortConfig.direction === 'asc') {
        setSortConfig({ key: effectiveSortKey, direction: 'desc' });
      } else if (sortConfig.direction === 'desc') {
        setSortConfig({ key: null, direction: null });
      } else {
        setSortConfig({ key: effectiveSortKey, direction: 'asc' });
      }
    } else {
      // При зміні колонки сортування, скидаємо попереднє сортування і встановлюємо нове
      setSortConfig({ key: effectiveSortKey, direction: 'asc' });
    }
  };
  
  // Функція для отримання іконки статусу сортування
  const getSortIcon = (columnKey: string, sortKey?: string) => {
    const effectiveSortKey = sortKey || columnKey;
    
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

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{title}</h1>
      
      {/* Top search and active filters section */}
      {props.topSearchComponent && (
        <div className="mb-4">
          {props.topSearchComponent}
        </div>
      )}
      
      {/* Top controls */}
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        {filterComponent}
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setCopying(true);
              // Копіювання даних таблиці
              const tableData = sortedRows
                .map(row => {
                  let rowData = {};
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
          >
            {copying ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
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
                        const newVisibility = {};
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
                        let desired = ['full_name', 'brand', 'supplier'];
                        
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
          
          <Button onClick={() => setCreateOpen(true)}>Додати</Button>
        </div>
      </div>
      
      {/* Table */}
      <div className="rounded-md border w-full overflow-x-auto">
        <table className="w-full table-auto" style={{userSelect: 'text'}}>
          <thead style={{userSelect: 'none'}}>
            <tr className="bg-muted/50">
              <th className="py-2 px-4 text-center font-medium text-sm w-16">№</th>
              {columns.map(column => {
                if (visibleColumns[column.key as string] === false) {
                  return null;
                }
                
                // Determine alignment based on column type
                const isTextColumn = ['full_name', 'brand', 'supplier', 'city', 'contact', 'phone', 'telegram', 'firmware'].includes(column.key as string);
                const headerAlignment = 'text-center';
                const justifyContent = 'justify-center';

                return (
                  <th
                    key={column.key as string}
                    className={`py-2 px-4 ${headerAlignment} font-medium text-sm`}
                  >
                    <div className={`flex items-center gap-1 ${justifyContent}`}>
                      <button
                        className="hover:bg-muted/50 flex items-center gap-2 px-2 py-1 rounded transition-colors"
                        onClick={() => handleSortClick(column.key as string, column.sortKey)}
                      >
                        <span>{column.header}</span>
                        <span className="flex items-center">
                          {getSortIcon(column.key as string, column.sortKey)}
                        </span>
                      </button>
                    </div>
                  </th>
                );
              })}
              <th className="py-2 px-4 text-center font-medium text-sm">Дії</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.filter(c => visibleColumns[c.key as string] !== false).length + 2} className="text-center py-4">
                  Завантаження...
                </td>
              </tr>
            ) : sortedRows.length === 0 ? (
              <tr>
                <td colSpan={columns.filter(c => visibleColumns[c.key as string] !== false).length + 2} className="text-center py-4">
                  Немає даних
                </td>
              </tr>
            ) : (
              sortedRows.map((row: any, index: number) => (
                <tr key={row.id} className="border-t">
                  <td className="py-2 px-4 text-center w-16">{(page - 1) * pageSize + index + 1}</td>
                  {columns.map(column => {
                    if (visibleColumns[column.key as string] === false) {
                      return null;
                    }
                    
                    const value = row[column.key as keyof typeof row];
                    // Match data cell alignment with header alignment
                    const isTextColumn = ['full_name', 'brand', 'supplier', 'city', 'contact', 'phone', 'telegram', 'firmware'].includes(column.key as string);
                    const dataAlignment = isTextColumn ? 'text-left' : 'text-center';
                    
                    return (
                      <td key={column.key as string} className={`py-2 px-4 ${dataAlignment} whitespace-nowrap`}>
                        {column.render ? column.render(row) : String(value || '')}
                      </td>
                    );
                  })}
                  <td className="py-2 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                    {buttonsVisibility.contact && row.phone && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={`tel:${row.phone}`}>Контакт</a>
                      </Button>
                    )}
                    {buttonsVisibility.edit && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditRow({ id: row.id, price: row.price })}
                      >
                        Змінити
                      </Button>
                    )}
                    {buttonsVisibility.delete && (
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
                    )}
                    {buttonsVisibility.chart && chartConfig && (
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
                    )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
