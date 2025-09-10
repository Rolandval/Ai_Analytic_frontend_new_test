import { apiClient } from '@/lib/api-client';

export type TranslateDescriptionItem = {
  lang_code: 'ua' | 'en' | 'ru' | string;
  product_id: number;
  site_product: string;
  site_shortname: string;
  site_short_description: string;
  site_full_description: string;
  site_meta_keywords: string;
  site_meta_description: string;
  site_searchwords: string;
  site_page_title: string;
  site_promo_text: string;
};

export type TranslateSiteDescriptionsRequest = {
  model_name: string;
  descriptions: TranslateDescriptionItem[];
};

export type TranslateSiteDescriptionsResponse = any;

// AI translation
export async function aiTranslateSiteDescriptions(
  body: TranslateSiteDescriptionsRequest
): Promise<TranslateSiteDescriptionsResponse> {
  const res = await apiClient.post('/content/ai_translate_site_descriptions', body);
  return res?.data as TranslateSiteDescriptionsResponse;
}

// Free translation
export type FreeTranslateSiteDescriptionsRequest = {
  lang_code: 'ua' | 'en' | 'ru' | string;
  descriptions: TranslateDescriptionItem[];
};

export async function translateSiteDescriptionsFree(
  body: FreeTranslateSiteDescriptionsRequest
): Promise<TranslateSiteDescriptionsResponse> {
  const res = await apiClient.post('/content/translate_site_descriptions', body);
  return res?.data as TranslateSiteDescriptionsResponse;
}
