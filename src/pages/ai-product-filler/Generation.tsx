
import { useState, useEffect, useRef, useCallback, useMemo, Fragment, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Search, Loader2, Plus, X, Save, ArrowUpDown, ChevronDown, ChevronRight, ArrowRight, ArrowLeftRight } from 'lucide-react';
import { Checkbox } from '@/components/ui/Checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { fetchContentDescriptions, ProductType, generateAiCategoryDescription, CATEGORY_FIELD_MAPPING } from '@/api/contentDescriptions';
import { fetchSiteCategoriesDescriptions, updateSiteCategoriesDescriptions, type SiteCategoryDescription, type UpdateSiteCategoryDescriptionRequest } from '@/api/siteCategoriesDescriptions';
import { fetchAllColumnPrompts, fetchColumnPrompts, type SiteColumnName, type SiteContentPrompt, SITE_COLUMNS } from '@/api/contentPrompts';
import { getTemplates } from '@/api/productFillerMock';
import type { ProductTemplates, CategoryTemplates } from '@/api/productFillerMock';
import { generateAiDescription } from '@/api/generateAiDescription';
import { aiTranslateSiteDescriptions, translateSiteDescriptionsFree, type TranslateDescriptionItem } from '@/api/translateSiteDescriptions';
import { chatApi } from '@/api/chatApi';
import { updateSiteDescriptions } from '@/api/updateSiteDescriptions';
import { toast } from '@/hooks/use-toast';
import { Pagination } from '@/components/ui/Pagination';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { useLocation } from 'react-router-dom';
import bgImage from './img/photo_2025-09-02_23-21-26.jpg';
import AIProductFillerLayout from './components/AIProductFillerLayout';
import { useTheme } from '@/hooks/useTheme';
import { usePFI18n } from './i18n';
import { useSiteCategories } from '@/hooks/useSiteCategories';
import { useCategoryGeneration } from './useCategoryGeneration';
import { CATEGORY_COLUMNS, type CategoryColumnName } from './categoryGeneration';
import { dataCache } from '@/utils/dataCache';

