import { apiClient } from '@/lib/api-client';

export interface SiteCategory {
  category_id: number;
  category: string;
}

// Нова структура для описів категорій
export interface SiteCategoryWithDescription {
  category_id: number;
  lang_code: string;
  category: string;
  description: string;
  meta_keywords: string;
  page_title: string;
}

export interface SiteCategoriesDescriptionsResponse {
  result: SiteCategoryWithDescription[];
}

export const siteCategoriesApi = {
  /**
   * Отримати список всіх категорій сайту (старий формат)
   */
  getCategories: async (): Promise<SiteCategory[]> => {
    const response = await apiClient.get('/content/site_categories');
    return response.data;
  },

  /**
   * Отримати описи категорій сайту з пагінацією (новий формат)
   * @param page - номер сторінки (починається з 1)
   * @param limit - кількість записів на сторінку
   */
  getCategoriesDescriptions: async (page: number = 1, limit: number = 9999): Promise<SiteCategoryWithDescription[]> => {
    const response = await apiClient.get<SiteCategoriesDescriptionsResponse>(`/content/get_site_categories_descriptions/${page}/${limit}`);
    return response.data.result || [];
  },

  /**
   * Отримати унікальні категорії з описів (без дублікатів по category_id)
   * Використовує новий ендпоінт та повертає список категорій у старому форматі для сумісності
   */
  getCategoriesFromDescriptions: async (): Promise<SiteCategory[]> => {
    const descriptions = await siteCategoriesApi.getCategoriesDescriptions();
    
    // Створюємо Map для унікальних категорій по category_id
    const uniqueCategories = new Map<number, SiteCategory>();
    
    descriptions.forEach(desc => {
      if (!uniqueCategories.has(desc.category_id)) {
        uniqueCategories.set(desc.category_id, {
          category_id: desc.category_id,
          category: desc.category
        });
      }
    });
    
    return Array.from(uniqueCategories.values());
  },
};
