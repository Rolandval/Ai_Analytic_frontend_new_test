import { useQuery } from '@tanstack/react-query';
import { getInverterSuppliersAnalytic } from '@/services/inverters.api';

export const useInverterSuppliersAnalytic = () => {
  return useQuery({
    queryKey: ['inverter-suppliers-analytic'],
    queryFn: getInverterSuppliersAnalytic,
  });
};
