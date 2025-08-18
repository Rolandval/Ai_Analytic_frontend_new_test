import { useMutation, useQueryClient } from '@tanstack/react-query';
import { runInverterTask } from '@/services/inverters.api';

export const useRunInverterTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: runInverterTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inverter-tasks'] });
    },
  });
};
