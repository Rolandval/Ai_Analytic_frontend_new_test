import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTask } from '@/services/tasks.api';
import { UploadTask } from '@/types/task';

export const useUpdateBatteryTask = () => {
  const queryClient = useQueryClient();

  return useMutation<UploadTask, Error, Partial<UploadTask> & { id: number }>({
    mutationFn: ({ id, ...data }) => updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batteryTasks'] });
    },
  });
};
