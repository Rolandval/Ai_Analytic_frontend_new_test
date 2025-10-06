import { apiClient } from '@/lib/api-client';

export interface RemoveWatermarkRequest {
  image: File;
  data?: {
    model?: string;
    strength?: number;
    [key: string]: any;
  };
}

export interface RemoveWatermarkResponse {
  processed_image: string; // base64 encoded image or URL
  success: boolean;
  message?: string;
}

export async function removeWatermark(
  request: RemoveWatermarkRequest
): Promise<RemoveWatermarkResponse> {
  const formData = new FormData();
  formData.append('image', request.image);

  // Формуємо URL з query параметрами
  const params = new URLSearchParams();
  if (request.data?.model_name) {
    params.append('model_name', request.data.model_name);
  }
  
  const url = `/content/remove_watermark?${params.toString()}`;

  const res = await apiClient.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return res?.data as RemoveWatermarkResponse;
}
