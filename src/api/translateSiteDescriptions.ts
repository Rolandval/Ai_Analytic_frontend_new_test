import { apiClient } from '@/lib/api-client';

export type TranslateDescriptionItem = {
  product_id: number;
  lang_code?: string; // дублюємо для сумісності з бекендом
  site_product?: string | null;
  site_shortname?: string | null;
  site_short_description?: string | null;
  site_full_description?: string | null;
  site_meta_keywords?: string | null;
  site_meta_description?: string | null;
  site_searchwords?: string | null;
  site_page_title?: string | null;
  site_promo_text?: string | null;
};

export type TranslateSiteDescriptionsRequest = {
  lang_code: 'ua' | 'en' | 'ru' | string;
  descriptions: TranslateDescriptionItem[];
  engine?: 'ai' | 'free' | string;
};

export type TranslateSiteDescriptionsResponse = {
  descriptions?: TranslateDescriptionItem[];
  items?: TranslateDescriptionItem[];
  result?: TranslateDescriptionItem[];
} | TranslateDescriptionItem[];

export async function translateSiteDescriptions(
  body: TranslateSiteDescriptionsRequest
): Promise<TranslateSiteDescriptionsResponse> {
  const res = await apiClient.post('/content/translate_site_descriptions', body);
  return res?.data as TranslateSiteDescriptionsResponse;
}
