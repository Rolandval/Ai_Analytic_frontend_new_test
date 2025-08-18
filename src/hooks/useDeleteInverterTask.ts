import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteTask } from '@/services/tasks.api';

export const useDeleteInverterTask = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: (taskId) => deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inverter-tasks'] });
    },
  });
};
