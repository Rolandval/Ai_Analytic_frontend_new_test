import { apiClient } from '@/lib/api-client';

export type UpdateSiteDescriptionPayload = {
  // Обов'язковий ідентифікатор продукту згідно бекенд-схеми
  product_id: number;
  // Ідентифікація запису на бекенді: використовуємо доступні ключі зі схеми
  site_lang_code?: string | null;
  site_product?: string | null;
  // Змінювані поля (будь-яке з них може бути присутнім)
  site_shortname?: string | null;
  site_short_description?: string | null;
  site_full_description?: string | null;
  site_meta_keywords?: string | null;
  site_meta_description?: string | null;
  site_searchwords?: string | null;
  site_page_title?: string | null;
  site_promo_text?: string | null;
};

export type UpdateSiteDescriptionsRequest = {
  descriptions: UpdateSiteDescriptionPayload[];
};

export async function updateSiteDescriptions(body: UpdateSiteDescriptionsRequest): Promise<any> {
  const res = await apiClient.post('/content/update_site_descriptions', body);
  return res?.data;
}
