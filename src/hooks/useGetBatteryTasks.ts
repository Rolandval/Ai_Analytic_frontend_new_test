import { useQuery } from '@tanstack/react-query';
import { getTasks } from '@/services/tasks.api';
import { ProductTypeEnum } from '@/types/task';

export const useGetBatteryTasks = (page: number, pageSize: number) => {
  return useQuery({
    queryKey: ['battery-tasks', page, pageSize],
    queryFn: () => getTasks(ProductTypeEnum.BATTERIES, { page, page_size: pageSize }),
  });
};
