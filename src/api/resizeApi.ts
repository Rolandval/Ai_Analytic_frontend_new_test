import { apiClient } from '@/lib/api-client';

export interface ResizeImageRequest {
  image: File;
  data?: {
    width?: number;
    height?: number;
    maintain_aspect_ratio?: boolean;
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp';
    [key: string]: any;
  };
}

export interface ResizeImageResponse {
  processed_image: string; // base64 encoded image or URL
  success: boolean;
  message?: string;
}

export async function resizeImage(
  request: ResizeImageRequest
): Promise<ResizeImageResponse> {
  const formData = new FormData();
  formData.append('image', request.image);
  
  if (request.data) {
    formData.append('data', JSON.stringify(request.data));
  }

  const res = await apiClient.post('/content/ai_resize_image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return res?.data as ResizeImageResponse;
}
