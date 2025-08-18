import { useQuery } from '@tanstack/react-query';
import { getTasks } from '@/services/tasks.api';
import { ProductTypeEnum } from '@/types/task';

export const useGetSolarPanelTasks = (page: number, pageSize: number) => {
  return useQuery({
    queryKey: ['solar-panel-tasks', page, pageSize],
    queryFn: () => getTasks(ProductTypeEnum.SOLAR_PANELS, { page, page_size: pageSize }),
  });
};
