import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTask } from '@/services/tasks.api';
import { UploadTask, UploadTasksIntervalEnum } from '@/types/task';

export const useUpdateBatteryTask = () => {
  const queryClient = useQueryClient();

  return useMutation<UploadTask, Error, Partial<UploadTask> & { id: number }>({
    mutationFn: ({ id, ...data }) => updateTask(id, data as { name: string; interval: UploadTasksIntervalEnum; is_active: boolean }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batteryTasks'] });
    },
  });
};
