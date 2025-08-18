import { useQuery } from '@tanstack/react-query';
import { getTasks } from '@/services/tasks.api';
import { ProductTypeEnum } from '@/types/task';

export const useGetInverterTasks = (page: number, pageSize: number) => {
  return useQuery({
    queryKey: ['inverter-tasks', page, pageSize],
    queryFn: () => getTasks(ProductTypeEnum.INVERTERS, { page, page_size: pageSize }),
  });
};
