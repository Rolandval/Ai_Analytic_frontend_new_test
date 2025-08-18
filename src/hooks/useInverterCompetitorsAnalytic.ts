import { useQuery } from '@tanstack/react-query';
import { getInverterCompetitorsAnalytic } from '@/services/inverters.api';

export const useInverterCompetitorsAnalytic = () => {
  return useQuery({
    queryKey: ['inverter-competitors-analytic'],
    queryFn: getInverterCompetitorsAnalytic,
  });
};
