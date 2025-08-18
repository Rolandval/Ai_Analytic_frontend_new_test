import { useQuery } from '@tanstack/react-query';
import { getBatteriesDirectory } from '@/services/batteries.api';
import { BatteryDirectoryParams } from '@/types/battery';

export const useGetBatteriesDirectory = (params: BatteryDirectoryParams) => {
  return useQuery({
    queryKey: ['batteries-directory', params],
    queryFn: () => getBatteriesDirectory(params),
  });
};
