import { apiClient } from '@/lib/api-client';

export interface SiteCategory {
  category_id: number;
  category: string;
}

export const siteCategoriesApi = {
  /**
   * Отримати список всіх категорій сайту
   */
  getCategories: async (): Promise<SiteCategory[]> => {
    const response = await apiClient.get('/content/site_categories');
    return response.data;
  },
};