interface ContentDescription {
  id?: number;
  product_id?: number;
  product_type?: ProductType;
  product_name?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
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

// Модель чату для вибору моделі генерації
interface ChatModel {
  id: number;
  name: string;
  icon: string;
  input_tokens_price?: number;
  output_tokens_price?: number;
}

interface CustomFilter {
  id: string;
  name: string;
  field: string;
  value: string;
  active: boolean;
}

// Колонку мови видалено — мапа назв мов більше не потрібна

export default function AIProductFillerGeneration({ title: _title = 'AI генерація', mode = 'generation' }: { title?: string; mode?: 'generation' | 'translation' }) {
  const location = useLocation();
  const { isDarkMode } = useTheme();
  const { t } = usePFI18n();
  const { data: categories, isLoading: categoriesLoading } = useSiteCategories();
  const STORAGE_KEY_TEMPLATES_STATE = 'aiProductFiller.templatesState';
  const STORAGE_KEY_COLUMN_WIDTHS = 'aiProductFiller.columnWidths.v1';
  const STORAGE_KEY_UNSAVED = 'aiProductFiller.unsavedDiffs.v1';
  const STORAGE_KEY_CATEGORY_UNSAVED = 'aiProductFiller.categoryUnsavedDiffs.v1';

  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');
  const [isDataFromCache, setIsDataFromCache] = useState(false);
  
  const [descriptions, setDescriptions] = useState<ContentDescription[]>([]);
  const [initialDescriptions, setInitialDescriptions] = useState<ContentDescription[]>([]);
  const [categoryDescriptions, setCategoryDescriptions] = useState<SiteCategoryDescription[]>([]);
  const [initialCategoryDescriptions, setInitialCategoryDescriptions] = useState<SiteCategoryDescription[]>([]);
  const [loading, setLoading] = useState(false);
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [customFilters, setCustomFilters] = useState<CustomFilter[]>([]);
  const [newFilter, setNewFilter] = useState<Omit<CustomFilter, 'id' | 'active'>>({ name: '', field: 'site_product', value: '' });
  // Фільтр мови (ua/en/ru), за замовчуванням "ua"
  const [selectedLang, setSelectedLang] = useState<'ua' | 'en' | 'ru'>('ua');
  // Мова перекладу (цільова), використовується лише в режимі перекладу
  const [targetLang, setTargetLang] = useState<'ua' | 'en' | 'ru'>('ru');
  // Мова джерела для Free перекладу
  const [sourceLang, setSourceLang] = useState<'ua' | 'en' | 'ru'>('ua');
  // Моделі чату для вибору моделі генерації
  const [chatModels, setChatModels] = useState<ChatModel[]>([]);
  const [selectedChatModel, setSelectedChatModel] = useState<string>('');
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  // Сортування: колонки і напрям
  const [sortBy, setSortBy] = useState<SiteColumnName | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  // refs для синхронізації горизонтальних скролбарів
  const topScrollRef = useRef<HTMLDivElement | null>(null);
  const tableScrollRef = useRef<HTMLDivElement | null>(null);
  const isScrollingRef = useRef(false);
  // Вибір окремих клітинок
  // Вибір окремих клітинок категорій
const [categorySelectedCells, setCategorySelectedCells] = useState<Record<string, boolean>>({});
// Стани для категорій
const [categoryRowCheckedRows, setCategoryRowCheckedRows] = useState<Record<string, boolean>>({});
const [categoryColumnHeaderChecked, setCategoryColumnHeaderChecked] = useState<Partial<Record<string, boolean>>>({});
  const [selectedCells, setSelectedCells] = useState<Record<string, boolean>>({});
  // Стан для редагування клітинок категорій (rowKey:column)
  const [editingCategoryCell, setEditingCategoryCell] = useState<string | null>(null);
  
  console.log('🎯 [Generation] Component rendered, selectedCells:', selectedCells);
  
  // Рядки, у яких відбулась AI‑генерація в цій сесії (для селективного збереження)
  const [generatedRows, setGeneratedRows] = useState<Record<string, boolean>>({});
  const [templatesState, setTemplatesState] = useState<TemplatesState>(null);
  // Масова генерація
  const [massGenerating, setMassGenerating] = useState(false);
  const [massProgress, setMassProgress] = useState<string>('');
  // Генерація для вибраних клітинок
  const [selectedGenerating, setSelectedGenerating] = useState(false);
  const [selectedProgress, setSelectedProgress] = useState<string>('');
  // Статус генерації для конкретних клітинок (rowKey:col -> true)
  const [cellGenerating, setCellGenerating] = useState<Record<string, boolean>>({});
  // Статус перекладу для конкретних клітинок (rowKey:col -> true)
  const [cellTranslating, setCellTranslating] = useState<Record<string, boolean>>({});
  // Стан для перекладу вибраних
  const [translating, setTranslating] = useState(false);
  const [translateProgress, setTranslateProgress] = useState<string>('');
  // Режим перекладу доступний по пропсу mode
  // Документ заголовок за мовою і режимом
  useEffect(() => {
    const prev = document.title;
    const pageTitle = mode === 'translation' ? t('nav.translator') : t('nav.generation');
    document.title = `${pageTitle} — AI Product Filler`;
    return () => { document.title = prev; };
  }, [t, mode]);
  const isTranslateMode = mode === 'translation';
  // Масова генерація по колонці — видалено (замість кнопок у хедері використовуються чекбокси вибору колонки)
  const [saving, setSaving] = useState(false);
  // Незалежний візуальний стан чекбокса рядка, щоб вибір стовпця не впливав на нього
  const [rowCheckedRows, setRowCheckedRows] = useState<Record<string, boolean>>({});
  // Незалежний стан для чекбоксів у заголовках колонок (щоб вибір рядків їх не змінював)
  const [columnHeaderChecked, setColumnHeaderChecked] = useState<Partial<Record<SiteColumnName, boolean>>>({});
  // Стан розгортання рядків (незалежний від вибору/чекбоксів)
  const [expandedRowKeys, setExpandedRowKeys] = useState<Record<string, boolean>>({});
  const toggleRowExpanded = (rowKey: string) => setExpandedRowKeys(prev => ({ ...prev, [rowKey]: !prev[rowKey] }));
  // Ресайз колонок: ширини у px, за замовчуванням не задані (поведінка як зараз)
  const [columnWidths, setColumnWidths] = useState<Partial<Record<SiteColumnName, number>>>({});
  const resizingRef = useRef<{ col: SiteColumnName; startX: number; startWidth: number } | null>(null);
  // Промпти керуються на сторінці Templates; тут використовуємо активний з бекенду
  // Restore saved column widths
   
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_COLUMN_WIDTHS);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        // sanitize to numbers only
        const restored = Object.fromEntries(
          Object.entries(parsed).filter(([k, v]) => typeof v === 'number')
        ) as Partial<Record<SiteColumnName, number>>;
        setColumnWidths(restored);
      }
    } catch (e) {
      // noop
    }
  }, []);
  // Persist column widths when changed
  useEffect(() => {
    try {
      if (!columnWidths || Object.keys(columnWidths).length === 0) return;
      localStorage.setItem(STORAGE_KEY_COLUMN_WIDTHS, JSON.stringify(columnWidths));
    } catch (e) {
      // noop
    }
  }, [columnWidths]);

  // Initialize column widths to fit container (no scroll by default)
  useEffect(() => {
    try {
      // If widths already restored or set, skip
      if (columnWidths && Object.keys(columnWidths).length > 0) return;
      const container = tableScrollRef.current;
      if (!container) return;
      const total = container.clientWidth; // available width
      if (!total || total <= 0) return;
      const RESERVED_FIRST_COL = 96; // '№' column (w-24 ~ 96px)
      const safety = 16; // padding/scrollbar safety
      const avail = Math.max(120, total - RESERVED_FIRST_COL - safety);
      const cols = (SITE_COLUMNS as SiteColumnName[]);
      const even = Math.max(120, Math.floor(avail / cols.length));
      const init: Partial<Record<SiteColumnName, number>> = {};
      cols.forEach(c => { init[c] = even; });
      setColumnWidths(init);
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableScrollRef.current]);

  const onHeaderResizeMove = useCallback((e: MouseEvent) => {
    const ctx = resizingRef.current;
    if (!ctx) return;
    const delta = e.clientX - ctx.startX;
    const next = Math.max(120, ctx.startWidth + delta);
    setColumnWidths(prev => ({ ...prev, [ctx.col]: next }));
  }, []);
  const onHeaderResizeEnd = useCallback(() => {
    if (!resizingRef.current) return;
    resizingRef.current = null;
    document.removeEventListener('mousemove', onHeaderResizeMove);
    document.removeEventListener('mouseup', onHeaderResizeEnd);
  }, [onHeaderResizeMove]);
  const onResizeStart = (col: SiteColumnName) => (e: React.MouseEvent) => {
    const th = (e.currentTarget as HTMLElement).closest('th') as HTMLTableCellElement | null;
    const startWidth = th?.offsetWidth ?? 0;
    resizingRef.current = { col, startX: e.clientX, startWidth };
    document.addEventListener('mousemove', onHeaderResizeMove);
    document.addEventListener('mouseup', onHeaderResizeEnd);
    e.preventDefault();
    e.stopPropagation();
  };

    type UnsavedMap = Record<string, Partial<Pick<ContentDescription,
    'site_lang_code' | 'site_product' | 'site_shortname' | 'site_short_description' | 'site_full_description' | 'site_meta_keywords' | 'site_meta_description' | 'site_searchwords' | 'site_page_title' | 'site_promo_text'>>>;

  const readUnsaved = (): UnsavedMap => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_UNSAVED);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return (parsed && typeof parsed === 'object') ? parsed as UnsavedMap : {};
    } catch { return {}; }
  };
  const writeUnsaved = (data: UnsavedMap) => {
    try { localStorage.setItem(STORAGE_KEY_UNSAVED, JSON.stringify(data)); } catch {}
  };
  const clearAllUnsaved = () => { try { localStorage.removeItem(STORAGE_KEY_UNSAVED); } catch {} };

  const saveUnsavedField = (desc: ContentDescription, key: keyof ContentDescription, value: any) => {
    const stable = getStableKey(desc);
    const cur = readUnsaved();
    const entry = { ...(cur[stable] || {}) } as any;
    entry[key] = value;
    cur[stable] = entry;
    writeUnsaved(cur);
  };

  const applyUnsavedToItems = (items: ContentDescription[]): ContentDescription[] => {
    const cur = readUnsaved();
    if (!cur || Object.keys(cur).length === 0) return items;
    return items.map((it) => {
      const key = getStableKey(it);
      const patch = cur[key] as any;
      if (!patch) return it;
      const out: any = { ...it };
      Object.keys(patch).forEach((k) => {
        (out as any)[k] = (patch as any)[k];
      });
      return out as ContentDescription;
    });
  };

  // ===== ЗБЕРЕЖЕННЯ ЧЕРНЕТКИ КАТЕГОРІЙ В localStorage =====
  type CategoryUnsavedMap = Record<string, Partial<Pick<SiteCategoryDescription,
    'category' | 'description' | 'meta_keywords' | 'page_title'>>>;

  const getCategoryStableKey = (cat: SiteCategoryDescription): string => {
    return `cat_${cat.category_id}_${cat.lang_code}`;
  };

  const readCategoryUnsaved = (): CategoryUnsavedMap => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CATEGORY_UNSAVED);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return (parsed && typeof parsed === 'object') ? parsed as CategoryUnsavedMap : {};
    } catch { return {}; }
  };

  const writeCategoryUnsaved = (data: CategoryUnsavedMap) => {
    try { localStorage.setItem(STORAGE_KEY_CATEGORY_UNSAVED, JSON.stringify(data)); } catch {}
  };

  const clearAllCategoryUnsaved = () => { 
    try { localStorage.removeItem(STORAGE_KEY_CATEGORY_UNSAVED); } catch {} 
  };

  const saveCategoryUnsavedField = (cat: SiteCategoryDescription, key: keyof SiteCategoryDescription, value: any) => {
    const stable = getCategoryStableKey(cat);
    const map = readCategoryUnsaved();
    if (!map[stable]) map[stable] = {};
    map[stable][key as any] = value;
    writeCategoryUnsaved(map);
  };

  const applyCategoryUnsavedToItems = (items: SiteCategoryDescription[]): SiteCategoryDescription[] => {
    const cur = readCategoryUnsaved();
    if (!cur || Object.keys(cur).length === 0) return items;
    return items.map((cat) => {
      const key = getCategoryStableKey(cat);
      const patch = cur[key] as any;
      if (!patch) return cat;
      const out: any = { ...cat };
      Object.keys(patch).forEach((k) => {
        (out as any)[k] = (patch as any)[k];
      });
      return out as SiteCategoryDescription;
    });
  };

  // Перемикач рушія перекладу: 'ai' або 'free' (лише у режимі перекладу)
  const STORAGE_KEY_TRANSLATION_ENGINE = 'aiProductFiller.translationEngine';
  const [translationEngine, setTranslationEngine] = useState<'ai' | 'free'>('ai');
  useEffect(() => {
    if (mode !== 'translation') return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TRANSLATION_ENGINE);
      if (saved === 'ai' || saved === 'free') setTranslationEngine(saved);
    } catch {}
  }, [mode]);
  useEffect(() => {
    if (mode !== 'translation') return;
    try { localStorage.setItem(STORAGE_KEY_TRANSLATION_ENGINE, translationEngine); } catch {}
  }, [translationEngine, mode]);

  // Прапорець: після збереження потрібно взяти чисті серверні дані (без мерджу з локальними)
  const preferServerOnceRef = useRef(false);

  // Канонізація мовних кодів: 'ua' -> 'uk'
  const canonicalLang = (s: string | undefined | null) => {
    const v = (s || '').toLowerCase();
    if (v === 'ua' || v === 'uk') return 'uk';
    if (v === 'ru') return 'ru';
    if (v === 'en') return 'en';
    return v;
  };

  // Те саме, але з явним джерелом prompts (уникнути гонок setState під час генерації)
  const resolvePromptForColumnFrom = (
    promptsByCol: Record<SiteColumnName, SiteContentPrompt[]>,
    col: SiteColumnName
  ): string | null => {
    const st = templatesState as any;
    if (st?.enabled && st.enabled[col] === false) {
      console.info('[resolvePromptForColumnFrom] disabled by Templates', { col });
      return null;
    }
    const list = (promptsByCol?.[col] as SiteContentPrompt[] | undefined) || [];
    const norm = (s?: string) => (s || '').toLowerCase();
    const want = norm(selectedLang);
    const isSameLang = (code?: string) => (want === 'ua' ? (norm(code) === 'ua' || norm(code) === 'uk') : norm(code) === want);
    const byLang = list.filter(p => isSameLang(p.lang_code as any));
    const pool = byLang.length > 0 ? byLang : list;
    const active = pool.find(p => p.is_active);
    if (active?.prompt) {
      const preview = String(active.prompt).slice(0, 120);
      console.debug('[resolvePromptForColumnFrom] use', { col, source: 'active', id: active.id, name: active.name, preview });
      return active.prompt;
    }
    if (Array.isArray(pool) && pool.length > 0) {
      const latest = [...pool].filter(x => typeof x?.prompt === 'string').sort((a, b) => (b.id ?? 0) - (a.id ?? 0))[0];
      if (latest && typeof latest.prompt === 'string') {
        const preview = latest.prompt.slice(0, 120);
        console.debug('[resolvePromptForColumnFrom] use', { col, source: 'latest', id: latest.id, name: latest.name, preview });
        return latest.prompt;
      }
    }
    const tplKey = mapSiteColumnToProductTplKey[col];
    const fromTpl = st?.productTpl?.[tplKey] as string | undefined;
    if (fromTpl && typeof fromTpl === 'string') {
      const preview = fromTpl.slice(0, 120);
      console.debug('[resolvePromptForColumnFrom] use', { col, source: 'local-productTpl', tplKey, preview });
      return fromTpl;
    }
    console.warn('[resolvePromptForColumnFrom] no prompt available', { col });
    return null;
  };

  // Слухач події з Templates: коли користувач активує промпт, Generation підтягує зміни одразу
  useEffect(() => {
    const handler = async (e: CustomEvent<{ column?: SiteColumnName | null; lang?: 'ua' | 'en' | 'ru' }>) => {
      try {
        const detail = (e as any)?.detail || {};
        const eventLang = detail.lang as 'ua' | 'en' | 'ru' | undefined;
        const column = detail.column as SiteColumnName | undefined;
        if (eventLang && eventLang !== selectedLang) {
          console.info('[Generation] ai_pf_prompts_changed ignored (lang mismatch)', { eventLang, selectedLang });
          return;
        }
        if (column) {
          console.log('[Generation] Refresh prompts for column via event', { column, selectedLang });
          const list = await fetchColumnPrompts(column, selectedLang as any);
          setTemplatesState(prev => {
            const prevPrompts = ((prev as any)?.prompts ?? {}) as Record<SiteColumnName, SiteContentPrompt[]>;
            return { ...(prev || {}), prompts: { ...prevPrompts, [column]: list }, lang: selectedLang } as any;
          });
        } else {
          console.log('[Generation] Refresh all prompts via event', { selectedLang });
          const prompts = await fetchAllColumnPrompts(SITE_COLUMNS, selectedLang as any);
          setTemplatesState(prev => ({ ...(prev || {}), prompts, lang: selectedLang } as any));
        }
        toast({ title: 'Активний промпт оновлено' });
      } catch (err) {
        console.error('[Generation] Failed to handle ai_pf_prompts_changed', err);
      }
    };
    window.addEventListener('ai_pf_prompts_changed' as any, handler as any);
    return () => window.removeEventListener('ai_pf_prompts_changed' as any, handler as any);
  }, [selectedLang]);
  useEffect(() => () => {
    document.removeEventListener('mousemove', onHeaderResizeMove);
    document.removeEventListener('mouseup', onHeaderResizeEnd);
  }, [onHeaderResizeEnd, onHeaderResizeMove]);
  const getColStyle = useCallback((col: SiteColumnName) => {
    const w = columnWidths[col];
    return w ? ({ width: w, minWidth: w, maxWidth: w } as CSSProperties) : undefined;
  }, [columnWidths]);
  // Прийом шаблонів із сторінки Templates через router state і логування
  type TemplatesState = {
    from?: 'templates' | 'generation-fallback';
    entity?: 'product' | 'category';
    lang?: string;
    prompts?: Partial<Record<SiteColumnName, SiteContentPrompt[]>>;
    productTpl?: ProductTemplates | null;
    categoryTpl?: CategoryTemplates | null;
    enabled?: Partial<Record<SiteColumnName, boolean>>;
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
        const prompts = await fetchAllColumnPrompts(SITE_COLUMNS, selectedLang as any);
        const productTpl = getTemplates('product', selectedLang as any);
        const categoryTpl = getTemplates('category', selectedLang as any);
        const fallback = {
          from: 'generation-fallback' as const,
          entity: 'product' as const,
          lang: selectedLang,
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
  }, [incomingTemplates, selectedLang]);

  // При зміні мови — перезавантажити промпти з API
  useEffect(() => {
    (async () => {
      try {
        const prompts = await fetchAllColumnPrompts(SITE_COLUMNS, selectedLang as any);
        setTemplatesState(prev => ({
          ...(prev || {}),
          lang: selectedLang,
          prompts,
        } as any));
      } catch (e) {
        // noop
      }
    })();
  }, [selectedLang]);
  
  
  // Завантаження списку моделей для генерації / AI-перекладу
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Моделі потрібні або у режимі генерації, або у режимі перекладу з рушієм AI
        if (mode === 'translation' && translationEngine !== 'ai') return;
        setModelsLoading(true);
        setModelsError(null);
        const models = await chatApi.getModels();
        if (!mounted) return;
        setChatModels(models || []);
        // Встановити дефолтну модель, якщо ще не вибрано
        if (!selectedChatModel && Array.isArray(models) && models.length > 0) {
          setSelectedChatModel(models[0].name);
        }
      } catch (e) {
        if (!mounted) return;
        setModelsError((e as any)?.message || 'Помилка завантаження моделей');
      } finally {
        if (!mounted) return;
        setModelsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [mode, translationEngine]);
  // Стабільні ключі рядків
  // 1) Перевага product_id, далі id
  // 2) Якщо немає — фолбек: символ-властивість на об'єкті, яка копіюється спредом і зберігає UID
  const ROW_UID = useRef(Symbol('row_uid')).current as symbol;
  const stableIdCounterRef = useRef(0);
  const getRowKey = (desc: ContentDescription, _index: number) => {
    const anyDesc = desc as any;
    const langCode = (desc.site_lang_code ?? '').toString().toLowerCase() || 'unknown';
    // Гарантуємо наявність унікального UID на кожному об'єкті (копіюється через спред)
    if (!anyDesc[ROW_UID]) {
      anyDesc[ROW_UID] = `uid${++stableIdCounterRef.current}`;
    }
    const uid = String(anyDesc[ROW_UID]);
    const pid = anyDesc.product_id;

    // Функції для категорій

    let rowKey: string;
    if (pid != null) rowKey = `${pid}|${langCode}|${uid}`;
    else if (desc.id != null) rowKey = `${desc.id}|${langCode}|${uid}`;
    else rowKey = `${langCode}|${uid}`;
    
    // console.log(`[getRowKey] Generated key: ${rowKey} for product: ${desc.site_product || desc.product_name || 'unnamed'}`);
    return rowKey;
  };
  const isCellChecked = (rowKey: string, col: string) => {
    const cellKey = `${rowKey}:${col}`;
    const isChecked = !!selectedCells[cellKey];
    // console.log(`[isCellChecked] ${cellKey}: ${isChecked}`);
    return isChecked;
  };
  const getCategoryRowKey = (cat: SiteCategoryDescription, index: number) => {
    return `cat_${cat.category_id}_${cat.lang_code}_${index}`;
  };
  
  const isCategoryCellChecked = (rowKey: string, col: string) => !!categorySelectedCells[`${rowKey}:${col}`];
  
  const onCategoryCellCheckedChange = (rowKey: string, col: string, checked: boolean | 'indeterminate') => {
    console.log('✅ [onCategoryCellCheckedChange] CATEGORY CELL CLICKED!', {
      rowKey,
      col,
      checked,
      cellKey: `${rowKey}:${col}`
    });
    setCategorySelectedCells(prev => {
      const cellKey = `${rowKey}:${col}`;
      const newState = { ...prev, [cellKey]: checked === true };
      console.log(`📝 Updated categorySelectedCells: ${cellKey} = ${checked === true}`);
      console.log('📋 All selected category cells:', Object.keys(newState).filter(k => newState[k]));
      return newState;
    });
  };
  
  const getCategoryRowCheckedState = (rowKey: string): boolean => {
    return !!categoryRowCheckedRows[rowKey];
  };
  
  const onCategoryRowCheckedChange = (rowKey: string, checked: boolean | 'indeterminate') => {
    setCategoryRowCheckedRows(prev => ({ ...prev, [rowKey]: checked === true }));
    
    // Вибираємо всі незаповнені клітинки в рядку
    if (checked === true) {
      const category = pagedCategories.find((cat, idx) => getCategoryRowKey(cat, idx) === rowKey);
      if (category) {
        const cols: Array<keyof SiteCategoryDescription> = ['category', 'description', 'meta_keywords', 'page_title'];
        const updates: Record<string, boolean> = {};
        
        cols.forEach((col) => {
          const value = category[col];
          const isEmpty = !value || String(value).trim() === '';
          if (isEmpty) {
            updates[`${rowKey}:${col}`] = true;
          }
        });
        
        setCategorySelectedCells(prev => ({ ...prev, ...updates }));
      }
    } else {
      // Знімаємо вибір з усіх клітинок рядка
      setCategorySelectedCells(prev => {
        const next = { ...prev };
        const cols = ['category', 'description', 'meta_keywords', 'page_title'];
        cols.forEach((col) => {
          delete next[`${rowKey}:${col}`];
        });
        return next;
      });
    }
  };
  
  const getCategoryColumnCheckedState = (col: string): boolean => {
    return !!categoryColumnHeaderChecked[col];
  };
  
  const onCategoryColumnCheckedChange = (col: string, checked: boolean | 'indeterminate') => {
    setCategoryColumnHeaderChecked(prev => ({ ...prev, [col]: checked === true }));
    
    // Вибираємо всі незаповнені клітинки в колонці
    if (checked === true) {
      const updates: Record<string, boolean> = {};
      
      pagedCategories.forEach((cat, idx) => {
        const rowKey = getCategoryRowKey(cat, idx);
        const value = cat[col as keyof SiteCategoryDescription];
        const isEmpty = !value || String(value).trim() === '';
        
        if (isEmpty) {
          updates[`${rowKey}:${col}`] = true;
        }
      });
      
      setCategorySelectedCells(prev => ({ ...prev, ...updates }));
    } else {
      // Знімаємо вибір з усіх клітинок колонки
      setCategorySelectedCells(prev => {
        const next = { ...prev };
        pagedCategories.forEach((cat, idx) => {
          const rowKey = getCategoryRowKey(cat, idx);
          delete next[`${rowKey}:${col}`];
        });
        return next;
      });
    }
  };
  // Стабільний ключ рядка: product_id+lang (канонічна), інакше id+lang, інакше lang|product
  const getStableKey = (d: ContentDescription) => {
    const anyD: any = d as any;
    const lang = canonicalLang(d.site_lang_code) || '';
    if (anyD.product_id != null) return `${String(anyD.product_id)}|${lang}`;
    if (anyD.id != null) return `${String(anyD.id)}|${lang}`;
    return `${lang}|${d.site_product ?? d.product_name ?? ''}`;
  };
  // Фільтрація та пагінація категорій (винесено з рендеру таблиці)
  const filteredCategories = useMemo(() => {
    const searchLower = (searchQuery || '').toLowerCase();
    return (categoryDescriptions || []).filter((c) => {
      const lang = (c.lang_code || '').toLowerCase();
      const langMatch = selectedLang === 'ua' ? (lang === 'ua' || lang === 'uk') : lang === selectedLang;
      const inSearch = !searchLower ||
        (c.category || '').toLowerCase().includes(searchLower) ||
        (c.description || '').toLowerCase().includes(searchLower) ||
        (c.meta_keywords || '').toLowerCase().includes(searchLower) ||
        (c.page_title || '').toLowerCase().includes(searchLower);
      return langMatch && inSearch;
    });
  }, [categoryDescriptions, searchQuery, selectedLang]);

  const pagedCategories = useMemo(() => {
    return filteredCategories.slice((page - 1) * limit, page * limit);
  }, [filteredCategories, page, limit]);

  const categoryGeneration = useCategoryGeneration(
    pagedCategories, // Передаємо тільки категорії поточної сторінки!
    setCategoryDescriptions,
    templatesState?.prompts || {},
    selectedLang,
    selectedChatModel || 'GPT-4o-mini',
    getCategoryRowKey,
    saveCategoryUnsavedField // Передаємо функцію збереження в localStorage
  );

  // Обгортка для handleCategoryUpdate, щоб зберігати зміни в localStorage
  const originalHandleCategoryUpdate = categoryGeneration.handleCategoryUpdate;
  const wrappedHandleCategoryUpdate = useCallback((updatedCategory: SiteCategoryDescription) => {
    console.log('[wrappedHandleCategoryUpdate] Called with:', updatedCategory);
    
    // Зберігаємо зміни в localStorage
    const fields: Array<keyof SiteCategoryDescription> = ['category', 'description', 'meta_keywords', 'page_title'];
    fields.forEach((field) => {
      if (updatedCategory[field] !== undefined) {
        console.log('[wrappedHandleCategoryUpdate] Saving to localStorage:', field, updatedCategory[field]);
        saveCategoryUnsavedField(updatedCategory, field, updatedCategory[field]);
      }
    });
    
    // Викликаємо оригінальний обробник
    console.log('[wrappedHandleCategoryUpdate] Calling original handler');
    originalHandleCategoryUpdate(updatedCategory);
  }, [originalHandleCategoryUpdate]);

  // Базова мапа початкових даних для визначення "брудних" клітинок (незбережені зміни)
  const initialByStableKey = useMemo(() => {
    const m = new Map<string, ContentDescription>();
    try {
      initialDescriptions.forEach((d) => m.set(getStableKey(d), d));
    } catch {}
    return m;
  }, [initialDescriptions]);

  // Базова мапа початкових даних категорій для визначення "брудних" клітинок
  const initialCategoryByStableKey = useMemo(() => {
    const m = new Map<string, SiteCategoryDescription>();
    try {
      initialCategoryDescriptions.forEach((cat) => m.set(getCategoryStableKey(cat), cat));
    } catch {}
    return m;
  }, [initialCategoryDescriptions]);

  const isCellDirty = useCallback((desc: ContentDescription, col: SiteColumnName) => {
    const base = initialByStableKey.get(getStableKey(desc));
    if (!base) return false;
    const field = mapSiteColumnToContentField[col];
    const before = (base as any)[field];
    const current = (desc as any)[field];
    return String(before ?? '') !== String(current ?? '');
  }, [initialByStableKey]);

  const isCategoryCellDirty = useCallback((cat: SiteCategoryDescription, col: keyof SiteCategoryDescription) => {
    const base = initialCategoryByStableKey.get(getCategoryStableKey(cat));
    if (!base) return false;
    const before = (base as any)[col];
    const current = (cat as any)[col];
    return String(before ?? '') !== String(current ?? '');
  }, [initialCategoryByStableKey]);

  // Позначка, що для рядка було виконано хоча б одну AI‑генерацію
  const markRowGenerated = (desc: ContentDescription) => {
    const key = getStableKey(desc);
    setGeneratedRows(prev => ({ ...prev, [key]: true }));
  };

  // Обчислити, який промпт буде використаний для конкретної колонки (для логування/діагностики)
  const getPromptChoiceForColumn = (col: SiteColumnName) => {
    const st = templatesState as any;
    if (st?.enabled && st.enabled[col] === false) {
      return { col, source: 'disabled' as const };
    }
    const list = (st?.prompts?.[col] as SiteContentPrompt[] | undefined) || [];
    const norm = (s?: string) => (s || '').toLowerCase();
    const want = norm(selectedLang);
    const isSameLang = (code?: string) => (want === 'ua' ? (norm(code) === 'ua' || norm(code) === 'uk') : norm(code) === want);
    const byLang = list.filter(p => isSameLang(p.lang_code as any));
    const pool = byLang.length > 0 ? byLang : list;
    const active = pool.find(p => p.is_active);
    if (active?.prompt) {
      return { col, source: 'active' as const, id: active.id, name: active.name, prompt: active.prompt };
    }
    if (Array.isArray(pool) && pool.length > 0) {
      const latest = [...pool].filter(x => typeof x?.prompt === 'string').sort((a, b) => (b.id ?? 0) - (a.id ?? 0))[0];
      if (latest && typeof latest.prompt === 'string') {
        return { col, source: 'latest' as const, id: latest.id, name: latest.name, prompt: latest.prompt };
      }
    }
    const tplKey = mapSiteColumnToProductTplKey[col];
    const fromTpl = st?.productTpl?.[tplKey] as string | undefined;
    if (fromTpl && typeof fromTpl === 'string') {
      return { col, source: 'local-productTpl' as const, tplKey, prompt: fromTpl };
    }
    return { col, source: 'none' as const };
  };

  const logActivePromptsNow = () => {
    const st = templatesState as any;
    if (!st) { console.warn('[Generation] logActivePrompts: templatesState is empty'); return; }
    const rows = (SITE_COLUMNS as SiteColumnName[]).map((c) => {
      const choice = getPromptChoiceForColumn(c) as any;
      const preview = typeof choice.prompt === 'string' ? choice.prompt.slice(0, 160) : '';
      return {
        col: c,
        source: choice.source,
        id: choice.id ?? '-',
        name: choice.name ?? '-',
        preview,
      };
    });
    try {
      console.groupCollapsed('[Generation] Активні промпти для мови', selectedLang);
      // eslint-disable-next-line no-console
      console.table(rows);
      console.groupEnd();
    } catch {
      // eslint-disable-next-line no-console
      console.log('[Generation] Active prompts', rows);
    }
  };

  // Повний лог усіх шаблонів (prompts) по кожній колонці
  const logAllPromptsNow = () => {
    const st = templatesState as any;
    if (!st?.prompts) { console.warn('[Generation] logAllPrompts: prompts are empty'); return; }
    try {
      console.groupCollapsed('[Generation] Всі шаблони (prompts) для мови', selectedLang);
      (SITE_COLUMNS as SiteColumnName[]).forEach((col) => {
        const list = ((st.prompts?.[col] as SiteContentPrompt[]) || []);
        const rows = list.map((it) => ({ id: it.id, name: it.name, is_active: it.is_active, lang_code: it.lang_code, preview: String(it.prompt || '').slice(0, 160) }));
        console.groupCollapsed('[Prompts]', col, `(${rows.length})`);
        // eslint-disable-next-line no-console
        console.table(rows);
        console.groupEnd();
      });
      console.groupEnd();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('[Generation] All prompts dump failed', e);
    }
  };

  // Автоматично логувати застосовувані промпти щоразу, коли оновлюються prompts або мова
  useEffect(() => {
    if (!templatesState?.prompts) return;
    logAllPromptsNow();
    logActivePromptsNow();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templatesState?.prompts, selectedLang]);

  // Дефолтний промо-текст, якщо поле порожнє, коли перекладаємо
  const getDefaultPromoText = (lang: 'ua' | 'en' | 'ru') => {
    if (lang === 'ru') return 'Выгодное предложение: отличная цена и доставка по Украине.';
    if (lang === 'en') return 'Special offer: best price and delivery across Ukraine.';
    return 'Вигідна пропозиція: найкраща ціна та доставка по Україні.';
  };

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

  // Зворотна мапа: content field -> назва колонки (SiteColumnName)
  const mapContentFieldToSiteColumn: Record<string, SiteColumnName> = useMemo(() => {
    const out: Record<string, SiteColumnName> = {} as any;
    (Object.keys(mapSiteColumnToContentField) as SiteColumnName[]).forEach((col) => {
      const field = mapSiteColumnToContentField[col] as string;
      out[field] = col;
    });
    return out;
  }, []);

  // Базові сталі ширини колонок (px): фіксовані для незалежного ресайзу
  const DEFAULT_COL_WIDTHS: Record<SiteColumnName, number> = {
    product: 280,
    shortname: 200,
    short_description: 280,
    full_description: 420,
    promo_text: 240,
    meta_keywords: 220,
    meta_description: 260,
    searchwords: 240,
    page_title: 240,
  };

  // Хелпер: знайти варіант рядка для вказаної мови (за product_id або назвами)
  const getVariantForRow = useCallback((base: ContentDescription, lang: 'ua' | 'en' | 'ru') => {
    const pid = (base as any).product_id ?? null;
    const norm = (s?: string) => (s || '').toLowerCase();
    const isUa = (code: string) => code === 'ua' || code === 'uk';
    if (pid != null) {
      const found = descriptions.find((d) => {
        if ((d as any).product_id !== pid) return false;
        const code = norm((d as any).site_lang_code);
        return lang === 'ua' ? isUa(code) : code === lang;
      });
      return found || null;
    }
    const name = (base as any).site_product || (base as any).product_name || '';
    const found = descriptions.find((d) => {
      const code = norm((d as any).site_lang_code);
      const sameLang = lang === 'ua' ? isUa(code) : code === lang;
      if (!sameLang) return false;
      const n2 = (d as any).site_product || (d as any).product_name || '';
      return n2 === name;
    });
    return found || null;
  }, [descriptions]);

  // Переклад для вибраних клітинок на поточній сторінці
  const handleTranslateSelected = async () => {
    setTranslating(true);
    setTranslateProgress('');
    // Збираємо вибрані клітинки заздалегідь, щоб використовувати і в catch/finally
    let selectedKeys: string[] = [];
    try {
      const cols = SITE_COLUMNS as SiteColumnName[];
      // Позначаємо всі вибрані клітинки поточної сторінки як "перекладаю…"
      selectedKeys = [];
      pagedDescriptions.forEach((desc, idx) => {
        const rowKey = getRowKey(desc, idx);
        cols.forEach((col) => {
          if (selectedCells[`${rowKey}:${col}`]) selectedKeys.push(`${rowKey}:${col}`);
        });
      });
      if (selectedKeys.length > 0) {
        setCellTranslating(prev => {
          const next = { ...prev };
          selectedKeys.forEach((k: string) => { next[k] = true; });
          return next;
        });
      }
      // Функція побудови payload для конкретної цільової мови
      const buildPayloadForLang = (lang: 'ua' | 'en' | 'ru'): TranslateDescriptionItem[] => {
        const items: TranslateDescriptionItem[] = [];
        pagedDescriptions.forEach((desc, idx) => {
          const rowKey = getRowKey(desc, idx);
          const selectedCols = cols.filter(col => selectedCells[`${rowKey}:${col}`]);
          if (selectedCols.length === 0) return;
          const product_id = (desc as any).product_id as number | undefined;
          if (typeof product_id !== 'number') return; // пропускаємо без product_id
          // Визначаємо джерельний рядок для Free режиму (sourceLang)
          const srcDesc = (translationEngine === 'free') ? (getVariantForRow(desc, sourceLang) ?? desc) : desc;
          // Формуємо item лише з НЕпорожніми полями; бек може відхиляти повністю порожні значення
          const base: TranslateDescriptionItem = { product_id, lang_code: lang } as TranslateDescriptionItem;
          let nonEmptyCount = 0;
          selectedCols.forEach(col => {
            const field = mapSiteColumnToContentField[col];
            const current = (srcDesc as any)[field] as string | null | undefined;
            let value: string | null = null;
            if (field === 'site_promo_text' && (!current || String(current).trim() === '')) {
              value = getDefaultPromoText(lang);
            } else {
              const s = (current ?? '').toString().trim();
              value = s.length > 0 ? s : null;
            }
            if (value != null) {
              (base as any)[field] = value;
              nonEmptyCount++;
            }
          });
          // ВАЖЛИВО: не додаємо site_product, якщо колонку product НЕ вибрано,
          // інакше бек може сприйняти це як інструкцію перекладати назву.
          // Якщо немає жодного непорожнього вибраного поля — пропускаємо цей item (інакше можливий 422)
          if (nonEmptyCount > 0) items.push(base);
        });
        return items;
      };

      // Перекладаємо тільки обрану цільову мову. Для AI — відправляємо model_name, для Free — top-level lang_code
      const langs: Array<'ua' | 'en' | 'ru'> = [targetLang];
      for (const lang of langs) {
        // Карта вибраних колонок для кожного продукту на поточній сторінці
        const selectedByPid: Record<number, Set<SiteColumnName>> = {} as any;
        const cols = SITE_COLUMNS as SiteColumnName[];
        pagedDescriptions.forEach((desc, idx) => {
          const rowKey = getRowKey(desc, idx);
          const pid = (desc as any).product_id as number | undefined;
          if (typeof pid !== 'number') return;
          cols.forEach((col) => {
            if (selectedCells[`${rowKey}:${col}`]) {
              if (!selectedByPid[pid]) selectedByPid[pid] = new Set();
              selectedByPid[pid].add(col);
            }
          });
        });
        const payloadItems = buildPayloadForLang(lang);
        if (payloadItems.length === 0) {
          setTranslateProgress(prev => prev ? `${prev} | ${lang}: 0/0` : `${lang}: 0/0`);
          continue;
        }
        // Нормалізуємо під схему: усі поля як рядки; ДЛЯ НЕВИБРАНИХ ПОЛІВ — ПУСТИЙ РЯДОК,
        // щоб бекенд їх проігнорував і не перекладав. Це гарантує переклад лише вибраної клітинки.
        const normalized = payloadItems.map((it) => ({
          lang_code: (it as any).lang_code ?? lang,
          product_id: (it as any).product_id as number,
          site_product: String((it as any).site_product ?? ''),
          site_shortname: String((it as any).site_shortname ?? ''),
          site_short_description: String((it as any).site_short_description ?? ''),
          site_full_description: String((it as any).site_full_description ?? ''),
          site_meta_keywords: String((it as any).site_meta_keywords ?? ''),
          site_meta_description: String((it as any).site_meta_description ?? ''),
          site_searchwords: String((it as any).site_searchwords ?? ''),
          site_page_title: String((it as any).site_page_title ?? ''),
          site_promo_text: String((it as any).site_promo_text ?? ''),
        }));
        const model_name = selectedChatModel?.trim() || 'GPT-4o-mini';
        const res = (translationEngine === 'ai')
          ? await aiTranslateSiteDescriptions({ model_name, descriptions: normalized })
          : await translateSiteDescriptionsFree({ lang_code: lang, descriptions: normalized });
        const list: any[] = Array.isArray(res)
          ? res
          : (Array.isArray((res as any)?.translations)
              ? (res as any).translations
              : (Array.isArray((res as any)?.descriptions)
                ? (res as any).descriptions
                : (Array.isArray((res as any)?.items)
                  ? (res as any).items
                  : (Array.isArray((res as any)?.result) ? (res as any).result : []))));

        // Оновлюємо локальний стейт перекладеними значеннями для поточної мови
        let done = 0;
        list.forEach((it) => {
          const pid = (it as any).product_id;
          if (typeof pid !== 'number') return;
          const allowed = selectedByPid[pid] ?? new Set<SiteColumnName>();
          setDescriptions(prev => {
            const respLang = ((it as any).site_lang_code ?? (it as any).lang_code ?? lang) as string | undefined;
            const findByLang = (arr: typeof prev) => {
              if (!respLang) return -1;
              const norm = (s: string) => (s || '').toLowerCase();
              const want = norm(respLang);
              return arr.findIndex(x => (x as any).product_id === pid && norm((x as any).site_lang_code ?? '') === want);
            };
            const idx = findByLang(prev);
            if (idx === -1) {
              // Якщо рядка для цієї мови ще немає — додаємо новий (upsert) ТІЛЬКИ якщо є хоч одне непорожнє поле
              const newEntry: any = { product_id: pid, site_lang_code: respLang };
              let hasAny = false;
              (['site_product','site_shortname','site_short_description','site_full_description','site_meta_keywords','site_meta_description','site_searchwords','site_page_title','site_promo_text'] as const)
                .forEach((k) => {
                  const col = mapContentFieldToSiteColumn[k] as SiteColumnName | undefined;
                  if (!col || !allowed.has(col)) return;
                  const v = (it as any)[k];
                  if (typeof v === 'string' && v.trim().length > 0) {
                    newEntry[k] = v;
                    hasAny = true;
                  }
                });
              if (hasAny) return [...prev, newEntry] as any;
              return prev;
            }
            const next = [...prev];
            const curr = { ...next[idx] } as any;
            (['site_product','site_shortname','site_short_description','site_full_description','site_meta_keywords','site_meta_description','site_searchwords','site_page_title','site_promo_text'] as const)
              .forEach((k) => {
                const col = mapContentFieldToSiteColumn[k] as SiteColumnName | undefined;
                if (!col || !allowed.has(col)) return;
                const v = (it as any)[k];
                if (typeof v === 'string' && v.trim().length > 0) curr[k] = v;
              });
            next[idx] = curr;
            return next as any;
          });
          // Позначаємо рядок як змінений/згенерований для подальшого збереження
          markRowGenerated({ product_id: pid } as any);
          // Зберігаємо отримані значення як незбережені в localStorage
          const respLang = ((it as any).site_lang_code ?? (it as any).lang_code ?? lang) as string | undefined;
          const descKey: any = { product_id: pid, site_lang_code: respLang };
          (['site_product','site_shortname','site_short_description','site_full_description','site_meta_keywords','site_meta_description','site_searchwords','site_page_title','site_promo_text'] as const)
            .forEach((k) => {
              const col = mapContentFieldToSiteColumn[k] as SiteColumnName | undefined;
              if (!col || !allowed.has(col)) return;
              const v = (it as any)[k];
              if (typeof v === 'string' && v.trim().length > 0) saveUnsavedField(descKey as any, k as any, v);
            });
          done++;
        });
        setTranslateProgress(prev => prev ? `${prev} | ${lang}: ${done}/${payloadItems.length}` : `${lang}: ${done}/${payloadItems.length}`);
      }

      // Після успішного перекладу перед очищенням вибору зберігаємо розгортання
      setExpandedRowKeys(prev => {
        const next = { ...prev } as Record<string, boolean>;
        Object.keys(rowCheckedRows).forEach(k => {
          if (rowCheckedRows[k]) next[k] = true;
        });
        return next;
      });
      // Тепер очищаємо вибір і стани чекбоксів
      setSelectedCells({});
      setRowCheckedRows({});
      setColumnHeaderChecked({});
    } catch (e) {
      console.error('[TranslateSelected] Помилка', e);
      // Знімаємо індикатор перекладу з усіх вибраних клітинок
      if (selectedKeys.length > 0) {
        setCellTranslating(prev => {
          const next = { ...prev };
          selectedKeys.forEach((k: string) => { delete next[k]; });
          return next;
        });
      }
    } finally {
      setTranslating(false);
      if (selectedKeys.length > 0) {
        setCellTranslating(prev => {
          const next = { ...prev };
          selectedKeys.forEach((k: string) => { delete next[k]; });
          return next;
        });
      }
    }
  };


  const resolvePromptForColumn = (col: SiteColumnName): string | null => {
    const st = templatesState as any;
    // Якщо користувач вимкнув цю колонку у Templates — пропускаємо генерацію
    if (st?.enabled && st.enabled[col] === false) {
      console.info('[resolvePromptForColumn] disabled by Templates', { col });
      return null;
    }
    // 1) активний промпт з бекенду, інакше перший
    const list = (st?.prompts?.[col] as SiteContentPrompt[] | undefined) || [];
    // Фільтруємо за мовою інтерфейсу (ua ~ uk)
    const norm = (s?: string) => (s || '').toLowerCase();
    const want = norm(selectedLang);
    const isSameLang = (code?: string) => (want === 'ua' ? (norm(code) === 'ua' || norm(code) === 'uk') : norm(code) === want);
    const byLang = list.filter(p => isSameLang(p.lang_code as any));
    const pool = byLang.length > 0 ? byLang : list; // якщо бек не проставляє lang_code — не відкидаємо такі записи
    if (byLang.length === 0 && list.length > 0) {
      console.debug('[resolvePromptForColumn] no lang match, falling back to unfiltered list', { col, selectedLang });
    }
    const active = pool.find(p => p.is_active);
    if (active?.prompt) {
      const preview = typeof active.prompt === 'string' ? active.prompt.slice(0, 120) : '';
      console.debug('[resolvePromptForColumn] use', { col, source: 'active', id: active.id, name: active.name, preview });
      return active.prompt;
    }
    // Якщо активного немає — беремо найновіший (найбільший id) у вибірці мови
    if (Array.isArray(pool) && pool.length > 0) {
      const latest = [...pool].filter(x => typeof x?.prompt === 'string').sort((a, b) => (b.id ?? 0) - (a.id ?? 0))[0];
      if (latest && typeof latest.prompt === 'string') {
        const preview = latest.prompt.slice(0, 120);
        console.debug('[resolvePromptForColumn] use', { col, source: 'latest', id: latest.id, name: latest.name, preview });
        return latest.prompt;
      }
    }
    // 2) fallback до локальних шаблонів productTpl
    const tplKey = mapSiteColumnToProductTplKey[col];
    const fromTpl = st?.productTpl?.[tplKey] as string | undefined;
    if (fromTpl && typeof fromTpl === 'string') {
      const preview = fromTpl.slice(0, 120);
      console.debug('[resolvePromptForColumn] use', { col, source: 'local-productTpl', tplKey, preview });
      return fromTpl;
    }
    console.warn('[resolvePromptForColumn] no prompt available', { col });
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
  
  
  const onCellCheckedChangeWithLog = (
    rowKey: string,
    col: string,
    desc: ContentDescription,
    checked: boolean | 'indeterminate'
  ) => {
    console.log('✅ [onCellCheckedChangeWithLog] CELL CLICKED!', {
      rowKey,
      col,
      checked,
      cellKey: `${rowKey}:${col}`,
      site_product: desc.site_product || desc.product_name || '-',
    });
    setSelectedCells(prev => {
      const cellKey = `${rowKey}:${col}`;
      const newState = { ...prev, [cellKey]: checked === true };
      console.log(`📝 Updated selectedCells: ${cellKey} = ${checked === true}`);
      console.log('📋 All selected cells:', Object.keys(newState).filter(k => newState[k]));
      return newState;
    });
    // Тільки перемикаємо вибір. Генерація виконується кнопкою "Заповнити вибрані".
  };

  // Рядкові хелпери для комбінованої колонки №/Генерувати
  const ROW_GENERATABLE_COLUMNS: SiteColumnName[] = SITE_COLUMNS as SiteColumnName[];
  // Хелпер: визначити, чи значення клітинки вважається порожнім (у т.ч. плейсхолдер '-')
  const isEmptyCellValue = (v: string | null | undefined): boolean => {
    if (v === null || v === undefined) {
      console.log(`[isEmptyCellValue] null/undefined -> true`);
      return true;
    }
    const s = String(v).trim();
    if (s.length === 0) {
      console.log(`[isEmptyCellValue] empty string -> true`);
      return true;
    }
    const isEmpty = s === '-' || s === '—' || s === '–';
    console.log(`[isEmptyCellValue] "${s}" -> ${isEmpty}`);
    return isEmpty;
  };
  // Стан чекбокса рядка — тільки з незалежного стану, не змінюється від вибору колонок
  const getRowCheckedState = (rowKey: string): boolean | 'indeterminate' => {
    return !!rowCheckedRows[rowKey];
  };
  // Візуальний стан чекбокса стовпця — повністю контрольований і незалежний від selectedCells
  const getColumnCheckedState = (col: SiteColumnName): boolean | 'indeterminate' => {
    return !!columnHeaderChecked[col];
  };

  // Встановити/зняти вибір для всіх клітинок стовпця на поточній сторінці
  const onColumnCheckedChange = (col: SiteColumnName, checked: boolean | 'indeterminate') => {
    const value = checked === true;
    // Підрахунок порожніх клітинок у цій колонці на поточній сторінці
    let emptyCount = 0;
    const field = mapSiteColumnToContentField[col];
    pagedDescriptions.forEach((desc) => {
      const v = (desc as any)[field] as string | null | undefined;
      if (isEmptyCellValue(v)) emptyCount++;
    });
    if (emptyCount === 0) {
      // Немає що вибирати — показуємо підказку і не перемикаємо стан у "вибрано"
      toast({ title: 'Немає порожніх клітинок у цій колонці на цій сторінці' });
      setColumnHeaderChecked(prev => ({ ...prev, [col]: false }));
      return;
    }
    setColumnHeaderChecked(prev => ({ ...prev, [col]: value }));
    setSelectedCells(prev => {
      const next = { ...prev };
      // Застосовуємо тільки до порожніх клітинок цієї колонки на поточній сторінці
      pagedDescriptions.forEach((desc, idx) => {
        const v = (desc as any)[field] as string | null | undefined;
        if (!isEmptyCellValue(v)) return;
        const rowKey = getRowKey(desc, idx);
        next[`${rowKey}:${col}`] = value;
      });
      return next;
    });
  };
  // Керування вибором усього рядка: впливає тільки на порожні клітинки, і фіксує незалежний стан чекбокса рядка
  const onRowGenerateCheckedChange = (
    rowKey: string,
    checked: boolean | 'indeterminate'
  ) => {
    const value = checked === true;
    // Знайти опис рядка за ключем
    const rowDesc = pagedDescriptions.find((d, idx) => getRowKey(d, idx) === rowKey);
    if (!rowDesc) {
      console.warn('[onRowGenerateCheckedChange] Row not found:', rowKey);
      return;
    }
    
    // Перевірити, чи є хоч одна порожня клітинка в цьому рядку
    let emptyInRow = 0;
    const cellStates: Record<string, { field: string; value: any; isEmpty: boolean }> = {};
    
    ROW_GENERATABLE_COLUMNS.forEach(col => {
      const field = mapSiteColumnToContentField[col];
      const v = (rowDesc as any)[field] as string | null | undefined;
      const isEmpty = isEmptyCellValue(v);
      cellStates[col] = { field, value: v, isEmpty };
      if (isEmpty) emptyInRow++;
    });
    
    console.log('[onRowGenerateCheckedChange]', {
      rowKey,
      checked,
      emptyInRow,
      cellStates,
      site_product: rowDesc.site_product || rowDesc.product_name || '-'
    });
    
    if (emptyInRow === 0) {
      toast({ title: 'У цьому рядку немає порожніх клітинок на цій сторінці' });
      setRowCheckedRows(prev => ({ ...prev, [rowKey]: false }));
      return;
    }
    setRowCheckedRows(prev => ({ ...prev, [rowKey]: value }));
    setSelectedCells(prev => {
      const next = { ...prev };
      ROW_GENERATABLE_COLUMNS.forEach(col => {
        const field = mapSiteColumnToContentField[col];
        const v = (rowDesc as any)[field] as string | null | undefined;
        // Вибираємо лише порожні клітинки рядка (і в генерації, і в перекладі)
        if (!isEmptyCellValue(v)) return;
        next[`${rowKey}:${col}`] = value;
      });
      return next;
    });
  };

  // Майстер‑чекбокс: керує вибором усіх доступних клітинок на поточній сторінці
  const getMasterCheckedState = (): boolean | 'indeterminate' => {
    let total = 0;
    let selected = 0;
    console.log('[getMasterCheckedState] Starting check...');
    
    pagedDescriptions.forEach((desc, idx) => {
      const rowKey = getRowKey(desc, idx);
      console.log(`[getMasterCheckedState] Row ${idx} (${rowKey}):`);
      
      ROW_GENERATABLE_COLUMNS.forEach((col) => {
        const field = mapSiteColumnToContentField[col];
        const v = (desc as any)[field] as string | null | undefined;
        const isEmpty = isEmptyCellValue(v);
        const cellKey = `${rowKey}:${col}`;
        const isSelected = !!selectedCells[cellKey];
        
        console.log(`  ${col} (${field}): "${v}" -> isEmpty: ${isEmpty}, selected: ${isSelected}`);
        
        // Враховуємо лише порожні клітинки (для обох режимів)
        if (!isEmpty) return;
        total++;
        if (isSelected) selected++;
      });
    });
    
    console.log(`[getMasterCheckedState] Result: ${selected}/${total}`);
    
    if (total === 0) return false;
    if (selected === 0) return false;
    if (selected === total) return true;
    return 'indeterminate';
  };

  const onMasterCheckedChange = (checked: boolean | 'indeterminate') => {
    const value = checked === true;
    console.log(`[onMasterCheckedChange] Setting all to: ${value}`);
    
    // Оновлюємо незалежні візуальні стани для рядків та заголовків колонок
    setRowCheckedRows(prev => {
      const next: Record<string, boolean> = { ...prev };
      pagedDescriptions.forEach((desc, idx) => {
        const rowKey = getRowKey(desc, idx);
        console.log(`[onMasterCheckedChange] Setting row ${rowKey} to: ${value}`);
        next[rowKey] = value;
      });
      return next;
    });
    setColumnHeaderChecked(prev => {
      const next: Partial<Record<SiteColumnName, boolean>> = { ...prev };
      (SITE_COLUMNS as SiteColumnName[]).forEach(col => { next[col] = value; });
      return next;
    });
    // Власне вибір клітинок
    setSelectedCells(prev => {
      const next = { ...prev };
      pagedDescriptions.forEach((desc, idx) => {
        const rowKey = getRowKey(desc, idx);
        console.log(`[onMasterCheckedChange] Processing row ${idx} (${rowKey}):`);
        
        ROW_GENERATABLE_COLUMNS.forEach((col) => {
          const field = mapSiteColumnToContentField[col];
          const v = (desc as any)[field] as string | null | undefined;
          const isEmpty = isEmptyCellValue(v);
          const cellKey = `${rowKey}:${col}`;
          
          console.log(`  ${col}: "${v}" -> isEmpty: ${isEmpty}`);
          
          // Вибираємо лише порожні клітинки (для обох режимів)
          if (!isEmpty) return;
          
          next[cellKey] = value;
          console.log(`  Set ${cellKey} = ${value}`);
        });
      });
      return next;
    });
  };

  // Генерація для вибраних клітинок на поточній сторінці
  const handleGenerateSelected = async () => {
    console.log('🚀 [handleGenerateSelected] BUTTON CLICKED!');
    console.log('Current state:', {
      templatesState: !!templatesState,
      selectedCells,
      pagedDescriptions: pagedDescriptions.length
    });
    
    if (!templatesState) {
      console.warn('[GenerateSelected] Шаблони ще не готові');
      return;
    }
    setSelectedGenerating(true);
    setSelectedProgress('');
    try {
      const cols = SITE_COLUMNS as SiteColumnName[];
      type Job = { globalIdx: number; row: ContentDescription; rowKey: string; col: SiteColumnName };
      const jobs: Job[] = [];
      // Виконуємо тільки для поточної сторінки
      console.log('[GenerateSelected] Processing rows:', {
        pagedDescriptions: pagedDescriptions.length,
        selectedCells: Object.keys(selectedCells).filter(k => selectedCells[k]),
        allSelectedCells: selectedCells
      });
      
      pagedDescriptions.forEach((desc, idx) => {
        const rowKey = getRowKey(desc, idx);
        console.log(`[GenerateSelected] Processing row ${idx}:`, {
          rowKey,
          product_id: (desc as any).product_id,
          site_lang_code: desc.site_lang_code,
          site_product: desc.site_product,
          product_name: desc.product_name
        });
        
        // Переважно використовуємо стабільне співпадіння за посиланням
        let globalIdx = descriptions.indexOf(desc as any);
        if (globalIdx === -1) {
          // Фолбек: пошук за id або композитним ключем мова+назва
          const targetId = (desc as any).product_id ?? desc.id ?? null;
          const targetLang = desc.site_lang_code ?? '';
          const targetName = desc.site_product || desc.product_name || '';
          globalIdx = descriptions.findIndex(it => {
            const candidateId = (it as any).product_id ?? it.id ?? null;
            if (targetId != null && candidateId != null) return candidateId === targetId;
            const itLang = it.site_lang_code ?? '';
            const itName = it.site_product || it.product_name || '';
            return itLang === targetLang && itName === targetName;
          });
        }
        
        // Генеруємо лише для реально вибраних клітинок
        cols.forEach((col) => {
          const cellKey = `${rowKey}:${col}`;
          const isSelected = selectedCells[cellKey];
          
          if (isSelected) {
            jobs.push({ globalIdx, row: desc, rowKey, col });
            console.log(`✅ [GenerateSelected] Added job for ${cellKey} (row ${idx})`);
          }
        });
      });
      console.log('[GenerateSelected] Created jobs:', jobs.length, jobs.map(j => ({ rowKey: j.rowKey, col: j.col })));
      
      if (jobs.length === 0) {
        setSelectedProgress('Нічого не вибрано');
        return;
      }
      // 1) Перед генерацією підтягнути актуальні промпти для задіяних колонок і поточної мови
      let localPromptsByCol: Record<SiteColumnName, SiteContentPrompt[]> | null = null;
      try {
        const involvedCols = Array.from(new Set(jobs.map(j => j.col)));
        console.log('[GenerateSelected] Refresh involved prompts', { involvedCols, selectedLang });
        const settled = await Promise.allSettled(involvedCols.map(c => fetchColumnPrompts(c, selectedLang as any)));
        setTemplatesState(prev => {
          const prevPrompts = ((prev as any)?.prompts ?? {}) as Record<SiteColumnName, SiteContentPrompt[]>;
          const nextPrompts = { ...prevPrompts } as Record<SiteColumnName, SiteContentPrompt[]>;
          involvedCols.forEach((c, idx) => {
            const s = settled[idx];
            if (s.status === 'fulfilled') nextPrompts[c] = s.value;
          });
          localPromptsByCol = nextPrompts;
          return { ...(prev || {}), prompts: nextPrompts, lang: selectedLang } as any;
        });
        try {
          involvedCols.forEach((c, idx) => {
            const s = settled[idx];
            if (s.status === 'fulfilled') {
              const rows = (s.value || []).map((it: any) => ({ id: it.id, name: it.name, is_active: it.is_active, lang_code: it.lang_code }));
              console.groupCollapsed('[Prompts] Received list for', c, 'lang', selectedLang);
              // eslint-disable-next-line no-console
              console.table(rows);
              console.groupEnd();
            }
          });
        } catch {}
      } catch (e) {
        console.warn('[GenerateSelected] Failed to refresh prompts before generation', e);
      }
      // Генерування для product виконуємо останнім, щоб не змінювати ідентифікатор рядка до заповнення інших колонок
      jobs.sort((a, b) => (a.col === 'product' ? 1 : 0) - (b.col === 'product' ? 1 : 0));
      console.log('[GenerateSelected] Starting generation for jobs:', jobs.map(j => ({ rowKey: j.rowKey, col: j.col })));
      let done = 0;
      for (const job of jobs) {
        console.log(`🔄 [GenerateSelected] Processing job ${done + 1}/${jobs.length}:`, { 
          rowKey: job.rowKey, 
          col: job.col,
          globalIdx: job.globalIdx 
        });
        try {
          const desc = job.row;
          const site_product = desc.site_product || desc.product_name || '';
          const site_full_description = desc.site_full_description || desc.description || desc.site_product || desc.product_name || 'Товар';
          
          console.log(`📝 [GenerateSelected] Job data:`, {
            site_product,
            site_full_description: site_full_description.substring(0, 50) + '...',
            col: job.col,
            product_id: (desc as any).product_id,
            site_lang_code: (desc as any).site_lang_code
          });
          
          // Дозволяємо генерувати 'product' навіть якщо назва порожня; інші колонки вимагають назву
          if (job.col !== 'product' && !site_product) {
            console.warn('[GenerateSelected] Skip: empty site_product for col', job.col, 'row:', {
              product_id: (desc as any).product_id,
              site_lang_code: (desc as any).site_lang_code,
              site_product: desc.site_product,
              product_name: desc.product_name,
            });
            done++; setSelectedProgress(`${done}/${jobs.length}`); continue;
          }
          // Перевіряємо, що site_full_description не порожній
          if (!site_full_description.trim()) {
            console.warn('[GenerateSelected] Skip: empty site_full_description for col', job.col, 'row:', {
              product_id: (desc as any).product_id,
              site_lang_code: (desc as any).site_lang_code,
            });
            done++; setSelectedProgress(`${done}/${jobs.length}`); continue;
          }
          const prompt = localPromptsByCol
            ? resolvePromptForColumnFrom(localPromptsByCol, job.col)
            : resolvePromptForColumn(job.col);
          if (!prompt) {
            console.warn('[GenerateSelected] Skip: no prompt resolved for col', job.col, 'lang:', selectedLang);
            done++; setSelectedProgress(`${done}/${jobs.length}`); continue;
          }
          const model_name = selectedChatModel?.trim() || 'GPT-4o-mini';
          const payload = { site_product, site_full_description, prompt, model_name } as const;
          
          console.log(`🚀 [GenerateSelected] About to call API for job ${done + 1}/${jobs.length}`);
          console.log(`📡 [GenerateSelected] API payload:`, payload);
          
          const genKey = `${job.rowKey}:${job.col}`;
          setCellGenerating(prev => ({ ...prev, [genKey]: true }));
          
          console.log(`⏳ [GenerateSelected] Calling generateAiDescription...`);
          const res = await generateAiDescription(payload);
          console.log(`✅ [GenerateSelected] API response received:`, res?.substring(0, 100) + '...');
          const generated = extractGeneratedText(res);
          if (generated && typeof generated === 'string') {
            const field = mapSiteColumnToContentField[job.col];
            setDescriptions(prev => {
              // Якщо під час батчу масив не змінювався структурно, globalIdx залишиться правильним
              const idx = job.globalIdx;
              if (idx == null || idx < 0 || idx >= prev.length) return prev;
              const next = [...prev];
              next[idx] = { ...next[idx], [field]: generated } as ContentDescription;
              return next;
            });
            // Зберігаємо як незбережену зміну у localStorage
            saveUnsavedField(desc, field as keyof ContentDescription, generated);
            // Знімаємо позначку з цієї клітинки після успішної генерації
            setSelectedCells(prev => {
              const next = { ...prev };
              next[`${job.rowKey}:${job.col}`] = false;
              return next;
            });
            // Маркуємо рядок як згенерований
            markRowGenerated(job.row);
          }
        } catch (e) {
          console.error(`❌ [GenerateSelected] Error in job ${done + 1}/${jobs.length}:`, e);
        } finally {
          const genKey = `${job.rowKey}:${job.col}`;
          setCellGenerating(prev => { const next = { ...prev }; delete next[genKey]; return next; });
          done++;
          setSelectedProgress(`${done}/${jobs.length}`);
          console.log(`✅ [GenerateSelected] Completed job ${done}/${jobs.length} (${job.rowKey}:${job.col})`);
        }
      }
      console.log(`🏁 [GenerateSelected] All jobs completed! Total: ${done}/${jobs.length}`);
    } finally {
      setSelectedGenerating(false);
      // Після генерації очищаємо вибір, щоб прибрати галочки у № та хедерах колонок
      setSelectedCells({});
      setRowCheckedRows({});
      setColumnHeaderChecked({});
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
      type Job = { row: ContentDescription; col: SiteColumnName; rowKey: string };
      const jobs: Job[] = [];
      // Лише поточна сторінка
      pagedDescriptions.forEach((desc, index) => {
        cols.forEach((col) => {
          const field = mapSiteColumnToContentField[col];
          const currentVal = (desc as any)[field] as string | null | undefined;
          if (!currentVal || String(currentVal).trim() === '') {
            jobs.push({ row: desc, col, rowKey: getRowKey(desc, index) });
          }
        });
      });
      if (jobs.length === 0) {
        setMassProgress('Немає порожніх полів на сторінці');
        return;
      }
      // 1) Перед масовою генерацією підтягнути актуальні промпти для задіяних колонок
      let localPromptsByCol2: Record<SiteColumnName, SiteContentPrompt[]> | null = null;
      try {
        const involvedCols = Array.from(new Set(jobs.map(j => j.col)));
        console.log('[MassGenerate] Refresh involved prompts', { involvedCols, selectedLang });
        const settled = await Promise.allSettled(involvedCols.map(c => fetchColumnPrompts(c, selectedLang as any)));
        setTemplatesState(prev => {
          const prevPrompts = ((prev as any)?.prompts ?? {}) as Record<SiteColumnName, SiteContentPrompt[]>;
          const nextPrompts = { ...prevPrompts } as Record<SiteColumnName, SiteContentPrompt[]>;
          involvedCols.forEach((c, idx) => {
            const s = settled[idx];
            if (s.status === 'fulfilled') nextPrompts[c] = s.value;
          });
          localPromptsByCol2 = nextPrompts;
          return { ...(prev || {}), prompts: nextPrompts, lang: selectedLang } as any;
        });
        try {
          involvedCols.forEach((c, idx) => {
            const s = settled[idx];
            if (s.status === 'fulfilled') {
              const rows = (s.value || []).map((it: any) => ({ id: it.id, name: it.name, is_active: it.is_active, lang_code: it.lang_code }));
              console.groupCollapsed('[Prompts] Received list for', c, 'lang', selectedLang);
              // eslint-disable-next-line no-console
              console.table(rows);
              console.groupEnd();
            }
          });
        } catch {}
      } catch (e) {
        console.warn('[MassGenerate] Failed to refresh prompts before generation', e);
      }
      let done = 0;
      for (const job of jobs) {
        const desc = job.row;
        const site_product = desc.site_product || desc.product_name || '';
        const site_full_description = desc.site_full_description || desc.description || desc.site_product || desc.product_name || 'Товар';
        if (!site_product) { done++; setMassProgress(`${done}/${jobs.length}`); continue; }
        if (!site_full_description.trim()) { done++; setMassProgress(`${done}/${jobs.length}`); continue; }
        const prompt = localPromptsByCol2
          ? resolvePromptForColumnFrom(localPromptsByCol2, job.col)
          : resolvePromptForColumn(job.col);
        if (!prompt) { done++; setMassProgress(`${done}/${jobs.length}`); continue; }
        try {
          const model_name = selectedChatModel?.trim() || 'GPT-4o-mini';
          const payload = { site_product, site_full_description, prompt, model_name } as const;
          const genKey = `${job.rowKey}:${job.col}`;
          setCellGenerating(prev => ({ ...prev, [genKey]: true }));
          const res = await generateAiDescription(payload);
          const generated = extractGeneratedText(res);
          if (generated && typeof generated === 'string') {
            const field = mapSiteColumnToContentField[job.col];
            setDescriptions(prev => {
              const targetId = (desc as any).product_id ?? desc.id ?? null;
              const targetLang = desc.site_lang_code ?? '';
              const targetName = desc.site_product || desc.product_name || '';
              const idx = prev.findIndex(it => {
                const candidateId = (it as any).product_id ?? it.id ?? null;
                if (targetId != null && candidateId != null) return candidateId === targetId;
                const itLang = it.site_lang_code ?? '';
                const itName = it.site_product || it.product_name || '';
                return itLang === targetLang && itName === targetName;
              });
              if (idx === -1) return prev;
              const next = [...prev];
              next[idx] = { ...next[idx], [field]: generated } as ContentDescription;
              return next;
            });
            // Зберігаємо як незбережену зміну у localStorage
            saveUnsavedField(desc, field as keyof ContentDescription, generated);
            // Знімаємо позначку з клітинки після успішної генерації
            setSelectedCells(prev => ({ ...prev, [`${job.rowKey}:${job.col}`]: false }));
            // Маркуємо рядок як згенерований
            markRowGenerated(desc);
          }
        } catch (e) {
          console.error('[MassGenerate] Помилка', e);
        } finally {
          const genKey = `${job.rowKey}:${job.col}`;
          setCellGenerating(prev => { const next = { ...prev }; delete next[genKey]; return next; });
          done++;
          setMassProgress(`${done}/${jobs.length}`);
        }
      }
    } catch (e) {
      console.error('[MassGenerate] Failed', e);
    } finally {
      setMassGenerating(false);
    }
  };
  const handleGenerateSelectedCategories = async () => {
    console.log('🚀 [handleGenerateSelectedCategories] BUTTON CLICKED!');
    console.log('Current category state:', {
      templatesState: !!templatesState,
      categorySelectedCells,
      categorySelectedCellsKeys: Object.keys(categorySelectedCells),
      categorySelectedCellsTrue: Object.keys(categorySelectedCells).filter(k => categorySelectedCells[k]),
      categoryDescriptions: (categoryDescriptions || []).length
    });
    
    if (!templatesState) {
      console.warn('[GenerateSelectedCategories] Шаблони ще не готові');
      return;
    }
    
    await categoryGeneration.handleGenerateSelectedCategories(
      categorySelectedCells,
      onCategoryCellCheckedChange,
      () => {
        setCategorySelectedCells({});
        setCategoryRowCheckedRows({});
        setCategoryColumnHeaderChecked({});
      }
    );
  };
  
  // Масова генерація категорій
  const handleMassGenerateCategories = async () => {
    if (!templatesState) {
      console.warn('[MassGenerateCategories] Шаблони ще не готові');
      return;
    }
    
    await categoryGeneration.handleMassGenerateCategories(
      (key: string, selected: boolean) => {
        setCategorySelectedCells(prev => ({ ...prev, [key]: selected }));
      }
    );
  };
  
  // Збереження лише змінених рядків у бекенд
  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      // Побудова мапи початкових значень за стабільними ключами (з урахуванням мови)
      const initialByPidLang = new Map<string, ContentDescription>();
      const initialByComposite = new Map<string, ContentDescription>();
      const makeCompositeKey = (d: ContentDescription) => `${canonicalLang(d.site_lang_code) ?? ''}|${d.site_product ?? d.product_name ?? ''}`;
      initialDescriptions.forEach((desc) => {
        const lang = canonicalLang(desc.site_lang_code ?? '');
        if (typeof desc.product_id === 'number') initialByPidLang.set(`${desc.product_id}|${lang}`, desc);
        initialByComposite.set(makeCompositeKey(desc), desc);
      });

      const payload: Array<any> = [];
      const diffs: Array<{ product_id: number | undefined; lang: string; name: string; field: string; before: string; after: string }>= [];
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

      const norm = (key: keyof ContentDescription, v: any) => {
        // Не нормалізуємо site_product тут, щоб випадково не очистити ідентифікатор назви
        if (key === 'site_product' as any) return v;
        if (typeof v === 'string' && v.trim() === '') {
          try { console.debug('[SaveChanges] normalize empty -> null for', String(key)); } catch {}
          return null;
        }
        return v;
      };

      descriptions.forEach((curr) => {
        // Знаходимо базовий рядок: спершу за product_id+lang, інакше за композитним ключем (lang|name)
        const currLang = canonicalLang(curr.site_lang_code ?? '');
        const base = typeof curr.product_id === 'number'
          ? initialByPidLang.get(`${curr.product_id}|${currLang}`)
          : initialByComposite.get(`${currLang}|${curr.site_product ?? curr.product_name ?? ''}`);
        if (!base) {
          const product_id = curr.product_id;
          if (typeof product_id !== 'number') { skippedNoProductId++; return; }
          // Новий рядок: відправляємо ТІЛЬКИ наявні поля (без null), щоб нічого зайвого не видалити
          const item: any = { product_id };
          const lang = (curr.site_lang_code ?? '') as string; // у payload не канонізуємо
          const prodName = curr.site_product ?? curr.product_name;
          if (curr.site_lang_code !== undefined) { item.site_lang_code = lang; item.lang_code = lang; }
          if (prodName !== undefined) { item.site_product = prodName; diffs.push({ product_id, lang, name: String(prodName ?? ''), field: 'site_product', before: '(new)', after: String(prodName ?? '') }); }
          if (curr.site_shortname !== undefined) { const v = norm('site_shortname', curr.site_shortname); item.site_shortname = v; diffs.push({ product_id, lang, name: String(prodName ?? ''), field: 'site_shortname', before: '(new)', after: String(v ?? '') }); }
          if (curr.site_short_description !== undefined) { const v = norm('site_short_description', curr.site_short_description); item.site_short_description = v; diffs.push({ product_id, lang, name: String(prodName ?? ''), field: 'site_short_description', before: '(new)', after: String(v ?? '') }); }
          if (curr.site_full_description !== undefined) { const v = norm('site_full_description', curr.site_full_description); item.site_full_description = v; diffs.push({ product_id, lang, name: String(prodName ?? ''), field: 'site_full_description', before: '(new)', after: String(v ?? '') }); }
          if (curr.site_meta_keywords !== undefined) { const v = norm('site_meta_keywords', curr.site_meta_keywords); item.site_meta_keywords = v; diffs.push({ product_id, lang, name: String(prodName ?? ''), field: 'site_meta_keywords', before: '(new)', after: String(v ?? '') }); }
          if (curr.site_meta_description !== undefined) { const v = norm('site_meta_description', curr.site_meta_description); item.site_meta_description = v; diffs.push({ product_id, lang, name: String(prodName ?? ''), field: 'site_meta_description', before: '(new)', after: String(v ?? '') }); }
          if (curr.site_searchwords !== undefined) { const v = norm('site_searchwords', curr.site_searchwords); item.site_searchwords = v; diffs.push({ product_id, lang, name: String(prodName ?? ''), field: 'site_searchwords', before: '(new)', after: String(v ?? '') }); }
          if (curr.site_page_title !== undefined) { const v = norm('site_page_title', curr.site_page_title); item.site_page_title = v; diffs.push({ product_id, lang, name: String(prodName ?? ''), field: 'site_page_title', before: '(new)', after: String(v ?? '') }); }
          if (curr.site_promo_text !== undefined) { const v = norm('site_promo_text', curr.site_promo_text); item.site_promo_text = v; diffs.push({ product_id, lang, name: String(prodName ?? ''), field: 'site_promo_text', before: '(new)', after: String(v ?? '') }); }
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
          // Існуючий рядок: ВІДПРАВЛЯЄМО ПОВНИЙ РЯДОК: незмінні поля — зі значенням base, змінені — з curr
          const item: any = { product_id };
          const lang = (curr.site_lang_code ?? base.site_lang_code ?? '') as string; // у payload не канонізуємо
          item.site_lang_code = lang; (item as any).lang_code = lang;
          const newName = curr.site_product ?? curr.product_name;
          const baseName = base.site_product ?? base.product_name;
          item.site_product = (newName !== undefined ? newName : baseName);
          if (String(newName ?? baseName ?? '') !== String(baseName ?? '')) {
            diffs.push({ product_id, lang, name: String(newName ?? baseName ?? ''), field: 'site_product', before: String(baseName ?? ''), after: String(newName ?? baseName ?? '') });
          }
          const setField = (key: keyof ContentDescription) => {
            const beforeVal = (base as any)[key];
            const afterVal = (curr as any)[key];
            // якщо зміни є — беремо поточне; інакше — базове
            const outValRaw = (String(beforeVal ?? '') !== String(afterVal ?? '')) ? afterVal : beforeVal;
            const outVal = norm(key, outValRaw);
            (item as any)[key] = outVal ?? null; // надсилаємо явне значення (null для очищених)
            if (String(beforeVal ?? '') !== String(outVal ?? '')) {
              diffs.push({ product_id, lang, name: String(newName ?? baseName ?? ''), field: String(key), before: String(beforeVal ?? ''), after: String(outVal ?? '') });
            }
          };
          setField('site_shortname');
          setField('site_short_description');
          setField('site_full_description');
          setField('site_meta_keywords');
          setField('site_meta_description');
          setField('site_searchwords');
          setField('site_page_title');
          setField('site_promo_text');
          payload.push(item);
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

      try {
        const changedRows = new Set(diffs.map(d => d.product_id)).size;
        console.groupCollapsed('[SaveChanges] Diff summary', { rows: changedRows, fields: diffs.length });
        // eslint-disable-next-line no-console
        console.table(diffs);
        console.groupEnd();
      } catch {}
      console.log('[SaveChanges] payload length:', payload.length, payload);
      await updateSiteDescriptions({ descriptions: payload });
      // Показуємо лише статус без кількості змін
      toast({ title: 'Успішно' });
      
      // Оновлюємо initialDescriptions збереженими даними
      // щоб вони стали новою базою для порівняння
      setInitialDescriptions(descriptions.map(desc => ({ ...desc })));
      
      // Оновлюємо кеш збереженими даними
      try {
        await dataCache.cacheProducts(descriptions, selectedLang, true);
        console.log('[SaveChanges] Updated cache with saved data');
      } catch (cacheError) {
        console.warn('[SaveChanges] Failed to update cache:', cacheError);
      }
      
      // Очищаємо локальні чернетки, бо дані збережено
      clearAllUnsaved();
      
      // НЕ перезавантажуємо з сервера, щоб не втратити згенеровані дані
      // preferServerOnceRef.current = true;
      // await fetchData();
      
      // Скидаємо маркери згенерованих рядків після успішного збереження
      setGeneratedRows({});
    } catch (e) {
      console.error('[SaveChanges] Failed', e);
      // Показуємо лише статус без деталей
      toast({ title: 'Не успішно', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Збереження змінених категорій у бекенд
  const handleSaveCategoryChanges = async () => {
    try {
      setSaving(true);
      
      console.log('[SaveCategoryChanges] Starting save...');
      console.log('[SaveCategoryChanges] Current categories:', categoryDescriptions.length);
      console.log('[SaveCategoryChanges] Initial categories:', initialCategoryDescriptions.length);
      
      const payload: UpdateSiteCategoryDescriptionRequest[] = [];
      
      // Перевіряємо всі категорії на зміни
      categoryDescriptions.forEach((cat) => {
        const stableKey = getCategoryStableKey(cat);
        const initial = initialCategoryDescriptions.find(
          c => c.category_id === cat.category_id && c.lang_code === cat.lang_code
        );
        
        if (!initial) {
          console.log('[SaveCategoryChanges] No initial found for:', stableKey);
          return;
        }
        
        // Перевіряємо, чи є зміни в будь-якому полі
        const hasChanges = 
          cat.category !== initial.category ||
          cat.description !== initial.description ||
          cat.meta_keywords !== initial.meta_keywords ||
          cat.page_title !== initial.page_title;
        
        if (hasChanges) {
          console.log('[SaveCategoryChanges] Changes detected for:', stableKey, {
            category: cat.category !== initial.category,
            description: cat.description !== initial.description,
            meta_keywords: cat.meta_keywords !== initial.meta_keywords,
            page_title: cat.page_title !== initial.page_title
          });
          
          payload.push({
            category_id: cat.category_id,
            lang_code: cat.lang_code,
            category: cat.category,
            description: cat.description,
            meta_keywords: cat.meta_keywords,
            page_title: cat.page_title
          });
        }
      });
      
      if (payload.length === 0) {
        console.log('[SaveCategoryChanges] No changes detected');
        toast({ title: 'Немає змін для збереження' });
        return;
      }
      
      console.log('[SaveCategoryChanges] Saving categories:', payload);
      console.log('[SaveCategoryChanges] Payload JSON:', JSON.stringify(payload, null, 2));
      
      const response = await updateSiteCategoriesDescriptions(payload);
      console.log('[SaveCategoryChanges] Response:', response);
      
      toast({ title: `Успішно збережено ${payload.length} категорій` });
      
      // Оновлюємо initialCategoryDescriptions збереженими даними
      // щоб вони стали новою базою для порівняння
      setInitialCategoryDescriptions(categoryDescriptions.map(cat => ({ ...cat })));
      
      // Оновлюємо кеш збереженими даними
      try {
        await dataCache.cacheCategories(categoryDescriptions, selectedLang, true);
        console.log('[SaveCategoryChanges] Updated cache with saved data');
      } catch (cacheError) {
        console.warn('[SaveCategoryChanges] Failed to update cache:', cacheError);
      }
      
      // Очищаємо локальні чернетки
      clearAllCategoryUnsaved();
      
      // НЕ перезавантажуємо з сервера, щоб не втратити згенеровані дані
      // await fetchCategoryData();
      
    } catch (e) {
      console.error('[SaveCategoryChanges] Failed', e);
      toast({ title: 'Помилка збереження', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Фонове завантаження всіх товарів (9999 записів)
  const scheduleProductsBackgroundFetch = useCallback(() => {
    console.log('[Generation] Scheduling background fetch for ALL products...');
    
    setTimeout(async () => {
      try {
        console.log('[Generation] STEP 2: Background fetch - ALL products (9999)');
        setBackgroundLoading(true);
        
        const fullRequest = {
          category_ids: selectedCategory === 'all' ? [] : [selectedCategory],
          page: 1,
          limit: 9999,
        };
        
        const fullResponse = await fetchContentDescriptions<ContentDescription>(fullRequest);
        console.log('[Generation] STEP 2 response:', {
          itemsCount: fullResponse.items?.length ?? 0,
          total: fullResponse.total,
        });
        
        // Фільтруємо всі товари по мові
        const fullItems = fullResponse.items || [];
        const fullItemsForLang = fullItems.filter((item: any) => {
          const lang = (item.site_lang_code || '').toLowerCase();
          return selectedLang === 'ua' 
            ? (lang === 'ua' || lang === 'uk')
            : lang === selectedLang;
        });
        
        console.log(`[Generation] STEP 2: Filtered ${fullItemsForLang.length} items for lang '${selectedLang}'`);
        
        // Оновлюємо дані в UI
        const withUnsaved = applyUnsavedToItems(fullItemsForLang);
        setDescriptions(withUnsaved);
        setInitialDescriptions(fullItemsForLang.map(it => ({ ...it })));
        setIsDataFromCache(false);
        
        // Зберігаємо всі товари в повний кеш
        try {
          await dataCache.cacheProducts(fullItemsForLang, selectedLang, true);
          console.log(`[Generation] STEP 2: Cached ${fullItemsForLang.length} products as FULL cache`);
        } catch (cacheError) {
          console.warn('[Generation] STEP 2: Failed to cache:', cacheError);
        }
        
      } catch (err) {
        console.error('[Generation] STEP 2: Background fetch failed:', err);
      } finally {
        setBackgroundLoading(false);
      }
    }, 100);
  }, [selectedCategory, selectedLang]);

  // Фонове завантаження всіх категорій (9999 записів)
  const scheduleCategoriesBackgroundFetch = useCallback(() => {
    console.log('[Generation] Scheduling background fetch for ALL categories...');
    
    setTimeout(async () => {
      try {
        console.log('[Generation] STEP 2: Background fetch - ALL categories (9999)');
        setBackgroundLoading(true);
        
        const fullResponse = await fetchSiteCategoriesDescriptions(1, 9999);
        console.log('[Generation] STEP 2 response:', {
          itemsCount: fullResponse.items?.length ?? 0,
          total: fullResponse.total,
        });
        
        // Фільтруємо всі категорії по мові
        const fullItems = fullResponse.items || [];
        const fullItemsForLang = fullItems.filter((item: any) => {
          const lang = (item.lang_code || '').toLowerCase();
          return selectedLang === 'ua' 
            ? (lang === 'ua' || lang === 'uk')
            : lang === selectedLang;
        });
        
        console.log(`[Generation] STEP 2: Filtered ${fullItemsForLang.length} categories for lang '${selectedLang}'`);
        
        // Оновлюємо дані в UI
        const withUnsaved = applyCategoryUnsavedToItems(fullItemsForLang);
        setCategoryDescriptions(withUnsaved);
        setInitialCategoryDescriptions(fullItemsForLang.map(it => ({ ...it })));
        setIsDataFromCache(false);
        
        // Зберігаємо всі категорії в повний кеш
        try {
          await dataCache.cacheCategories(fullItemsForLang, selectedLang, true);
          console.log(`[Generation] STEP 2: Cached ${fullItemsForLang.length} categories as FULL cache`);
        } catch (cacheError) {
          console.warn('[Generation] STEP 2: Failed to cache:', cacheError);
        }
        
      } catch (err) {
        console.error('[Generation] STEP 2: Background fetch failed:', err);
      } finally {
        setBackgroundLoading(false);
      }
    }, 100);
  }, [selectedLang]);

  const fetchData = async (showLoader: boolean = true) => {
    if (showLoader) {
      setLoading(true);
    }
    setError(null);
    
    try {
      // Завжди перевіряємо кеш спочатку перед викликом API
      console.log('[Generation] Checking cache for products...');
      let cachedData = null;
      
      try {
        cachedData = await dataCache.getCachedProducts<ContentDescription>(selectedLang);
      } catch (cacheError) {
        console.warn('[Generation] Cache read failed, continuing without cache:', cacheError);
      }
      
      if (cachedData && cachedData.data.length > 0) {
        console.log(`[Generation] ✅ Cache hit! Showing ${cachedData.data.length} cached products (isFull=${cachedData.isFull})`);
        const withUnsaved = applyUnsavedToItems(cachedData.data);
        setDescriptions(withUnsaved);
        setInitialDescriptions(cachedData.data.map(item => ({ ...item })));
        setIsDataFromCache(true);
        setLoading(false);
        
        if (!cachedData.isFull) {
          console.log('[Generation] Cached products are partial, scheduling background refresh...');
          scheduleProductsBackgroundFetch();
        } else {
          console.log('[Generation] Using cached data, skipping API call');
        }
        return;
      }
      
      console.log('[Generation] ❌ Cache miss. Fetching from API...');
      
      // ЕТАП 1: Швидко завантажуємо перші 300 товарів
      const quickRequest = {
        category_ids: selectedCategory === 'all' ? [] : [selectedCategory],
        page: 1,
        limit: 300,
      };
      console.log('[Generation] STEP 1: Quick fetch - 300 products:', quickRequest);
      
      const quickResponse = await fetchContentDescriptions<ContentDescription>(quickRequest);
      console.log('[Generation] STEP 1 response:', {
        itemsCount: quickResponse.items?.length ?? 0,
        total: quickResponse.total,
      });
      
      // Фільтруємо перші 300 товарів по мові
      const quickItems = quickResponse.items || [];
      const quickItemsForLang = quickItems.filter((item: any) => {
        const lang = (item.site_lang_code || '').toLowerCase();
        return selectedLang === 'ua' 
          ? (lang === 'ua' || lang === 'uk')
          : lang === selectedLang;
      });
      
      console.log(`[Generation] STEP 1: Filtered ${quickItemsForLang.length} items for lang '${selectedLang}'`);
      
      // Показуємо перші 300 товарів користувачу
      const withUnsaved = applyUnsavedToItems(quickItemsForLang);
      setDescriptions(withUnsaved);
      setInitialDescriptions(quickItemsForLang.map(it => ({ ...it })));
      setIsDataFromCache(false);
      setLoading(false);
      
      // Зберігаємо перші 300 в кеш
      try {
        await dataCache.cacheProducts(quickItemsForLang, selectedLang);
        console.log(`[Generation] STEP 1: Cached ${quickItemsForLang.length} products`);
      } catch (cacheError) {
        console.warn('[Generation] STEP 1: Failed to cache:', cacheError);
      }
      
      // ЕТАП 2: Фоново завантажуємо всі товари (9999)
      scheduleProductsBackgroundFetch();
      // total рахуємо після клієнтської фільтрації
    } catch (err: any) {
      console.error('Error fetching content descriptions:', err);
      
      // Детальна діагностика помилки
      let errorMessage = 'Помилка при завантаженні даних. Спробуйте пізніше.';
      
      if (err?.response) {
        // Помилка від сервера
        const status = err.response.status;
        console.error(`[Generation] API Error ${status}:`, err.response.data);
        
        if (status === 401) {
          errorMessage = 'Помилка авторизації. Будь ласка, увійдіть в систему.';
        } else if (status === 404) {
          errorMessage = 'API endpoint не знайдено. Перевірте конфігурацію сервера.';
        } else if (status === 500) {
          errorMessage = 'Помилка сервера. Спробуйте пізніше.';
        } else {
          errorMessage = `Помилка сервера (${status}). ${err.response.data?.message || ''}`;
        }
      } else if (err?.request) {
        // Запит був відправлений, але немає відповіді
        console.error('[Generation] No response from server:', err.request);
        errorMessage = 'Сервер не відповідає. Перевірте підключення до інтернету та доступність API.';
      } else if (err?.message?.includes('IndexedDB')) {
        // Помилка IndexedDB
        console.error('[Generation] IndexedDB error:', err.message);
        errorMessage = 'Помилка локального кешу. Спробуйте перезавантажити сторінку.';
      } else if (err?.message) {
        // Інша помилка
        console.error('[Generation] Error:', err.message);
        errorMessage = `Помилка: ${err.message}`;
      }
      
      setError(errorMessage);
      
      // Показуємо toast з помилкою
      toast({
        title: 'Помилка завантаження',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    } 
  };
  
  const fetchCategoryData = async (showLoader: boolean = true) => {
    if (showLoader) {
      setLoading(true);
    }
    setError(null);
    
    try {
      // Завжди перевіряємо кеш спочатку перед викликом API
      console.log('[Generation] Checking cache for categories...');
      const cachedData = await dataCache.getCachedCategories<SiteCategoryDescription>(selectedLang);
      
      if (cachedData && cachedData.data.length > 0) {
        console.log(`[Generation] ✅ Cache hit! Showing ${cachedData.data.length} cached categories (isFull=${cachedData.isFull})`);
        const withUnsaved = applyCategoryUnsavedToItems(cachedData.data);
        setCategoryDescriptions(withUnsaved);
        setInitialCategoryDescriptions(cachedData.data.map(it => ({ ...it })));
        setIsDataFromCache(true);
        setLoading(false);
        
        if (!cachedData.isFull) {
          console.log('[Generation] Cached categories are partial, scheduling background refresh...');
          scheduleCategoriesBackgroundFetch();
        } else {
          console.log('[Generation] Using cached data, skipping API call');
        }
        return;
      }
      
      console.log('[Generation] ❌ Cache miss. Fetching from API...');
      
      // ЕТАП 1: Швидко завантажуємо перші 100 категорій
      console.log('[Generation] STEP 1: Quick fetch - 100 categories');
      const quickResponse = await fetchSiteCategoriesDescriptions(1, 100);
      console.log('[Generation] STEP 1 response:', {
        itemsCount: quickResponse.items?.length ?? 0,
        total: quickResponse.total,
      });
      
      // Фільтруємо перші 100 категорій по мові
      const quickItems = quickResponse.items || [];
      const quickItemsForLang = quickItems.filter((item: any) => {
        const lang = (item.lang_code || '').toLowerCase();
        return selectedLang === 'ua' 
          ? (lang === 'ua' || lang === 'uk')
          : lang === selectedLang;
      });
      
      console.log(`[Generation] STEP 1: Filtered ${quickItemsForLang.length} categories for lang '${selectedLang}'`);
      
      // Показуємо перші 100 категорій користувачу
      const withUnsaved = applyCategoryUnsavedToItems(quickItemsForLang);
      setCategoryDescriptions(withUnsaved);
      setInitialCategoryDescriptions(quickItemsForLang.map(it => ({ ...it })));
      setIsDataFromCache(false);
      setLoading(false);
      
      // Зберігаємо перші 100 в кеш
      try {
        await dataCache.cacheCategories(quickItemsForLang, selectedLang);
        console.log(`[Generation] STEP 1: Cached ${quickItemsForLang.length} categories`);
      } catch (cacheError) {
        console.warn('[Generation] STEP 1: Failed to cache:', cacheError);
      }
      
      // ЕТАП 2: Фоново завантажуємо всі категорії (9999)
      scheduleCategoriesBackgroundFetch();
    } catch (err: any) {
      console.error('Error fetching category descriptions:', err);
      
      // Детальна діагностика помилки
      let errorMessage = 'Помилка при завантаженні категорій. Спробуйте пізніше.';
      
      if (err?.response) {
        const status = err.response.status;
        console.error(`[Generation] API Error ${status}:`, err.response.data);
        
        if (status === 401) {
          errorMessage = 'Помилка авторизації. Будь ласка, увійдіть в систему.';
        } else if (status === 404) {
          errorMessage = 'API endpoint не знайдено. Перевірте конфігурацію сервера.';
        } else if (status === 500) {
          errorMessage = 'Помилка сервера. Спробуйте пізніше.';
        } else {
          errorMessage = `Помилка сервера (${status}). ${err.response.data?.message || ''}`;
        }
      } else if (err?.request) {
        console.error('[Generation] No response from server:', err.request);
        errorMessage = 'Сервер не відповідає. Перевірте підключення до інтернету та доступність API.';
      } else if (err?.message?.includes('IndexedDB')) {
        console.error('[Generation] IndexedDB error:', err.message);
        errorMessage = 'Помилка локального кешу. Спробуйте перезавантажити сторінку.';
      } else if (err?.message) {
        console.error('[Generation] Error:', err.message);
        errorMessage = `Помилка: ${err.message}`;
      }
      
      setError(errorMessage);
      
      toast({
        title: 'Помилка завантаження',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (activeTab === 'products') {
      // Завантажуємо тільки якщо немає даних
      if (descriptions.length === 0) {
        console.log('[Generation] Loading products - no data yet');
        fetchData();
      } else {
        console.log('[Generation] Products already loaded, skipping fetch');
      }
    } else {
      // Завантажуємо тільки якщо немає даних
      if (categoryDescriptions.length === 0) {
        console.log('[Generation] Loading categories - no data yet');
        fetchCategoryData();
      } else {
        console.log('[Generation] Categories already loaded, skipping fetch');
      }
    }
  }, [activeTab]);
  
  // Окремий useEffect для зміни категорії (тільки для товарів)
  useEffect(() => {
    if (activeTab === 'products' && descriptions.length > 0) {
      console.log('[Generation] Category changed, reloading products');
      fetchData();
    }
  }, [selectedCategory]);
  
  const handleRefresh = () => {
    // Перевіряємо наявність незбережених змін
    const hasUnsavedChanges = activeTab === 'products' 
      ? Object.keys(readUnsaved()).length > 0
      : Object.keys(readCategoryUnsaved()).length > 0;
    
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'У вас є незбережені зміни. Оновлення сторінки призведе до їх втрати. Продовжити?'
      );
      if (!confirmed) return;
    }
    
    if (activeTab === 'products') fetchData();
    else fetchCategoryData();
  };
  // При зміні пошуку або користувацьких фільтрів переходимо на першу сторінку
  useEffect(() => {
    setPage(1);
  }, [searchQuery, customFilters]);

  // При зміні мови переходимо на першу сторінку, щоб коректно відображати пагінацію
  useEffect(() => {
    console.log('[Generation] selectedLang changed:', selectedLang);
    setPage(1);
  }, [selectedLang]);

  // Очищення вибору клітинок при зміні джерела даних (page/filters/search/limit/productType/lang)
  useEffect(() => {
    console.log('[Generation] Data source changed, clearing selections');
    setSelectedCells({});
    setRowCheckedRows({});
    setColumnHeaderChecked({});
  }, [page, limit, searchQuery, customFilters, selectedLang]);

  // Логування стану даних - перенесено після оголошення pagedDescriptions

  // Прибрано вимірювання ширини таблиці — покладаємось на overflow-x-auto

  // Синхронізація прокрутки між верхнім і нижнім скролбарами
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

  // Фільтрація по всіх товарах (не тільки по поточній сторінці)
  const filteredDescriptions = useMemo(() => {
    return descriptions.filter(desc => {
      // Базовий пошук за запитом - шукаємо ТІЛЬКИ по назві товару
      let matchesSearch = true;
      if (searchQuery) {
        const productName = desc.site_product || desc.product_name || '';
        const searchLower = searchQuery.toLowerCase();
        
        matchesSearch = productName.toLowerCase().includes(searchLower);
      }
      
      // Фільтр за мовою (клієнтський) — 'ua' вважаємо еквівалентним до 'uk'
      const lang = (desc.site_lang_code || '').toLowerCase();
      const langMatch = selectedLang === 'ua'
        ? (lang === 'ua' || lang === 'uk')
        : lang === selectedLang;

      // Перевірка за користувацькими фільтрами
      // Застосовуємо тільки активні фільтри
      const activeFilters = customFilters.filter(filter => filter.active);
      if (activeFilters.length === 0) return matchesSearch && langMatch;

      return matchesSearch && langMatch && activeFilters.every(filter => {
        const fieldValue = desc[filter.field as keyof ContentDescription];
        if (fieldValue === undefined || fieldValue === null) return false;
        return String(fieldValue).toLowerCase().includes(filter.value.toLowerCase());
      });
    });
  }, [descriptions, searchQuery, selectedLang, customFilters]);
  
  // Хелпери сортування
  const toggleSort = (col: SiteColumnName) => {
    if (sortBy !== col) { setSortBy(col); setSortDir('asc'); }
    else if (sortDir === 'asc') { setSortDir('desc'); }
    else { setSortBy(null); }
    setPage(1);
  };

  const getSortValue = (d: any, col: SiteColumnName): string => {
    switch (col) {
      case 'product':
        return (d.site_product || d.product_name || '').toString();
      case 'shortname':
        return (d.site_shortname || '').toString();
      case 'short_description':
        return (d.site_short_description || '').toString();
      case 'full_description':
        return (d.site_full_description || d.description || '').toString();
      case 'promo_text':
        return (d.site_promo_text || '').toString();
      case 'meta_keywords':
        return (d.site_meta_keywords || '').toString();
      case 'meta_description':
        return (d.site_meta_description || '').toString();
      case 'searchwords':
        return (d.site_searchwords || '').toString();
      case 'page_title':
        return (d.site_page_title || '').toString();
      default:
        return '';
    }
  };

  // Сортування після фільтрації
  const sortedDescriptions = sortBy
    ? [...filteredDescriptions].sort((a, b) => {
        const aVal = getSortValue(a, sortBy);
        const bVal = getSortValue(b, sortBy);
        const cmp = aVal.localeCompare(bVal, undefined, { sensitivity: 'base' });
        return sortDir === 'asc' ? cmp : -cmp;
      })
    : filteredDescriptions;
  // Пагінація після фільтрації та сортування
  const totalFiltered = filteredDescriptions.length;
  const pagedDescriptions = sortedDescriptions.slice((page - 1) * limit, page * limit);
  const totalPages = Math.ceil(totalFiltered / limit);
  
  // Логування стану даних
  console.log('🔍 [Generation] Current state:', {
    pagedDescriptions: pagedDescriptions.length,
    totalDescriptions: descriptions.length,
    selectedCells: Object.keys(selectedCells).length,
    filteredDescriptions: filteredDescriptions.length,
    page,
    limit
  });
  
  // Масове розгортання/згортання рядків (лише у режимі перекладу). Визначено тут, після pagedDescriptions.
  const getExpandAllCheckedState = useCallback((): boolean | 'indeterminate' => {
    if (!isTranslateMode) return false;
    const total = pagedDescriptions.length;
    if (total === 0) return false;
    let expanded = 0;
    for (let i = 0; i < total; i++) {
      const key = getRowKey(pagedDescriptions[i], i);
      if (expandedRowKeys[key]) expanded++;
    }
    if (expanded === 0) return false;
    if (expanded === total) return true;
    return 'indeterminate';
  }, [isTranslateMode, pagedDescriptions, expandedRowKeys]);

  const onExpandAllCheckedChange = (checked: boolean | 'indeterminate') => {
    if (!isTranslateMode) return;
    const shouldExpand = checked === true;
    setExpandedRowKeys(prev => {
      const next: Record<string, boolean> = { ...prev };
      for (let i = 0; i < pagedDescriptions.length; i++) {
        const key = getRowKey(pagedDescriptions[i], i);
        if (shouldExpand) next[key] = true; else delete next[key];
      }
      return next;
    });
  };
  
  // Допоміжні: пошук варіантів по мовах для того самого продукту
  const normLang = (s: string | undefined) => (s || '').toLowerCase();
  const isUaCode = (s: string | undefined) => {
    const l = normLang(s);
    return l === 'ua' || l === 'uk';
  };
  const findLangVariant = (base: ContentDescription, lang: 'ua' | 'en' | 'ru'): ContentDescription | null => {
    const pid = (base as any).product_id ?? null;
    if (pid != null) {
      const found = descriptions.find((d) => {
        if ((d as any).product_id !== pid) return false;
        const code = normLang(d.site_lang_code);
        return lang === 'ua' ? isUaCode(code) : code === lang;
      });
      return found || null;
    }
    // Фолбек: пошук за назвою
    const name = base.site_product || base.product_name || '';
    const found = descriptions.find((d) => {
      const code = normLang(d.site_lang_code);
      if (lang === 'ua' ? !isUaCode(code) : code !== lang) return false;
      const n2 = d.site_product || d.product_name || '';
      return n2 === name;
    });
    return found || null;
  };

  // Визначення, чи рядок для певної мови дійсно містить переклад
  const cyrillicRe = /[\u0400-\u04FF]/; // включно з UA/RU символами
  const latinRe = /[A-Za-z]/;
  const aggregateVariantText = (v: ContentDescription) => {
    const parts = [
      v.site_product,
      v.site_shortname,
      v.site_short_description,
      v.site_full_description || (v as any).description,
      v.site_promo_text,
      v.site_meta_keywords,
      v.site_meta_description,
      v.site_searchwords,
      v.site_page_title,
    ].filter(Boolean).map(x => String(x));
    return parts.join(' ');
  };
  const isVariantReadyForLang = (lang: 'ua'|'en'|'ru', v: ContentDescription): boolean => {
    const text = aggregateVariantText(v);
    if (!text || text.trim() === '') return false;
    const hasCyr = cyrillicRe.test(text);
    const hasLat = latinRe.test(text);
    if (lang === 'en') {
      // Для EN приховуємо, якщо текст все ще кирилицею (не перекладений)
      return hasLat && !hasCyr;
    }
    // Для UA/RU достатньо наявності кирилиці
    return hasCyr;
  };

  // Function to truncate text with ellipsis
  const truncateText = (text: string | undefined, maxLength: number) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  // Дозволяємо колонкам стискатися: мінімальна ширина 0 для всіх клітинок, щоб уникнути горизонтального скролу
  const minWClass = (_v?: string) => 'min-w-0';

  // Інлайн-редактор тексту клітинки, відкривається по кліку
  type EditableTextCellProps = {
    rowKey: string;
    col: SiteColumnName;
    value: string;
    desc: ContentDescription;
    long?: boolean;
    placeholder?: string;
    truncate?: number; // якщо 0/undefined — без скорочення
    highlightDirty?: boolean;
    loading?: boolean;
  };
  const EditableTextCell = ({ rowKey: _rowKey, col, value, desc, long = false, placeholder = '-', truncate = 0, highlightDirty = false, loading = false, loadingText = 'генерую…' }: EditableTextCellProps & { loadingText?: string }) => {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState<string>(value);
    const inputRef = useRef<HTMLTextAreaElement | null>(null);
    // Запам'ятовуємо значення на старті редагування, щоб уникнути перезапису зовнішніх оновлень (напр., генерації)
    const valueAtEditStartRef = useRef<string>(value);
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const overlayRef = useRef<HTMLDivElement | null>(null);
    const [overlayPos, setOverlayPos] = useState<{ top: number; left: number; width: number } | null>(null);

    useEffect(() => {
      if (editing) {
        // Позиціонуємо textarea над клітинкою
        if (wrapperRef.current) {
          const rect = wrapperRef.current.getBoundingClientRect();
          setOverlayPos({ top: rect.top, left: rect.left, width: rect.width });
        }
        // Фокус у textarea
        if (inputRef.current) {
          inputRef.current.focus();
          // Розміщуємо курсор в кінець
          const len = inputRef.current.value.length;
          inputRef.current.setSelectionRange(len, len);
        }
      }
    }, [editing]);

    // Репозиціонування при скролі/ресайзі, коли редактор відкрито
    useEffect(() => {
      if (!editing) return;
      const handle = () => {
        if (!wrapperRef.current) return;
        const rect = wrapperRef.current.getBoundingClientRect();
        setOverlayPos({ top: rect.top, left: rect.left, width: rect.width });
      };
      window.addEventListener('scroll', handle, true);
      window.addEventListener('resize', handle);
      return () => {
        window.removeEventListener('scroll', handle, true);
        window.removeEventListener('resize', handle);
      };
    }, [editing]);

    // Оновлюємо чернетку, якщо значення змінилось зовні
    useEffect(() => {
      if (!editing) setDraft(value);
    }, [value, editing]);

    // Коміт змін у модель
    const commitDraft = () => {
      const v = draft ?? '';
      const field = mapSiteColumnToContentField[col];
      setDescriptions(prev => {
        // 1) Перевага: стабільний UID рядка (копіюється при спреді)
        const targetUid = (desc as any)[ROW_UID];
        let idx = -1;
        if (targetUid !== undefined) {
          idx = prev.findIndex((it) => (it as any)[ROW_UID] === targetUid);
        }
        // 2) Фолбек: пошук за id або (lang+name)
        if (idx === -1) {
          const targetId = (desc as any).product_id ?? (desc as any).id ?? null;
          const targetLang = (desc as any).site_lang_code ?? '';
          const targetName = (desc as any).site_product || (desc as any).product_name || '';
          idx = prev.findIndex(it => {
            const candidateId = (it as any).product_id ?? (it as any).id ?? null;
            if (targetId != null && candidateId != null) return candidateId === targetId;
            const itLang = (it as any).site_lang_code ?? '';
            const itName = (it as any).site_product || (it as any).product_name || '';
            return itLang === targetLang && itName === targetName;
          });
        }
        if (idx === -1) return prev;
        const next = [...prev];
        next[idx] = { ...next[idx], [field]: v } as ContentDescription;
        return next;
      });
      // Позначаємо рядок як змінений, щоб "Зберегти зміни" відправило його на бекенд
      markRowGenerated(desc);
      // Зберігаємо у localStorage як незбережене значення
      saveUnsavedField(desc, field as keyof ContentDescription, v);
    };

    // Під час редагування: закривати при кліку поза клітинкою (з комітом),
    // але НЕ закривати під час операцій генерації/перекладу/збереження.
    // Також використовуємо подію 'click' замість 'mousedown', щоб onClick на кнопках
    // встиг встановити стани (selectedGenerating/translating/...), і редактор не закрився.
    useEffect(() => {
      if (!editing) return;
      const onDocClick = (e: MouseEvent) => {
        const operationInProgress = translating || selectedGenerating || massGenerating || saving;
        if (operationInProgress) return;
        if (!wrapperRef.current) return;
        const target = e.target as Node;
        const insideOverlay = overlayRef.current ? overlayRef.current.contains(target) : false;
        if (!wrapperRef.current.contains(target) && !insideOverlay) {
          commitDraft();
          setEditing(false);
        }
      };
      document.addEventListener('click', onDocClick, false);
      return () => document.removeEventListener('click', onDocClick, false);
    }, [editing, draft, translating, selectedGenerating, massGenerating, saving]);

    // save/cancel більше не потрібні — редагування застосовується миттєво в onChange,
    // а Escape відновлює початкове значення

    if (!editing) {
      const rawShown = loading ? loadingText : value;
      const shown = truncate ? truncateText(rawShown, truncate) : rawShown;
      return (
        <div
          className={`w-full flex-1 min-h-[2px] text-xs leading-none ${loading ? 'text-amber-600 italic' : (highlightDirty ? 'text-amber-600 dark:text-amber-300 font-medium' : 'text-gray-700 dark:text-gray-300')} cursor-text hover:bg-gray-50 dark:hover:bg-gray-700 px-0.5 truncate whitespace-nowrap flex items-center gap-1`}
          onClick={(e) => { e.stopPropagation(); valueAtEditStartRef.current = value; setEditing(true); }}
          title={value || placeholder}
          data-long={long ? '1' : '0'}
        >
          {loading && <Loader2 className="h-3 w-3 animate-spin text-amber-600" />}
          {shown || placeholder}
        </div>
      );
    }

    return (
      <>
        {/* Якір усередині клітинки для вимірювання позиції */}
        <div ref={wrapperRef} onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} className="w-full flex-1" />
        {/* Оверлей-редактор над таблицею */}
        {overlayPos && createPortal(
          <div ref={overlayRef} style={{ position: 'fixed', top: overlayPos.top, left: overlayPos.left, width: overlayPos.width, zIndex: 9999 }}>
            <Textarea
              ref={inputRef as any}
              className="resize text-xs leading-tight bg-white dark:bg-neutral-900 border border-gray-300 dark:border-gray-600 rounded p-2 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[64px]"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                // Ctrl+Enter або Cmd+Enter — зберегти і закрити
                if ((e.key === 'Enter') && (e.ctrlKey || e.metaKey)) { e.preventDefault(); commitDraft(); setEditing(false); }
                if (e.key === 'Escape') {
                  e.preventDefault();
                  const original = valueAtEditStartRef.current ?? '';
                  const field = mapSiteColumnToContentField[col];
                  setDescriptions(prev => {
                    // 1) за стабільним UID
                    const targetUid = (desc as any)[ROW_UID];
                    let idx = -1;
                    if (targetUid !== undefined) {
                      idx = prev.findIndex((it) => (it as any)[ROW_UID] === targetUid);
                    }
                    // 2) фолбек за id або (lang+name)
                    if (idx === -1) {
                      const targetId = (desc as any).product_id ?? (desc as any).id ?? null;
                      const targetLang = (desc as any).site_lang_code ?? '';
                      const targetName = (desc as any).site_product || (desc as any).product_name || '';
                      idx = prev.findIndex(it => {
                        const candidateId = (it as any).product_id ?? (it as any).id ?? null;
                        if (targetId != null && candidateId != null) return candidateId === targetId;
                        const itLang = (it as any).site_lang_code ?? '';
                        const itName = (it as any).site_product || (it as any).product_name || '';
                        return itLang === targetLang && itName === targetName;
                      });
                    }
                    if (idx === -1) return prev;
                    const next = [...prev];
                    next[idx] = { ...next[idx], [field]: original } as ContentDescription;
                    return next;
                  });
                  setDraft(original);
                  setEditing(false);
                }
              }}
              onBlur={() => { commitDraft(); setEditing(false); }}
              rows={6}
            />
          </div>,
          document.body
        )}
      </>
    );
  };
  
  // Прибрано map для назв мов — колонку мови видалено

  return (
    <AIProductFillerLayout>
    <div
      className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-white dark:bg-neutral-900"
      style={
        (isDarkMode ? undefined : ({
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        } as CSSProperties))
      }
    >
      {!isDarkMode && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-[1.5px] pointer-events-none" />
      )}
      <div className="relative z-10 w-full px-0 py-0 overflow-x-hidden">
      {/* Header */}
      <div className="mb-6">
        <div className="p-4 space-y-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">{mode === 'translation' ? t('nav.translator') : t('nav.generation')}</h1>
              
              {/* Перемикач товари/категорії */}
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'products' | 'categories')} className="w-auto">
                <TabsList className="bg-white/80 dark:bg-neutral-800/80 border border-emerald-500/20">
                  <TabsTrigger value="products" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                    Товари
                  </TabsTrigger>
                  <TabsTrigger value="categories" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                    Категорії
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              {isTranslateMode && (
                <div className="flex items-center gap-1 bg-white/80 dark:bg-neutral-800/80 border border-amber-200/70 dark:border-neutral-700 rounded-full p-1 text-xs select-none">
                  <button
                    type="button"
                    aria-pressed={translationEngine === 'ai'}
                    onClick={() => setTranslationEngine('ai')}
                    className={`px-2 py-1 rounded-full transition-colors ${translationEngine === 'ai' ? 'bg-amber-500 text-white' : 'text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-neutral-700'}`}
                    title="Використовувати AI для перекладу"
                  >
                    AI переклад
                  </button>
                  <button
                    type="button"
                    aria-pressed={translationEngine === 'free'}
                    onClick={() => setTranslationEngine('free')}
                    className={`px-2 py-1 rounded-full transition-colors ${translationEngine === 'free' ? 'bg-amber-500 text-white' : 'text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-neutral-700'}`}
                    title="Використовувати Free переклад"
                  >
                    Free переклад
                  </button>
                </div>
              )}
            </div>
            
            {/* Рядок керування (пошук, мова, тип, модель/мови перекладу, кнопки) */}
            
            <div className="flex flex-wrap items-center gap-2.5 w-full">
              {/* Пошук */}
              <div className="relative flex-1 min-w-[220px] max-w-[480px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder={
                    activeTab === 'categories'
                      ? (searchQuery ? `Знайдено: ${filteredCategories.length} з ${categoryDescriptions.length}` : `Пошук по ${categoryDescriptions.length} категоріях`)
                      : (searchQuery ? `Знайдено: ${filteredDescriptions.length} з ${descriptions.length}` : `Пошук по ${descriptions.length} товарах`)
                  }
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title="Очистити пошук"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {/* Мова */}
              <Select value={selectedLang} onValueChange={(value) => setSelectedLang(value as 'ua' | 'en' | 'ru')}>
                <SelectTrigger className="w-[120px] shrink-0" title="Мова">
                  <SelectValue placeholder="Мова" />
                </SelectTrigger>
                <SelectContent className="select-content-scroll" style={{maxHeight: "320px", overflowY: "scroll", scrollbarWidth: "thin"}}>
                  <SelectItem value="ua">ua</SelectItem>
                  <SelectItem value="en">en</SelectItem>
                  <SelectItem value="ru">ru</SelectItem>
                </SelectContent>
              </Select>
              {/* Категорія */}
              <Select value={selectedCategory.toString()} onValueChange={(value) => setSelectedCategory(value === 'all' ? 'all' : parseInt(value))}>
                <SelectTrigger className="w-[200px] shrink-0">
                  <SelectValue placeholder={categoriesLoading ? 'Завантаження...' : 'Всі категорії'} />
                </SelectTrigger>
                <SelectContent className="select-content-scroll" style={{maxHeight: "320px", overflowY: "scroll", scrollbarWidth: "thin"}}>
                  <SelectItem value="all">Всі категорії</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.category_id} value={cat.category_id.toString()}>
                      {cat.category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Модель/Мови для перекладу */}
              {!isTranslateMode ? (
                // Режим генерації: вибір AI-моделі
                <>
                  <Select value={selectedChatModel} onValueChange={(value) => setSelectedChatModel(value)}>
                    <SelectTrigger className="w-[240px] shrink-0" title="AI Модель">
                      <SelectValue placeholder={modelsLoading ? 'Завантаження моделей…' : 'Виберіть модель'} />
                    </SelectTrigger>
                    <SelectContent className="select-content-scroll" style={{maxHeight: "320px", overflowY: "scroll", scrollbarWidth: "thin"}}>
                      {chatModels.map((m) => (
                        <SelectItem key={m.id} value={m.name} className="flex items-center">
                          <div className="flex items-center gap-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={m.icon} alt="icon" className="w-4 h-4 rounded-sm" />
                            <span>{m.name}</span>
                            {typeof m.input_tokens_price === 'number' && typeof m.output_tokens_price === 'number' && (
                              <span className="text-xs text-gray-500">({m.input_tokens_price}/{m.output_tokens_price})</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {modelsError && (
                    <span className="text-xs text-red-500" title={modelsError}>Помилка завантаження моделей</span>
                  )}
                </>
              ) : (
                translationEngine === 'ai' ? (
                  // Режим перекладу + AI: вибір моделі
                  <>
                    <Select value={selectedChatModel} onValueChange={(value) => setSelectedChatModel(value)}>
                      <SelectTrigger className="w-[240px] shrink-0" title="AI Модель для перекладу">
                        <SelectValue placeholder={modelsLoading ? 'Завантаження моделей…' : 'Виберіть модель'} />
                      </SelectTrigger>
                      <SelectContent className="select-content-scroll" style={{maxHeight: "320px", overflowY: "scroll", scrollbarWidth: "thin"}}>
                        {chatModels.map((m) => (
                          <SelectItem key={m.id} value={m.name} className="flex items-center">
                            <div className="flex items-center gap-2">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={m.icon} alt="icon" className="w-4 h-4 rounded-sm" />
                              <span>{m.name}</span>
                              {typeof m.input_tokens_price === 'number' && typeof m.output_tokens_price === 'number' && (
                                <span className="text-xs text-gray-500">({m.input_tokens_price}/{m.output_tokens_price})</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {modelsError && (
                      <span className="text-xs text-red-500" title={modelsError}>Помилка завантаження моделей</span>
                    )}
                  </>
                ) : (
                  // Режим перекладу + Free: селектори мов перенесено перед кнопкою перекладу
                  <></>
                )
              )
}
              {/* Кнопки керування – без додаткового контейнера (йдуть як діти головного рядка) */}
              <>
                {/* Кнопка + з попапом для додавання фільтра – перенесено сюди */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" title="Додати фільтр">
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
                          <SelectContent className="select-content-scroll" style={{maxHeight: "320px", overflowY: "scroll", scrollbarWidth: "thin"}}>
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
                                active: true
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
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={activeTab === 'categories' ? handleSaveCategoryChanges : handleSaveChanges}
                  disabled={saving}
                  title={activeTab === 'categories' ? 'Зберегти змінені категорії' : 'Надіслати лише змінені рядки до бекенду'}
                >
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  {t('buttons.save_changes')}
                </Button>
                {!isTranslateMode && (
                  <Button
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={activeTab === 'categories' ? handleMassGenerateCategories : handleMassGenerate}
                    disabled={activeTab === 'categories' ? (categoryGeneration.categoryMassGenerating || !templatesState) : (massGenerating || !templatesState)}
                  >
                    {massGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('buttons.mass_generate')}{massGenerating && massProgress ? ` (${massProgress})` : ''}
                  </Button>
                )}
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={handleRefresh} className="shrink-0">
                    {t('buttons.update')}
                  </Button>
                  {isDataFromCache && (
                    <Badge variant="secondary" className="text-xs px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" title="Дані завантажено з кешу. Оновлення у фоновому режимі...">
                      📦 Кеш
                    </Badge>
                  )}
                </div>
                {/* Блок вибору мов перенесено сюди – безпосередньо перед кнопкою перекладу */}
                {isTranslateMode && (
                  translationEngine === 'free' ? (
                    <div className="flex items-center gap-2">
                      <Select value={sourceLang} onValueChange={(value) => setSourceLang(value as 'ua' | 'en' | 'ru')}>
                        <SelectTrigger className="w-[140px] shrink-0" title="З якої мови">
                          <SelectValue placeholder="З мови" />
                        </SelectTrigger>
                        <SelectContent className="select-content-scroll" style={{maxHeight: "320px", overflowY: "scroll", scrollbarWidth: "thin"}}>
                          <SelectItem value="ua">ua</SelectItem>
                          <SelectItem value="en">en</SelectItem>
                          <SelectItem value="ru">ru</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-1">
                        <span
                          aria-hidden
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/10 text-amber-600 border border-amber-300 dark:bg-amber-400/10 dark:text-amber-300 dark:border-amber-400/30"
                          title="Напрямок перекладу"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-amber-600 hover:text-amber-700 shrink-0"
                          title="Поміняти місцями мови"
                          onClick={() => {
                            setSourceLang(targetLang);
                            setTargetLang(sourceLang);
                          }}
                        >
                          <ArrowLeftRight className="h-4 w-4" />
                        </Button>
                      </div>
                      <Select value={targetLang} onValueChange={(value) => setTargetLang(value as 'ua' | 'en' | 'ru')}>
                        <SelectTrigger className="w-[140px] shrink-0" title="На яку мову">
                          <SelectValue placeholder="На мову" />
                        </SelectTrigger>
                        <SelectContent className="select-content-scroll" style={{maxHeight: "320px", overflowY: "scroll", scrollbarWidth: "thin"}}>
                          <SelectItem value="ua">ua</SelectItem>
                          <SelectItem value="en">en</SelectItem>
                          <SelectItem value="ru">ru</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <Select value={targetLang} onValueChange={(value) => setTargetLang(value as 'ua' | 'en' | 'ru')}>
                      <SelectTrigger className="w-[140px] shrink-0" title="Мова перекладу">
                        <SelectValue placeholder="Мова перекладу" />
                      </SelectTrigger>
                      <SelectContent className="select-content-scroll" style={{maxHeight: "320px", overflowY: "scroll", scrollbarWidth: "thin"}}>
                        <SelectItem value="ua">ua</SelectItem>
                        <SelectItem value="en">en</SelectItem>
                        <SelectItem value="ru">ru</SelectItem>
                      </SelectContent>
                    </Select>
                  )
                )}
                {/* Кнопку аналізу видалено на прохання користувача */}
                {/* Згенерувати/Перекласти вибрані – завжди остання кнопка у ряду */}
                <Button
                  onClick={
    isTranslateMode 
      ? handleTranslateSelected 
      : (activeTab === 'categories' ? handleGenerateSelectedCategories : handleGenerateSelected)
  }
                  disabled={
    isTranslateMode 
      ? translating 
      : (activeTab === 'categories' 
          ? (categoryGeneration.categorySelectedGenerating || !templatesState)
          : (selectedGenerating || !templatesState))
  }
                  title={
    isTranslateMode 
      ? 'Перекласти вибрані клітинки поточної сторінки' 
      : (activeTab === 'categories' 
          ? 'Згенерувати AI-контент для вибраних категорій'
          : 'Згенерувати AI-контент для вибраних клітинок поточної сторінки')
  }
                  className={!isTranslateMode ? 'bg-red-600 hover:bg-red-700 text-white font-semibold px-4' : ''}
                  variant={isTranslateMode ? 'outline' : undefined}
               >
                  {(!isTranslateMode && (activeTab === 'categories' ? categoryGeneration.categorySelectedGenerating : selectedGenerating)) && 
    <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {(isTranslateMode && translating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isTranslateMode
                    ? `${t('buttons.translate_selected')}${translateProgress ? ` (${translateProgress})` : ''}`
                    : `${t('buttons.generate_selected')}${selectedProgress ? ` (${selectedProgress})` : ''}`}
                </Button>
              </>
              {/* Активні фільтри – після кнопок, щоб кнопки не переносились через довгі бейджі */}
              {customFilters.length > 0 && (
                <>
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
                </>
              )}
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
      <div className="p-8 rounded-2xl m-5 bg-white/95 dark:bg-transparent shadow-xl ring-1 ring-black/5 dark:ring-white/10">
      <div className="bg-white/95   dark:bg-slate-800/90 rounded-2xl shadow-xl ring-1 ring-black/5 dark:ring-white/10 overflow-x-hidden backdrop-blur-sm">
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
              <div className="rounded-t-xl overflow-hidden" style={{ minWidth: "100%" }}>
              {activeTab === 'categories' ? (
  <Table className="table-fixed min-w-full">
    <TableHeader className="[&>tr>th]:bg-[#EBF3F6] dark:[&>tr>th]:bg-gray-900 first:[&>tr>th]:rounded-tl-xl last:[&>tr>th]:rounded-tr-xl [&>tr>th:hover]:bg-[#EBF3F6] dark:[&>tr>th:hover]:bg-gray-900 [&>tr>th]:px-1">
      <TableRow>
        <TableHead noClamp className="h-10 sm:h-12 w-32 text-center text-gray-700 dark:text-gray-300 font-medium">
          <div className="relative h-full flex items-center justify-center px-2">
            <span className="leading-none">№</span>
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <Checkbox
                aria-label="Вибрати всі рядки категорій"
                checked={false}
                onCheckedChange={() => {}}
                size="md"
                className="align-middle dark:bg-neutral-800/70 hover:shadow-md"
                disabled={massGenerating || translating}
              />
            </div>
          </div>
        </TableHead>
        <TableHead noClamp className="h-10 sm:h-12 text-center text-gray-700 dark:text-gray-300 font-medium">
          <div className="flex flex-col gap-0.5 items-center justify-center h-full">
            <span className="truncate" title="Категорія">Категорія</span>
            <div className="flex items-center gap-1 mt-0.5" title="Вибрати/зняти вибір усіх клітинок у колонці">
              <Checkbox
                aria-label="Вибрати колонку Категорія"
                checked={getCategoryColumnCheckedState('category')}
                onCheckedChange={(checked) => onCategoryColumnCheckedChange('category', checked)}
                size="sm"
                className="dark:bg-neutral-800/70"
                disabled={massGenerating || translating}
              />
            </div>
          </div>
        </TableHead>
        <TableHead noClamp className="h-10 sm:h-12 text-center text-gray-700 dark:text-gray-300 font-medium">
          <div className="flex flex-col gap-0.5 items-center justify-center h-full">
            <span className="truncate" title="Опис">Опис</span>
            <div className="flex items-center gap-1 mt-0.5" title="Вибрати/зняти вибір усіх клітинок у колонці">
              <Checkbox
                aria-label="Вибрати колонку Опис"
                checked={getCategoryColumnCheckedState('description')}
                onCheckedChange={(checked) => onCategoryColumnCheckedChange('description', checked)}
                size="sm"
                className="dark:bg-neutral-800/70"
                disabled={massGenerating || translating}
              />
            </div>
          </div>
        </TableHead>
        <TableHead noClamp className="h-10 sm:h-12 text-center text-gray-700 dark:text-gray-300 font-medium">
          <div className="flex flex-col gap-0.5 items-center justify-center h-full">
            <span className="truncate" title="Meta keywords">Meta keywords</span>
            <div className="flex items-center gap-1 mt-0.5" title="Вибрати/зняти вибір усіх клітинок у колонці">
              <Checkbox
                aria-label="Вибрати колонку Meta keywords"
                checked={getCategoryColumnCheckedState('meta_keywords')}
                onCheckedChange={(checked) => onCategoryColumnCheckedChange('meta_keywords', checked)}
                size="sm"
                className="dark:bg-neutral-800/70"
                disabled={massGenerating || translating}
              />
            </div>
          </div>
        </TableHead>
        <TableHead noClamp className="h-10 sm:h-12 text-center text-gray-700 dark:text-gray-300 font-medium">
          <div className="flex flex-col gap-0.5 items-center justify-center h-full">
            <span className="truncate" title="Заголовок сторінки">Заголовок</span>
            <div className="flex items-center gap-1 mt-0.5" title="Вибрати/зняти вибір усіх клітинок у колонці">
              <Checkbox
                aria-label="Вибрати колонку Заголовок"
                checked={getCategoryColumnCheckedState('page_title')}
                onCheckedChange={(checked) => onCategoryColumnCheckedChange('page_title', checked)}
                size="sm"
                className="dark:bg-neutral-800/70"
                disabled={massGenerating || translating}
              />
            </div>
          </div>
        </TableHead>
        <TableHead noClamp className="h-10 sm:h-12 w-24 text-center text-gray-700 dark:text-gray-300 font-medium">Мова</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {(() => {
        const total = filteredCategories.length;
        const paged = pagedCategories;

        if (total === 0) {
          return (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                Немає даних для відображення
              </TableCell>
            </TableRow>
          );
        }

        console.log('📊 [Categories] Rendering categories table:', {
          total: total,
          paged: paged.length,
          categoryDescriptions: (categoryDescriptions || []).length,
          page,
          limit
        });

        return paged.map((c, idx) => {
          const rowKey = getCategoryRowKey(c, idx);
          console.log(`🔑 [Categories] Row ${idx}: rowKey = ${rowKey}, category = ${c.category}`);
          return (
            <TableRow key={rowKey} className="odd:bg-[#F5FAFD] even:bg-white odd:dark:bg-gray-900 even:dark:bg-gray-800">
              <TableCell className="py-0   text-center w-32">
                <div className="relative flex items-center justify-center text-gray-700 dark:text-gray-300 px-2 h-full">
                  <span className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center tabular-nums text-gray-500">
                    {(page - 1) * limit + idx + 1}
                  </span>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <Checkbox
                      aria-label="Вибрати весь рядок категорії"
                      checked={getCategoryRowCheckedState(rowKey)}
                      onCheckedChange={(checked) => onCategoryRowCheckedChange(rowKey, checked)}
                      onClick={(e) => e.stopPropagation()}
                      size="md"
                      className="dark:bg-neutral-800/70"
                    />
                  </div>
                </div>
              </TableCell>
              <TableCell className="py-0   px-1">
                <div className="flex items-center gap-0.5">
                  <Checkbox
                    aria-label="Вибрати клітинку категорії"
                    checked={isCategoryCellChecked(rowKey, 'category')}
                    onCheckedChange={(checked) => {
                      console.log(`🖱️ [Category Checkbox] Click on ${rowKey}:category, checked=${checked}`);
                      onCategoryCellCheckedChange(rowKey, 'category', checked);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    size="xs"
                    className="dark:bg-neutral-800/70"
                  />
                  <span className="truncate" title={c.category}>{c.category}</span>
                </div>
              </TableCell>
              <TableCell className="py-0 px-0" style={{ width: '200px', minWidth: '200px', maxWidth: '200px' }}>
                <div className="relative">
                  {!isTranslateMode && (
                    <Checkbox
                      aria-label="Вибрати клітинку опису"
                      checked={isCategoryCellChecked(rowKey, 'description')}
                      onCheckedChange={(checked) => onCategoryCellCheckedChange(rowKey, 'description', checked)}
                      onClick={(e) => e.stopPropagation()}
                      size="xs"
                      className="absolute left-0 top-0 z-10 dark:bg-neutral-800/70"
                    />
                  )}
                  <Popover 
                    open={editingCategoryCell === `${rowKey}:description`}
                    onOpenChange={(open) => {
                      if (!open) setEditingCategoryCell(null);
                    }}
                  >
                    <PopoverTrigger asChild>
                      <div
                        onClick={() => setEditingCategoryCell(`${rowKey}:description`)}
                        className={`cursor-pointer text-xs leading-tight py-0.5 px-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 min-h-[24px] ${!isTranslateMode ? 'pl-6' : ''}`}
                      >
                        <span className={`line-clamp-1 truncate ${isCategoryCellDirty(c, 'description') ? 'text-orange-600 dark:text-orange-400' : ''}`}>{c.description || 'Клікніть для редагування...'}</span>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-96 p-3" align="start">
                      <Textarea
                        value={c.description || ''}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setCategoryDescriptions(prev => prev.map(cat => 
                            cat.category_id === c.category_id && cat.lang_code === c.lang_code 
                              ? { ...cat, description: newValue }
                              : cat
                          ));
                          saveCategoryUnsavedField(c, 'description', newValue);
                        }}
                        className="w-full min-h-[120px] text-sm"
                        placeholder="Опис категорії..."
                        autoFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {categoryGeneration.categoryCellGenerating[`${rowKey}:description`] && (
                    <div className="absolute inset-0 bg-blue-50/80 dark:bg-blue-900/20 flex items-center justify-center rounded">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      <span className="ml-2 text-xs text-blue-600">генерую…</span>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="py-0 px-0" style={{ width: '180px', minWidth: '180px', maxWidth: '180px' }}>
                <div className="relative">
                  {!isTranslateMode && (
                    <Checkbox
                      aria-label="Вибрати клітинку meta keywords"
                      checked={isCategoryCellChecked(rowKey, 'meta_keywords')}
                      onCheckedChange={(checked) => onCategoryCellCheckedChange(rowKey, 'meta_keywords', checked)}
                      onClick={(e) => e.stopPropagation()}
                      size="xs"
                      className="absolute left-0 top-0 z-10 dark:bg-neutral-800/70"
                    />
                  )}
                  <Popover 
                    open={editingCategoryCell === `${rowKey}:meta_keywords`}
                    onOpenChange={(open) => {
                      if (!open) setEditingCategoryCell(null);
                    }}
                  >
                    <PopoverTrigger asChild>
                      <div
                        onClick={() => setEditingCategoryCell(`${rowKey}:meta_keywords`)}
                        className={`cursor-pointer text-xs leading-tight py-0.5 px-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 min-h-[24px] ${!isTranslateMode ? 'pl-6' : ''}`}
                      >
                        <span className={`line-clamp-1 truncate ${isCategoryCellDirty(c, 'meta_keywords') ? 'text-orange-600 dark:text-orange-400' : ''}`}>{c.meta_keywords || 'Клікніть для редагування...'}</span>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-96 p-3" align="start">
                      <Textarea
                        value={c.meta_keywords || ''}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setCategoryDescriptions(prev => prev.map(cat => 
                            cat.category_id === c.category_id && cat.lang_code === c.lang_code 
                              ? { ...cat, meta_keywords: newValue }
                              : cat
                          ));
                          saveCategoryUnsavedField(c, 'meta_keywords', newValue);
                        }}
                        className="w-full min-h-[120px] text-sm"
                        placeholder="Ключові слова..."
                        autoFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {categoryGeneration.categoryCellGenerating[`${rowKey}:meta_keywords`] && (
                    <div className="absolute inset-0 bg-blue-50/80 dark:bg-blue-900/20 flex items-center justify-center rounded">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      <span className="ml-2 text-xs text-blue-600">генерую…</span>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="py-0 px-0" style={{ width: '180px', minWidth: '180px', maxWidth: '180px' }}>
                <div className="relative">
                  {!isTranslateMode && (
                    <Checkbox
                      aria-label="Вибрати клітинку заголовка"
                      checked={isCategoryCellChecked(rowKey, 'page_title')}
                      onCheckedChange={(checked) => onCategoryCellCheckedChange(rowKey, 'page_title', checked)}
                      onClick={(e) => e.stopPropagation()}
                      size="xs"
                      className="absolute left-0 top-0 z-10 dark:bg-neutral-800/70"
                    />
                  )}
                  <Popover 
                    open={editingCategoryCell === `${rowKey}:page_title`}
                    onOpenChange={(open) => {
                      if (!open) setEditingCategoryCell(null);
                    }}
                  >
                    <PopoverTrigger asChild>
                      <div
                        onClick={() => setEditingCategoryCell(`${rowKey}:page_title`)}
                        className={`cursor-pointer text-xs leading-tight py-0.5 px-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 min-h-[24px] ${!isTranslateMode ? 'pl-6' : ''}`}
                      >
                        <span className={`line-clamp-1 truncate ${isCategoryCellDirty(c, 'page_title') ? 'text-orange-600 dark:text-orange-400' : ''}`}>{c.page_title || 'Клікніть для редагування...'}</span>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-96 p-3" align="start">
                      <Textarea
                        value={c.page_title || ''}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setCategoryDescriptions(prev => prev.map(cat => 
                            cat.category_id === c.category_id && cat.lang_code === c.lang_code 
                              ? { ...cat, page_title: newValue }
                              : cat
                          ));
                          saveCategoryUnsavedField(c, 'page_title', newValue);
                        }}
                        className="w-full min-h-[120px] text-sm"
                        placeholder="Заголовок сторінки..."
                        autoFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {categoryGeneration.categoryCellGenerating[`${rowKey}:page_title`] && (
                    <div className="absolute inset-0 bg-blue-50/80 dark:bg-blue-900/20 flex items-center justify-center rounded">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      <span className="ml-2 text-xs text-blue-600">генерую…</span>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-center uppercase">{(c.lang_code || '').toUpperCase()}</TableCell>
            </TableRow>
          );
        });
      })()}
    </TableBody>
  </Table>
) : (
              <Table className="table-fixed min-w-full">
              <TableHeader className="[&>tr>th]:bg-[#EBF3F6] dark:[&>tr>th]:bg-gray-900 first:[&>tr>th]:rounded-tl-xl last:[&>tr>th]:rounded-tr-xl [&>tr>th:hover]:bg-[#EBF3F6] dark:[&>tr>th:hover]:bg-gray-900 [&>tr>th]:px-1">
                <TableRow>
                  <TableHead noClamp className="h-10 sm:h-12 w-32 text-center text-gray-700 dark:text-gray-300 font-medium">
                    <div className="relative h-full flex items-center justify-center px-2">
                      <span className="leading-none">№</span>
                      {isTranslateMode && (
                        <div className="absolute left-2 top-1/2 -translate-y-1/2">
                          {(() => {
                            const master = getExpandAllCheckedState();
                            const allExpanded = master === true;
                            return (
                              <button
                                type="button"
                                aria-label={allExpanded ? 'Згорнути всі рядки' : 'Розгорнути всі рядки'}
                                title={allExpanded ? 'Згорнути всі рядки' : 'Розгорнути всі рядки'}
                                onClick={() => onExpandAllCheckedChange(!allExpanded)}
                                disabled={translating}
                                className="h-6 w-6 inline-flex items-center justify-center rounded hover:bg-neutral-200/70 dark:hover:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300"
                              >
                                {allExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </button>
                            );
                          })()}
                        </div>
                      )}
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <Checkbox
                          aria-label="Вибрати всі колонки на сторінці"
                          checked={getMasterCheckedState()}
                          onCheckedChange={(checked) => onMasterCheckedChange(checked)}
                          size="md"
                          className="align-middle dark:bg-neutral-800/70 hover:shadow-md"
                          disabled={massGenerating || translating}
                        />
                      </div>
                    </div>
                  </TableHead>
                  <TableHead noClamp className="h-10 sm:h-12 text-center text-gray-700 dark:text-gray-300 font-medium" resizable onResizeStart={onResizeStart('product')} style={getColStyle('product')}>
                    <div className="flex flex-col gap-0.5 items-center justify-center h-full">
                      <div className="flex items-center justify-center gap-1 w-full overflow-hidden">
                        <span className="truncate" title="Назва товару">Назва</span>
                        <Button
                          variant="outline"
                          className="h-5 w-5 p-0 ml-1"
                          title={`Сортувати за назвою (${sortBy === 'product' ? sortDir : 'off'})`}
                          onClick={() => toggleSort('product')}
                        >
                          <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5" title="Вибрати/зняти вибір усіх клітинок у колонці">
                        <Checkbox
                          aria-label="Вибрати колонку Назва"
                          checked={getColumnCheckedState('product')}
                          onCheckedChange={(checked) => onColumnCheckedChange('product', checked)}
                          size="sm"
                          className="dark:bg-neutral-800/70"
                          disabled={massGenerating || translating}
                        />
                      </div>
                    </div>
                  </TableHead>
                  <TableHead noClamp className="h-10 sm:h-12 text-center text-gray-700 dark:text-gray-300 font-medium" resizable onResizeStart={onResizeStart('shortname')} style={getColStyle('shortname')}>
                    <div className="flex flex-col gap-0.5 items-center justify-center h-full">
                      <div className="flex items-center justify-center gap-1 w-full overflow-hidden">
                        <span className="truncate" title="Коротка назва">Коротка</span>
                        <Button
                          variant="outline"
                          className="h-5 w-5 p-0 ml-1"
                          title={`Сортувати (${sortBy === 'shortname' ? sortDir : 'off'})`}
                          onClick={() => toggleSort('shortname')}
                        >
                          <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5" title="Вибрати/зняти вибір усіх клітинок у колонці">
                        <Checkbox
                          aria-label="Вибрати колонку Коротка"
                          checked={getColumnCheckedState('shortname')}
                          onCheckedChange={(checked) => onColumnCheckedChange('shortname', checked)}
                          size="sm"
                          className="dark:bg-neutral-800/70"
                          disabled={massGenerating || translating}
                        />
                      </div>
                    </div>
                  </TableHead>
                  <TableHead noClamp className="h-10 sm:h-12 text-center text-gray-700 dark:text-gray-300 font-medium" resizable onResizeStart={onResizeStart('short_description')} style={getColStyle('short_description')}>
                    <div className="flex flex-col gap-0.5 items-center justify-center h-full">
                      <div className="flex items-center justify-center gap-1 w-full overflow-hidden">
                        <span className="truncate" title="Короткий опис">Опис</span>
                        <Button
                          variant="outline"
                          className="h-5 w-5 p-0 ml-1"
                          title={`Сортувати (${sortBy === 'short_description' ? sortDir : 'off'})`}
                          onClick={() => toggleSort('short_description')}
                        >
                          <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5" title="Вибрати/зняти вибір усіх клітинок у колонці">
                        <Checkbox
                          aria-label="Вибрати колонку Опис"
                          checked={getColumnCheckedState('short_description')}
                          onCheckedChange={(checked) => onColumnCheckedChange('short_description', checked)}
                          size="sm"
                          className="dark:bg-neutral-800/70"
                          disabled={massGenerating || translating}
                        />
                      </div>
                    </div>
                  </TableHead>
                  <TableHead noClamp className="h-10 sm:h-12 text-center text-gray-700 dark:text-gray-300 font-medium" resizable onResizeStart={onResizeStart('full_description')} style={getColStyle('full_description')}>
                    <div className="flex flex-col gap-0.5 items-center justify-center h-full">
                      <div className="flex items-center justify-center gap-1 w-full overflow-hidden">
                        <span className="truncate" title="Повний опис">Повний</span>
                        <Button
                          variant="outline"
                          className="h-5 w-5 p-0 ml-1"
                          title={`Сортувати (${sortBy === 'full_description' ? sortDir : 'off'})`}
                          onClick={() => toggleSort('full_description')}
                        >
                          <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5" title="Вибрати/зняти вибір усіх клітинок у колонці">
                        <Checkbox
                          aria-label="Вибрати колонку Повний"
                          checked={getColumnCheckedState('full_description')}
                          onCheckedChange={(checked) => onColumnCheckedChange('full_description', checked)}
                          size="sm"
                          className="dark:bg-neutral-800/70"
                          disabled={massGenerating || translating}
                        />
                      </div>
                    </div>
                  </TableHead>
                  <TableHead noClamp className="h-10 sm:h-12 text-center text-gray-700 dark:text-gray-300 font-medium" resizable onResizeStart={onResizeStart('promo_text')} style={getColStyle('promo_text')}>
                    <div className="flex flex-col gap-0.5 items-center justify-center h-full">
                      <div className="flex items-center justify-center gap-1 w-full overflow-hidden">
                        <span className="truncate" title="Промо‑текст">Промо</span>
                        <Button
                          variant="outline"
                          className="h-5 w-5 p-0 ml-1"
                          title={`Сортувати (${sortBy === 'promo_text' ? sortDir : 'off'})`}
                          onClick={() => toggleSort('promo_text')}
                        >
                          <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5" title="Вибрати/зняти вибір усіх клітинок у колонці">
                        <Checkbox
                          aria-label="Вибрати колонку Промо"
                          checked={getColumnCheckedState('promo_text')}
                          onCheckedChange={(checked) => onColumnCheckedChange('promo_text', checked)}
                          size="sm"
                          className="dark:bg-neutral-800/70"
                          disabled={massGenerating || translating}
                        />
                      </div>
                    </div>
                  </TableHead>
                  <TableHead noClamp className="h-10 sm:h-12 text-gray-700 dark:text-gray-300 font-medium" resizable onResizeStart={onResizeStart('meta_keywords')} style={getColStyle('meta_keywords')}>
                    <div className="flex flex-col gap-0.5 items-start justify-center h-full">
                      <div className="flex items-center gap-1 w-full overflow-hidden">
                        <span className="truncate" title="Мета ключові слова (meta keywords)">Мета</span>
                        <Button
                          variant="outline"
                          className="h-5 w-5 p-0 ml-1"
                          title={`Сортувати (${sortBy === 'meta_keywords' ? sortDir : 'off'})`}
                          onClick={() => toggleSort('meta_keywords')}
                        >
                          <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5" title="Вибрати/зняти вибір усіх клітинок у колонці">
                        <Checkbox
                          aria-label="Вибрати колонку Мета"
                          checked={getColumnCheckedState('meta_keywords')}
                          onCheckedChange={(checked) => onColumnCheckedChange('meta_keywords', checked)}
                          size="sm"
                          className="dark:bg-neutral-800/70"
                          disabled={massGenerating || translating}
                        />
                      </div>
                    </div>
                  </TableHead>
                  <TableHead noClamp className="h-10 sm:h-12 text-center text-gray-700 dark:text-gray-300 font-medium" resizable onResizeStart={onResizeStart('meta_description')} style={getColStyle('meta_description')}>
                    <div className="flex flex-col gap-0.5 items-center justify-center h-full">
                      <div className="flex items-center justify-center gap-1 w-full overflow-hidden">
                        <span className="truncate" title="Мета‑опис (meta description)">Мета-опис</span>
                        <Button
                          variant="outline"
                          className="h-5 w-5 p-0 ml-1"
                          title={`Сортувати (${sortBy === 'meta_description' ? sortDir : 'off'})`}
                          onClick={() => toggleSort('meta_description')}
                        >
                          <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5" title="Вибрати/зняти вибір усіх клітинок у колонці">
                        <Checkbox
                          aria-label="Вибрати колонку Мета-опис"
                          checked={getColumnCheckedState('meta_description')}
                          onCheckedChange={(checked) => onColumnCheckedChange('meta_description', checked)}
                          size="sm"
                          className="dark:bg-neutral-800/70"
                          disabled={massGenerating || translating}
                        />
                      </div>
                    </div>
                  </TableHead>
                  <TableHead noClamp className="h-10 sm:h-12 text-center text-gray-700 dark:text-gray-300 font-medium" resizable onResizeStart={onResizeStart('searchwords')} style={getColStyle('searchwords')}>
                    <div className="flex flex-col gap-0.5 items-center justify-center h-full">
                      <div className="flex items-center justify-center gap-1 w-full overflow-hidden">
                        <span className="truncate" title="Пошукові слова для сайту">Пошукові слова</span>
                        <Button
                          variant="outline"
                          className="h-5 w-5 p-0 ml-1"
                          title={`Сортувати (${sortBy === 'searchwords' ? sortDir : 'off'})`}
                          onClick={() => toggleSort('searchwords')}
                        >
                          <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5" title="Вибрати/зняти вибір усіх клітинок у колонці">
                        <Checkbox
                          aria-label="Вибрати колонку Пошукові слова"
                          checked={getColumnCheckedState('searchwords')}
                          onCheckedChange={(checked) => onColumnCheckedChange('searchwords', checked)}
                          size="sm"
                          className="dark:bg-neutral-800/70"
                          disabled={massGenerating || translating}
                        />
                      </div>
                    </div>
                  </TableHead>
                  <TableHead noClamp className="h-10 sm:h-12 text-center text-gray-700 dark:text-gray-300 font-medium" resizable onResizeStart={onResizeStart('page_title')} style={getColStyle('page_title')}>
                    <div className="flex flex-col gap-0.5 items-center justify-center h-full">
                      <div className="flex items-center justify-center gap-1 w-full overflow-hidden">
                        <span className="truncate" title="Заголовок сторінки (page title)">Заголовок</span>
                        <Button
                          variant="outline"
                          className="h-5 w-5 p-0 ml-1"
                          title={`Сортувати (${sortBy === 'page_title' ? sortDir : 'off'})`}
                          onClick={() => toggleSort('page_title')}
                        >
                          <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5" title="Вибрати/зняти вибір усіх клітинок у колонці">
                        <Checkbox
                          aria-label="Вибрати колонку Заголовок"
                          checked={getColumnCheckedState('page_title')}
                          onCheckedChange={(checked) => onColumnCheckedChange('page_title', checked)}
                          size="sm"
                          className="dark:bg-neutral-800/70"
                          disabled={massGenerating || translating}
                        />
                      </div>
                    </div>
                  </TableHead>
                  <TableHead noClamp className="h-10 sm:h-12 text-center text-gray-700 dark:text-gray-300 font-medium" style={{ width: '120px', minWidth: '120px', maxWidth: '120px' }}>
                    <div className="flex flex-col gap-0.5 items-center justify-center h-full">
                      <div className="flex items-center justify-center gap-1 w-full overflow-hidden">
                        <span className="truncate" title="Відгук користувача">Відгук</span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5" title="Вибрати/зняти вибір усіх клітинок у колонці">
                        <Checkbox
                          aria-label="Вибрати колонку Відгук"
                          checked={false}
                          onCheckedChange={() => {}}
                          size="sm"
                          className="dark:bg-neutral-800/70"
                          disabled={true}
                        />
                      </div>
                    </div>
                  </TableHead>
                  <TableHead noClamp className="h-10 sm:h-12 text-center text-gray-700 dark:text-gray-300 font-medium rounded-tr-xl" style={{ width: '100px', minWidth: '100px', maxWidth: '100px' }}>
                    <div className="flex flex-col gap-0.5 items-center justify-center h-full">
                      <div className="flex items-center justify-center gap-1 w-full overflow-hidden">
                        <span className="truncate" title="Оцінка якості">Оцінка</span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5" title="Вибрати/зняти вибір усіх клітинок у колонці">
                        <Checkbox
                          aria-label="Вибрати колонку Оцінка"
                          checked={false}
                          onCheckedChange={() => {}}
                          size="sm"
                          className="dark:bg-neutral-800/70"
                          disabled={true}
                        />
                      </div>
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  console.log('📊 [TableBody] Rendering table body:', {
                    filteredDescriptions: filteredDescriptions.length,
                    pagedDescriptions: pagedDescriptions.length,
                    descriptions: descriptions.length
                  });
                  return null;
                })()}
                {filteredDescriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8 text-gray-500">
                      Немає даних для відображення
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedDescriptions.map((desc, index) => {
                    const rowKey = getRowKey(desc, index);
                    console.log(`🔑 [Render] Row ${index}: rowKey = ${rowKey}, product = ${desc.site_product || desc.product_name || 'unnamed'}`);
                    
                    // У режимі перекладу: якщо користувач вручну перемкнув (chevron),
                    // використовуємо це значення. Інакше — розкриваємо за станом чекбокса рядка.
                    const manualExpand = expandedRowKeys[rowKey];
                    const expanded = isTranslateMode && (
                      manualExpand !== undefined ? manualExpand : (getRowCheckedState(rowKey) === true)
                    );
                    return (
                      <Fragment key={rowKey}>
                      <TableRow className={`h-auto min-h-[2px] odd:bg-[#F5FAFD] even:bg-white odd:dark:bg-gray-900 even:dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700`}>
                        <TableCell className="py-0 sm:py-1 px-1 text-center w-32">
                          <div className="relative flex items-center justify-center text-gray-700 dark:text-gray-300 px-2 h-full">
                            {/* Ліворуч — chevron у режимі перекладу */}
                            <div className="absolute left-2 top-1/2 -translate-y-1/2">
                              {isTranslateMode ? (
                                <button
                                  type="button"
                                  className="h-4 w-4 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                                  title={expanded ? 'Згорнути підрядки' : 'Розгорнути підрядки'}
                                  onClick={(e) => { e.stopPropagation(); toggleRowExpanded(rowKey); }}
                                >
                                  {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                </button>
                              ) : null}
                            </div>
                            {/* По центру — номер рядка (абсолютно по центру, як '№' у хедері) */}
                            <span className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center tabular-nums text-gray-500">
                              {(page - 1) * limit + index + 1}
                            </span>
                            {/* Праворуч — чекбокс рядка */}
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                              <Checkbox
                                aria-label="Вибрати весь рядок"
                                checked={getRowCheckedState(rowKey)}
                                onCheckedChange={(checked) => onRowGenerateCheckedChange(rowKey, checked)}
                                onClick={(e) => e.stopPropagation()}
                                size="md"
                                className="dark:bg-neutral-800/70"
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-0 sm:py-1 px-1 min-h-[2px]" style={getColStyle('product')}>
                          <div className={`flex items-center gap-0.5 ${minWClass(desc.site_product || desc.product_name || '')}`} title={desc.site_product || desc.product_name || ''}>
                            <Checkbox
                              aria-label="Вибрати клітинку"
                              checked={isCellChecked(rowKey, 'product')}
                              onCheckedChange={(checked) => {
                                console.log(`🖱️ [Checkbox] Click on ${rowKey}:product, checked=${checked}`);
                                onCellCheckedChangeWithLog(rowKey, 'product', desc, checked);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              size="xs"
                              className="dark:bg-neutral-800/70"
                            />
                            <EditableTextCell
                              rowKey={rowKey}
                              col="product"
                              value={desc.site_product || desc.product_name || ''}
                              desc={desc}
                              long={true}
                              highlightDirty={isCellDirty(desc, 'product')}
                              loading={!!(cellGenerating[`${rowKey}:product`] || cellTranslating[`${rowKey}:product`])}
                              loadingText={cellTranslating[`${rowKey}:product`] ? 'перекладаю…' : 'генерую…'}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-0 sm:py-1 px-1 min-h-[2px]" style={getColStyle('shortname')}>
                          <div className={`flex items-center gap-0.5 ${minWClass(desc.site_shortname || '')}`}>
                            <Checkbox
                              aria-label="Вибрати клітинку"
                              checked={isCellChecked(rowKey, 'shortname')}
                              onCheckedChange={(checked) => onCellCheckedChangeWithLog(rowKey, 'shortname', desc, checked)}
                              onClick={(e) => e.stopPropagation()}
                              size="xs"
                              className="dark:bg-neutral-800/70"
                            />
                            <EditableTextCell
                              rowKey={rowKey}
                              col="shortname"
                              value={desc.site_shortname || ''}
                              desc={desc}
                              long
                              highlightDirty={isCellDirty(desc, 'shortname')}
                              loading={!!(cellGenerating[`${rowKey}:shortname`] || cellTranslating[`${rowKey}:shortname`])}
                              loadingText={cellTranslating[`${rowKey}:shortname`] ? 'перекладаю…' : 'генерую…'}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-0 sm:py-1 px-1 min-h-[2px]" style={getColStyle('short_description')}>
                          <div className={`flex items-center gap-0.5 ${minWClass(desc.site_short_description || '')}`} title={desc.site_shortname || ''}>
                            <Checkbox
                              aria-label="Вибрати клітинку"
                              checked={isCellChecked(rowKey, 'short_description')}
                              onCheckedChange={(checked) => onCellCheckedChangeWithLog(rowKey, 'short_description', desc, checked)}
                              onClick={(e) => e.stopPropagation()}
                              size="xs"
                              className="dark:bg-neutral-800/70"
                            />
                            <EditableTextCell
                              rowKey={rowKey}
                              col="short_description"
                              value={desc.site_short_description || ''}
                              desc={desc}
                              long
                              highlightDirty={isCellDirty(desc, 'short_description')}
                              loading={!!(cellGenerating[`${rowKey}:short_description`] || cellTranslating[`${rowKey}:short_description`])}
                              loadingText={cellTranslating[`${rowKey}:short_description`] ? 'перекладаю…' : 'генерую…'}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-0 sm:py-1 px-1 min-h-[2px]" style={getColStyle('full_description')}>
                          <div className={`flex items-center gap-0.5 ${minWClass(desc.site_full_description || desc.description || '')}`} title={desc.site_full_description || desc.description || ''}>
                            <Checkbox
                              aria-label="Вибрати клітинку"
                              checked={isCellChecked(rowKey, 'full_description')}
                              onCheckedChange={(checked) => onCellCheckedChangeWithLog(rowKey, 'full_description', desc, checked)}
                              onClick={(e) => e.stopPropagation()}
                              size="xs"
                              className="dark:bg-neutral-800/70"
                            />
                            <EditableTextCell
                              rowKey={rowKey}
                              col="full_description"
                              value={desc.site_full_description || desc.description || ''}
                              desc={desc}
                              long
                              highlightDirty={isCellDirty(desc, 'full_description')}
                              loading={!!(cellGenerating[`${rowKey}:full_description`] || cellTranslating[`${rowKey}:full_description`])}
                              loadingText={cellTranslating[`${rowKey}:full_description`] ? 'перекладаю…' : 'генерую…'}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-0 sm:py-1 px-1 min-h-[2px]" style={getColStyle('promo_text')}>
                          <div className={`flex items-center gap-0.5 ${minWClass(desc.site_promo_text || '')}`} title={desc.site_promo_text || ''}>
                            <Checkbox
                              aria-label="Вибрати клітинку"
                              checked={isCellChecked(rowKey, 'promo_text')}
                              onCheckedChange={(checked) => onCellCheckedChangeWithLog(rowKey, 'promo_text', desc, checked)}
                              onClick={(e) => e.stopPropagation()}
                              size="xs"
                              className="dark:bg-neutral-800/70"
                            />
                            <EditableTextCell
                              rowKey={rowKey}
                              col="promo_text"
                              value={desc.site_promo_text || ''}
                              desc={desc}
                              long
                              highlightDirty={isCellDirty(desc, 'promo_text')}
                              loading={!!(cellGenerating[`${rowKey}:promo_text`] || cellTranslating[`${rowKey}:promo_text`])}
                              loadingText={cellTranslating[`${rowKey}:promo_text`] ? 'перекладаю…' : 'генерую…'}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-0 sm:py-1 px-1 min-h-[2px]" style={getColStyle('meta_keywords')}>
                          <div className={`flex items-center gap-0.5 ${minWClass(desc.site_meta_keywords || '')}`} title={desc.site_meta_keywords || ''}>
                            <Checkbox
                              aria-label="Вибрати клітинку"
                              checked={isCellChecked(rowKey, 'meta_keywords')}
                              onCheckedChange={(checked) => onCellCheckedChangeWithLog(rowKey, 'meta_keywords', desc, checked)}
                              onClick={(e) => e.stopPropagation()}
                              size="xs"
                              className="dark:bg-neutral-800/70"
                            />
                            <EditableTextCell
                              rowKey={rowKey}
                              col="meta_keywords"
                              value={desc.site_meta_keywords || ''}
                              desc={desc}
                              long
                              highlightDirty={isCellDirty(desc, 'meta_keywords')}
                              loading={!!(cellGenerating[`${rowKey}:meta_keywords`] || cellTranslating[`${rowKey}:meta_keywords`])}
                              loadingText={cellTranslating[`${rowKey}:meta_keywords`] ? 'перекладаю…' : 'генерую…'}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-0 sm:py-1 px-1 min-h-[2px]" style={getColStyle('meta_description')}>
                          <div className={`flex items-center gap-0.5 ${minWClass(desc.site_meta_description || '')}`} title={desc.site_meta_description || ''}>
                            <Checkbox
                              aria-label="Вибрати клітинку"
                              checked={isCellChecked(rowKey, 'meta_description')}
                              onCheckedChange={(checked) => onCellCheckedChangeWithLog(rowKey, 'meta_description', desc, checked)}
                              onClick={(e) => e.stopPropagation()}
                              size="xs"
                              className="dark:bg-neutral-800/70"
                            />
                            <EditableTextCell
                              rowKey={rowKey}
                              col="meta_description"
                              value={desc.site_meta_description || ''}
                              desc={desc}
                              long
                              highlightDirty={isCellDirty(desc, 'meta_description')}
                              loading={!!(cellGenerating[`${rowKey}:meta_description`] || cellTranslating[`${rowKey}:meta_description`])}
                              loadingText={cellTranslating[`${rowKey}:meta_description`] ? 'перекладаю…' : 'генерую…'}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-0 sm:py-1 px-1 min-h-[2px]" style={getColStyle('searchwords')}>
                          <div className={`flex items-center gap-0.5 ${minWClass(desc.site_searchwords || '')}`} title={desc.site_searchwords || ''}>
                            <Checkbox
                              aria-label="Вибрати клітинку"
                              checked={isCellChecked(rowKey, 'searchwords')}
                              onCheckedChange={(checked) => onCellCheckedChangeWithLog(rowKey, 'searchwords', desc, checked)}
                              onClick={(e) => e.stopPropagation()}
                              size="xs"
                              className="dark:bg-neutral-800/70"
                            />
                            <EditableTextCell
                              rowKey={rowKey}
                              col="searchwords"
                              value={desc.site_searchwords || ''}
                              desc={desc}
                              long
                              highlightDirty={isCellDirty(desc, 'searchwords')}
                              loading={!!(cellGenerating[`${rowKey}:searchwords`] || cellTranslating[`${rowKey}:searchwords`])}
                              loadingText={cellTranslating[`${rowKey}:searchwords`] ? 'перекладаю…' : 'генерую…'}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-0 sm:py-1 px-1 min-h-[2px]" style={getColStyle('page_title')}>
                          <div className={`flex items-center gap-0.5 ${minWClass(desc.site_page_title || '')}`} title={desc.site_page_title || ''}>
                            <Checkbox
                              aria-label="Вибрати клітинку"
                              checked={isCellChecked(rowKey, 'page_title')}
                              onCheckedChange={(checked) => onCellCheckedChangeWithLog(rowKey, 'page_title', desc, checked)}
                              onClick={(e) => e.stopPropagation()}
                              size="xs"
                              className="dark:bg-neutral-800/70"
                            />
                            <EditableTextCell
                              rowKey={rowKey}
                              col="page_title"
                              value={desc.site_page_title || ''}
                              desc={desc}
                              long
                              highlightDirty={isCellDirty(desc, 'page_title')}
                              loading={!!(cellGenerating[`${rowKey}:page_title`] || cellTranslating[`${rowKey}:page_title`])}
                              loadingText={cellTranslating[`${rowKey}:page_title`] ? 'перекладаю…' : 'генерую…'}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-0 sm:py-1 px-1 min-h-[2px]" style={{ width: '120px', minWidth: '120px', maxWidth: '120px' }}>
                          <div className="flex items-center gap-0.5">
                            <Checkbox
                              aria-label="Вибрати клітинку"
                              checked={false}
                              onCheckedChange={() => {}}
                              onClick={(e) => e.stopPropagation()}
                              size="xs"
                              className="dark:bg-neutral-800/70"
                              disabled={true}
                            />
                            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                              —
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-0 sm:py-1 px-1 min-h-[2px]" style={{ width: '100px', minWidth: '100px', maxWidth: '100px' }}>
                          <div className="flex items-center gap-0.5">
                            <Checkbox
                              aria-label="Вибрати клітинку"
                              checked={false}
                              onCheckedChange={() => {}}
                              onClick={(e) => e.stopPropagation()}
                              size="xs"
                              className="dark:bg-neutral-800/70"
                              disabled={true}
                            />
                            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                              —
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expanded && (
                        ([targetLang] as Array<'ua'|'en'|'ru'>).map((lang) => {
                          const variant = findLangVariant(desc, lang as 'ua'|'en'|'ru');
                          if (!variant) return null;
                          // Показуємо лише ті мови, де переклад готовий: для EN — латинка без кирилиці; для RU/UA — кирилиця
                          const isReady = isVariantReadyForLang(lang as 'ua'|'en'|'ru', variant);
                          if (!isReady) return null;
                          const vKey = getRowKey(variant, 0);
                          const label = lang.toUpperCase();
                          const getValForCol = (col: SiteColumnName): string => {
                            if (!variant) return '';
                            const v = variant as ContentDescription;
                            switch (col) {
                              case 'product':
                                return (v.site_product || v.product_name || '') as string;
                              case 'shortname':
                                return (v.site_shortname || '') as string;
                              case 'short_description':
                                return (v.site_short_description || '') as string;
                              case 'full_description':
                                return (v.site_full_description || v.description || '') as string;
                              case 'promo_text':
                                return (v.site_promo_text || '') as string;
                              case 'meta_keywords':
                                return (v.site_meta_keywords || '') as string;
                              case 'meta_description':
                                return (v.site_meta_description || '') as string;
                              case 'searchwords':
                                return (v.site_searchwords || '') as string;
                              case 'page_title':
                                return (v.site_page_title || '') as string;
                              default:
                                return '';
                            }
                          };
                          return (
                            <TableRow key={`${rowKey}-lang-${lang}`} className={`h-auto min-h-[2px] bg-white/70 dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700`}>
                              <TableCell className="py-0 sm:py-1 px-1 text-center w-24">
                                <div className="flex items-center justify-center">
                                  <Badge variant="secondary" className="text-[10px] px-1 py-0.5">{label}</Badge>
                                </div>
                              </TableCell>
                              <TableCell className="py-0 sm:py-1 px-1 min-h-[2px]" style={getColStyle('product')}>
                                <div className={`flex items-center gap-0.5 ${minWClass(getValForCol('product'))}`} title={getValForCol('product')}>
                                  {variant ? (
                                    <EditableTextCell rowKey={vKey} col="product" value={getValForCol('product')} desc={variant} long={true} highlightDirty={isCellDirty(variant, 'product')} />
                                  ) : (
                                    <div className="truncate text-gray-400">-</div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="py-0 sm:py-1 px-1 min-h-[2px]" style={getColStyle('shortname')}>
                                <div className={`flex items-center gap-0.5 ${minWClass(getValForCol('shortname'))}`}>
                                  {variant ? (
                                    <EditableTextCell rowKey={vKey} col="shortname" value={getValForCol('shortname')} desc={variant} long highlightDirty={isCellDirty(variant, 'shortname')} />
                                  ) : (
                                    <div className="truncate text-gray-400">-</div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="py-0 sm:py-1 px-1 min-h-[2px]" style={getColStyle('short_description')}>
                                <div className={`flex items-center gap-0.5 ${minWClass(getValForCol('short_description'))}`} title={getValForCol('short_description')}>
                                  {variant ? (
                                    <EditableTextCell rowKey={vKey} col="short_description" value={getValForCol('short_description')} desc={variant} long highlightDirty={isCellDirty(variant, 'short_description')} />
                                  ) : (
                                    <div className="truncate text-gray-400">-</div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="py-0 sm:py-1 px-1 min-h-[2px]" style={getColStyle('full_description')}>
                                <div className={`flex items-center gap-0.5 ${minWClass(getValForCol('full_description'))}`} title={getValForCol('full_description')}>
                                  {variant ? (
                                    <EditableTextCell rowKey={vKey} col="full_description" value={getValForCol('full_description')} desc={variant} long highlightDirty={isCellDirty(variant, 'full_description')} />
                                  ) : (
                                    <div className="truncate text-gray-400">-</div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="py-0 sm:py-1 px-1 min-h-[2px]" style={getColStyle('promo_text')}>
                                <div className={`flex items-center gap-0.5 ${minWClass(getValForCol('promo_text'))}`} title={getValForCol('promo_text')}>
                                  {variant ? (
                                    <EditableTextCell rowKey={vKey} col="promo_text" value={getValForCol('promo_text')} desc={variant} long highlightDirty={isCellDirty(variant, 'promo_text')} />
                                  ) : (
                                    <div className="truncate text-gray-400">-</div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="py-0 sm:py-1 px-1 min-h-[2px]" style={getColStyle('meta_keywords')}>
                                <div className={`flex items-center gap-0.5 ${minWClass(getValForCol('meta_keywords'))}`} title={getValForCol('meta_keywords')}>
                                  {variant ? (
                                    <EditableTextCell rowKey={vKey} col="meta_keywords" value={getValForCol('meta_keywords')} desc={variant} long highlightDirty={isCellDirty(variant, 'meta_keywords')} />
                                  ) : (
                                    <div className="truncate text-gray-400">-</div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="py-0 sm:py-1 px-1 min-h-[2px]" style={getColStyle('meta_description')}>
                                <div className={`flex items-center gap-0.5 ${minWClass(getValForCol('meta_description'))}`} title={getValForCol('meta_description')}>
                                  {variant ? (
                                    <EditableTextCell rowKey={vKey} col="meta_description" value={getValForCol('meta_description')} desc={variant} long highlightDirty={isCellDirty(variant, 'meta_description')} />
                                  ) : (
                                    <div className="truncate text-gray-400">-</div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="py-0 sm:py-1 px-1 min-h-[2px]" style={getColStyle('searchwords')}>
                                <div className={`flex items-center gap-0.5 ${minWClass(getValForCol('searchwords'))}`} title={getValForCol('searchwords')}>
                                  {variant ? (
                                    <EditableTextCell rowKey={vKey} col="searchwords" value={getValForCol('searchwords')} desc={variant} long highlightDirty={isCellDirty(variant, 'searchwords')} />
                                  ) : (
                                    <div className="truncate text-gray-400">-</div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="py-0 sm:py-1 px-1 min-h-[2px]" style={getColStyle('page_title')}>
                                <div className={`flex items-center gap-0.5 ${minWClass(getValForCol('page_title'))}`} title={getValForCol('page_title')}>
                                  {variant ? (
                                    <EditableTextCell rowKey={vKey} col="page_title" value={getValForCol('page_title')} desc={variant} long highlightDirty={isCellDirty(variant, 'page_title')} />
                                  ) : (
                                    <div className="truncate text-gray-400">-</div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="py-0 sm:py-1 px-1 min-h-[2px]" style={{ width: '120px', minWidth: '120px', maxWidth: '120px' }}>
                                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                                  —
                                </div>
                              </TableCell>
                              <TableCell className="py-0 sm:py-1 px-1 min-h-[2px]" style={{ width: '100px', minWidth: '100px', maxWidth: '100px' }}>
                                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                                  —
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                      </Fragment>
                    );
                  })
                )}
              </TableBody>
              </Table>
              )}
              </div>
            </div>
            {/* Нижня панель дій (дублікат верхньої) */}
            <div className="flex flex-wrap items-center gap-2 justify-start px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={
    isTranslateMode 
      ? handleTranslateSelected 
      : (activeTab === 'categories' ? handleGenerateSelectedCategories : handleGenerateSelected)
  }
                disabled={
    isTranslateMode 
      ? translating 
      : (activeTab === 'categories' 
          ? (categoryGeneration.categorySelectedGenerating || !templatesState)
          : (selectedGenerating || !templatesState))
  }
                title={
    isTranslateMode 
      ? 'Перекласти вибрані клітинки поточної сторінки' 
      : (activeTab === 'categories' 
          ? 'Згенерувати AI-контент для вибраних категорій'
          : 'Згенерувати AI-контент для вибраних клітинок поточної сторінки')
  }
              >
                {(!isTranslateMode && (activeTab === 'categories' ? categoryGeneration.categorySelectedGenerating : selectedGenerating)) && 
    <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {(isTranslateMode && translating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isTranslateMode
                  ? `${t('buttons.translate_selected')}${translateProgress ? ` (${translateProgress})` : ''}`
                  : `${t('buttons.generate_selected')}${selectedProgress ? ` (${selectedProgress})` : ''}`}
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleSaveChanges}
                disabled={saving}
                title="Надіслати лише змінені рядки до бекенду"
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                {t('buttons.save_changes')}
              </Button>
              {!isTranslateMode && (
                <Button
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={activeTab === 'categories' ? handleMassGenerateCategories : handleMassGenerate}
                  disabled={activeTab === 'categories' ? (categoryGeneration.categoryMassGenerating || !templatesState) : (massGenerating || !templatesState)}
                >
                  {massGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('buttons.mass_generate')}{massGenerating && massProgress ? ` (${massProgress})` : ''}
                </Button>
              )}
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleRefresh}>
                  {t('buttons.update')}
                </Button>
                {isDataFromCache && (
                  <Badge variant="secondary" className="text-xs px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" title="Дані завантажено з кешу">
                    📦 Кеш
                  </Badge>
                )}
                {backgroundLoading && (
                  <Badge variant="secondary" className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 animate-pulse" title="Фонове завантаження всіх даних...">
                    ⏳ Довантаження...
                  </Badge>
                )}
                {searchQuery && (
                  <Badge variant="secondary" className="text-xs px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" title={`Пошук: "${searchQuery}"`}>
                    🔍 Знайдено: {activeTab === 'categories' ? filteredCategories.length : filteredDescriptions.length} / {activeTab === 'categories' ? categoryDescriptions.length : descriptions.length}
                  </Badge>
                )}
              </div>
            </div>
            {(totalPages > 0 || searchQuery) && (
              <div className="flex flex-col gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>
                      {(() => {
                        const start = totalFiltered > 0 ? (page - 1) * limit + 1 : 0;
                        const end = Math.min(page * limit, totalFiltered);
                        const searchInfo = searchQuery ? ` (пошук: "${searchQuery}")` : '';
                        return `${t('table.shown')} ${start}-${end} ${t('table.of')} ${totalFiltered} ${t('table.records')}${searchInfo}`;
                      })()}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('table.per_page')}</span>
                      <Select value={limit.toString()} onValueChange={(value) => setLimit(Number(value))}>
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="select-content-scroll" style={{maxHeight: "320px", overflowY: "scroll", scrollbarWidth: "thin"}}>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="30">30</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {totalPages > 1 && (
                    <Pagination 
                      currentPage={page} 
                      totalPages={totalPages} 
                      onPageChange={(newPage) => setPage(newPage)}
                    />
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      </div>
      </div>
    </div>
    </AIProductFillerLayout>
  );
}
