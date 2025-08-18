import { useQuery } from '@tanstack/react-query';
import { getSolarPanelCompetitorsAnalytic } from '@/services/solarPanels.api';

export const useSolarPanelCompetitorsAnalytic = () => {
  return useQuery({
    queryKey: ['solar-panel-competitors-analytic'],
    queryFn: getSolarPanelCompetitorsAnalytic,
  });
};
