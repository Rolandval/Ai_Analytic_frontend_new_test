import { useQuery } from '@tanstack/react-query';
import { getLostSolarPanels } from '@/services/solar-panels.api';

export const useLostSolarPanels = (page: number, page_size: number = 15) => {
  return useQuery({
    queryKey: ['lost-solar-panels', page, page_size],
    queryFn: () => getLostSolarPanels(page, page_size),
  });
};
