import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createBatteryTask } from '@/services/batteries.api';

export const useCreateBatteryTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBatteryTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['battery-tasks'] });
    },
  });
};
