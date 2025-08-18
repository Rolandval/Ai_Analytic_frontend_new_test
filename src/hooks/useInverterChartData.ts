import { useQuery } from '@tanstack/react-query';
import { getInverterChartData } from '@/services/inverters.api';
import { ChartDataRequest } from '@/types/analytics';

export const useInverterChartData = (params: ChartDataRequest) => {
  return useQuery({
    queryKey: ['inverter-chart-data', params],
    queryFn: () => getInverterChartData(params),
  });
};
