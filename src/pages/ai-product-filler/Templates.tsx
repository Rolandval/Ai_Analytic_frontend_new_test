import { useEffect, useMemo, useState } from 'react';
import {
  getTemplates,
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
  updateSiteContentPrompt,
  SITE_COLUMNS,
  type SiteColumnName,
  type SiteContentPrompt,
} from '@/api/contentPrompts';

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
  const [entity, setEntity] = useState<Entity>('product');
  const [lang, setLang] = useState<Lang>('ua');
  const [productTpl, setProductTpl] = useState<ProductTemplates | null>(null);
  const [categoryTpl, setCategoryTpl] = useState<CategoryTemplates | null>(null);
  const [saving, setSaving] = useState(false);
  const [copiedVar, setCopiedVar] = useState<string | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<'all' | SiteColumnName>('all');
  const [prompts, setPrompts] = useState<Partial<Record<SiteColumnName, SiteContentPrompt[]>>>({});
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [promptsError, setPromptsError] = useState<string | null>(null);
  const [savingPromptId, setSavingPromptId] = useState<number | null>(null);
  const [originalPrompts, setOriginalPrompts] = useState<
    Partial<Record<SiteColumnName, Record<number, { name: string; prompt: string }>>>
  >({});

  // Load templates
  useEffect(() => {
    setProductTpl(getTemplates('product', lang));
    setCategoryTpl(getTemplates('category', lang));
  }, [lang]);

  const loadPrompts = async (col: 'all' | SiteColumnName) => {
    setLoadingPrompts(true);
    setPromptsError(null);
    try {
      if (col === 'all') {
        const data = await fetchAllColumnPrompts();
        setPrompts(data);
        // build originals
        const orig: Partial<Record<SiteColumnName, Record<number, { name: string; prompt: string }>>> = {};
        SITE_COLUMNS.forEach(c => {
          const list = data[c] ?? [];
          orig[c] = list.reduce((acc, it) => {
            acc[it.id] = { name: it.name, prompt: it.prompt };
            return acc;
          }, {} as Record<number, { name: string; prompt: string }>);
        });
        setOriginalPrompts(orig);
      } else {
        const data = await fetchColumnPrompts(col);
        setPrompts(prev => ({ ...prev, [col]: data }));
        // update originals for this column
        const map = data.reduce((acc, it) => {
          acc[it.id] = { name: it.name, prompt: it.prompt };
          return acc;
        }, {} as Record<number, { name: string; prompt: string }>);
        setOriginalPrompts(prev => ({ ...prev, [col]: map }));
      }
    } catch (e) {
      setPromptsError('Не вдалося завантажити підказки');
    } finally {
      setLoadingPrompts(false);
    }
  };

  useEffect(() => {
    void loadPrompts(selectedColumn);
  }, [selectedColumn]);

  const vars = useMemo(() => (entity === 'product' ? PRODUCT_VARIABLES : CATEGORY_VARIABLES), [entity]);
  const fields = useMemo(() => (entity === 'product' ? PRODUCT_FIELDS : CATEGORY_FIELDS), [entity]);
  const columnLabels = useMemo(() => ({
    product: 'product',
    shortname: 'shortname',
    short_description: 'short_description',
    full_description: 'full_description',
    meta_keywords: 'meta_keywords',
    meta_description: 'meta_description',
    searchwords: 'searchwords',
    page_title: 'page_title',
    promo_text: 'promo_text',
  }), []);

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

  const savePrompt = async (item: SiteContentPrompt) => {
    setSavingPromptId(item.id);
    try {
      const updated = await updateSiteContentPrompt({
        id: item.id,
        name: item.name,
        prompt: item.prompt,
        site_column_name: item.site_column_name,
      });
      setPrompts(prev => {
        const list = prev[item.site_column_name] ?? [];
        const next = list.map(p => (p.id === item.id ? updated : p));
        return { ...prev, [item.site_column_name]: next };
      });
      // update originals baseline
      setOriginalPrompts(prev => ({
        ...prev,
        [item.site_column_name]: {
          ...(prev[item.site_column_name] ?? {}),
          [item.id]: { name: updated.name, prompt: updated.prompt },
        },
      }));
    } catch (e) {
      setPromptsError('Не вдалося зберегти підказку');
    } finally {
      setSavingPromptId(null);
    }
  };

  const isDirty = (column: SiteColumnName, item: SiteContentPrompt) => {
    const orig = originalPrompts[column]?.[item.id];
    if (!orig) return true;
    return orig.name !== item.name || orig.prompt !== item.prompt;
  };

  const onChangeField = (key: string, value: string) => {
    if (entity === 'product') {
      setProductTpl(prev => (prev ? ({ ...prev, [key]: value } as ProductTemplates) : prev));
    } else {
      setCategoryTpl(prev => (prev ? ({ ...prev, [key]: value } as CategoryTemplates) : prev));
    }
  };

  const onSave = async () => {
    setSaving(true);
    try {
      if (entity === 'product' && productTpl) setTemplates('product', lang, productTpl);
      if (entity === 'category' && categoryTpl) setTemplates('category', lang, categoryTpl);
    } finally {
      setSaving(false);
    }
  };

  const copyVar = async (v: string) => {
    try {
      await navigator.clipboard.writeText(v);
      setCopiedVar(v);
      window.setTimeout(() => setCopiedVar(null), 1000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="sticky top-0 z-10 -mx-4 px-4 md:mx-0 md:px-0 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-neutral-900/60 bg-white/80 dark:bg-neutral-900/80 border-b">
        <div className="flex items-center justify-between py-3">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold">Шаблони контенту</h1>
            <p className="text-sm text-muted-foreground">Налаштуйте шаблони AI для продуктів і категорій</p>
          </div>
          <button onClick={onSave} className="bg-primary text-white px-4 py-2 rounded-md disabled:opacity-50" disabled={saving}>
            {saving ? 'Збереження…' : 'Зберегти'}
          </button>
        </div>
      </div>

      {/* Top tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="inline-flex rounded-md border overflow-hidden">
          {(['product', 'category'] as Entity[]).map(t => (
            <button
              key={t}
              className={`px-3 py-1.5 text-sm ${entity === t ? 'bg-primary text-white' : 'bg-transparent'}`}
              onClick={() => setEntity(t)}
            >
              {t === 'product' ? 'Продукт' : 'Категорія'}
            </button>
          ))}
        </div>

        <div className="inline-flex rounded-md border overflow-hidden">
          {(['ua', 'ru'] as Lang[]).map(l => (
            <button
              key={l}
              className={`px-3 py-1.5 text-sm ${lang === l ? 'bg-primary text-white' : 'bg-transparent'}`}
              onClick={() => setLang(l)}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Variables and form */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
        {/* Variables list */}
        <div className="md:col-span-1">
          <div className="sticky top-16 rounded-xl border border-white/10 dark:border-neutral-700 bg-white/50 dark:bg-neutral-800/40 p-4">
            <h3 className="font-medium mb-3">Змінні</h3>
            <ul className="space-y-2 text-sm">
              {vars.map(v => (
                <li key={v}>
                  <button
                    type="button"
                    onClick={() => copyVar(v)}
                    className="w-full text-left px-2 py-1 rounded border hover:bg-white/60 dark:hover:bg-neutral-700/60 transition flex items-center justify-between"
                    title="Натисніть, щоб скопіювати"
                  >
                    <code className="truncate mr-2">{v}</code>
                    {copiedVar === v && (
                      <span className="text-emerald-600 text-xs">Скопійовано</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Підказки (збережені)</h3>
                <div className="flex items-center gap-2">
                  <select
                    className="text-xs border rounded px-2 py-1 bg-white/70 dark:bg-neutral-900/40"
                    value={selectedColumn}
                    onChange={(e) => setSelectedColumn(e.target.value as 'all' | SiteColumnName)}
                  >
                    <option value="all">Всі</option>
                    {SITE_COLUMNS.map(c => (
                      <option key={c} value={c}>{columnLabels[c]}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => loadPrompts(selectedColumn)}
                    className="text-xs px-2 py-1 rounded border hover:bg-white/60 dark:hover:bg-neutral-700/60"
                  >
                    Оновити
                  </button>
                </div>
              </div>
              {promptsError && (
                <div className="text-red-600 text-xs mb-2">{promptsError}</div>
              )}
              {loadingPrompts ? (
                <div className="text-xs text-muted-foreground">Завантаження…</div>
              ) : (
                <div className="space-y-3">
                  {selectedColumn === 'all' ? (
                    SITE_COLUMNS.map(c => (
                      <div key={c}>
                        <div className="text-xs font-medium text-muted-foreground mb-1">{columnLabels[c]}</div>
                        <ul className="space-y-2">
                          {(prompts[c] ?? []).length ? (
                            (prompts[c] ?? []).map((p) => (
                              <li key={`${c}-${p.id}`} className="space-y-1">
                                <input
                                  className="w-full text-xs rounded border bg-white/70 dark:bg-neutral-900/40 px-2 py-1"
                                  placeholder="Назва"
                                  value={p.name}
                                  onChange={(e) => handlePromptChange(c, p.id, { name: e.target.value })}
                                />
                                <textarea
                                  className="w-full text-xs rounded border bg-white/70 dark:bg-neutral-900/40 p-2"
                                  placeholder="Промпт"
                                  value={p.prompt}
                                  onChange={(e) => handlePromptChange(c, p.id, { prompt: e.target.value })}
                                />
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => copyVar(p.prompt)}
                                    className="text-xs px-2 py-1 rounded border hover:bg-white/60 dark:hover:bg-neutral-700/60"
                                  >
                                    Копіювати
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => savePrompt(p)}
                                    className="text-xs px-2 py-1 rounded border hover:bg-white/60 dark:hover:bg-neutral-700/60 disabled:opacity-50"
                                    disabled={!isDirty(c, p) || savingPromptId === p.id}
                                  >
                                    {savingPromptId === p.id ? 'Збереження…' : 'Оновити промпт'}
                                  </button>
                                </div>
                              </li>
                            ))
                          ) : (
                            <li className="text-xs text-muted-foreground">Немає підказок</li>
                          )}
                        </ul>
                      </div>
                    ))
                  ) : (
                    <ul className="space-y-2">
                      {(prompts[selectedColumn] ?? []).length ? (
                        (prompts[selectedColumn] ?? []).map((p) => (
                          <li key={`${selectedColumn}-${p.id}`} className="space-y-1">
                            <input
                              className="w-full text-xs rounded border bg-white/70 dark:bg-neutral-900/40 px-2 py-1"
                              placeholder="Назва"
                              value={p.name}
                              onChange={(e) => handlePromptChange(selectedColumn, p.id, { name: e.target.value })}
                            />
                            <textarea
                              className="w-full text-xs rounded border bg-white/70 dark:bg-neutral-900/40 p-2"
                              placeholder="Промпт"
                              value={p.prompt}
                              onChange={(e) => handlePromptChange(selectedColumn, p.id, { prompt: e.target.value })}
                            />
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => copyVar(p.prompt)}
                                className="text-xs px-2 py-1 rounded border hover:bg-white/60 dark:hover:bg-neutral-700/60"
                              >
                                Копіювати
                              </button>
                              <button
                                type="button"
                                onClick={() => savePrompt(p)}
                                className="text-xs px-2 py-1 rounded border hover:bg-white/60 dark:hover:bg-neutral-700/60 disabled:opacity-50"
                                disabled={!isDirty(selectedColumn, p) || savingPromptId === p.id}
                              >
                                {savingPromptId === p.id ? 'Збереження…' : 'Оновити промпт'}
                              </button>
                            </div>
                          </li>
                        ))
                      ) : (
                        <li className="text-xs text-muted-foreground">Немає підказок</li>
                      )}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fields */}
        <div className="md:col-span-3">
          <div className="rounded-xl border border-white/10 dark:border-neutral-700 bg-white/50 dark:bg-neutral-800/40 p-4">
            <h3 className="font-medium mb-4">Шаблони {entity === 'product' ? 'продуктів' : 'категорій'}</h3>
            <div className="space-y-6">
              {fields.map(f => (
                <div key={f.key} id={`field-${f.key}`}>
                  <div className="flex items-center justify-between mb-2">
                    <a href={`#field-${f.key}`} className="text-sky-600 hover:underline">{f.label}</a>
                    <div className="hidden md:flex gap-2 text-xs text-muted-foreground">
                      <span className={lang === 'ua' ? 'font-semibold' : ''}>UA</span>
                      <span>/</span>
                      <span className={lang === 'ru' ? 'font-semibold' : ''}>RU</span>
                    </div>
                  </div>
                  <textarea
                    className="w-full min-h-[120px] rounded-md border bg-white/70 dark:bg-neutral-900/40 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    value={entity === 'product' ? (productTpl?.[f.key as keyof ProductTemplates] ?? '') : (categoryTpl?.[f.key as keyof CategoryTemplates] ?? '')}
                    onChange={(e) => onChangeField(f.key, e.target.value)}
                    placeholder="Введіть шаблон..."
                  />
                  <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Довжина: {(entity === 'product' ? (productTpl?.[f.key as keyof ProductTemplates] ?? '') : (categoryTpl?.[f.key as keyof CategoryTemplates] ?? '')).length}</span>
                    <a href={`#field-${f.key}`} className="hover:underline">#</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button onClick={onSave} className="bg-primary text-white px-4 py-2 rounded-md disabled:opacity-50" disabled={saving}>
              {saving ? 'Збереження…' : 'Зберегти'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
