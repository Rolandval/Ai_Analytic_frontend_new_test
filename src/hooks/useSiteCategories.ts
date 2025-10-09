import { useQuery } from '@tanstack/react-query';
import { siteCategoriesApi, type SiteCategory, type SiteCategoryWithDescription } from '@/api/siteCategoriesApi';

export const useSiteCategories = () => {
  return useQuery<SiteCategory[], Error>({
    queryKey: ['siteCategories'],
    queryFn: siteCategoriesApi.getCategoriesFromDescriptions, // Використовуємо новий ендпоінт
    staleTime: 5 * 60 * 1000, // 5 хвилин
    gcTime: 10 * 60 * 1000, // 10 хвилин
  });
};

// Новий хук для роботи з повними описами категорій
export const useSiteCategoriesDescriptions = (page: number = 1, limit: number = 9999) => {
  return useQuery<SiteCategoryWithDescription[], Error>({
    queryKey: ['siteCategoriesDescriptions', page, limit],
    queryFn: () => siteCategoriesApi.getCategoriesDescriptions(page, limit),
    staleTime: 5 * 60 * 1000, // 5 хвилин
    gcTime: 10 * 60 * 1000, // 10 хвилин
  });
};
