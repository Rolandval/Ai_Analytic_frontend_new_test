import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addInverterSupplier } from '@/services/inverters.api';

export const useAddInverterSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addInverterSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inverter-suppliers'] });
    },
  });
};
