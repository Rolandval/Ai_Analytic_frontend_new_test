import { useQuery } from '@tanstack/react-query';
import { getBatteryCompetitorsAnalytic } from '@/services/batteries.api';

export const useBatteryCompetitorsAnalytic = () => {
  return useQuery({
    queryKey: ['battery-competitors-analytic'],
    queryFn: getBatteryCompetitorsAnalytic,
  });
};
