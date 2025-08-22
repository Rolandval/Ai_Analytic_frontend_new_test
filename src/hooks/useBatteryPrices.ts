import { useQuery } from '@tanstack/react-query';
import { getBatteryPrices } from '@/services/batteries.api';
import { BatteryPriceListRequest, BatteryPriceSchema } from '@/types/battery';
import { Paginated } from '@/types/api';

export const useBatteryPrices = (params: BatteryPriceListRequest) => {
  return useQuery<Paginated<BatteryPriceSchema>, Error>({
    queryKey: ['batteryPrices', params],
    queryFn: () => getBatteryPrices(params),
    placeholderData: (previousData) => previousData,
  });
};
