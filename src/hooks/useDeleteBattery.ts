import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteBattery } from '@/services/batteries.api';

export const useDeleteBattery = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteBattery,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['batteries-directory'] });
      qc.invalidateQueries({ queryKey: ['lost-batteries'] });
    },
  });
};
