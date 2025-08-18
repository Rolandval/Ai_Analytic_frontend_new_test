import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTask, runTaskNow } from '@/services/tasks.api';
import { ProductTypeEnum, UploadTask } from '@/types/task';


export const useAddBatteryTask = () => {
  const queryClient = useQueryClient();

  return useMutation<{ task_id: number; detail: string }, Error, Omit<UploadTask, 'id' | 'is_active' | 'last_run'>>({
    mutationFn: (task) => createTask(ProductTypeEnum.BATTERIES, task),
    onSuccess: (data) => {
      runTaskNow((data as { task_id: number }).task_id).finally(() => {
        queryClient.invalidateQueries({ queryKey: ['batteryTasks'] });
      });
    }
  });
};
