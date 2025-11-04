import { apiClient } from '@/lib/api-client';

export interface ResizePhotoRequest {
  photo: File;
  resize_percent: number;
}

export interface CropPhotoRequest {
  photo: File;
  crop_percent?: number;
  top_pct?: number;
  bottom_pct?: number;
  left_pct?: number;
  right_pct?: number;
}

export interface ConvertPhotoRequest {
  photo: File;
  format: string;
}

export interface SetAltTagRequest {
  src: string;
  alt: string;
}

export interface PhotoResponse {
  success: boolean;
  message?: string;
  processed_image?: string; // base64 або URL
}

export async function resizePhoto(request: ResizePhotoRequest): Promise<PhotoResponse> {
  const formData = new FormData();
  formData.append('photo', request.photo);
  formData.append('resize_percent', request.resize_percent.toString());

  const res = await apiClient.post('/photo/resize', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    responseType: 'blob', // Отримуємо blob замість JSON
  });
  
  // Конвертуємо blob в base64
  const blob = res?.data as Blob;
  const base64 = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
  
  return {
    success: true,
    processed_image: base64,
  };
}

export async function cropPhoto(request: CropPhotoRequest): Promise<PhotoResponse> {
  const formData = new FormData();
  formData.append('photo', request.photo);
  
  if (request.crop_percent) formData.append('crop_percent', request.crop_percent.toString());
  if (request.top_pct) formData.append('top_pct', request.top_pct.toString());
  if (request.bottom_pct) formData.append('bottom_pct', request.bottom_pct.toString());
  if (request.left_pct) formData.append('left_pct', request.left_pct.toString());
  if (request.right_pct) formData.append('right_pct', request.right_pct.toString());

  const res = await apiClient.post('/photo/crop', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    responseType: 'blob',
  });
  
  const blob = res?.data as Blob;
  const base64 = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
  
  return {
    success: true,
    processed_image: base64,
  };
}

export async function convertPhoto(request: ConvertPhotoRequest): Promise<PhotoResponse> {
  const formData = new FormData();
  formData.append('photo', request.photo);
  formData.append('format', request.format);

  const res = await apiClient.post('/photo/convert', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    responseType: 'blob',
  });
  
  const blob = res?.data as Blob;
  const base64 = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
  
  return {
    success: true,
    processed_image: base64,
  };
}

export async function setAltTag(request: SetAltTagRequest): Promise<PhotoResponse> {
  const res = await apiClient.post('/photo/alt', request, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  return res?.data as PhotoResponse;
}
