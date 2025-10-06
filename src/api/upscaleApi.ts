import { apiClient } from '@/lib/api-client';

export interface UpscaleRequest {
  image: File;
  data?: {
    model?: string;
    scale?: number;
    format?: 'png' | 'jpg' | 'webp';
    quality?: number;
    [key: string]: any;
  };
}

export interface UpscaleResponse {
  processed_image: string; // base64 encoded image or URL
  success: boolean;
  message?: string;
}

export async function upscaleImage(
  request: UpscaleRequest
): Promise<UpscaleResponse> {
  const formData = new FormData();
  formData.append('image', request.image);

  // Формуємо URL з query параметрами
  const params = new URLSearchParams();
  if (request.data?.model_name) {
    params.append('model_name', request.data.model_name);
  }
  
  const url = `/content/upscale?${params.toString()}`;

  const res = await apiClient.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return res?.data as UpscaleResponse;
}
