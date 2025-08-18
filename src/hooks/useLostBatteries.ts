import { useQuery } from '@tanstack/react-query';
import { getLostBatteries } from '@/services/batteries.api';

export const useLostBatteries = (page: number, page_size: number = 15) => {
  return useQuery({
    queryKey: ['lost-batteries', page, page_size],
    queryFn: () => getLostBatteries(page, page_size),
  });
};
