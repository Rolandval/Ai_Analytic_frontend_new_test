import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteSolarPanelSupplier } from '@/services/solarPanels.api';

export const useDeleteSolarPanelSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSolarPanelSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solar-panel-suppliers'] });
    },
  });
};
