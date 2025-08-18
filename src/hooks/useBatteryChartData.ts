import { useQuery } from '@tanstack/react-query';
import { getBatteryChartData } from '@/services/batteries.api';
import { ChartDataRequest } from '@/types/analytics';

export const useBatteryChartData = (params: ChartDataRequest) => {
  return useQuery({
    queryKey: ['battery-chart-data', params],
    queryFn: () => getBatteryChartData(params),
  });
};
