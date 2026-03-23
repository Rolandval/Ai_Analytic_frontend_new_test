export interface ImageWithModelRequest {
  image: string; // base64
  model?: string;
}

export interface ProcessedImageResponse {
  result_image: string; // base64
  processing_time?: number;
}
