import type React from 'react';

import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { History, Trash2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/Checkbox';
// import { useNavigate } from 'react-router-dom';

import { getTemplates,
 setTemplates,
  PRODUCT_VARIABLES,
  CATEGORY_VARIABLES,
  type Lang,
  type Entity,
  type ProductTemplates,
  type CategoryTemplates,
} from '@/api/productFillerMock';

import {
  fetchAllColumnPrompts,
  fetchColumnPrompts,
  createSiteContentPrompt,
  activateSiteContentPrompt,
  deleteSiteContentPrompt,
  mapProductFieldKeyToSiteColumnName,
  type SiteColumnName,
  type SiteContentPrompt,
} from '@/api/contentPrompts';
import AIProductFillerLayout from './components/AIProductFillerLayout';

type FieldConfig<K extends string> = { key: K; label: string };

const PRODUCT_FIELDS: FieldConfig<keyof ProductTemplates>[] = [
  { key: 'name', label: 'Name' },
  { key: 'shortname', label: 'Shortname' },
  { key: 'short_description', label: 'Short description' },
  { key: 'full_description', label: 'Full description' },
  { key: 'meta_keywords', label: 'Meta-tag Keywords' },
  { key: 'meta_description', label: 'Meta description' },
  { key: 'search_words', label: 'Search words' },
  { key: 'page_title', label: 'Page title' },
  { key: 'age_warning_message', label: 'Age warning message' },
  { key: 'promo_text', label: 'Promo text' },
  { key: 'unit_name', label: 'Unit name' },
];

const CATEGORY_FIELDS: FieldConfig<keyof CategoryTemplates>[] = [
  { key: 'age_warning_message', label: 'Age warning message' },
  { key: 'meta_title', label: 'Meta-tag Title' },
  { key: 'meta_description', label: 'Meta-tag Description' },
  { key: 'description', label: 'Description' },
  { key: 'meta_keywords', label: 'Meta-tag Keywords' },
];

export default function AIProductFillerTemplates() {
  // const navigate = useNavigate();
  const STORAGE_KEY_TEMPLATES_STATE = 'aiProductFiller.templatesState';
  const [entity, setEntity] = useState<Entity>('product');
  const [lang, setLang] = useState<Lang>('ua');
  const [productTpl, setProductTpl] = useState<ProductTemplates | null>(null);
  const [categoryTpl, setCategoryTpl] = useState<CategoryTemplates | null>(null);
  const [saving, setSaving] = useState(false);
  const [prompts, setPrompts] = useState<Partial<Record<SiteColumnName, SiteContentPrompt[]>>>({});
  const [creatingColumn, setCreatingColumn] = useState<SiteColumnName | null>(null);
  // Діалог історії промптів
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyColumn, setHistoryColumn] = useState<SiteColumnName | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  // Перемикачі: увімкнена/вимкнена генерація по кожній колонці (для продуктів) для поточної мови
  type EnabledMap = Partial<Record<SiteColumnName, boolean>>;
  const ENABLED_STORAGE_KEY = 'ai_pf_enabled_columns_v1';
  const [enabled, setEnabled] = useState<EnabledMap>({});

  // Пер-колонкові статуси збереження та базовий текст останнього збереження
  const [savingPerColumn, setSavingPerColumn] = useState<
    Partial<Record<SiteColumnName, 'idle' | 'saving' | 'saved' | 'error'>>
  >({});
  const [lastSavedText, setLastSavedText] = useState<Partial<Record<SiteColumnName, string>>>({});

  // Завантажити стан перемикачів з localStorage для поточної мови
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(ENABLED_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, Record<string, boolean>>; // entity-lang -> map
        const key = `${entity}:${lang}`;
        setEnabled(parsed[key] ?? {});
      } else {
        setEnabled({});
      }
    } catch {
      setEnabled({});
    }
  }, [entity, lang]);

  const persistEnabled = (next: EnabledMap) => {
    setEnabled(next);
    try {
      const raw = window.localStorage.getItem(ENABLED_STORAGE_KEY);
      const all = raw ? (JSON.parse(raw) as Record<string, Record<string, boolean>>) : {};
      const key = `${entity}:${lang}`;
      all[key] = next as Record<string, boolean>;
      window.localStorage.setItem(ENABLED_STORAGE_KEY, JSON.stringify(all));
    } catch {
      // ignore
    }
  };

  // Сповіщення інших екранів (Generation) про зміну промптів
  const notifyPromptsChanged = (column?: SiteColumnName) => {
    try {
      const detail = { column: column ?? null, lang };
      window.dispatchEvent(new CustomEvent('ai_pf_prompts_changed', { detail }));
      console.debug('[Templates] Dispatched ai_pf_prompts_changed', detail);
    } catch (e) {
      console.warn('[Templates] Failed to dispatch prompts changed event', e);
    }
  };

  const activatePrompt = async (column: SiteColumnName, id: number) => {
    try {
      await activateSiteContentPrompt(id);
      // reload this column to reflect new active state
      const list = await fetchColumnPrompts(column, lang);
      setPrompts(prev => ({ ...prev, [column]: list }));
      // baseline map більше не використовується
      // сповістити генерацію, що активний промпт змінився
      notifyPromptsChanged(column);
    } catch (e) {
      console.error('Не вдалося активувати підказку', e);
    }
  };

  const deletePrompt = async (column: SiteColumnName, id: number) => {
    if (!window.confirm('Видалити цей промпт? Дію неможливо скасувати.')) return;
    // Перевіряємо, чи був він активним до видалення
    const prevList = prompts[column] ?? [];
    const wasActive = !!prevList.find((p) => p.id === id)?.is_active;
    setDeletingId(id);
    try {
      const ok = await deleteSiteContentPrompt(id);
      if (ok) {
        let list = await fetchColumnPrompts(column, lang);
        // Якщо видаляли активний — активуємо "попередню" версію
        if (wasActive && list.length > 0) {
          // шукаємо найбільший id, що менший за видалений; якщо немає — просто максимальний id
          const less = list.filter((x) => x.id < id);
          let toActivate = less.length > 0 ? less.reduce((a, b) => (a.id > b.id ? a : b)) : list.reduce((a, b) => (a.id > b.id ? a : b));
          if (toActivate && !toActivate.is_active) {
            await activateSiteContentPrompt(toActivate.id);
            list = await fetchColumnPrompts(column, lang);
          }
        }
        setPrompts(prev => ({ ...prev, [column]: list }));
        // baseline map більше не використовується
        notifyPromptsChanged(column);
      }
    } catch (e) {
      console.error('Не вдалося видалити підказку', e);
    } finally {
      setDeletingId(null);
    }
  };

  // Load templates
  useEffect(() => {
    // Keep local defaults as fallback only. Product fields will read from API prompts.
    setProductTpl(getTemplates('product', lang));
    setCategoryTpl(getTemplates('category', lang));
  }, [lang]);

  const loadAllPrompts = async () => {
    try {
      const data = await fetchAllColumnPrompts(undefined as unknown as any, lang);
      setPrompts(data);

      // ініціалізуємо lastSavedText поточними активними/першими значеннями
      const last: Partial<Record<SiteColumnName, string>> = {};
      (Object.keys(data) as SiteColumnName[]).forEach((c) => {
        const list = data[c] ?? [];
        const active = (list.find((it) => !!it.is_active) ?? list[0]) as SiteContentPrompt | undefined;
        if (active) last[c] = active.prompt;
      });
      setLastSavedText(last);
    } catch (e) {
      console.error('Не вдалося завантажити підказки', e);
    }
  };

  // Видалено goToGenerationWithTemplates — не використовується у цьому UI

  // Постійно зберігаємо актуальний payload у sessionStorage як fallback для Generation
  useEffect(() => {
    const payload = {
      from: 'templates' as const,
      entity,
      lang,
      prompts,
      productTpl,
      categoryTpl,
      enabled,
    };
    try {
      sessionStorage.setItem(STORAGE_KEY_TEMPLATES_STATE, JSON.stringify(payload));
    } catch (e) {
      console.warn('[Templates] Failed to persist payload to sessionStorage', e);
    }
  }, [entity, lang, prompts, productTpl, categoryTpl, enabled]);

  const createPrompt = async (column: SiteColumnName, name: string, prompt: string) => {
    setCreatingColumn(column);
    try {
      const payload = { name, prompt, site_column_name: column, lang_code: lang, is_active: true } as const;
      console.log('[CreateSiteContentPrompt] Payload:', payload);
      const created = await createSiteContentPrompt(payload);
      // Reload the column list to capture the new item (and its real id)
      let list = await fetchColumnPrompts(column, lang);
      console.log('[CreateSiteContentPrompt] Reloaded column list:', column, list);
      // Try to find created item in the list
      let target = list.find(it => it.id === created?.id);
      if (!target) target = list.find(it => it.prompt === prompt && it.name === name);
      if (!target) target = list.find(it => it.prompt === prompt);
      // If target exists and is not active, explicitly activate it (backend should deactivate previous active)
      if (target && !target.is_active) {
        await activateSiteContentPrompt(target.id);
        list = await fetchColumnPrompts(column, lang);
      }
      setPrompts(prev => ({ ...prev, [column]: list }));
      notifyPromptsChanged(column);
    } catch (e) {
      console.error('Не вдалося створити підказку', e);
    } finally {
      setCreatingColumn(null);
    }
  };

  useEffect(() => {
    void loadAllPrompts();
  }, [lang]);

  const vars = useMemo(() => (entity === 'product' ? PRODUCT_VARIABLES : CATEGORY_VARIABLES), [entity]);
  const fields = useMemo(() => (entity === 'product' ? PRODUCT_FIELDS : CATEGORY_FIELDS), [entity]);
  // left labels removed with Saved prompts UI

  // Мапа колонки у читабельну назву поля (для заголовка діалогу)
  const columnToFieldLabel = useMemo(() => {
    const map = new Map<SiteColumnName, string>();
    PRODUCT_FIELDS.forEach((f) => {
      const col = mapProductFieldKeyToSiteColumnName(f.key as keyof ProductTemplates);
      if (col) map.set(col, f.label);
    });
    return map;
  }, []);

  const handlePromptChange = (
    column: SiteColumnName,
    id: number,
    patch: Partial<Pick<SiteContentPrompt, 'name' | 'prompt'>>
  ) => {
    setPrompts(prev => {
      const list = prev[column] ?? [];
      const next = list.map(item => (item.id === id ? { ...item, ...patch } : item));
      return { ...prev, [column]: next };
    });
  };

  // Updating existing prompt is disabled by product decision; we create a new prompt instead (new id)

  // removed isDirty (кнопки версій прибрані; авто-збереження створює нову версію одразу)

  const onChangeField = (key: string, value: string) => {
    if (entity === 'product') {
      // Try map product field key to API column and update first prompt item inline
      const column = mapProductFieldKeyToSiteColumnName(key as keyof ProductTemplates);
      if (column) {
        const list = prompts[column] ?? [];
        const active = (list.find((it) => !!it.is_active) ?? list[0]) as SiteContentPrompt | undefined;
        if (active) {
          handlePromptChange(column, active.id, { prompt: value });
          return;
        }
      }
      // Fallback to local state if no mapping or no prompt item
      setProductTpl(prev => (prev ? ({ ...prev, [key]: value } as ProductTemplates) : prev));
    } else {
      setCategoryTpl(prev => (prev ? ({ ...prev, [key]: value } as CategoryTemplates) : prev));
    }
  };

  const onSave = async () => {
    // Зберігати промпти ТІЛЬКИ по кнопці. Плюс локальні немаплені поля/категорії.
    setSaving(true);
    try {
      if (entity === 'product') {
        // 1) Збереження промптів для замаплених колонок (тільки якщо є зміни)
        const saveTasks: Promise<void>[] = [];
        (PRODUCT_FIELDS as typeof PRODUCT_FIELDS).forEach((f) => {
          const column = mapProductFieldKeyToSiteColumnName(f.key as keyof ProductTemplates);
          if (!column) return; // немаплені підуть у локальне збереження нижче
          const list = prompts[column] ?? [];
          const active = (list.find((it) => !!it.is_active) ?? list[0]) as SiteContentPrompt | undefined;
          const currentText = (active?.prompt ?? ((productTpl?.[f.key as keyof ProductTemplates] as string) ?? ''));
          const baseline = (lastSavedText[column] ?? '');
          if (!currentText || currentText.trim().length === 0) return; // не створюємо порожні
          if (currentText === baseline) return; // змін немає

          setSavingPerColumn((prev) => ({ ...prev, [column]: 'saving' }));
          const currentName = active ? active.name : column;
          const task = (async () => {
            await createPrompt(column, currentName, currentText);
            setLastSavedText((prev) => ({ ...prev, [column]: currentText }));
            setSavingPerColumn((prev) => ({ ...prev, [column]: 'saved' }));
            window.setTimeout(() => {
              setSavingPerColumn((prev) => ({ ...prev, [column]: 'idle' }));
            }, 1200);
          })().catch(() => {
            setSavingPerColumn((prev) => ({ ...prev, [column]: 'error' }));
          });
          saveTasks.push(task);
        });
        await Promise.allSettled(saveTasks);

        // 2) Локальне збереження немаплених полів продукту
        if (productTpl) {
          const toPersist = PRODUCT_FIELDS.reduce((acc, f) => {
            const column = mapProductFieldKeyToSiteColumnName(f.key as keyof ProductTemplates);
            if (!column) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (acc as any)[f.key] = productTpl[f.key as keyof ProductTemplates] as any;
            }
            return acc;
          }, {} as Partial<ProductTemplates>);
          if (Object.keys(toPersist).length > 0) {
            setTemplates('product', lang, toPersist as unknown as ProductTemplates);
          }
        }
      }

      if (entity === 'category' && categoryTpl) setTemplates('category', lang, categoryTpl);
    } finally {
      setSaving(false);
    }
  };

  const copyVar = async (v: string) => {
    try {
      await navigator.clipboard.writeText(v);
    } catch {
      // ignore
    }
  };

  return (
    <AIProductFillerLayout>
    <div className="w-full py-0">
      <div className="sticky top-0 z-10 px-0 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-neutral-900/60 bg-white/80 dark:bg-neutral-900/80 border-b">
        <div className="flex items-center justify-between py-3">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold">Шаблони контенту</h1>
            <p className="text-sm text-muted-foreground">Налаштуйте шаблони AI для продуктів і категорій</p>
          </div>
          
        </div>
      </div>
      {/* Outer card */}
      <div className="p-8 rounded-2xl m-5 bg-white/95 shadow-xl dark:bg-slate-800/90 backdrop-blur-sm">
        {/* Top tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="inline-flex rounded-md overflow-hidden">
          {(['product', 'category'] as Entity[]).map(t => (
            <button
              key={t}
              className={`px-3 py-1.5 text-sm ${
                entity === t
                  ? 'bg-emerald-200/70 text-emerald-900'
                  : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800/70'
              }`}
              onClick={() => setEntity(t)}
            >
              {t === 'product' ? 'Продукт' : 'Категорія'}
            </button>
          ))}
        </div>
          <div className="inline-flex rounded-md border overflow-hidden">
          {(['ua', 'ru', 'en'] as Lang[]).map(l => (
            <button
              key={l}
              className={`px-3 py-1.5 text-sm transition-colors ${
                lang === l
                  ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                  : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800/70'
              }`}
              onClick={() => setLang(l)}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
        </div>
        {/* Variables and form */}
        <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4 mt-4">
          {/* Variables (left) */}
          <div className="col-span-1">
            <div className="rounded-xl bg-white/70 w-full dark:bg-neutral-800/40 p-4 shadow-sm">
              <h3 className="font-medium mb-3">Змінні</h3>
              <div className="flex flex-col gap-2">
                {vars.map((raw) => {
                  const [token, ...rest] = raw.split(' - ');
                  const label = rest.join(' - ');
                  return (
                    <button
                      key={raw}
                      type="button"
                      onClick={() => copyVar(token)}
                      title={`Скопіювати ${token}`}
                      className="w-full text-left text-sm px-3 py-2 rounded-md border bg-neutral-50/80 dark:bg-neutral-900/40 hover:bg-neutral-100 dark:hover:bg-neutral-900 border-neutral-200 dark:border-neutral-700 transition-colors"
                    >
                      <span className="font-mono text-[13px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
                        {token}
                      </span>
                      {label && (
                        <span className="text-neutral-600 dark:text-neutral-400 ml-2 truncate align-middle">
                          — {label}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          {/* Fields (right) */}
          <div className="col-span-1">
            <div className="rounded-xl bg-white/70 w-full dark:bg-neutral-800/40 p-4 shadow-sm">
              <h3 className="font-medium mb-4">Шаблони {entity === 'product' ? 'продуктів' : 'категорій'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {fields.map(f => (
                  <div key={f.key} id={`field-${f.key}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <a href={`#field-${f.key}`} className="text-green-700 hover:underline">{f.label}</a>
                        {entity === 'product' && (() => {
                          const column = mapProductFieldKeyToSiteColumnName(f.key as keyof ProductTemplates);
                          if (!column) return null;
                          const list = prompts[column] ?? [];
                          return (
                            <button
                              type="button"
                              className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-neutral-300 text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:border-neutral-700 dark:hover:bg-neutral-800/70"
                              onClick={() => {
                                setHistoryColumn(column);
                                setHistoryOpen(true);
                              }}
                              title={`Переглянути історію збережених промптів${list.length ? ` (${list.length})` : ''}`}
                              aria-label={`Історія${list.length ? ` (${list.length})` : ''}`}
                            >
                              <History className="h-4 w-4" />
                            </button>
                          );
                        })()}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="hidden md:flex gap-2 text-xs text-muted-foreground">
                          <span className={lang === 'ua' ? 'font-semibold text-primary' : ''}>UA</span>
                          <span>/</span>
                          <span className={lang === 'ru' ? 'font-semibold text-primary' : ''}>RU</span>
                          <span>/</span>
                          <span className={lang === 'en' ? 'font-semibold text-primary' : ''}>EN</span>
                        </div>
                        {entity === 'product' && (() => {
                          const column = mapProductFieldKeyToSiteColumnName(f.key as keyof ProductTemplates);
                          if (!column) return null;
                          const checked = enabled[column] !== false; // за замовчуванням true
                          return (
                            <label className="flex items-center gap-2 text-xs text-muted-foreground" title="Включати цей шаблон у генерацію">
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(val) => {
                                  const value = Boolean(val);
                                  persistEnabled({ ...enabled, [column]: value });
                                }}
                              />
                              <span className="select-none">В генерацію</span>
                            </label>
                          );
                        })()}
                      </div>
                    </div>
                    <textarea
                      className="w-full min-h-[120px] rounded-md bg-white/70 dark:bg-neutral-900/40 p-3 text-sm border border-emerald-300/70 dark:border-emerald-500/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      value={(
                        () => {
                          if (entity === 'product') {
                            const column = mapProductFieldKeyToSiteColumnName(f.key as keyof ProductTemplates);
                            if (column) {
                              const list = prompts[column] ?? [];
                              const active = (list.find((it) => !!it.is_active) ?? list[0]) as SiteContentPrompt | undefined;
                              if (active) return active.prompt;
                            }
                            return (productTpl?.[f.key as keyof ProductTemplates] as string) ?? '';
                          } else {
                            return (categoryTpl?.[f.key as keyof CategoryTemplates] as string) ?? '';
                          }
                        }
                      )()}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChangeField(f.key, e.target.value)}
                      placeholder="Введіть шаблон..."
                    />
                    <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Довжина: {(() => {
                        if (entity === 'product') {
                          const column = mapProductFieldKeyToSiteColumnName(f.key as keyof ProductTemplates);
                          if (column) {
                            const list = prompts[column] ?? [];
                            const active = (list.find((it) => !!it.is_active) ?? list[0]) as SiteContentPrompt | undefined;
                            if (active) return active.prompt.length;
                          }
                          return (productTpl?.[f.key as keyof ProductTemplates] ?? '').length;
                        }
                        return (categoryTpl?.[f.key as keyof CategoryTemplates] ?? '').length;
                      })()}</span>
                      <div className="flex items-center gap-2">
                        <a href={`#field-${f.key}`} className="hover:underline">#</a>
                        {(() => {
                          if (entity !== 'product') return null;
                          const column = mapProductFieldKeyToSiteColumnName(f.key as keyof ProductTemplates);
                          if (!column) return null;
                          const list = prompts[column] ?? [];
                          const active = (list.find((it) => !!it.is_active) ?? list[0]) as SiteContentPrompt | undefined;
                          const currentText = (() => {
                            if (active) return active.prompt;
                            return (productTpl?.[f.key as keyof ProductTemplates] as string) ?? '';
                          })();
                          const baseline = lastSavedText[column] ?? '';
                          const isDirty = currentText !== baseline;
                          const status = savingPerColumn[column] ?? 'idle';
                          const isLoading = creatingColumn === column || status === 'saving';
                          return (
                            <span className="inline-flex items-center gap-2 text-xs">
                              {isLoading ? (
                                <span className="inline-flex items-center gap-1.5 text-emerald-700">
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  Зберігаємо…
                                </span>
                              ) : status === 'error' ? (
                                <span className="inline-flex items-center gap-1.5 text-red-600">
                                  <AlertCircle className="h-4 w-4" />
                                  Помилка збереження
                                </span>
                              ) : isDirty ? (
                                <span className="inline-flex items-center gap-1.5 text-amber-600">
                                  Не збережено
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-emerald-700">
                                  <CheckCircle2 className="h-4 w-4" />
                                  Збережено
                                </span>
                              )}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                    {/* ІСТОРІЮ перенесено у попап (кнопка "Історія" у хедері поля) */}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={onSave} className="bg-emerald-400 text-white px-4 py-2 rounded-md disabled:opacity-50" disabled={saving}>
                {saving ? 'Збереження…' : 'Зберегти'}
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* ДІАЛОГ: Історія збережених промптів */}
      <Dialog
        open={historyOpen}
        onOpenChange={(o) => {
          setHistoryOpen(o);
          if (!o) setHistoryColumn(null);
        }}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Історія промптів — {historyColumn ? (columnToFieldLabel.get(historyColumn) ?? historyColumn) : ''} ({lang.toUpperCase()})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-auto">
            {(() => {
              const list = historyColumn ? (prompts[historyColumn] ?? []) : [];
              if (!list.length) {
                return <div className="text-sm text-neutral-500">Немає збережених промптів</div>;
              }
              return (
                <div className="space-y-2">
                  {list.map((p) => (
                    <div key={p.id} className="flex items-center gap-2 text-sm">
                      {p.is_active && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">active</span>
                      )}
                      <span className="truncate" title={p.name || p.prompt}>{p.name || `${historyColumn} #${p.id}`}</span>
                      <span className="text-neutral-400">—</span>
                      <span className="truncate" title={p.prompt}>{p.prompt.slice(0, 120)}</span>
                      <div className="ml-auto flex items-center gap-2">
                        {historyColumn && (
                          <>
                            <button
                              type="button"
                              className="text-xs px-2 py-1 rounded-md border border-emerald-300 text-emerald-800 hover:bg-emerald-100/70 dark:text-emerald-300 dark:hover:bg-emerald-900/30 disabled:opacity-50"
                              onClick={() => activatePrompt(historyColumn, p.id)}
                              disabled={!!p.is_active || deletingId === p.id}
                              title={p.is_active ? 'Вже активний' : 'Зробити активним'}
                            >
                              Активувати
                            </button>
                            <button
                              type="button"
                              className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-red-300 text-red-700 hover:bg-red-50 dark:text-red-300 dark:border-red-600 dark:hover:bg-red-900/20 disabled:opacity-50"
                              onClick={() => historyColumn && deletePrompt(historyColumn, p.id)}
                              disabled={deletingId === p.id}
                              title="Видалити промпт"
                              aria-label="Видалити промпт"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>

      </AIProductFillerLayout>
    );
  }
