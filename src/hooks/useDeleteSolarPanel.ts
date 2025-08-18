import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteSolarPanel } from '@/services/solarPanels.api';

export const useDeleteSolarPanel = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteSolarPanel,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['solar-panels-directory'] });
      qc.invalidateQueries({ queryKey: ['lost-solar-panels'] });
    },
  });
};
