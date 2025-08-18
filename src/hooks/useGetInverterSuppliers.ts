import { useQuery } from '@tanstack/react-query';
import { getInverterSuppliers } from '@/services/inverters.api';

export const useGetInverterSuppliers = (page: number, pageSize: number) => {
  return useQuery({
    queryKey: ['inverter-suppliers', page, pageSize],
    queryFn: () => getInverterSuppliers({ page, page_size: pageSize }),
  });
};
