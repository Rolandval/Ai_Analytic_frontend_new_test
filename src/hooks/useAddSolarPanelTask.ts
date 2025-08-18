import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTask, runTaskNow } from '@/services/tasks.api';
import { ProductTypeEnum, UploadTask } from '@/types/task';

export const useAddSolarPanelTask = () => {
  const queryClient = useQueryClient();

  return useMutation<{ task_id: number; detail: string }, Error, Omit<UploadTask, 'id' | 'is_active' | 'last_run'>>({
    mutationFn: (task) => createTask(ProductTypeEnum.SOLAR_PANELS, task),
    onSuccess: (data) => {
      // backend requires last_run not null, so trigger immediate run to populate it
      runTaskNow(data.task_id).finally(() => {
        queryClient.invalidateQueries({ queryKey: ['solar-panel-tasks'] });
      });
    }
  });
};
