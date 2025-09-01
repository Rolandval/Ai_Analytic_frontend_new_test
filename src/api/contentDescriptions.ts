import { apiClient } from '@/lib/api-client';

export type ProductType = 'batteries' | 'solar_panels' | 'inverters';

export interface ContentDescriptionsRequest {
  product_type?: ProductType;
  page?: number; // 1-based
  limit?: number; // page size
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
  const response = await apiClient.post('/content/descriptions', {
    product_type: req.product_type,
    page: req.page ?? 1,
    limit: req.limit ?? 50,
  });
  const data = response.data || {};
  // Normalize possible shapes: { items, total, page, limit } OR { result, page, limit }
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

export const generateAiDescription = async (
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
