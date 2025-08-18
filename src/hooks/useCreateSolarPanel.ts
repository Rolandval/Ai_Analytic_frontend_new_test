import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSolarPanel } from '@/services/solarPanels.api';

export const useCreateSolarPanel = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createSolarPanel,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['solar-panels-directory'] });
      qc.invalidateQueries({ queryKey: ['lost-solar-panels'] });
    },
  });
};
