import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSolarPanelTask } from '@/services/solarPanels.api';

export const useCreateSolarPanelTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSolarPanelTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solar-panel-tasks'] });
    },
  });
};
