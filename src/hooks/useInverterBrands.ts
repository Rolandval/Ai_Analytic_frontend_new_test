import { useQuery } from '@tanstack/react-query';
import { getInverterBrands } from '@/services/inverters.api';

export const useInverterBrands = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['inverterBrands'],
    queryFn: getInverterBrands,
  });

  const brands: string[] = (data as any)?.brands ?? (data as any) ?? [];
  return { brands, isLoading, error };
};
