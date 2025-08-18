import { useMutation, useQueryClient } from '@tanstack/react-query';
import { runBatteryTask } from '@/services/batteries.api';

export const useRunBatteryTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: runBatteryTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['battery-tasks'] });
    },
  });
};
