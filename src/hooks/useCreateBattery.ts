import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createBattery } from '@/services/batteries.api';

export const useCreateBattery = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createBattery,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['batteries-directory'] });
      qc.invalidateQueries({ queryKey: ['lost-batteries'] });
    },
  });
};
