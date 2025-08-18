import { useQuery } from '@tanstack/react-query';
import { getInverterPrices } from '@/services/inverters.api';
import { InverterPriceListRequest } from '@/types/inverter';

export const useInverterPrices = (params: InverterPriceListRequest) => {
  return useQuery({
    queryKey: ['inverterPrices', params],
    queryFn: () => getInverterPrices(params),
    placeholderData: (previousData) => previousData,
  });
};
