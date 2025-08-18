import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addSolarPanelSupplier } from '@/services/solarPanels.api';

export const useAddSolarPanelSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addSolarPanelSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solar-panel-suppliers'] });
    },
  });
};
