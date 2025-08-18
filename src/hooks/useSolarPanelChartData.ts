import { useQuery } from '@tanstack/react-query';
import { getSolarPanelChartData } from '@/services/solarPanels.api';
import { ChartDataRequest } from '@/types/analytics';

export const useSolarPanelChartData = (params: ChartDataRequest) => {
  return useQuery({
    queryKey: ['solar-panel-chart-data', params],
    queryFn: () => getSolarPanelChartData(params),
  });
};
