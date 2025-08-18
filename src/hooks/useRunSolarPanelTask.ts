import { useMutation, useQueryClient } from '@tanstack/react-query';
import { runSolarPanelTask } from '@/services/solarPanels.api';

export const useRunSolarPanelTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: runSolarPanelTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solar-panel-tasks'] });
    },
  });
};
