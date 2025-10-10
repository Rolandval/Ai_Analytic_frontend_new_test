/**
 * Типи для товарів
 */

export type ProductType = 'product' | 'category';

export interface ContentDescription {
  id?: number;
  product_id?: number;
  product_type?: ProductType;
  product_name?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
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
