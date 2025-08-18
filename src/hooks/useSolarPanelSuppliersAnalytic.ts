import { useQuery } from '@tanstack/react-query';
import { getSolarPanelSuppliersAnalytic } from '@/services/solarPanels.api';

export const useSolarPanelSuppliersAnalytic = () => {
  return useQuery({
    queryKey: ['solar-panel-suppliers-analytic'],
    queryFn: getSolarPanelSuppliersAnalytic,
  });
};
