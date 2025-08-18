import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createInverterTask } from '@/services/inverters.api';

export const useCreateInverterTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createInverterTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inverter-tasks'] });
    },
  });
};
