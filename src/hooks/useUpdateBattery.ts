import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateBattery } from '@/services/batteries.api';

export const useUpdateBattery = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateBattery(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['batteries-directory'] });
      qc.invalidateQueries({ queryKey: ['lost-batteries'] });
    },
  });
};
