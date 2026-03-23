import { useCallback, useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Search, RefreshCcw, BarChart2, Loader2 } from 'lucide-react';
import { fetchContentDescriptions, ProductType } from '@/api/contentDescriptions';
import AIProductFillerLayout from './components/AIProductFillerLayout';
import { usePFI18n } from './i18n';

interface ContentDescription {
  site_lang_code?: string | null;
  product_type?: ProductType;
  site_product?: string;
  product_name?: string;
  site_shortname?: string | null;
  site_short_description?: string | null;
  site_full_description?: string | null;
  site_meta_keywords?: string | null;
  site_meta_description?: string | null;
  site_searchwords?: string | null;
  site_page_title?: string | null;
  site_promo_text?: string | null;
}

type MissingCounts = {
  total: number;
  missing: number;
  product: number;
  shortname: number;
  short_description: number;
  full_description: number;
  promo_text: number;
  meta_keywords: number;
  meta_description: number;
  searchwords: number;
  page_title: number;
};

export default function AIProductFillerAnalysis() {
  const { t } = usePFI18n();
  const [descriptions, setDescriptions] = useState<ContentDescription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductType, setSelectedProductType] = useState<ProductType | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | string>('all');

  const [data, setData] = useState<{ ua: MissingCounts; ru: MissingCounts; en: MissingCounts } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch ALL data by paginating until fewer than page-size items are returned
      const PAGE_SIZE = 2000;
      let page = 1;
      let all: ContentDescription[] = [];
       
      while (true) {
        const resp = await fetchContentDescriptions<ContentDescription>({ page, limit: PAGE_SIZE });
        const items = resp.items || [];
        all = all.concat(items);
        if (items.length < (resp.limit ?? PAGE_SIZE)) break;
        page += 1;
      }
      setDescriptions(all);
    } catch (e: any) {
      setError(e?.message || 'Помилка завантаження');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Витягнути назву категорії з різних можливих полів відповіді бекенду
  const extractCategory = useCallback((d: any): string | null => {
    try {
      const fields = [
        'category_name',
        'category',
        'site_category_name',
        'site_category',
        'category_title',
      ];
      for (const f of fields) {
        const v = (d?.[f] ?? '').toString().trim();
        if (v) return v;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // Доступні категорії на основі поточного списку та фільтрів (тип + пошук)
  const categories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = descriptions.filter((d) => {
      if (selectedProductType !== 'all' && d.product_type !== selectedProductType) return false;
      if (q) {
        const hay = [
          d.site_product,
          d.product_name,
          d.site_shortname,
          d.site_short_description,
          d.site_full_description,
          d.site_meta_keywords,
          d.site_meta_description,
          d.site_searchwords,
          d.site_page_title,
          d.site_promo_text,
        ]
          .map((v) => (v || '').toLowerCase())
          .join(' ');
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const set = new Set<string>();
    list.forEach((d) => {
      const c = extractCategory(d);
      if (c) set.add(c);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [descriptions, searchQuery, selectedProductType, extractCategory]);

  // Якщо вибрана категорія більше не доступна після зміни фільтрів — скинути на "all"
  useEffect(() => {
    if (selectedCategory !== 'all' && !categories.includes(selectedCategory)) {
      setSelectedCategory('all');
    }
  }, [categories, selectedCategory]);

  const analyze = useCallback(() => {
    setAnalyzing(true);
    const isEmpty = (v: any) => v == null || String(v).trim() === '';
    const langKey = (code?: string | null): 'ua' | 'ru' | 'en' | null => {
      const v = (code || '').toLowerCase();
      if (v === 'ua' || v === 'uk') return 'ua';
      if (v === 'ru') return 'ru';
      if (v === 'en') return 'en';
      return null;
    };
    const init: MissingCounts = {
      total: 0,
      missing: 0,
      product: 0,
      shortname: 0,
      short_description: 0,
      full_description: 0,
      promo_text: 0,
      meta_keywords: 0,
      meta_description: 0,
      searchwords: 0,
      page_title: 0,
    };
    const acc: { ua: MissingCounts; ru: MissingCounts; en: MissingCounts } = {
      ua: { ...init },
      ru: { ...init },
      en: { ...init },
    };

    const q = searchQuery.trim().toLowerCase();
    const list = descriptions.filter((d) => {
      // product type filter
      if (selectedProductType !== 'all' && d.product_type !== selectedProductType) return false;
      // search filter on any of key fields
      if (q) {
        const hay = [
          d.site_product,
          d.product_name,
          d.site_shortname,
          d.site_short_description,
          d.site_full_description,
          d.site_meta_keywords,
          d.site_meta_description,
          d.site_searchwords,
          d.site_page_title,
          d.site_promo_text,
        ]
          .map((v) => (v || '').toLowerCase())
          .join(' ');
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    // category filter (якщо вибрано конкретну категорію)
    const finalList = selectedCategory === 'all' ? list : list.filter((d) => extractCategory(d) === selectedCategory);

    finalList.forEach((d) => {
      const lk = langKey(d.site_lang_code);
      if (!lk) return;
      const target = acc[lk];
      target.total += 1;
      const missFlags = [
        isEmpty(d.site_product || d.product_name),
        isEmpty(d.site_shortname),
        isEmpty(d.site_short_description),
        isEmpty(d.site_full_description || d.site_promo_text),
        isEmpty(d.site_promo_text),
        isEmpty(d.site_meta_keywords),
        isEmpty(d.site_meta_description),
        isEmpty(d.site_searchwords),
        isEmpty(d.site_page_title),
      ];
      if (missFlags.some(Boolean)) target.missing += 1;
      if (missFlags[0]) target.product += 1;
      if (missFlags[1]) target.shortname += 1;
      if (missFlags[2]) target.short_description += 1;
      if (missFlags[3]) target.full_description += 1;
      if (missFlags[4]) target.promo_text += 1;
      if (missFlags[5]) target.meta_keywords += 1;
      if (missFlags[6]) target.meta_description += 1;
      if (missFlags[7]) target.searchwords += 1;
      if (missFlags[8]) target.page_title += 1;
    });

    setData(acc);
    setAnalyzing(false);
  }, [descriptions, searchQuery, selectedProductType, selectedCategory, extractCategory]);

  // Автоматично перераховувати при вході на сторінку і зміні фільтрів/даних
  useEffect(() => {
    analyze();
  }, [analyze]);

  const langs: Array<'ua'|'ru'|'en'> = ['ua','ru','en'];
  const label = (lng: 'ua'|'ru'|'en') => (lng === 'ua' ? 'UA' : lng === 'ru' ? 'RU' : 'EN');
  const pct = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0);

  // Локалізований заголовок вкладки
  useEffect(() => {
    const prev = document.title;
    document.title = `${t('nav.analysis')} — AI Product Filler`;
    return () => { document.title = prev; };
  }, [t]);

  return (
    <AIProductFillerLayout>
      <div className="px-4 py-3">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full mb-3">
          <div className="relative flex-1 min-w-[220px] max-w-[480px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder={t('controls.search')}
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={selectedProductType} onValueChange={(v) => setSelectedProductType(v as ProductType | 'all')}>
            <SelectTrigger className="w-[180px] shrink-0" title={t('controls.type')}>
              <SelectValue placeholder={t('controls.type')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('type.all')}</SelectItem>
              <SelectItem value="solar_panels">{t('type.solar_panels')}</SelectItem>
              <SelectItem value="batteries">{t('type.batteries')}</SelectItem>
              <SelectItem value="inverters">{t('type.inverters')}</SelectItem>
            </SelectContent>
          </Select>
          {categories.length > 0 && (
            <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as any)}>
              <SelectTrigger className="w-[220px] shrink-0" title="Категорія">
                <SelectValue placeholder="Категорія" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всі категорії</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button onClick={load} variant="outline" className="shrink-0">
            <RefreshCcw className="h-4 w-4 mr-2" /> {t('buttons.update')}
          </Button>
          <Button onClick={analyze} className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0">
            <BarChart2 className="h-4 w-4 mr-2" /> {t('buttons.recalc')}
          </Button>
        </div>

        {/* Analysis */}
        {(loading || analyzing) && (
          <div className="flex items-center justify-center py-16">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
              <span>{loading ? 'Завантаження…' : 'Перерахунок…'}</span>
            </div>
          </div>
        )}

        {error && <div className="text-sm text-red-600">{error}</div>}

        {data && !loading && !analyzing && (
          <div className="grid grid-cols-1 gap-3">
            {langs.map((lng) => {
              const d = data[lng];
              const items: Array<{ key: keyof MissingCounts; label: string }> = [
                { key: 'product', label: t('field.product') },
                { key: 'shortname', label: t('field.shortname') },
                { key: 'short_description', label: t('field.short_description') },
                { key: 'full_description', label: t('field.full_description') },
                { key: 'promo_text', label: t('field.promo_text') },
                { key: 'meta_keywords', label: t('field.meta_keywords') },
                { key: 'meta_description', label: t('field.meta_description') },
                { key: 'searchwords', label: t('field.searchwords') },
                { key: 'page_title', label: t('field.page_title') },
              ];
              return (
                <div key={lng} className="m-0 p-3 rounded-xl bg-white/95 dark:bg-slate-800/90 shadow-md ring-1 ring-black/10 dark:ring-white/10">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="secondary" className="px-2 py-0.5 text-[11px]">{label(lng)}</Badge>
                      <h3 className="text-sm font-semibold">{t('analysis.title')}</h3>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{t('analysis.total')}: <b className="text-foreground">{d.total}</b></span>
                      <span>{t('analysis.missing_short')}: <b className="text-foreground">{d.missing}</b> ({pct(d.missing, d.total)}%)</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                    {/* Summary 1 */}
                    <div className="rounded-xl border bg-gray-50 dark:bg-neutral-900/40 p-2">
                      <div className="flex items-center justify-between">
                        <div className="text-[11px] text-muted-foreground">{t('analysis.missing_rows')}</div>
                        <div className="text-[11px] text-muted-foreground">{pct(d.missing, d.total)}%</div>
                      </div>
                      <div className="mt-1 text-base font-semibold">{d.missing}</div>
                      <div className="mt-1.5"><Progress value={pct(d.missing, d.total)} /></div>
                    </div>
                    {/* Summary 2 */}
                    <div className="rounded-xl border bg-gray-50 dark:bg-neutral-900/40 p-2">
                      <div className="flex items-center justify-between">
                        <div className="text-[11px] text-muted-foreground">{t('analysis.fully_filled')}</div>
                        <div className="text-[11px] text-muted-foreground">{pct(Math.max(d.total - d.missing, 0), d.total)}%</div>
                      </div>
                      <div className="mt-1 text-base font-semibold">{Math.max(d.total - d.missing, 0)}</div>
                      <div className="mt-1.5"><Progress value={pct(Math.max(d.total - d.missing, 0), d.total)} /></div>
                    </div>

                    {items.map((it) => (
                      <div key={it.key as string} className="rounded-xl border p-2 bg-gray-50 dark:bg-neutral-900/40">
                        <div className="flex items-center justify-between">
                          <div className="text-[11px] text-muted-foreground">{it.label}</div>
                          <div className="text-[11px] text-muted-foreground">{pct((d as any)[it.key] as number, d.total)}%</div>
                        </div>
                        <div className="mt-1 text-base font-semibold leading-none">{(d as any)[it.key] as number}</div>
                        <div className="mt-1.5"><Progress value={pct((d as any)[it.key] as number, d.total)} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AIProductFillerLayout>
  );
}
