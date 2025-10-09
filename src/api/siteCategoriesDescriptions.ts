import { apiClient } from '@/lib/api-client';

export interface SiteCategoryDescription {
  category_id: number;
  lang_code: string;
  category: string;
  description: string;
  meta_keywords: string;
  page_title: string;
}

export interface UpdateSiteCategoryDescriptionRequest {
  category_id: number;
  lang_code: string;
  category: string;
  description: string;
  meta_keywords: string;
  page_title: string;
}

// Нова структура відповіді від API
export interface SiteCategoriesDescriptionsApiResponse {
  result: SiteCategoryDescription[];
}

// Стара структура для сумісності з існуючим кодом
export interface SiteCategoriesDescriptionsResponse {
  items: SiteCategoryDescription[];
  total: number;
  page: number;
  limit: number;
}

export async function fetchSiteCategoriesDescriptions(
  page: number,
  limit: number
): Promise<SiteCategoriesDescriptionsResponse> {
  const response = await apiClient.get<SiteCategoriesDescriptionsApiResponse>(
    `/content/get_site_categories_descriptions/${page}/${limit}`
  );
  
  // Адаптуємо нову структуру до старої для сумісності
  const items = response.data.result || [];
  return {
    items,
    total: items.length,
    page,
    limit
  };
}

export async function updateSiteCategoriesDescriptions(
  data: UpdateSiteCategoryDescriptionRequest[]
): Promise<{ success: boolean; message: string }> {
  console.log('[API] updateSiteCategoriesDescriptions - updating', data.length, 'categories');
  
  // Відправляємо категорії по одній, бо бекенд очікує один об'єкт за раз
  let successCount = 0;
  let errorCount = 0;
  
  for (const category of data) {
    try {
      console.log('[API] Updating category:', category.category_id, category.lang_code);
      
      const response = await apiClient.post<{ success: boolean; message: string }>(
        '/content/update_site_categories_descriptions',
        category // Відправляємо один об'єкт
      );
      
      console.log('[API] Response:', response.data);
      successCount++;
    } catch (error) {
      console.error('[API] Failed to update category:', category.category_id, error);
      errorCount++;
    }
  }
  
  console.log('[API] Update complete:', { successCount, errorCount, total: data.length });
  
  if (errorCount > 0) {
    return { 
      success: false, 
      message: `Оновлено ${successCount} з ${data.length} категорій. Помилок: ${errorCount}` 
    };
  }
  
  return { 
    success: true, 
    message: `Успішно оновлено ${successCount} категорій` 
  };
}
