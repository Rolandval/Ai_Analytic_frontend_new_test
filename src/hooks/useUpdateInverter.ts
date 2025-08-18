import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateInverter } from '@/services/inverters.api';

export const useUpdateInverter = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateInverter(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inverters-directory'] });
      qc.invalidateQueries({ queryKey: ['lost-inverters'] });
    },
  });
};
