import { useQuery } from '@tanstack/react-query';
import { getSolarPanels } from '@/services/solarPanels.api';
import { SolarPanelListRequest } from '@/types/solarPanel';

export const useGetSolarPanelsDirectory = (params: SolarPanelListRequest) => {
  return useQuery({
    queryKey: ['solar-panels-directory', params],
    queryFn: () => getSolarPanels(params),
    staleTime: 1000 * 60,
  });
};
