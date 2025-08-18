import { apiClient } from "@/lib/api-client";

export interface GeneratePostDescriptionRequest {
  title: string;
  description?: string;
}

export interface GeneratePostDescriptionResponse {
  title: string;
  full_description: string;
  short_description: string;
  search_keywords: string[];
  promo_text: string;
  short_video_url: string;
  video_review_url: string;
  reviews: Array<{
    name: string;
    text: string;
    rating: string;
  }>;
  similar_products?: string[] | null;
}

export const generatePostDescription = async (
  data: GeneratePostDescriptionRequest
): Promise<GeneratePostDescriptionResponse> => {
  const response = await apiClient.post<GeneratePostDescriptionResponse>(
    "/content/generate_post_descriptions",
    data
  );
  return response.data;
};
