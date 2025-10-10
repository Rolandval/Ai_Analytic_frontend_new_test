/**
 * Типи для категорій
 */

export interface SiteCategoryDescription {
  category_id: number;
  lang_code: string;
  category: string;
  description?: string;
  meta_keywords?: string;
  page_title?: string;
}
