import { useQuery } from '@tanstack/react-query';
import { getSolarPanelPrices } from '@/services/solarPanels.api';
import { SolarPanelPriceListRequest, PaginatedSolarPanelPricesResponse } from '@/types/solarPanel';

export const useSolarPanelPrices = (params: SolarPanelPriceListRequest) => {
  return useQuery<PaginatedSolarPanelPricesResponse, Error>({
    queryKey: ['solarPanelPrices', params],
    queryFn: () => getSolarPanelPrices(params),
    placeholderData: (previousData) => previousData,
  });
};
