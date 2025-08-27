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

  // Load templates
  useEffect(() => {
    setProductTpl(getTemplates('product', lang));
    setCategoryTpl(getTemplates('category', lang));
  }, [lang]);

  const vars = useMemo(() => (entity === 'product' ? PRODUCT_VARIABLES : CATEGORY_VARIABLES), [entity]);
  const fields = useMemo(() => (entity === 'product' ? PRODUCT_FIELDS : CATEGORY_FIELDS), [entity]);

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
