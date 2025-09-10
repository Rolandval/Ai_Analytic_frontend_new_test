import { useQuery } from '@tanstack/react-query';
import { getInverterSuppliers } from '@/services/inverters.api';

export const useGetInverterSuppliers = (page: number, pageSize: number = 100, search: string = '') => {
  return useQuery({
    queryKey: ['inverter-suppliers', page, pageSize, search],
    queryFn: () => getInverterSuppliers({ page, page_size: pageSize, search }),
  });
};
