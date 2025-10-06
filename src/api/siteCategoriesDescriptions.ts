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
  const response = await apiClient.get<SiteCategoriesDescriptionsResponse>(
    `/content/get_site_categories_descriptions/${page}/${limit}`
  );
  return response.data;
}

export async function updateSiteCategoriesDescriptions(
  data: UpdateSiteCategoryDescriptionRequest[]
): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.post<{ success: boolean; message: string }>(
    '/content/update_site_categories_descriptions',
    data
  );
  return response.data;
}
