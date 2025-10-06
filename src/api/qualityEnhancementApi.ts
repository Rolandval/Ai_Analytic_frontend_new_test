import { apiClient } from '@/lib/api-client';

export interface QualityEnhancementRequest {
  image: File;
  data?: {
    model?: string;
    enhancement_level?: 'low' | 'medium' | 'high';
    denoise?: boolean;
    sharpen?: boolean;
    [key: string]: any;
  };
}

export interface QualityEnhancementResponse {
  processed_image: string; // base64 encoded image or URL
  success: boolean;
  message?: string;
}

export async function enhanceQuality(
  request: QualityEnhancementRequest
): Promise<QualityEnhancementResponse> {
  const formData = new FormData();
  formData.append('image', request.image);

  // Формуємо URL з query параметрами
  const params = new URLSearchParams();
  if (request.data?.model_name) {
    params.append('model_name', request.data.model_name);
  }
  
  const url = `/content/quality_enhancement?${params.toString()}`;

  const res = await apiClient.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return res?.data as QualityEnhancementResponse;
}
