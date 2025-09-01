import { useState, useEffect, useRef } from 'react';
import type { WheelEvent as ReactWheelEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Search, Loader2, Plus, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/Checkbox';
import { fetchContentDescriptions, ProductType, generateAiDescription } from '@/api/contentDescriptions';
import { Pagination } from '@/components/ui/Pagination';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { fetchColumnPrompts } from '@/api/contentPrompts';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';

interface ContentDescription {
  id?: number;
  product_id?: number;
  product_type?: ProductType;
  product_name?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  // Поля для альтернативного формату відповіді
  site_lang_code?: string;
  site_product?: string;
  site_shortname?: string;
  site_short_description?: string | null;
  site_full_description?: string | null;
  site_meta_keywords?: string;
  site_meta_description?: string;
  site_searchwords?: string | null;
  site_page_title?: string;
  site_promo_text?: string | null;
}

interface CustomFilter {
  id: string;
  name: string;
  field: string;
  value: string;
  active: boolean;
}

// Мапа мовних кодів для відображення
const languageLabels: Record<string, string> = {
  'en': 'Англійська',
  'uk': 'Українська',
  'ru': 'Російська',
  'de': 'Німецька',
  'fr': 'Французька',
  'es': 'Іспанська'
};

export default function AIProductFillerGeneration() {
  const [descriptions, setDescriptions] = useState<ContentDescription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductType, setSelectedProductType] = useState<ProductType | 'all'>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [customFilters, setCustomFilters] = useState<CustomFilter[]>([]);
  const [newFilter, setNewFilter] = useState<Omit<CustomFilter, 'id' | 'active'>>({ name: '', field: 'site_product', value: '' });
  // refs для синхронізації горизонтальних скролбарів
  const topScrollRef = useRef<HTMLDivElement | null>(null);
  const tableScrollRef = useRef<HTMLDivElement | null>(null);
  const isScrollingRef = useRef(false);
  const [tableWidth, setTableWidth] = useState(1500);
  const [showScrollbars, setShowScrollbars] = useState(false);
  // Вибрані рядки та промпт для генерації
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [fullDescPrompt, setFullDescPrompt] = useState<string>('');
  const { toast } = useToast();
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [resultOpen, setResultOpen] = useState(false);
  
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const request = {
        product_type: selectedProductType === 'all' ? undefined : selectedProductType,
        page,
        limit
      };
      
      const response = await fetchContentDescriptions<ContentDescription>(request);
      setDescriptions(response.items);
      setTotal(response.total);
    } catch (err) {
      setError('Помилка при завантаженні даних. Спробуйте пізніше.');
      console.error('Error fetching content descriptions:', err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, [selectedProductType, page, limit]);

  // Завантажуємо промпт для генерації повного опису
  useEffect(() => {
    (async () => {
      try {
        const prompts = await fetchColumnPrompts('full_description');
        setFullDescPrompt(prompts?.[0]?.prompt ?? '');
        console.log('[Generation] Loaded full_description prompt:', prompts?.[0]);
      } catch (e) {
        console.error('[Generation] Не вдалося завантажити промпт для full_description', e);
      }
    })();
  }, []);

  // При зміні пошуку або користувацьких фільтрів переходимо на першу сторінку
  useEffect(() => {
    setPage(1);
  }, [searchQuery, customFilters]);

  // Вимірювання ширини таблиці та визначення, чи потрібні скролбари
  useEffect(() => {
    const measure = () => {
      // Використовуємо контейнер таблиці
      const el = tableScrollRef.current;
      if (!el) return;
      // Затримка для коректного вимірювання після рендеру
      requestAnimationFrame(() => {
        const contentWidth = el.scrollWidth;
        const viewportWidth = el.clientWidth;
        setTableWidth(contentWidth > 0 ? contentWidth : 1500);
        setShowScrollbars(contentWidth > viewportWidth + 2); // невеликий запас
      });
    };

    measure();
    window.addEventListener('resize', measure);
    // Спостерігач за зміною розмірів вмісту для точного оновлення ширини
    let ro: ResizeObserver | null = null;
    if ('ResizeObserver' in window) {
      ro = new ResizeObserver(() => measure());
      if (tableScrollRef.current) ro.observe(tableScrollRef.current);
    }
    return () => {
      window.removeEventListener('resize', measure);
      if (ro) ro.disconnect();
    };
  }, [descriptions, selectedProductType, limit]);

  // Синхронізація прокрутки між верхнім і нижнім скролбарами
  const onTopScroll = () => {
    if (isScrollingRef.current) return;
    isScrollingRef.current = true;
    const top = topScrollRef.current;
    const bottom = tableScrollRef.current;
    if (top && bottom) bottom.scrollLeft = top.scrollLeft;
    requestAnimationFrame(() => {
      isScrollingRef.current = false;
    });
  };

  const onBottomScroll = () => {
    if (isScrollingRef.current) return;
    isScrollingRef.current = true;
    const top = topScrollRef.current;
    const bottom = tableScrollRef.current;
    if (top && bottom) top.scrollLeft = bottom.scrollLeft;
    requestAnimationFrame(() => {
      isScrollingRef.current = false;
    });
  };

  // Перемикання вибору рядка
  const toggleRow = (key: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  // Запуск генерації для вибраних рядків
  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const selected = filteredDescriptions.filter((desc, index) => {
        const rowKey = String(desc.id ?? desc.site_product ?? index);
        return selectedRows.has(rowKey);
      });
      for (let i = 0; i < selected.length; i++) {
        const desc = selected[i];
        const site_product = desc.site_product || desc.product_name || '';
        const site_full_description = desc.site_full_description || desc.description || '';
        const payload = {
          site_product,
          site_full_description,
          prompt: fullDescPrompt,
          model_name: 'GPT-4o-mini',
        };
        console.log('[GenerateAI] Payload:', payload);
        try {
          const result = await generateAiDescription(payload);
          console.log('[GenerateAI] Response:', result);
          setLastResult(result ?? '');
          toast({
            title: 'Генерація завершена',
            description: `${site_product}: ${String(result ?? '').slice(0, 160)}`,
          });
        } catch (e) {
          console.error('[GenerateAI] Error:', e);
          toast({
            variant: 'destructive',
            title: 'Помилка генерації',
            description: `${site_product}: не вдалося згенерувати опис`,
          });
        }
      }
    } finally {
      setGenerating(false);
    }
  };

  // Дозволяємо прокручувати верхній скролбар коліщатком миші (вертикальне -> горизонтальне)
  const onTopWheel = (e: ReactWheelEvent<HTMLDivElement>) => {
    const el = topScrollRef.current;
    if (!el) return;
    // Перетворюємо вертикальний скрол в горизонтальний
    const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (delta !== 0) {
      e.preventDefault();
      el.scrollLeft += delta;
      // миттєва синхронізація з нижнім контейнером
      const bottom = tableScrollRef.current;
      if (bottom) bottom.scrollLeft = el.scrollLeft;
    }
  };

  // Функція для видалення фільтра
  const removeCustomFilter = (id: string) => {
    setCustomFilters(customFilters.filter(filter => filter.id !== id));
  };

  // Функція для перемикання активності фільтра
  const toggleFilterActive = (id: string) => {
    setCustomFilters(customFilters.map(filter => 
      filter.id === id ? { ...filter, active: !filter.active } : filter
    ));
  };

  const filteredDescriptions = descriptions.filter(desc => {
    // Базовий пошук за запитом
    let matchesSearch = true;
    if (searchQuery) {
      const productName = desc.site_product || desc.product_name || '';
      const shortName = desc.site_shortname || '';
      const shortDesc = desc.site_short_description || '';
      const fullDesc = desc.site_full_description || desc.description || '';
      const promoText = desc.site_promo_text || '';
      const metaKeywords = desc.site_meta_keywords || '';
      const metaDesc = desc.site_meta_description || '';
      const searchWords = desc.site_searchwords || '';
      
      const searchLower = searchQuery.toLowerCase();
      
      matchesSearch = productName.toLowerCase().includes(searchLower) ||
             shortName.toLowerCase().includes(searchLower) ||
             shortDesc?.toLowerCase().includes(searchLower) ||
             fullDesc?.toLowerCase().includes(searchLower) ||
             promoText?.toLowerCase().includes(searchLower) ||
             metaKeywords.toLowerCase().includes(searchLower) ||
             metaDesc.toLowerCase().includes(searchLower) ||
             searchWords?.toLowerCase().includes(searchLower);
    }
    
    // Перевірка за користувацькими фільтрами
    // Застосовуємо тільки активні фільтри
    const activeFilters = customFilters.filter(filter => filter.active);
    if (activeFilters.length === 0) return matchesSearch;
    
    return matchesSearch && activeFilters.every(filter => {
      const fieldValue = desc[filter.field as keyof ContentDescription];
      if (fieldValue === undefined || fieldValue === null) return false;
      return String(fieldValue).toLowerCase().includes(filter.value.toLowerCase());
    });
  });
  
  const totalPages = Math.ceil(total / limit);
  
  // Function to truncate text with ellipsis
  const truncateText = (text: string | undefined, maxLength: number) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };
  
  // Функція для отримання назви мови
  const getLanguageName = (langCode: string | undefined) => {
    if (!langCode) return '-';
    return languageLabels[langCode] || langCode;
  };

  return (
    <div className="container mx-auto px-4 py-6 overflow-x-hidden">
      {/* Header */}
      <div className="mb-6">
        <div className="p-4 space-y-4">
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold">Описи продуктів</h1>
            
            {/* Рядок з пошуком та фільтрами */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative w-[200px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Несохранённый поиск"
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              
              
              {/* Кнопка + з попапом для додавання фільтра */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="h-10 w-10">
                    <Plus className="h-4 w-4" />
                  </Button>
                  
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium leading-none">Додати фільтр</h4>
                      <p className="text-sm text-muted-foreground">
                        Виберіть поле та введіть значення для фільтрації
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <Select 
                        value={newFilter.field} 
                        onValueChange={(value) => setNewFilter({...newFilter, field: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Виберіть поле" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="site_product">Назва продукту</SelectItem>
                          <SelectItem value="site_shortname">Коротка назва</SelectItem>
                          <SelectItem value="site_short_description">Короткий опис</SelectItem>
                          <SelectItem value="site_full_description">Повний опис</SelectItem>
                          <SelectItem value="site_promo_text">Промо-текст</SelectItem>
                          <SelectItem value="site_meta_keywords">Мета-ключові слова</SelectItem>
                          <SelectItem value="site_meta_description">Мета-опис</SelectItem>
                          <SelectItem value="site_searchwords">Пошукові слова</SelectItem>
                          <SelectItem value="site_page_title">Заголовок сторінки</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Input 
                        value={newFilter.value} 
                        onChange={(e) => setNewFilter({...newFilter, value: e.target.value})} 
                        placeholder="Значення для пошуку"
                      />
                      
                      <Button 
                        onClick={() => {
                          if (newFilter.field && newFilter.value) {
                            const filter: CustomFilter = {
                              id: `filter_${Date.now()}`,
                              name: `${newFilter.field.replace('site_', '')}: ${newFilter.value}`,
                              field: newFilter.field,
                              value: newFilter.value,
                              active: true // Фільтр додається як активний
                            };
                            setCustomFilters([...customFilters, filter]);
                            setNewFilter({ name: '', field: newFilter.field, value: '' });
                          }
                        }}
                      >
                        Додати фільтр
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <div className="flex items-center flex-wrap gap-2">
                {customFilters.length > 0 && (
                  <div className='w-auto min-w-[200px] h-10 flex items-center space-x-1 p-1 bg-black rounded-md border border-[#333]'>
                    {customFilters.map(filter => (
                      <Badge 
                        key={filter.id}
                        variant="outline" 
                        className={`flex items-center h-8 gap-1 cursor-pointer rounded-md px-2 ${filter.active ? 'bg-[#333] text-white border-[#444]' : 'bg-black text-gray-300 border-[#333]'} hover:bg-[#222]`}
                        onClick={() => toggleFilterActive(filter.id)}
                        title={`Поле: ${filter.field}, Значення: ${filter.value}, Статус: ${filter.active ? 'Активний' : 'Неактивний'}`}
                      >
                        {filter.field.replace('site_', '')}: {filter.value}
                        <X 
                          size={14} 
                          className="cursor-pointer text-gray-400 hover:text-red-400" 
                          onClick={(e) => {
                            e.stopPropagation();
                            removeCustomFilter(filter.id);
                          }} 
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <Select value={selectedProductType} onValueChange={(value) => setSelectedProductType(value as ProductType | 'all')}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Все типы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі типи</SelectItem>
                  <SelectItem value="solar_panels">Сонячні панелі</SelectItem>
                  <SelectItem value="batteries">Акумулятори</SelectItem>
                  <SelectItem value="inverters">Інвертори</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Відображення активних фільтрів */}
           
            
            {/* Кнопки та опції */}
            <div className="flex flex-wrap items-center gap-2 justify-end">
              <Button
                onClick={handleGenerate}
                disabled={generating || selectedRows.size === 0 || !fullDescPrompt}
              >
                {generating ? 'Генерація...' : 'Generate AI Description'}
              </Button>
              <Button
                variant="outline"
                disabled={!lastResult}
                onClick={() => setResultOpen(true)}
              >
                Переглянути результат
              </Button>
              <Button variant="outline" onClick={fetchData}>
                Оновити
              </Button>
            </div>

          </div>
        </div>
      </div>

      {/* Top horizontal scrollbar (outside card to avoid clipping) */}
      {showScrollbars && (
        <div
          ref={topScrollRef}
          onScroll={onTopScroll}
          onWheel={onTopWheel}
          className="overflow-x-auto overflow-y-hidden h-4 mb-2"
        >
          <div style={{ width: tableWidth }} className="h-1" />
        </div>
      )}

      {/* Table with bottom scrollbar */}
      <div ref={tableScrollRef} onScroll={onBottomScroll} className="overflow-x-auto">
        <div style={{ minWidth: tableWidth }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Мова / Тип</TableHead>
                <TableHead>Продукт</TableHead>
                <TableHead>Коротка назва</TableHead>
                <TableHead>Короткий опис</TableHead>
                <TableHead>Повний опис</TableHead>
                <TableHead>Промо-текст</TableHead>
                <TableHead>Мета-ключові слова</TableHead>
                <TableHead>Мета-опис</TableHead>
                <TableHead>Пошукові слова</TableHead>
                <TableHead>Заголовок сторінки</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Завантаження...
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-red-500">
                    {error}
                  </TableCell>
                </TableRow>
              ) : filteredDescriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                    Немає даних для відображення
                  </TableCell>
                </TableRow>
              ) : (
                filteredDescriptions.map((desc, index) => {
                  const rowKey = String(desc.id ?? desc.site_product ?? index);
                  const checked = selectedRows.has(rowKey);
                  return (
                    <TableRow key={rowKey} className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700">
                      <TableCell className="py-3">
                        <div className="flex items-start gap-2">
                          <Checkbox aria-label="Вибрати рядок" checked={checked} onCheckedChange={() => toggleRow(rowKey)} />
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800">
                            {getLanguageName(desc.site_lang_code) || desc.product_type || '-'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-start gap-2">
                          <Checkbox aria-label="Вибрати рядок" checked={checked} onCheckedChange={() => toggleRow(rowKey)} />
                          <div className="font-medium text-sm">{desc.site_product || desc.product_name || '-'}</div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-start gap-2">
                          <Checkbox aria-label="Вибрати рядок" checked={checked} onCheckedChange={() => toggleRow(rowKey)} />
                          <div className="text-sm text-gray-700 dark:text-gray-300">
                            {desc.site_shortname || '-'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-start gap-2">
                          <Checkbox aria-label="Вибрати рядок" checked={checked} onCheckedChange={() => toggleRow(rowKey)} />
                          <div className="text-sm text-gray-700 dark:text-gray-300">
                            {truncateText(desc.site_short_description || '', 100)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-start gap-2">
                          <Checkbox aria-label="Вибрати рядок" checked={checked} onCheckedChange={() => toggleRow(rowKey)} />
                          <div className="text-sm text-gray-700 dark:text-gray-300">
                            {truncateText(desc.site_full_description || desc.description || '', 100)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-start gap-2">
                          <Checkbox aria-label="Вибрати рядок" checked={checked} onCheckedChange={() => toggleRow(rowKey)} />
                          <div className="text-sm text-gray-700 dark:text-gray-300">
                            {truncateText(desc.site_promo_text || '', 100)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-start gap-2">
                          <Checkbox aria-label="Вибрати рядок" checked={checked} onCheckedChange={() => toggleRow(rowKey)} />
                          <div className="text-sm text-gray-700 dark:text-gray-300">
                            {truncateText(desc.site_meta_keywords || '', 100)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-start gap-2">
                          <Checkbox aria-label="Вибрати рядок" checked={checked} onCheckedChange={() => toggleRow(rowKey)} />
                          <div className="text-sm text-gray-700 dark:text-gray-300">
                            {truncateText(desc.site_meta_description || '', 100)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-start gap-2">
                          <Checkbox aria-label="Вибрати рядок" checked={checked} onCheckedChange={() => toggleRow(rowKey)} />
                          <div className="text-sm text-gray-700 dark:text-gray-300">
                            {truncateText(desc.site_searchwords || '', 100)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-start gap-2">
                          <Checkbox aria-label="Вибрати рядок" checked={checked} onCheckedChange={() => toggleRow(rowKey)} />
                          <div className="text-sm text-gray-700 dark:text-gray-300">
                            {truncateText(desc.site_page_title || '', 100)}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span>
                Показано {(page - 1) * limit + 1}-{Math.min(page * limit, total)} з {total} записів
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Записів на сторінці</span>
                <Select value={limit.toString()} onValueChange={(value) => setLimit(Number(value))}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Pagination 
              currentPage={page} 
              totalPages={totalPages} 
              onPageChange={(newPage) => setPage(newPage)}
            />
          </div>
        </div>
      )}

      {/* Dialog to show last AI generation result */}
      <Dialog open={resultOpen} onOpenChange={setResultOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Результат AI-генерації</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto whitespace-pre-wrap text-sm">
            {lastResult || 'Немає результату'}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
