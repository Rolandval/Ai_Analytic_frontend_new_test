import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTask, runTaskNow } from '@/services/tasks.api';
import { ProductTypeEnum, UploadTask } from '@/types/task';

export const useAddInverterTask = () => {
  const queryClient = useQueryClient();

  return useMutation<{ task_id: number; detail: string }, Error, Omit<UploadTask, 'id' | 'is_active' | 'last_run'>>({
    mutationFn: (task) => createTask(ProductTypeEnum.INVERTERS, task),
    onSuccess: (data) => {
      runTaskNow(data.task_id).finally(() => {
        queryClient.invalidateQueries({ queryKey: ['inverter-tasks'] });
      });
    }
  });
};
