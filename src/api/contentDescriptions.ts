import { apiClient } from '@/lib/api-client';

export type ProductType = 'batteries' | 'solar_panels' | 'inverters';

export interface ContentDescriptionsRequest {
  product_type?: ProductType;
  category_ids?: number[]; // category filter as array
  page?: number; // 1-based
  limit?: number; // page size
  lang?: string; // language filter (e.g., 'ua' | 'en' | 'ru')
}

export interface ContentDescriptionsResponse<T = any> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export const fetchContentDescriptions = async <T = any>(
  req: ContentDescriptionsRequest
): Promise<ContentDescriptionsResponse<T>> => {
  const payload: any = {
    product_type: req.product_type,
    page: req.page ?? 1,
    limit: req.limit ?? 50,
    lang: req.lang,
  };
  
  // Завжди додаємо category_ids (порожній масив = всі категорії)
  if (req.category_ids !== undefined) {
    payload.category_ids = req.category_ids;
  }
  
  const response = await apiClient.post('/content/descriptions', payload);
  const data = response.data || {}; 
  
  const items: T[] = Array.isArray(data.items) ? data.items : (Array.isArray(data.result) ? data.result : []);
  const page = typeof data.page === 'number' ? data.page : (req.page ?? 1);
  const limit = typeof data.limit === 'number' ? data.limit : (req.limit ?? 50);
  const total = typeof data.total === 'number' ? data.total : (items?.length ?? 0);
  return { items, total, page, limit };
};

export interface GenerateDescriptionRequest {
  site_product: string;
  site_full_description: string;
  prompt: string;
  model_name: string;
}

export interface GenerateDescriptionResponse {
  text?: string;
  result?: string;
  description?: string;
}

export const generateAiDescriptionLegacy = async (
  body: GenerateDescriptionRequest
): Promise<string> => {
  // Вимикаємо автопарсинг JSON, щоб уникнути падіння при некоректному JSON від бекенду
  const res = await apiClient.post('/content/generate_ai_description', body, {
    transformResponse: [(d) => d],
  });
  const raw = res.data;
  // Спроба безпечно розпарсити JSON, якщо це строка-схоже-на-JSON
  let data: GenerateDescriptionResponse | any = raw;
  if (typeof raw === 'string') {
    try {
      data = JSON.parse(raw);
    } catch {
      // залишаємо як текст
    }
  }
  // Підтримка різних форм відповіді й повернення строкового результату за замовчуванням
  if (data && typeof data === 'object') {
    return data.text ?? data.result ?? data.description ?? '';
  }
  return typeof data === 'string' ? data : '';
};

// Мапінг ключів між категоріями та генерацією
export const CATEGORY_FIELD_MAPPING = {
  description: 'site_short_description',
  meta_keywords: 'site_meta_keywords', 
  page_title: 'site_page_title',
  category: 'site_product'
} as const;

export interface GenerateCategoryRequest {
  category_id: number;
  lang_code: string;
  category: string;
  site_short_description?: string;
  site_meta_keywords?: string; 
  site_page_title?: string;
  prompt: string;
  model_name?: string;
}

export interface GenerateCategoryResponse {
  text?: string;
  result?: string;
  description?: string;
}

export const generateAiCategoryDescription = async (
  body: GenerateCategoryRequest
): Promise<string> => {
  // Створюємо payload з мапінгом ключів
  const payload = {
    site_product: body.category,
    site_full_description: body.site_short_description || body.category || 'Категорія товарів',
    site_short_description: body.site_short_description || '',
    site_meta_keywords: body.site_meta_keywords || '',
    site_page_title: body.site_page_title || '',
    prompt: body.prompt,
    model_name: body.model_name || 'GPT-4o-mini'
  };

  // Вимикаємо автопарсинг JSON, щоб уникнути падіння при некоректному JSON від бекенду
  const res = await apiClient.post('/content/generate_ai_description', payload, {
    transformResponse: [(d) => d],
  });
  const raw = res.data;
  // Спроба безпечно розпарсити JSON, якщо це строка-схоже-на-JSON
  let data: GenerateCategoryResponse | any = raw;
  if (typeof raw === 'string') {
    try {
      data = JSON.parse(raw);
    } catch {
      // залишаємо як текст
    }
  }
  // Підтримка різних форм відповіді й повернення строкового результату за замовчуванням
  if (data && typeof data === 'object') {
    return data.text ?? data.result ?? data.description ?? '';
  }
  return typeof data === 'string' ? data : '';
};
