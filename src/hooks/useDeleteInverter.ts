import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteInverter } from '@/services/inverters.api';

export const useDeleteInverter = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteInverter,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inverters-directory'] });
      qc.invalidateQueries({ queryKey: ['lost-inverters'] });
    },
  });
};
