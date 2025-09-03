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
        const id = typeof obj?.id === 'number' ? obj.id : idx;
        const name = typeof obj?.name === 'string' ? obj.name : '';
        const prompt = typeof obj?.prompt === 'string'
          ? obj.prompt
          : (typeof obj?.text === 'string' ? obj.text : (typeof obj?.value === 'string' ? obj.value : (typeof obj?.content === 'string' ? obj.content : '')));
        const site_column_name: SiteColumnName | undefined = obj?.site_column_name ?? column;
        if (!prompt) return null;
        if (!site_column_name) return null;
        return { id, name, prompt, site_column_name } as SiteContentPrompt;
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
    const res = await apiClient.get(`/content/get_site_content_prompts/${column}/${langCode}`);
    return normalizePromptItems(res?.data, column);
  } catch (err: any) {
    // Fallback: try old endpoint without lang in path (backend may not support lang yet for some columns)
    try {
      // eslint-disable-next-line no-console
      console.warn('[fetchColumnPrompts] Falling back without lang for column', column, 'status:', err?.response?.status);
      const res2 = await apiClient.get(`/content/get_site_content_prompts/${column}`);
      return normalizePromptItems(res2?.data, column);
    } catch (err2) {
      // eslint-disable-next-line no-console
      console.error('[fetchColumnPrompts] Failed with and without lang for column', column, err2);
      return [];
    }
  }
};

export const fetchAllColumnPrompts = async (
  columns: SiteColumnName[] = SITE_COLUMNS,
  langCode: Lang = 'ua'
): Promise<Record<SiteColumnName, SiteContentPrompt[]>> => {
  const settled = await Promise.allSettled(columns.map((c) => fetchColumnPrompts(c, langCode)));
  const out = {} as Record<SiteColumnName, SiteContentPrompt[]>;
  columns.forEach((c, idx) => {
    const s = settled[idx];
    out[c] = s.status === 'fulfilled' ? s.value : [];
  });
  return out;
};

export interface CreateSiteContentPromptRequest {
  name: string;
  prompt: string;
  site_column_name: SiteColumnName;
}

export const createSiteContentPrompt = async (
  body: CreateSiteContentPromptRequest
): Promise<SiteContentPrompt> => {
  const res = await apiClient.post('/content/create_site_content_prompt', body);
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
}

export const updateSiteContentPrompt = async (
  body: UpdateSiteContentPromptRequest
): Promise<SiteContentPrompt> => {
  const res = await apiClient.post('/content/update_site_content_prompt', body);
  const data = res?.data;
  // If backend returns an object/array with updated item(s), normalize and use it.
  if (data && typeof data === 'object') {
    const items = normalizePromptItems(data, body.site_column_name);
    if (items?.[0]) return items[0];
  }
  // Some backends return plain 'OK'/true/1 on success. In that case, echo back the sent body.
  return { ...body };
};
