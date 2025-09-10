import { useQuery } from '@tanstack/react-query';
import { getBatterySuppliers } from '@/services/batteries.api';

export const useGetBatterySuppliers = (page: number, pageSize: number = 100, search: string = '') => {
  return useQuery({
    queryKey: ['battery-suppliers', page, pageSize, search],
    queryFn: () => getBatterySuppliers({ page, page_size: pageSize, search }),
  });
};
