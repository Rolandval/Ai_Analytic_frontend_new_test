import { useQuery } from '@tanstack/react-query';
import { getInverters } from '@/services/inverters.api';
import { InverterListRequest } from '@/types/inverter';

export const useGetInvertersDirectory = (params: InverterListRequest) => {
  return useQuery({
    queryKey: ['inverters-directory', params],
    queryFn: () => getInverters(params),
  });
};
