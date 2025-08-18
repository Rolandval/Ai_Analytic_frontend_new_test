import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createInverter } from '@/services/inverters.api';

export const useCreateInverter = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createInverter,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inverters-directory'] });
      qc.invalidateQueries({ queryKey: ['lost-inverters'] });
    },
  });
};
