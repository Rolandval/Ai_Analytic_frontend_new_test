import { useQuery } from '@tanstack/react-query';
import { siteCategoriesApi, type SiteCategory } from '@/api/siteCategoriesApi';

export const useSiteCategories = () => {
  return useQuery<SiteCategory[], Error>({
    queryKey: ['siteCategories'],
    queryFn: siteCategoriesApi.getCategories,
    staleTime: 5 * 60 * 1000, // 5 хвилин
    gcTime: 10 * 60 * 1000, // 10 хвилин
  });
};
