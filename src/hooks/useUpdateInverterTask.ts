import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTask } from '@/services/tasks.api';
import { UploadTask } from '@/types/task';

export const useUpdateInverterTask = () => {
  const queryClient = useQueryClient();

  return useMutation<UploadTask, Error, UploadTask>({
    mutationFn: ({ id, ...data }) => updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inverter-tasks'] });
    },
  });
};
