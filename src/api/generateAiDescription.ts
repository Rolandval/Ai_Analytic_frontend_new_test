import { apiClient } from '@/lib/api-client';

export interface GenerateAiDescriptionRequest {
  site_product: string;
  site_full_description: string;
  prompt: string;
  model_name: string; // e.g. 'GPT-4o-mini'
}

// Backend may return different shapes; keep it generic
export type GenerateAiDescriptionResponse = unknown;

export async function generateAiDescription(
  body: GenerateAiDescriptionRequest
): Promise<GenerateAiDescriptionResponse> {
  const res = await apiClient.post('/content/generate_ai_description', body);
  return res?.data;
}
