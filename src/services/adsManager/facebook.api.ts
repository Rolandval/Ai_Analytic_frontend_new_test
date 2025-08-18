import { createApi } from '@reduxjs/toolkit/query/react';
import { apiBaseQuery } from '@/lib/apiBaseQuery';

export interface GenerateFBPostRequest {
  title: string;
  description?: string;
}

export interface GenerateFBPostResponse {
  titles: string[];
  descriptions: string[];
  texts: string[];
  images: string[];
  video_url: string;
}

export interface GenerateGoogleAdRequest {
  title: string;
  description?: string;
}

export interface GenerateGoogleAdResponse {
  titles: string[];
  long_titles: string[];
  descriptions: string[];
  images: string[];
  video_url: string;
}

export const facebookApi = createApi({
  reducerPath: 'facebookApi',
  baseQuery: apiBaseQuery,
  endpoints: (builder) => ({
    generateFBPost: builder.mutation<GenerateFBPostResponse, GenerateFBPostRequest>({
      query: (data) => ({
        url: '/ads_manager/generate_fb_post',
        method: 'POST',
        body: data,
      }),
    }),
    generateGoogleAd: builder.mutation<GenerateGoogleAdResponse, GenerateGoogleAdRequest>({
      query: (data) => ({
        url: '/ads_manager/generate_google_ad',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const { useGenerateFBPostMutation, useGenerateGoogleAdMutation } = facebookApi;
