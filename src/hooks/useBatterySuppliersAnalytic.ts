import { useQuery } from '@tanstack/react-query';
import { getBatterySuppliersAnalytic } from '@/services/batteries.api';

export const useBatterySuppliersAnalytic = () => {
  return useQuery({
    queryKey: ['battery-suppliers-analytic'],
    queryFn: getBatterySuppliersAnalytic,
  });
};
