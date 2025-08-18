import { useQuery } from '@tanstack/react-query';
import { getLostInverters } from '@/services/inverters.api';

export const useLostInverters = (page: number, page_size: number = 15) => {
  return useQuery({
    queryKey: ['lost-inverters', page, page_size],
    queryFn: () => getLostInverters(page, page_size),
  });
};
