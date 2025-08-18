import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateSolarPanelSupplier } from '@/services/solarPanels.api';

export const useUpdateSolarPanelSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSolarPanelSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solar-panel-suppliers'] });
    },
  });
};
