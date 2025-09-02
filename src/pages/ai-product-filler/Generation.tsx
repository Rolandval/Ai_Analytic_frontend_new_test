import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Search, Loader2, Plus, X, Save } from 'lucide-react';
import { Checkbox } from '@/components/ui/Checkbox';
import { fetchContentDescriptions, ProductType } from '@/api/contentDescriptions';
import { fetchAllColumnPrompts, type SiteColumnName, type SiteContentPrompt, SITE_COLUMNS } from '@/api/contentPrompts';
import { getTemplates } from '@/api/productFillerMock';
import type { ProductTemplates, CategoryTemplates } from '@/api/productFillerMock';
import { generateAiDescription } from '@/api/generateAiDescription';
import { updateSiteDescriptions } from '@/api/updateSiteDescriptions';
import { toast } from '@/hooks/use-toast';
import { Pagination } from '@/components/ui/Pagination';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { useLocation } from 'react-router-dom';

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
  const location = useLocation();
  const STORAGE_KEY_TEMPLATES_STATE = 'aiProductFiller.templatesState';
  const [descriptions, setDescriptions] = useState<ContentDescription[]>([]);
  const [initialDescriptions, setInitialDescriptions] = useState<ContentDescription[]>([]);
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
  // Вибір окремих клітинок
  const [selectedCells, setSelectedCells] = useState<Record<string, boolean>>({});
  const [templatesState, setTemplatesState] = useState<TemplatesState>(null);
  // Масова генерація
  const [massGenerating, setMassGenerating] = useState(false);
  const [massProgress, setMassProgress] = useState<string>('');
  // Масова генерація по колонці
  const [colGenerating, setColGenerating] = useState<SiteColumnName | null>(null);
  const [colProgress, setColProgress] = useState<string>('');
  const [saving, setSaving] = useState(false);
  // Прийом шаблонів із сторінки Templates через router state і логування
  type TemplatesState = {
    from?: 'templates' | 'generation-fallback';
    entity?: 'product' | 'category';
    lang?: string;
    prompts?: Partial<Record<SiteColumnName, SiteContentPrompt[]>>;
    productTpl?: ProductTemplates | null;
    categoryTpl?: CategoryTemplates | null;
  } | null;
  const incomingTemplates = (location.state ?? null) as TemplatesState;
  useEffect(() => {
    let st = incomingTemplates;
    if (!st) {
      try {
        const raw = sessionStorage.getItem(STORAGE_KEY_TEMPLATES_STATE);
        if (raw) st = JSON.parse(raw);
      } catch (e) {
        console.warn('[Templates -> Generation] Failed to parse state from sessionStorage', e);
      }
    }
    if (st) {
      console.log('[Templates -> Generation] state:', st);
      if (st.prompts) {
        Object.entries(st.prompts).forEach(([col, list]) => {
          console.log('[Templates -> Generation] column:', col, 'items:', list);
        });
      }
      if (st.productTpl) console.log('[Templates -> Generation] productTpl:', st.productTpl);
      if (st.categoryTpl) console.log('[Templates -> Generation] categoryTpl:', st.categoryTpl);
      setTemplatesState(st);
      return;
    }
    // Fallback: напряму завантажуємо промпти з API і локальні шаблони, щоб логувати навіть при прямому заході
    (async () => {
      try {
        const prompts = await fetchAllColumnPrompts();
        const productTpl = getTemplates('product', 'ua');
        const categoryTpl = getTemplates('category', 'ua');
        const fallback = {
          from: 'generation-fallback' as const,
          entity: 'product' as const,
          lang: 'ua',
          prompts,
          productTpl,
          categoryTpl,
        };
        console.log('[Templates -> Generation] Fallback fetched:', fallback);
        try {
          sessionStorage.setItem(STORAGE_KEY_TEMPLATES_STATE, JSON.stringify(fallback));
        } catch {
          // ignore storage errors
        }
        setTemplatesState(fallback);
      } catch (err) {
        console.warn('[Templates -> Generation] Fallback fetch failed', err);
      }
    })();
  }, [incomingTemplates]);
  const getRowKey = (desc: ContentDescription, index: number) =>
    String(
      desc.id ??
        `${desc.site_lang_code ?? '-'}|${desc.site_product ?? desc.product_name ?? '-'}|${index}`
    );
  const isCellChecked = (rowKey: string, col: string) => !!selectedCells[`${rowKey}:${col}`];
  const isGeneratableColumn = (col: string): col is SiteColumnName =>
    (SITE_COLUMNS as string[]).includes(col);

  const mapSiteColumnToProductTplKey: Record<SiteColumnName, keyof ProductTemplates> = {
    product: 'name',
    shortname: 'shortname',
    short_description: 'short_description',
    full_description: 'full_description',
    promo_text: 'promo_text',
    meta_keywords: 'meta_keywords',
    meta_description: 'meta_description',
    searchwords: 'search_words',
    page_title: 'page_title',
  };

  // Відповідність колонок таблиці до полів об'єкта ContentDescription
  const mapSiteColumnToContentField: Record<SiteColumnName, keyof ContentDescription> = {
    product: 'site_product',
    shortname: 'site_shortname',
    short_description: 'site_short_description',
    full_description: 'site_full_description',
    promo_text: 'site_promo_text',
    meta_keywords: 'site_meta_keywords',
    meta_description: 'site_meta_description',
    searchwords: 'site_searchwords',
    page_title: 'site_page_title',
  };

  const resolvePromptForColumn = (col: SiteColumnName): string | null => {
    const st = templatesState as any;
    // 1) намагаємось збережені prompts (перший елемент у колонці)
    const list = st?.prompts?.[col] as Array<{ prompt: string }> | undefined;
    const fromPrompts = list?.[0]?.prompt;
    if (fromPrompts && typeof fromPrompts === 'string') return fromPrompts;
    // 2) fallback до локальних шаблонів productTpl
    const tplKey = mapSiteColumnToProductTplKey[col];
    const fromTpl = st?.productTpl?.[tplKey] as string | undefined;
    if (fromTpl && typeof fromTpl === 'string') return fromTpl;
    return null;
  };

  // Універсальний парсер відповіді бекенда, щоб дістати згенерований текст
  const extractGeneratedText = (res: unknown): string | null => {
    try {
      if (res == null) return null;
      if (typeof res === 'string') return res;
      if (Array.isArray(res)) {
        // Напр., масив рядків або масив об'єктів з text/content
        const first = res[0] as any;
        if (typeof first === 'string') return first;
        if (first && typeof first === 'object') {
          const t = first.text ?? first.content ?? first.value ?? first.result;
          if (typeof t === 'string' && t.trim()) return t;
        }
      }
      if (typeof res === 'object') {
        const obj: any = res;
        // Поширені властивості
        const maybe = obj.generated_text ?? obj.result ?? obj.text ?? obj.content ?? obj.value ?? obj.output ?? obj.data ?? obj.message;
        if (typeof maybe === 'string' && maybe.trim()) return maybe;
        // OpenAI-подібна форма
        if (Array.isArray(obj.choices) && obj.choices.length) {
          const ch0 = obj.choices[0];
          const msg = ch0?.message?.content ?? ch0?.text;
          if (typeof msg === 'string' && msg.trim()) return msg;
        }
        // Обгортки { items } / { data }
        if (Array.isArray(obj.items) && obj.items.length) {
          const i0 = obj.items[0];
          const t = (typeof i0 === 'string') ? i0 : (i0?.text ?? i0?.content ?? i0?.value ?? i0?.result);
          if (typeof t === 'string' && t.trim()) return t;
        }
        if (Array.isArray(obj.data) && obj.data.length) {
          const d0 = obj.data[0];
          const t = (typeof d0 === 'string') ? d0 : (d0?.text ?? d0?.content ?? d0?.value ?? d0?.result);
          if (typeof t === 'string' && t.trim()) return t;
        }
      }
    } catch {
      // ігноруємо
    }
    return null;
  };

  const handleGenerateForCell = async (
    col: SiteColumnName,
    desc: ContentDescription,
    rowKey: string
  ) => {
    if (!templatesState) {
      toast({ title: 'Шаблони ще завантажуються', description: 'Спробуйте ще раз за мить' });
      return;
    }
    const site_product = desc.site_product || desc.product_name || '';
    const site_full_description = desc.site_full_description || desc.description || '';
    if (!site_product) {
      toast({ title: 'Немає назви продукту', description: 'Поле site_product порожнє', variant: 'destructive' });
      return;
    }
    const prompt = resolvePromptForColumn(col);
    if (!prompt) {
      toast({ title: 'Не знайдено промпт', description: `Колонка: ${col}`, variant: 'destructive' });
      return;
    }
    try {
      const payload = { site_product, site_full_description, prompt, model_name: 'GPT-4o-mini' } as const;
      const res = await generateAiDescription(payload);
      console.log('[GenerateAI] Request:', payload, 'Response:', res);
      const generated = extractGeneratedText(res);
      if (generated && typeof generated === 'string') {
        const field = mapSiteColumnToContentField[col];
        setDescriptions(prev => prev.map((it, idx) => {
          const key = getRowKey(it, idx);
          if (key !== rowKey) return it;
          return { ...it, [field]: generated } as ContentDescription;
        }));
      } else {
        console.warn('[GenerateAI] Не вдалось прочитати результат для', col, res);
      }
    } catch (e) {
      console.error('[GenerateAI] Failed', e);
    }
  };
  const onCellCheckedChangeWithLog = (
    rowKey: string,
    col: string,
    desc: ContentDescription,
    checked: boolean | 'indeterminate'
  ) => {
    setSelectedCells(prev => ({ ...prev, [`${rowKey}:${col}`]: checked === true }));
    console.log({
      site_product: desc.site_product || desc.product_name || '-',
      site_full_description: desc.site_full_description || desc.description || '-',
      cell: col,
    });
    if (checked === true && isGeneratableColumn(col)) {
      void handleGenerateForCell(col as SiteColumnName, desc, rowKey);
    }
  };

  // Масова генерація всіх порожніх полів на поточній сторінці (послідовно)
  const handleMassGenerate = async () => {
    if (!templatesState) {
      console.warn('[MassGenerate] Шаблони ще не готові');
      return;
    }
    setMassGenerating(true);
    setMassProgress('');
    try {
      const cols = SITE_COLUMNS as SiteColumnName[];
      type Job = { rowIdx: number; row: ContentDescription; rowKey: string; col: SiteColumnName };
      const jobs: Job[] = [];
      descriptions.forEach((desc, idx) => {
        const rowKey = getRowKey(desc, idx);
        cols.forEach((col) => {
          const field = mapSiteColumnToContentField[col];
          const currentVal = (desc as any)[field] as string | null | undefined;
          if (!currentVal || String(currentVal).trim() === '') {
            jobs.push({ rowIdx: idx, row: desc, rowKey, col });
          }
        });
      });
      if (jobs.length === 0) {
        setMassProgress('Немає порожніх полів на сторінці');
        return;
      }
      let done = 0;
      for (const job of jobs) {
        const desc = job.row;
        const site_product = desc.site_product || desc.product_name || '';
        const site_full_description = desc.site_full_description || desc.description || '';
        if (!site_product) { done++; setMassProgress(`${done}/${jobs.length}`); continue; }
        const prompt = resolvePromptForColumn(job.col);
        if (!prompt) { done++; setMassProgress(`${done}/${jobs.length}`); continue; }
        try {
          const payload = { site_product, site_full_description, prompt, model_name: 'GPT-4o-mini' } as const;
          const res = await generateAiDescription(payload);
          const generated = extractGeneratedText(res);
          if (generated && typeof generated === 'string') {
            const field = mapSiteColumnToContentField[job.col];
            setDescriptions(prev => prev.map((it, idx) =>
              idx === job.rowIdx ? ({ ...it, [field]: generated } as ContentDescription) : it
            ));
          } else {
            console.warn('[MassGenerate] Порожній результат для', job.col);
          }
        } catch (e) {
          console.error('[MassGenerate] Помилка', e);
        } finally {
          done++;
          setMassProgress(`${done}/${jobs.length}`);
        }
      }
    } finally {
      setMassGenerating(false);
    }
  };
  
  // Масова генерація лише для однієї колонки (порожні клітинки на поточній сторінці)
  const handleMassGenerateColumn = async (col: SiteColumnName) => {
    if (!templatesState) {
      console.warn('[MassGenerateColumn] Шаблони ще не готові');
      return;
    }
    setColGenerating(col);
    setColProgress('');
    try {
      const field = mapSiteColumnToContentField[col];
      const jobs = descriptions
        .map((desc, idx) => ({ desc, idx }))
        .filter(({ desc }) => {
          const v = (desc as any)[field] as string | null | undefined;
          return !v || String(v).trim() === '';
        });
      if (jobs.length === 0) {
        setColProgress('Немає порожніх полів');
        return;
      }
      const prompt = resolvePromptForColumn(col);
      if (!prompt) {
        console.warn('[MassGenerateColumn] Не знайдено промпт для', col);
        return;
      }
      let done = 0;
      for (const job of jobs) {
        const desc = job.desc;
        const site_product = desc.site_product || desc.product_name || '';
        const site_full_description = desc.site_full_description || desc.description || '';
        if (!site_product) { done++; setColProgress(`${done}/${jobs.length}`); continue; }
        try {
          const payload = { site_product, site_full_description, prompt, model_name: 'GPT-4o-mini' } as const;
          const res = await generateAiDescription(payload);
          const generated = extractGeneratedText(res);
          if (generated && typeof generated === 'string') {
            setDescriptions(prev => prev.map((it, idx) => (
              idx === job.idx ? ({ ...it, [field]: generated } as ContentDescription) : it
            )));
          } else {
            console.warn('[MassGenerateColumn] Порожній результат для', col);
          }
        } catch (e) {
          console.error('[MassGenerateColumn] Помилка', e);
        } finally {
          done++;
          setColProgress(`${done}/${jobs.length}`);
        }
      }
    } finally {
      setColGenerating(null);
    }
  };

  // Збереження лише змінених рядків у бекенд
  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      // Побудова мапи початкових значень за стабільними ключами
      const initialById = new Map<number, ContentDescription>();
      const initialByComposite = new Map<string, ContentDescription>();
      const makeCompositeKey = (d: ContentDescription) => `${d.site_lang_code ?? ''}|${d.site_product ?? d.product_name ?? ''}`;
      initialDescriptions.forEach((desc) => {
        if (typeof desc.product_id === 'number') initialById.set(desc.product_id, desc);
        initialByComposite.set(makeCompositeKey(desc), desc);
      });

      const payload: Array<any> = [];
      let skippedNoProductId = 0;
      const diffFields: Array<keyof ContentDescription> = [
        'site_lang_code' as any,
        'site_product' as any,
        'site_shortname',
        'site_short_description',
        'site_full_description',
        'site_meta_keywords',
        'site_meta_description',
        'site_searchwords',
        'site_page_title',
        'site_promo_text',
      ];

      descriptions.forEach((curr) => {
        // Знаходимо базовий рядок: спершу за product_id, інакше за композитним ключем
        const base = typeof curr.product_id === 'number'
          ? initialById.get(curr.product_id)
          : initialByComposite.get(`${curr.site_lang_code ?? ''}|${curr.site_product ?? curr.product_name ?? ''}`);
        if (!base) {
          const product_id = curr.product_id;
          if (typeof product_id !== 'number') { skippedNoProductId++; return; }
          // Новий рядок: надсилаємо повний рядок (усі поля)
          const item: any = {
            product_id,
            site_lang_code: curr.site_lang_code ?? null,
            site_product: curr.site_product ?? curr.product_name ?? null,
            site_shortname: curr.site_shortname ?? null,
            site_short_description: curr.site_short_description ?? null,
            site_full_description: curr.site_full_description ?? null,
            site_meta_keywords: curr.site_meta_keywords ?? null,
            site_meta_description: curr.site_meta_description ?? null,
            site_searchwords: curr.site_searchwords ?? null,
            site_page_title: curr.site_page_title ?? null,
            site_promo_text: curr.site_promo_text ?? null,
          };
          payload.push(item);
          return;
        }
        let hasDiff = false;
        diffFields.forEach((f) => {
          const beforeVal = (base as any)[f] ?? null;
          const afterVal = (curr as any)[f] ?? null;
          if (String(beforeVal ?? '') !== String(afterVal ?? '')) {
            hasDiff = true;
          }
        });
        if (hasDiff) {
          const product_id = typeof curr.product_id === 'number' ? curr.product_id : (typeof base?.product_id === 'number' ? base!.product_id : undefined);
          if (typeof product_id !== 'number') { skippedNoProductId++; return; }
          // Існуючий рядок: надсилаємо повний рядок (усі поля)
          const fullItem: any = {
            product_id,
            site_lang_code: curr.site_lang_code ?? base.site_lang_code ?? null,
            site_product: curr.site_product ?? curr.product_name ?? base.site_product ?? base.product_name ?? null,
            site_shortname: curr.site_shortname ?? null,
            site_short_description: curr.site_short_description ?? null,
            site_full_description: curr.site_full_description ?? null,
            site_meta_keywords: curr.site_meta_keywords ?? null,
            site_meta_description: curr.site_meta_description ?? null,
            site_searchwords: curr.site_searchwords ?? null,
            site_page_title: curr.site_page_title ?? null,
            site_promo_text: curr.site_promo_text ?? null,
          };
          payload.push(fullItem);
        }
      });

      if (payload.length === 0) {
        if (skippedNoProductId > 0) {
          toast({
            title: 'Не вдалося зберегти',
            description: `Зміни в ${skippedNoProductId} рядках пропущені через відсутність product_id.`,
            variant: 'destructive',
          });
        } else {
          toast({ title: 'Немає змін', description: 'Жоден рядок не було змінено' });
        }
        return;
      }

      await updateSiteDescriptions({ descriptions: payload });
      const extra = skippedNoProductId > 0 ? ` (пропущено без product_id: ${skippedNoProductId})` : '';
      toast({ title: 'Збережено', description: `Оновлено рядків: ${payload.length}${extra}` });
      // Оновлюємо базову копію після успішного збереження
      setInitialDescriptions(descriptions.map(it => ({ ...it })));
    } catch (e) {
      console.error('[SaveChanges] Failed', e);
      toast({ title: 'Помилка збереження', description: 'Спробуйте ще раз пізніше', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

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
      // Зберігаємо базовий стан для виявлення змін
      setInitialDescriptions(response.items.map(it => ({ ...it })));
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

  // При зміні пошуку або користувацьких фільтрів переходимо на першу сторінку
  useEffect(() => {
    setPage(1);
  }, [searchQuery, customFilters]);

  // Очищення вибору клітинок при зміні джерела даних (page/filters/search/limit/productType)
  useEffect(() => {
    setSelectedCells({});
  }, [selectedProductType, page, limit, searchQuery, customFilters]);

  // Вимірювання ширини таблиці та визначення, чи потрібні скролбари
  useEffect(() => {
    const measure = () => {
      // Використовуємо контейнер таблиці
      const el = tableScrollRef.current;
      if (!el) return;
      // Затримка для коректного вимірювання після рендеру
      requestAnimationFrame(() => {
        const contentWidth = el.scrollWidth;
        setTableWidth(contentWidth > 0 ? contentWidth : 1500);
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

  // Видалено onTopWheel як невживаний для уникнення лінт-помилки

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

  // Інлайн-редактор тексту клітинки, відкривається по кліку
  type EditableTextCellProps = {
    rowKey: string;
    col: SiteColumnName;
    value: string;
    long?: boolean;
    placeholder?: string;
    truncate?: number; // якщо 0/undefined — без скорочення
  };
  const EditableTextCell = ({ rowKey, col, value, long = false, placeholder = '-', truncate = 0 }: EditableTextCellProps) => {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState<string>(value);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

    useEffect(() => {
      if (editing && inputRef.current) {
        inputRef.current.focus();
      }
    }, [editing]);

    // Оновлюємо чернетку, якщо значення змінилось зовні
    useEffect(() => {
      if (!editing) setDraft(value);
    }, [value, editing]);

    const save = () => {
      const field = mapSiteColumnToContentField[col];
      const newVal = draft;
      setDescriptions(prev => prev.map((it, idx) => {
        const key = getRowKey(it, idx);
        if (key !== rowKey) return it;
        return { ...it, [field]: newVal } as ContentDescription;
      }));
      setEditing(false);
    };

    const cancel = () => {
      setEditing(false);
      setDraft(value);
    };

    if (!editing) {
      const shown = truncate ? truncateText(value, truncate) : value;
      return (
        <div
          className="w-full flex-1 text-sm text-gray-700 dark:text-gray-300 cursor-text hover:bg-gray-50 dark:hover:bg-gray-700 rounded px-1 line-clamp-4 whitespace-normal break-words"
          onClick={(e) => { e.stopPropagation(); setEditing(true); }}
          title={value || placeholder}
        >
          {shown || placeholder}
        </div>
      );
    }

    return (
      <div onClick={(e) => e.stopPropagation()} className="w-full flex-1">
        {long ? (
          <textarea
            ref={inputRef as any}
            className="w-full text-sm bg-transparent border border-gray-300 dark:border-gray-600 rounded p-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={save}
            rows={4}
          />
        ) : (
          <Input
            ref={inputRef as any}
            className="w-full text-sm bg-transparent border border-gray-300 dark:border-gray-600 rounded p-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); save(); }
              if (e.key === 'Escape') { e.preventDefault(); cancel(); }
            }}
          />
        )}
      </div>
    );
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
            <h1 className="text-2xl font-bold"> AI генерація</h1>
            
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
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleSaveChanges}
                disabled={saving}
                title="Надіслати лише змінені рядки до бекенду"
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Зберегти зміни
              </Button>
              <Button
                className="bg-purple-600 hover:bg-purple-700 text-white"
                onClick={handleMassGenerate}
                disabled={massGenerating || !templatesState}
              >
                {massGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Масова генерація{massGenerating && massProgress ? ` (${massProgress})` : ''}
              </Button>
              <Button variant="outline" onClick={fetchData}>
                Оновити
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Top horizontal scrollbar (outside card to avoid clipping) */}
    {/*   {showScrollbars && (
        <div
          ref={topScrollRef}
          onScroll={onTopScroll}
          onWheel={onTopWheel} 
          className="overflow-x-scroll w-full h-8 cursor-pointer sticky top-0 z-50 pointer-events-auto bg-gray-200/95 dark:bg-gray-800/95 backdrop-blur border-y border-gray-400 dark:border-gray-600 shadow-md [&::-webkit-scrollbar]:h-4 [&::-webkit-scrollbar-thumb]:bg-gray-600 dark:[&::-webkit-scrollbar-thumb]:bg-gray-500 [&::-webkit-scrollbar-thumb]:rounded-md [&::-webkit-scrollbar-thumb:hover]:bg-gray-700 dark:[&::-webkit-scrollbar-thumb:hover]:bg-gray-400 [&::-webkit-scrollbar-track]:bg-gray-300 dark:[&::-webkit-scrollbar-track]:bg-gray-700"
          style={{ scrollbarWidth: 'auto', msOverflowStyle: 'auto' }}
        >
          <div className="h-px" style={{ width: tableWidth, minWidth: "100%" }} aria-hidden />
        </div>
      )}*/}

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm overflow-x-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2">Завантаження...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : (
          <>
            {/* Контейнер з таблицею (нижній скролбар) */}
            <div
              ref={tableScrollRef}
              onScroll={onBottomScroll}
              className="overflow-x-auto"
            >
              <div style={{ width: tableWidth, minWidth: "100%" }}>
              <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-900">
                  <TableHead className="h-16 sm:h-20 w-24 text-gray-700 dark:text-gray-300 font-medium">Мова</TableHead>
                  <TableHead noClamp className="h-16 sm:h-20 min-w-[350px] text-gray-700 dark:text-gray-300 font-medium">
                    <div className="flex flex-col gap-1 items-start justify-center h-full">
                      <div>Назва продукту</div>
                      <Button
                        variant="outline"
                        className="h-6 px-2 py-0 text-xs"
                        onClick={() => handleMassGenerateColumn('product')}
                        disabled={!!colGenerating || massGenerating || !templatesState}
                        title="Заповнити порожні клітинки у колонці 'Назва продукту'"
                      >
                        {colGenerating === 'product' ? (
                          <>
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Генерація{colProgress ? ` (${colProgress})` : ''}
                          </>
                        ) : (
                          'Заповнити порожні'
                        )}
                      </Button>
                    </div>
                  </TableHead>
                  <TableHead noClamp className="h-16 sm:h-20 w-40 text-gray-700 dark:text-gray-300 font-medium">
                    <div className="flex flex-col gap-1 items-start justify-center h-full">
                      <div>Коротка назва</div>
                      <Button
                        variant="outline"
                        className="h-6 px-2 py-0 text-xs"
                        onClick={() => handleMassGenerateColumn('shortname')}
                        disabled={!!colGenerating || massGenerating || !templatesState}
                        title="Заповнити порожні клітинки у колонці 'Коротка назва'"
                      >
                        {colGenerating === 'shortname' ? (
                          <>
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Генерація{colProgress ? ` (${colProgress})` : ''}
                          </>
                        ) : (
                          'Заповнити порожні'
                        )}
                      </Button>
                    </div>
                  </TableHead>
                  <TableHead noClamp className="h-16 sm:h-20 min-w-[200px] text-gray-700 dark:text-gray-300 font-medium">
                    <div className="flex flex-col gap-1 items-start justify-center h-full">
                      <div>Короткий опис</div>
                      <Button
                        variant="outline"
                        className="h-6 px-2 py-0 text-xs"
                        onClick={() => handleMassGenerateColumn('short_description')}
                        disabled={!!colGenerating || massGenerating || !templatesState}
                        title="Заповнити порожні клітинки у колонці 'Короткий опис'"
                      >
                        {colGenerating === 'short_description' ? (
                          <>
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Генерація{colProgress ? ` (${colProgress})` : ''}
                          </>
                        ) : (
                          'Заповнити порожні'
                        )}
                      </Button>
                    </div>
                  </TableHead>
                  <TableHead noClamp className="h-16 sm:h-20 min-w-[200px] text-gray-700 dark:text-gray-300 font-medium">
                    <div className="flex flex-col gap-1 items-start justify-center h-full">
                      <div>Повний опис</div>
                      <Button
                        variant="outline"
                        className="h-6 px-2 py-0 text-xs"
                        onClick={() => handleMassGenerateColumn('full_description')}
                        disabled={!!colGenerating || massGenerating || !templatesState}
                        title="Заповнити порожні клітинки у колонці 'Повний опис'"
                      >
                        {colGenerating === 'full_description' ? (
                          <>
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Генерація{colProgress ? ` (${colProgress})` : ''}
                          </>
                        ) : (
                          'Заповнити порожні'
                        )}
                      </Button>
                    </div>
                  </TableHead>
                  <TableHead noClamp className="h-16 sm:h-20 min-w-[200px] text-gray-700 dark:text-gray-300 font-medium">
                    <div className="flex flex-col gap-1 items-start justify-center h-full">
                      <div>Промо-текст</div>
                      <Button
                        variant="outline"
                        className="h-6 px-2 py-0 text-xs"
                        onClick={() => handleMassGenerateColumn('promo_text')}
                        disabled={!!colGenerating || massGenerating || !templatesState}
                        title="Заповнити порожні клітинки у колонці 'Промо-текст'"
                      >
                        {colGenerating === 'promo_text' ? (
                          <>
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Генерація{colProgress ? ` (${colProgress})` : ''}
                          </>
                        ) : (
                          'Заповнити порожні'
                        )}
                      </Button>
                    </div>
                  </TableHead>
                  <TableHead noClamp className="h-16 sm:h-20 min-w-[150px] text-gray-700 dark:text-gray-300 font-medium">
                    <div className="flex flex-col gap-1 items-start justify-center h-full">
                      <div>Мета-ключові слова</div>
                      <Button
                        variant="outline"
                        className="h-6 px-2 py-0 text-xs"
                        onClick={() => handleMassGenerateColumn('meta_keywords')}
                        disabled={!!colGenerating || massGenerating || !templatesState}
                        title="Заповнити порожні клітинки у колонці 'Мета-ключові слова'"
                      >
                        {colGenerating === 'meta_keywords' ? (
                          <>
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Генерація{colProgress ? ` (${colProgress})` : ''}
                          </>
                        ) : (
                          'Заповнити порожні'
                        )}
                      </Button>
                    </div>
                  </TableHead>
                  <TableHead noClamp className="h-16 sm:h-20 min-w-[150px] text-gray-700 dark:text-gray-300 font-medium">
                    <div className="flex flex-col gap-1 items-start justify-center h-full">
                      <div>Мета-опис</div>
                      <Button
                        variant="outline"
                        className="h-6 px-2 py-0 text-xs"
                        onClick={() => handleMassGenerateColumn('meta_description')}
                        disabled={!!colGenerating || massGenerating || !templatesState}
                        title="Заповнити порожні клітинки у колонці 'Мета-опис'"
                      >
                        {colGenerating === 'meta_description' ? (
                          <>
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Генерація{colProgress ? ` (${colProgress})` : ''}
                          </>
                        ) : (
                          'Заповнити порожні'
                        )}
                      </Button>
                    </div>
                  </TableHead>
                  <TableHead noClamp className="h-16 sm:h-20 min-w-[150px] text-gray-700 dark:text-gray-300 font-medium">
                    <div className="flex flex-col gap-1 items-start justify-center h-full">
                      <div>Пошукові слова</div>
                      <Button
                        variant="outline"
                        className="h-6 px-2 py-0 text-xs"
                        onClick={() => handleMassGenerateColumn('searchwords')}
                        disabled={!!colGenerating || massGenerating || !templatesState}
                        title="Заповнити порожні клітинки у колонці 'Пошукові слова'"
                      >
                        {colGenerating === 'searchwords' ? (
                          <>
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Генерація{colProgress ? ` (${colProgress})` : ''}
                          </>
                        ) : (
                          'Заповнити порожні'
                        )}
                      </Button>
                    </div>
                  </TableHead>
                  <TableHead noClamp className="h-16 sm:h-20 min-w-[150px] text-gray-700 dark:text-gray-300 font-medium">
                    <div className="flex flex-col gap-1 items-start justify-center h-full">
                      <div>Заголовок сторінки</div>
                      <Button
                        variant="outline"
                        className="h-6 px-2 py-0 text-xs"
                        onClick={() => handleMassGenerateColumn('page_title')}
                        disabled={!!colGenerating || massGenerating || !templatesState}
                        title="Заповнити порожні клітинки у колонці 'Заголовок сторінки'"
                      >
                        {colGenerating === 'page_title' ? (
                          <>
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Генерація{colProgress ? ` (${colProgress})` : ''}
                          </>
                        ) : (
                          'Заповнити порожні'
                        )}
                      </Button>
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDescriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                      Немає даних для відображення
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDescriptions.map((desc, index) => {
                    const rowKey = getRowKey(desc, index);
                    return (
                      <TableRow key={desc.id || desc.site_product || index} className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700">
                        <TableCell className="py-3">
                          <div className="flex items-start gap-2">
                            <Checkbox
                            aria-label="Вибрати клітинку"
                            checked={isCellChecked(rowKey, 'lang')}
                            onCheckedChange={(checked) => onCellCheckedChangeWithLog(rowKey, 'lang', desc, checked)}
                            onClick={(e) => e.stopPropagation()}
                          />
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800">
                              {getLanguageName(desc.site_lang_code) || desc.product_type || '-'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-start gap-2 w-full min-w-0">
                            <Checkbox
                            aria-label="Вибрати клітинку"
                            checked={isCellChecked(rowKey, 'product')}
                            onCheckedChange={(checked) => onCellCheckedChangeWithLog(rowKey, 'product', desc, checked)}
                            onClick={(e) => e.stopPropagation()}
                          />
                            <EditableTextCell
                              rowKey={rowKey}
                              col="product"
                              value={desc.site_product || desc.product_name || ''}
                              long={true}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-start gap-2 w-full min-w-0">
                            <Checkbox
                            aria-label="Вибрати клітинку"
                            checked={isCellChecked(rowKey, 'shortname')}
                            onCheckedChange={(checked) => onCellCheckedChangeWithLog(rowKey, 'shortname', desc, checked)}
                            onClick={(e) => e.stopPropagation()}
                          />
                            <EditableTextCell
                              rowKey={rowKey}
                              col="shortname"
                              value={desc.site_shortname || ''}
                              long
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-start gap-2 w-full min-w-0">
                            <Checkbox
                            aria-label="Вибрати клітинку"
                            checked={isCellChecked(rowKey, 'short_description')}
                            onCheckedChange={(checked) => onCellCheckedChangeWithLog(rowKey, 'short_description', desc, checked)}
                            onClick={(e) => e.stopPropagation()}
                          />
                            <EditableTextCell
                              rowKey={rowKey}
                              col="short_description"
                              value={desc.site_short_description || ''}
                              long
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-start gap-2 w-full min-w-0">
                            <Checkbox
                            aria-label="Вибрати клітинку"
                            checked={isCellChecked(rowKey, 'full_description')}
                            onCheckedChange={(checked) => onCellCheckedChangeWithLog(rowKey, 'full_description', desc, checked)}
                            onClick={(e) => e.stopPropagation()}
                          />
                            <EditableTextCell
                              rowKey={rowKey}
                              col="full_description"
                              value={desc.site_full_description || desc.description || ''}
                              long
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-start gap-2 w-full min-w-0">
                            <Checkbox
                            aria-label="Вибрати клітинку"
                            checked={isCellChecked(rowKey, 'promo_text')}
                            onCheckedChange={(checked) => onCellCheckedChangeWithLog(rowKey, 'promo_text', desc, checked)}
                            onClick={(e) => e.stopPropagation()}
                          />
                            <EditableTextCell
                              rowKey={rowKey}
                              col="promo_text"
                              value={desc.site_promo_text || ''}
                              long
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-start gap-2 w-full min-w-0">
                            <Checkbox
                            aria-label="Вибрати клітинку"
                            checked={isCellChecked(rowKey, 'meta_keywords')}
                            onCheckedChange={(checked) => onCellCheckedChangeWithLog(rowKey, 'meta_keywords', desc, checked)}
                            onClick={(e) => e.stopPropagation()}
                          />
                            <EditableTextCell
                              rowKey={rowKey}
                              col="meta_keywords"
                              value={desc.site_meta_keywords || ''}
                              long
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-start gap-2 w-full min-w-0">
                            <Checkbox
                            aria-label="Вибрати клітинку"
                            checked={isCellChecked(rowKey, 'meta_description')}
                            onCheckedChange={(checked) => onCellCheckedChangeWithLog(rowKey, 'meta_description', desc, checked)}
                            onClick={(e) => e.stopPropagation()}
                          />
                            <EditableTextCell
                              rowKey={rowKey}
                              col="meta_description"
                              value={desc.site_meta_description || ''}
                              long
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-start gap-2 w-full min-w-0">
                            <Checkbox
                            aria-label="Вибрати клітинку"
                            checked={isCellChecked(rowKey, 'searchwords')}
                            onCheckedChange={(checked) => onCellCheckedChangeWithLog(rowKey, 'searchwords', desc, checked)}
                            onClick={(e) => e.stopPropagation()}
                          />
                            <EditableTextCell
                              rowKey={rowKey}
                              col="searchwords"
                              value={desc.site_searchwords || ''}
                              long
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-start gap-2 w-full min-w-0">
                            <Checkbox
                            aria-label="Вибрати клітинку"
                            checked={isCellChecked(rowKey, 'page_title')}
                            onCheckedChange={(checked) => onCellCheckedChangeWithLog(rowKey, 'page_title', desc, checked)}
                            onClick={(e) => e.stopPropagation()}
                          />
                            <EditableTextCell
                              rowKey={rowKey}
                              col="page_title"
                              value={desc.site_page_title || ''}
                              long
                            />
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
            {totalPages > 1 && (
              <div className="flex flex-col gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
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
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="30">30</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
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
          </>
        )}
      </div>
    </div>
  );
}
