import { useQuery } from '@tanstack/react-query';
import { getBatteryBrands } from '@/services/batteries.api';

export const useGetBatteryBrands = () => {
  return useQuery({
    queryKey: ['battery-brands'],
    queryFn: getBatteryBrands,
    staleTime: Infinity, // Brands list is not expected to change often
  });
};
