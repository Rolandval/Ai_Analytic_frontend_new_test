import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateSolarPanel } from '@/services/solarPanels.api';

export const useUpdateSolarPanel = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateSolarPanel(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['solar-panels-directory'] });
      qc.invalidateQueries({ queryKey: ['lost-solar-panels'] });
    },
  });
};
