import { apiClient } from '@/lib/api-client';
import type { ProductTemplates, Lang } from './productFillerMock';

// Columns supported by backend endpoint `/content/get_site_content_prompts/{site_column_name}`
// Note: backend uses `product` for product name and `searchwords` without underscore.
export type SiteColumnName =
  | 'product'
  | 'shortname'
  | 'short_description'
  | 'full_description'
  | 'meta_keywords'
  | 'meta_description'
  | 'searchwords'
  | 'page_title'
  | 'promo_text';

export const SITE_COLUMNS: SiteColumnName[] = [
  'product',
  'shortname',
  'short_description',
  'full_description',
  'meta_keywords',
  'meta_description',
  'searchwords',
  'page_title',
  'promo_text',
];

// Structured prompt returned/stored by backend
export interface SiteContentPrompt {
  id: number;
  name: string;
  prompt: string;
  site_column_name: SiteColumnName;
  lang_code?: Lang;
  is_active?: boolean;
}

// Map UI product template field keys to backend site column names
export const mapProductFieldKeyToSiteColumnName = (
  key: keyof ProductTemplates
): SiteColumnName | null => {
  switch (key) {
    case 'name':
      return 'product';
    case 'shortname':
      return 'shortname';
    case 'short_description':
      return 'short_description';
    case 'full_description':
      return 'full_description';
    case 'meta_keywords':
      return 'meta_keywords';
    case 'meta_description':
      return 'meta_description';
    // UI uses `search_words`, backend expects `searchwords`
    case 'search_words':
      return 'searchwords';
    case 'page_title':
      return 'page_title';
    case 'promo_text':
      return 'promo_text';
    // Fields likely not supported by backend for prompts
    case 'age_warning_message':
    case 'unit_name':
      return null;
    default:
      return null;
  }
};

// Normalize backend response to structured SiteContentPrompt[]
const normalizePromptItems = (
  data: unknown,
  column?: SiteColumnName
): SiteContentPrompt[] => {
  if (!data) return [];
  // Already array of objects
  if (Array.isArray(data) && data.every((x) => typeof x === 'object' && x !== null)) {
    return (data as any[])
      .map((obj, idx) => {
        const id = typeof obj?.id === 'number' ? obj.id : (typeof obj?.id === 'string' && /^\d+$/.test(obj.id) ? Number(obj.id) : idx);
        const name = typeof obj?.name === 'string' ? obj.name : '';
        const prompt = typeof obj?.prompt === 'string'
          ? obj.prompt
          : (typeof obj?.text === 'string' ? obj.text : (typeof obj?.value === 'string' ? obj.value : (typeof obj?.content === 'string' ? obj.content : '')));
        const site_column_name: SiteColumnName | undefined = obj?.site_column_name ?? column;
        const lang_code: Lang | undefined = (obj?.lang_code ?? obj?.language ?? obj?.lang) as Lang | undefined;
        // Coerce various possible shapes for active flag: boolean/number/string and alternate keys
        const rawActive = (obj?.is_active ?? obj?.active ?? obj?.isActive) as unknown;
        let is_active: boolean | undefined;
        if (typeof rawActive === 'boolean') {
          is_active = rawActive;
        } else if (typeof rawActive === 'number') {
          is_active = rawActive === 1;
        } else if (typeof rawActive === 'string') {
          const s = rawActive.trim().toLowerCase();
          is_active = s === '1' || s === 'true' || s === 'yes' || s === 'active';
        } else {
          is_active = undefined;
        }
        if (!prompt) return null;
        if (!site_column_name) return null;
        return { id, name, prompt, site_column_name, lang_code, is_active } as SiteContentPrompt;
      })
      .filter(Boolean) as SiteContentPrompt[];
  }
  // If wrapped { items } or { result }
  if (typeof data === 'object') {
    const maybe = (data as any).items ?? (data as any).result ?? (data as any).data;
    return normalizePromptItems(maybe, column);
  }
  // If string array
  if (Array.isArray(data) && data.every((x) => typeof x === 'string')) {
    return (data as string[]).map((p, idx) => ({
      id: idx,
      name: '',
      prompt: p,
      site_column_name: column ?? 'product',
    }));
  }
  // Single string fallback
  if (typeof data === 'string') {
    return [{ id: 0, name: '', prompt: data, site_column_name: column ?? 'product' }];
  }
  return [];
};

