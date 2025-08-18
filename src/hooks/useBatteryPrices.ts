import { useQuery } from '@tanstack/react-query';
import { getBatteryPrices } from '@/services/batteries.api';
import { BatteryPriceListRequest, PaginatedBatteryPricesResponse } from '@/types/battery';

export const useBatteryPrices = (params: BatteryPriceListRequest) => {
  return useQuery<PaginatedBatteryPricesResponse, Error>({
    queryKey: ['batteryPrices', params],
    queryFn: () => getBatteryPrices(params),
    placeholderData: (previousData) => previousData,
  });
};
