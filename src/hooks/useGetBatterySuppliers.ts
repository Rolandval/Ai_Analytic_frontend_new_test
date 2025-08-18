import { useQuery } from '@tanstack/react-query';
import { getBatterySuppliers } from '@/services/batteries.api';

export const useGetBatterySuppliers = (page: number, pageSize: number) => {
  return useQuery({
    queryKey: ['battery-suppliers', page, pageSize],
    queryFn: () => getBatterySuppliers({ page, page_size: pageSize }),
  });
};
