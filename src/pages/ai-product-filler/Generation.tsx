import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Search, Loader2, Plus, X, Save, ArrowUpDown } from 'lucide-react';
import { Checkbox } from '@/components/ui/Checkbox';
import { fetchContentDescriptions, ProductType } from '@/api/contentDescriptions';
import { fetchAllColumnPrompts, type SiteColumnName, type SiteContentPrompt, SITE_COLUMNS } from '@/api/contentPrompts';
import { getTemplates } from '@/api/productFillerMock';
import type { ProductTemplates, CategoryTemplates } from '@/api/productFillerMock';
import { generateAiDescription } from '@/api/generateAiDescription';
import { chatApi } from '@/api/chatApi';
import { updateSiteDescriptions } from '@/api/updateSiteDescriptions';
import { toast } from '@/hooks/use-toast';
import { Pagination } from '@/components/ui/Pagination';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { useLocation } from 'react-router-dom';
import bgImage from './img/photo_2025-09-02_23-21-26.jpg';
import AIProductFillerLayout from './components/AIProductFillerLayout';

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
  const [customFilters, setCustomFilters] = useState<CustomFilter[]>([]);
  const [newFilter, setNewFilter] = useState<Omit<CustomFilter, 'id' | 'active'>>({ name: '', field: 'site_product', value: '' });
  // Фільтр мови (ua/en/ru), за замовчуванням "ua"
  const [selectedLang, setSelectedLang] = useState<'ua' | 'en' | 'ru'>('ua');
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
  const [selectedCells, setSelectedCells] = useState<Record<string, boolean>>({});
  // Рядки, у яких відбулась AI‑генерація в цій сесії (для селективного збереження)
  const [generatedRows, setGeneratedRows] = useState<Record<string, boolean>>({});
  const [templatesState, setTemplatesState] = useState<TemplatesState>(null);
  // Масова генерація
  const [massGenerating, setMassGenerating] = useState(false);
  const [massProgress, setMassProgress] = useState<string>('');
  // Генерація для вибраних клітинок
  const [selectedGenerating, setSelectedGenerating] = useState(false);
  const [selectedProgress, setSelectedProgress] = useState<string>('');
  // Масова генерація по колонці — видалено (замість кнопок у хедері використовуються чекбокси вибору колонки)
  const [saving, setSaving] = useState(false);
  // Незалежний візуальний стан чекбокса рядка, щоб вибір стовпця не впливав на нього
  const [rowCheckedRows, setRowCheckedRows] = useState<Record<string, boolean>>({});
  // Незалежний стан для чекбоксів у заголовках колонок (щоб вибір рядків їх не змінював)
  const [columnHeaderChecked, setColumnHeaderChecked] = useState<Partial<Record<SiteColumnName, boolean>>>({});
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
  
  // Завантаження списку моделей для генерації
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setModelsLoading(true);
        setModelsError(null);
        const models = await chatApi.getModels();
        if (!mounted) return;
        setChatModels(models as any);
        // Встановлюємо модель за замовчуванням, якщо ще не обрана
        if (!selectedChatModel && models && models.length > 0) {
          setSelectedChatModel(models[0].name);
        }
      } catch (e: any) {
        if (!mounted) return;
        setModelsError(e?.message || 'Не вдалося завантажити моделі');
      } finally {
        if (mounted) setModelsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);
  const getRowKey = (desc: ContentDescription, index: number) =>
    String(
      desc.id ??
        `${desc.site_lang_code ?? '-'}|${desc.site_product ?? desc.product_name ?? '-'}|${index}`
    );
  const isCellChecked = (rowKey: string, col: string) => !!selectedCells[`${rowKey}:${col}`];

  // Стабільний ключ рядка для маркування генерації/збереження: product_id або lang|product
  const getStableKey = (d: ContentDescription) =>
    String((d as any).product_id ?? `${d.site_lang_code ?? ''}|${d.site_product ?? d.product_name ?? ''}`);

  // Позначка, що для рядка було виконано хоча б одну AI‑генерацію
  const markRowGenerated = (desc: ContentDescription) => {
    const key = getStableKey(desc);
    setGeneratedRows(prev => ({ ...prev, [key]: true }));
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

  const resolvePromptForColumn = (col: SiteColumnName): string | null => {
    const st = templatesState as any;
    // Якщо користувач вимкнув цю колонку у Templates — пропускаємо генерацію
    if (st?.enabled && st.enabled[col] === false) return null;
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
    // Тільки перемикаємо вибір. Генерація виконується кнопкою "Заповнити вибрані".
  };

  // Рядкові хелпери для комбінованої колонки №/Генерувати
  const ROW_GENERATABLE_COLUMNS: SiteColumnName[] = SITE_COLUMNS as SiteColumnName[];
  // Хелпер: визначити, чи значення клітинки вважається порожнім (у т.ч. плейсхолдер '-')
  const isEmptyCellValue = (v: string | null | undefined): boolean => {
    if (v === null || v === undefined) return true;
    const s = String(v).trim();
    if (s.length === 0) return true;
    return s === '-' || s === '—' || s === '–';
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
    setColumnHeaderChecked(prev => ({ ...prev, [col]: value }));
    setSelectedCells(prev => {
      const next = { ...prev };
      // Застосовуємо тільки до порожніх клітинок цієї колонки на поточній сторінці
      const field = mapSiteColumnToContentField[col];
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
    setRowCheckedRows(prev => ({ ...prev, [rowKey]: value }));
    // Знайти опис рядка за ключем
    const rowDesc = pagedDescriptions.find((d, idx) => getRowKey(d, idx) === rowKey);
    if (!rowDesc) return;
    setSelectedCells(prev => {
      const next = { ...prev };
      ROW_GENERATABLE_COLUMNS.forEach(col => {
        const field = mapSiteColumnToContentField[col];
        const v = (rowDesc as any)[field] as string | null | undefined;
        if (!isEmptyCellValue(v)) return;
        next[`${rowKey}:${col}`] = value;
      });
      return next;
    });
  };

  // Генерація для вибраних клітинок на поточній сторінці
  const handleGenerateSelected = async () => {
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
      pagedDescriptions.forEach((desc, idx) => {
        const rowKey = getRowKey(desc, idx);
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
          if (selectedCells[`${rowKey}:${col}`]) {
            jobs.push({ globalIdx, row: desc, rowKey, col });
          }
        });
      });
      if (jobs.length === 0) {
        setSelectedProgress('Нічого не вибрано');
        return;
      }
      // Генерування для product виконуємо останнім, щоб не змінювати ідентифікатор рядка до заповнення інших колонок
      jobs.sort((a, b) => (a.col === 'product' ? 1 : 0) - (b.col === 'product' ? 1 : 0));
      let done = 0;
      for (const job of jobs) {
        try {
          const desc = job.row;
          const site_product = desc.site_product || desc.product_name || '';
          const site_full_description = desc.site_full_description || desc.description || '';
          // Дозволяємо генерувати 'product' навіть якщо назва порожня; інші колонки вимагають назву
          if (job.col !== 'product' && !site_product) { done++; setSelectedProgress(`${done}/${jobs.length}`); continue; }
          const prompt = resolvePromptForColumn(job.col);
          if (!prompt) { done++; setSelectedProgress(`${done}/${jobs.length}`); continue; }
          const payload = { site_product, site_full_description, prompt, model_name: selectedChatModel || 'GPT-4o-mini' } as const;
          const res = await generateAiDescription(payload);
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
          console.error('[GenerateSelected] Помилка', e);
        } finally {
          done++;
          setSelectedProgress(`${done}/${jobs.length}`);
        }
      }
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
      let done = 0;
      for (const job of jobs) {
        const desc = job.row;
        const site_product = desc.site_product || desc.product_name || '';
        const site_full_description = desc.site_full_description || desc.description || '';
        if (!site_product) { done++; setMassProgress(`${done}/${jobs.length}`); continue; }
        const prompt = resolvePromptForColumn(job.col);
        if (!prompt) { done++; setMassProgress(`${done}/${jobs.length}`); continue; }
        try {
          const payload = { site_product, site_full_description, prompt, model_name: selectedChatModel || 'GPT-4o-mini' } as const;
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
            // Знімаємо позначку з клітинки після успішної генерації
            setSelectedCells(prev => ({ ...prev, [`${job.rowKey}:${job.col}`]: false }));
            // Маркуємо рядок як згенерований
            markRowGenerated(desc);
          }
        } catch (e) {
          console.error('[MassGenerate] Помилка', e);
        } finally {
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
        // Зберігаємо лише ті рядки, де під час цієї сесії була AI‑генерація
        const wasGenerated = !!generatedRows[getStableKey(curr)];
        if (!wasGenerated) return;
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
      // Показуємо лише статус без кількості змін
      toast({ title: 'Успішно' });
      // Оновлюємо базову копію після успішного збереження
      setInitialDescriptions(descriptions.map(it => ({ ...it })));
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

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const request = {
        product_type: selectedProductType === 'all' ? undefined : selectedProductType,
        page: 1,
        // Забираємо більше елементів за раз, далі фільтруємо і пагінуємо на клієнті
        limit: 1000,
      };
      console.log('[Generation] fetchContentDescriptions request (client-side lang filter):', request);
      
      const response = await fetchContentDescriptions<ContentDescription>(request);
      console.log('[Generation] fetchContentDescriptions response:', {
        itemsCount: response.items?.length ?? 0,
        total: response.total,
        page: response.page,
        limit: response.limit,
        sampleLangs: (response.items || []).slice(0, 5).map((x: any) => x?.site_lang_code)
      });
      setDescriptions(response.items);
      // Зберігаємо базовий стан для виявлення змін
      setInitialDescriptions(response.items.map(it => ({ ...it })));
      // total рахуємо після клієнтської фільтрації
    } catch (err) {
      setError('Помилка при завантаженні даних. Спробуйте пізніше.');
      console.error('Error fetching content descriptions:', err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, [selectedProductType]);

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
    setSelectedCells({});
    setGeneratedRows({});
    setRowCheckedRows({});
    setColumnHeaderChecked({});
  }, [selectedProductType, page, limit, searchQuery, customFilters, selectedLang]);

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
  };
  const EditableTextCell = ({ rowKey: _rowKey, col, value, desc, long = false, placeholder = '-', truncate = 0 }: EditableTextCellProps) => {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState<string>(value);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
    // Запам'ятовуємо значення на старті редагування, щоб уникнути перезапису зовнішніх оновлень (напр., генерації)
    const valueAtEditStartRef = useRef<string>(value);
    const wrapperRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      if (editing && inputRef.current) {
        inputRef.current.focus();
      }
    }, [editing]);

    // Оновлюємо чернетку, якщо значення змінилось зовні
    useEffect(() => {
      if (!editing) setDraft(value);
    }, [value, editing]);

    // Під час редагування: закривати лише при кліку поза клітинкою
    useEffect(() => {
      if (!editing) return;
      const onDocMouseDown = (e: MouseEvent) => {
        if (!wrapperRef.current) return;
        const target = e.target as Node;
        if (!wrapperRef.current.contains(target)) {
          setEditing(false);
        }
      };
      document.addEventListener('mousedown', onDocMouseDown, true);
      return () => document.removeEventListener('mousedown', onDocMouseDown, true);
    }, [editing]);

    // save/cancel більше не потрібні — редагування застосовується миттєво в onChange,
    // а Escape відновлює початкове значення

    if (!editing) {
      const shown = truncate ? truncateText(value, truncate) : value;
      return (
        <div
          className={`w-full flex-1 min-h-[2px] text-xs leading-none text-gray-700 dark:text-gray-300 cursor-text hover:bg-gray-50 dark:hover:bg-gray-700 px-0.5 truncate whitespace-nowrap`}
          onClick={(e) => { e.stopPropagation(); valueAtEditStartRef.current = value; setEditing(true); }}
          title={value || placeholder}
        >
          {shown || placeholder}
        </div>
      );
    }

    return (
      <div ref={wrapperRef} onClick={(e) => e.stopPropagation()} className="w-full flex-1">
        {long ? (
          <textarea
            ref={inputRef as any}
            className="w-full h-20 text-xs leading-none bg-transparent border border-gray-300 dark:border-gray-600 rounded p-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={draft}
            onChange={(e) => {
              const v = e.target.value;
              setDraft(v);
              const field = mapSiteColumnToContentField[col];
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
                next[idx] = { ...next[idx], [field]: v } as ContentDescription;
                return next;
              });
            }}
            rows={2}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                const original = valueAtEditStartRef.current ?? '';
                const field = mapSiteColumnToContentField[col];
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
                  next[idx] = { ...next[idx], [field]: original } as ContentDescription;
                  return next;
                });
                setDraft(original);
                setEditing(false);
              }
            }}
          />
        ) : (
          <Input
            ref={inputRef as any}
            className="w-full h-5 min-h-[2px] text-xs leading-none bg-transparent border border-gray-300 dark:border-gray-600 rounded p-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={draft}
            onChange={(e) => {
              const v = e.target.value;
              setDraft(v);
              const field = mapSiteColumnToContentField[col];
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
                next[idx] = { ...next[idx], [field]: v } as ContentDescription;
                return next;
              });
            }}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); setEditing(false); }
              if (e.key === 'Escape') {
                e.preventDefault();
                const original = valueAtEditStartRef.current ?? '';
                const field = mapSiteColumnToContentField[col];
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
                  next[idx] = { ...next[idx], [field]: original } as ContentDescription;
                  return next;
                });
                setDraft(original);
                setEditing(false);
              }
            }}
          />
        )}
      </div>
    );
  };
  
  // Прибрано map для назв мов — колонку мови видалено

  return (
    <AIProductFillerLayout>
    <div
      className="relative min-h-[calc(100vh-64px)] overflow-hidden"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-[1.5px] pointer-events-none" />
      <div className="relative z-10 w-full px-0 py-0 overflow-x-hidden">
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
                  <div className='w-auto min-w-[200px] h-10 flex items-center space-x-1 p-1
                   bg-black rounded-md border border-[#333]'>
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
            <div className="flex items-center gap-2">
              {/* Фільтр мови */}
              <Select value={selectedLang} onValueChange={(value) => setSelectedLang(value as 'ua' | 'en' | 'ru')}>
                <SelectTrigger className="w-[120px]" title="Мова">
                  <SelectValue placeholder="Мова" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ua">ua</SelectItem>
                  <SelectItem value="en">en</SelectItem>
                  <SelectItem value="ru">ru</SelectItem>
                </SelectContent>
              </Select>
              {/* Тип продукту */}
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
              {/* Модель AI */}
              <Select value={selectedChatModel} onValueChange={(value) => setSelectedChatModel(value)}>
                <SelectTrigger className="w-[240px]" title="AI Модель">
                  <SelectValue placeholder={modelsLoading ? 'Завантаження моделей…' : 'Виберіть модель'} />
                </SelectTrigger>
                <SelectContent>
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
            </div>
            
            {/* Відображення активних фільтрів */}
           
            
            {/* Кнопки та опції */}
            <div className="flex flex-wrap items-center gap-2 justify-end">
              <Button
                variant="outline"
                onClick={handleGenerateSelected}
                disabled={selectedGenerating || !templatesState}
                title="Згенерувати AI-контент для вибраних клітинок поточної сторінки"
              >
                {selectedGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Заповнити вибрані{selectedGenerating && selectedProgress ? ` (${selectedProgress})` : ''}
              </Button>
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
      <div className="p-8 rounded-2xl m-5 bg-white/95 shadow-xl ring-1 ring-black/5">
      <div className="bg-white/95   dark:bg-slate-800/90 rounded-2xl shadow-xl ring-1 ring-black/5 overflow-x-hidden backdrop-blur-sm">
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
              className="overflow-x-hidden"
            >
              <div className="rounded-t-xl overflow-hidden" style={{ minWidth: "100%" }}>
              <Table className="table-fixed w-full">
              <TableHeader className="[&>tr>th]:bg-[#EBF3F6] dark:[&>tr>th]:bg-gray-900 first:[&>tr>th]:rounded-tl-xl last:[&>tr>th]:rounded-tr-xl [&>tr>th:hover]:bg-[#EBF3F6] dark:[&>tr>th:hover]:bg-gray-900 [&>tr>th]:px-1">
                <TableRow>
                  <TableHead noClamp className="h-10 sm:h-12 w-24 text-center text-gray-700 dark:text-gray-300 font-medium">
                    <div className="flex items-center justify-center">
                      <span>№</span>
                    </div>
                  </TableHead>
                  <TableHead noClamp className="h-10 sm:h-12 text-center text-gray-700 dark:text-gray-300 font-medium">
                    <div className="flex flex-col gap-0.5 items-center justify-center h-full">
                      <div className="flex items-center justify-center gap-1 w-full overflow-hidden">
                        <span className="truncate" title="Назва">Назва</span>
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
                          className="h-4 w-4"
                          disabled={massGenerating}
                        />
                      </div>
                    </div>
                  </TableHead>
                  <TableHead noClamp className="h-10 sm:h-12 text-center text-gray-700 dark:text-gray-300 font-medium">
                    <div className="flex flex-col gap-0.5 items-center justify-center h-full">
                      <div className="flex items-center justify-center gap-1 w-full overflow-hidden">
                        <span className="truncate" title="Коротка">Коротка</span>
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
                          className="h-4 w-4"
                          disabled={massGenerating}
                        />
                      </div>
                    </div>
                  </TableHead>
                  <TableHead noClamp className="h-10 sm:h-12 text-center text-gray-700 dark:text-gray-300 font-medium">
                    <div className="flex flex-col gap-0.5 items-center justify-center h-full">
                      <div className="flex items-center justify-center gap-1 w-full overflow-hidden">
                        <span className="truncate" title="Опис">Опис</span>
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
                          className="h-4 w-4"
                          disabled={massGenerating}
                        />
                      </div>
                    </div>
                  </TableHead>
                  <TableHead noClamp className="h-10 sm:h-12 text-center text-gray-700 dark:text-gray-300 font-medium">
                    <div className="flex flex-col gap-0.5 items-center justify-center h-full">
                      <div className="flex items-center justify-center gap-1 w-full overflow-hidden">
                        <span className="truncate" title="Повний">Повний</span>
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
                          className="h-4 w-4"
                          disabled={massGenerating}
                        />
                      </div>
                    </div>
                  </TableHead>
                  <TableHead noClamp className="h-10 sm:h-12 text-center text-gray-700 dark:text-gray-300 font-medium">
                    <div className="flex flex-col gap-0.5 items-center justify-center h-full">
                      <div className="flex items-center justify-center gap-1 w-full overflow-hidden">
                        <span className="truncate" title="Промо">Промо</span>
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
                          className="h-4 w-4"
                          disabled={massGenerating}
                        />
                      </div>
                    </div>
                  </TableHead>
                  <TableHead noClamp className="h-10 sm:h-12 text-gray-700 dark:text-gray-300 font-medium">
                    <div className="flex flex-col gap-0.5 items-start justify-center h-full">
                      <div className="flex items-center gap-1 w-full overflow-hidden">
                        <span className="truncate" title="Мета">Мета</span>
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
                          className="h-4 w-4"
                          disabled={massGenerating}
                        />
                      </div>
                    </div>
                  </TableHead>
                  <TableHead noClamp className="h-10 sm:h-12 text-center text-gray-700 dark:text-gray-300 font-medium">
                    <div className="flex flex-col gap-0.5 items-center justify-center h-full">
                      <div className="flex items-center justify-center gap-1 w-full overflow-hidden">
                        <span className="truncate" title="Мета-опис">Мета-опис</span>
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
                          className="h-4 w-4"
                          disabled={massGenerating}
                        />
                      </div>
                    </div>
                  </TableHead>
                  <TableHead noClamp className="h-10 sm:h-12 text-center text-gray-700 dark:text-gray-300 font-medium">
                    <div className="flex flex-col gap-0.5 items-center justify-center h-full">
                      <div className="flex items-center justify-center gap-1 w-full overflow-hidden">
                        <span className="truncate" title="Пошукові слова">Пошукові слова</span>
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
                          className="h-4 w-4"
                          disabled={massGenerating}
                        />
                      </div>
                    </div>
                  </TableHead>
                  <TableHead noClamp className="h-10 sm:h-12 text-center text-gray-700 dark:text-gray-300 font-medium rounded-tr-xl">
                    <div className="flex flex-col gap-0.5 items-center justify-center h-full">
                      <div className="flex items-center justify-center gap-1 w-full overflow-hidden">
                        <span className="truncate" title="Заголовок">Заголовок</span>
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
                          className="h-4 w-4"
                          disabled={massGenerating}
                        />
                      </div>
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
                  pagedDescriptions.map((desc, index) => {
                    const rowKey = getRowKey(desc, index);
                    return (
                      <TableRow key={getStableKey(desc)} className={`h-auto min-h-[2px] odd:bg-[#F5FAFD] even:bg-white hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700`}>
                        <TableCell className="py-0 sm:py-1 px-1 text-center w-24">
                          <div className="flex items-center justify-center gap-1 text-gray-700 dark:text-gray-300">
                            <span className="w-6 text-right text-gray-500">{(page - 1) * limit + index + 1}</span>
                            <Checkbox
                              aria-label="Вибрати весь рядок"
                              checked={getRowCheckedState(rowKey)}
                              onCheckedChange={(checked) => onRowGenerateCheckedChange(rowKey, checked)}
                              onClick={(e) => e.stopPropagation()}
                              className="h-4 w-4"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-0 sm:py-1 px-1 min-h-[2px]">
                          <div className={`flex items-center gap-0.5 ${minWClass(desc.site_product || desc.product_name || '')}`} title={desc.site_product || desc.product_name || ''}>
                            <Checkbox
                            aria-label="Вибрати клітинку"
                            checked={isCellChecked(rowKey, 'product')}
                            onCheckedChange={(checked) => onCellCheckedChangeWithLog(rowKey, 'product', desc, checked)}
                            onClick={(e) => e.stopPropagation()}
                            className="h-3 w-3"
                          />
                            <EditableTextCell
                              rowKey={rowKey}
                              col="product"
                              value={desc.site_product || desc.product_name || ''}
                              desc={desc}
                              long={true}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-0 sm:py-1 px-1 min-h-[2px]">
                          <div className={`flex items-center gap-0.5 ${minWClass(desc.site_shortname || '')}`}>
                            <Checkbox
                            aria-label="Вибрати клітинку"
                            checked={isCellChecked(rowKey, 'shortname')}
                            onCheckedChange={(checked) => onCellCheckedChangeWithLog(rowKey, 'shortname', desc, checked)}
                            onClick={(e) => e.stopPropagation()}
                            className="h-3 w-3"
                          />
                            <EditableTextCell
                              rowKey={rowKey}
                              col="shortname"
                              value={desc.site_shortname || ''}
                              desc={desc}
                              long
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-0 sm:py-1 px-1 min-h-[2px]">
                          <div className={`flex items-center gap-0.5 ${minWClass(desc.site_short_description || '')}`} title={desc.site_shortname || ''}>
                            <Checkbox
                            aria-label="Вибрати клітинку"
                            checked={isCellChecked(rowKey, 'short_description')}
                            onCheckedChange={(checked) => onCellCheckedChangeWithLog(rowKey, 'short_description', desc, checked)}
                            onClick={(e) => e.stopPropagation()}
                            className="h-3 w-3"
                          />
                            <EditableTextCell
                              rowKey={rowKey}
                              col="short_description"
                              value={desc.site_short_description || ''}
                              desc={desc}
                              long
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-0 sm:py-1 px-1 min-h-[2px]">
                          <div className={`flex items-center gap-0.5 ${minWClass(desc.site_full_description || desc.description || '')}`} title={desc.site_full_description || desc.description || ''}>
                            <Checkbox
                            aria-label="Вибрати клітинку"
                            checked={isCellChecked(rowKey, 'full_description')}
                            onCheckedChange={(checked) => onCellCheckedChangeWithLog(rowKey, 'full_description', desc, checked)}
                            onClick={(e) => e.stopPropagation()}
                            className="h-3 w-3"
                          />
                            <EditableTextCell
                              rowKey={rowKey}
                              col="full_description"
                              value={desc.site_full_description || desc.description || ''}
                              desc={desc}
                              long
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-0 sm:py-1 px-1 min-h-[2px]">
                          <div className={`flex items-center gap-0.5 ${minWClass(desc.site_promo_text || '')}`} title={desc.site_promo_text || ''}>
                            <Checkbox
                            aria-label="Вибрати клітинку"
                            checked={isCellChecked(rowKey, 'promo_text')}
                            onCheckedChange={(checked) => onCellCheckedChangeWithLog(rowKey, 'promo_text', desc, checked)}
                            onClick={(e) => e.stopPropagation()}
                            className="h-3 w-3"
                          />
                            <EditableTextCell
                              rowKey={rowKey}
                              col="promo_text"
                              value={desc.site_promo_text || ''}
                              desc={desc}
                              long
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-0 sm:py-1 px-1 min-h-[2px]">
                          <div className={`flex items-center gap-0.5 ${minWClass(desc.site_meta_keywords || '')}`} title={desc.site_meta_keywords || ''}>
                            <Checkbox
                            aria-label="Вибрати клітинку"
                            checked={isCellChecked(rowKey, 'meta_keywords')}
                            onCheckedChange={(checked) => onCellCheckedChangeWithLog(rowKey, 'meta_keywords', desc, checked)}
                            onClick={(e) => e.stopPropagation()}
                            className="h-3 w-3"
                          />
                            <EditableTextCell
                              rowKey={rowKey}
                              col="meta_keywords"
                              value={desc.site_meta_keywords || ''}
                              desc={desc}
                              long
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-0 sm:py-1 px-1 min-h-[2px]">
                          <div className={`flex items-center gap-0.5 ${minWClass(desc.site_meta_description || '')}`} title={desc.site_meta_description || ''}>
                            <Checkbox
                            aria-label="Вибрати клітинку"
                            checked={isCellChecked(rowKey, 'meta_description')}
                            onCheckedChange={(checked) => onCellCheckedChangeWithLog(rowKey, 'meta_description', desc, checked)}
                            onClick={(e) => e.stopPropagation()}
                            className="h-3 w-3"
                          />
                            <EditableTextCell
                              rowKey={rowKey}
                              col="meta_description"
                              value={desc.site_meta_description || ''}
                              desc={desc}
                              long
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-0 sm:py-1 px-1 min-h-[2px]">
                          <div className={`flex items-center gap-0.5 ${minWClass(desc.site_searchwords || '')}`} title={desc.site_searchwords || ''}>
                            <Checkbox
                            aria-label="Вибрати клітинку"
                            checked={isCellChecked(rowKey, 'searchwords')}
                            onCheckedChange={(checked) => onCellCheckedChangeWithLog(rowKey, 'searchwords', desc, checked)}
                            onClick={(e) => e.stopPropagation()}
                            className="h-3 w-3"
                          />
                            <EditableTextCell
                              rowKey={rowKey}
                              col="searchwords"
                              value={desc.site_searchwords || ''}
                              desc={desc}
                              long
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-0 sm:py-1 px-1 min-h-[2px]">
                          <div className={`flex items-center gap-0.5 ${minWClass(desc.site_page_title || '')}`} title={desc.site_page_title || ''}>
                            <Checkbox
                            aria-label="Вибрати клітинку"
                            checked={isCellChecked(rowKey, 'page_title')}
                            onCheckedChange={(checked) => onCellCheckedChangeWithLog(rowKey, 'page_title', desc, checked)}
                            onClick={(e) => e.stopPropagation()}
                            className="h-3 w-3"
                          />
                            <EditableTextCell
                              rowKey={rowKey}
                              col="page_title"
                              value={desc.site_page_title || ''}
                              desc={desc}
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
            {/* Нижня панель дій (дублікат верхньої) */}
            <div className="flex flex-wrap items-center gap-2 justify-end px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={handleGenerateSelected}
                disabled={selectedGenerating || !templatesState}
                title="Згенерувати AI-контент для вибраних клітинок поточної сторінки"
              >
                {selectedGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Заповнити вибрані{selectedGenerating && selectedProgress ? ` (${selectedProgress})` : ''}
              </Button>
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
            {totalPages > 1 && (
              <div className="flex flex-col gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>
                      {(() => {
                        const start = totalFiltered > 0 ? (page - 1) * limit + 1 : 0;
                        const end = Math.min(page * limit, totalFiltered);
                        return `Показано ${start}-${end} з ${totalFiltered} записів`;
                      })()}
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
      </div>
    </div>
    </AIProductFillerLayout>
  );
}