export const fetchColumnPrompts = async (
  column: SiteColumnName,
  langCode: Lang = 'ua'
): Promise<SiteContentPrompt[]> => {
  try {
    // eslint-disable-next-line no-console
    console.debug('[API] GET /content/get_site_content_prompts', { column, langCode });
    const res = await apiClient.get(`/content/get_site_content_prompts/${column}/${langCode}`);
    const items = normalizePromptItems(res?.data, column);
    try {
      const summary = items.map(it => ({ id: it.id, name: it.name, is_active: it.is_active, lang_code: it.lang_code })).slice(0, 10);
      // eslint-disable-next-line no-console
      console.debug('[API] <- prompts', { column, langCode, count: items.length, sample: summary });
    } catch {}
    return items;
  } catch (err: any) {
    // Fallback: try old endpoint without lang in path (backend may not support lang yet for some columns)
    try {
      // eslint-disable-next-line no-console
      console.warn('[API] [fetchColumnPrompts] Falling back without lang for column', column, 'status:', err?.response?.status);
      const res2 = await apiClient.get(`/content/get_site_content_prompts/${column}`);
      const items = normalizePromptItems(res2?.data, column);
      try {
        const summary = items.map(it => ({ id: it.id, name: it.name, is_active: it.is_active, lang_code: it.lang_code })).slice(0, 10);
        // eslint-disable-next-line no-console
        console.debug('[API] <- prompts (fallback no-lang)', { column, count: items.length, sample: summary });
      } catch {}
      return items;
    } catch (err2) {
      // eslint-disable-next-line no-console
      console.error('[API] [fetchColumnPrompts] Failed with and without lang for column', column, err2);
      return [];
    }
  }
};

export const fetchAllColumnPrompts = async (
  columns: SiteColumnName[] = SITE_COLUMNS,
  langCode: Lang = 'ua'
): Promise<Record<SiteColumnName, SiteContentPrompt[]>> => {
  // eslint-disable-next-line no-console
  console.debug('[API] fetchAllColumnPrompts start', { columns, langCode });
  const settled = await Promise.allSettled(columns.map((c) => fetchColumnPrompts(c, langCode)));
  const out = {} as Record<SiteColumnName, SiteContentPrompt[]>;
  columns.forEach((c, idx) => {
    const s = settled[idx];
    out[c] = s.status === 'fulfilled' ? s.value : [];
    try {
      const arr = out[c] || [];
      const act = arr.find(x => x.is_active);
      // eslint-disable-next-line no-console
      console.debug('[API] fetchAllColumnPrompts item', { column: c, count: arr.length, activeId: act?.id, activeName: act?.name });
    } catch {}
  });
  // eslint-disable-next-line no-console
  console.debug('[API] fetchAllColumnPrompts done');
  return out;
};

export interface CreateSiteContentPromptRequest {
  name: string;
  prompt: string;
  site_column_name: SiteColumnName;
  // optional to avoid breaking existing callers; defaulted to 'ua' when sending
  lang_code?: Lang;
  // backend requires this field; default to false when not provided
  is_active?: boolean;
}

export const createSiteContentPrompt = async (
  body: CreateSiteContentPromptRequest
): Promise<SiteContentPrompt> => {
  const res = await apiClient.post('/content/create_site_content_prompt', {
    ...body,
    lang_code: body.lang_code ?? 'ua',
    is_active: body.is_active ?? false,
  });
  const data = res?.data;
  if (data && typeof data === 'object') {
    const items = normalizePromptItems(data, body.site_column_name);
    if (items?.[0]) return items[0];
  }
  // If backend returns simple OK/1/true, echo back body with synthetic id 0.
  return { id: 0, ...body } as SiteContentPrompt;
};

export interface UpdateSiteContentPromptRequest {
  id: number;
  name: string;
  prompt: string;
  site_column_name: SiteColumnName;
  // optional to avoid breaking existing callers; defaulted to 'ua' when sending
  lang_code?: Lang;
  // backend requires this field; send current value or false
  is_active?: boolean;
}

export const updateSiteContentPrompt = async (
  body: UpdateSiteContentPromptRequest
): Promise<SiteContentPrompt> => {
  const res = await apiClient.post('/content/update_site_content_prompt', {
    ...body,
    lang_code: body.lang_code ?? 'ua',
    is_active: body.is_active ?? false,
  });
  const data = res?.data;
  // If backend returns an object/array with updated item(s), normalize and use it.
  if (data && typeof data === 'object') {
    const items = normalizePromptItems(data, body.site_column_name);
    if (items?.[0]) return items[0];
  }
  // Some backends return plain 'OK'/true/1 on success. In that case, echo back the sent body.
  return { ...body };
};

// Activate a prompt by id (backend marks it active among the column/lang group)
export const activateSiteContentPrompt = async (id: number): Promise<boolean> => {
  try {
    const res = await apiClient.get(`/content/activate_site_content_prompt/${id}`);
    // consider any 2xx a success
    return !!res;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[activateSiteContentPrompt] failed', e);
    return false;
  }
};
