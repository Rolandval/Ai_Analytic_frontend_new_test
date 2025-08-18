import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateInverterSupplier } from '@/services/inverters.api';

export const useUpdateInverterSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateInverterSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inverter-suppliers'] });
    },
  });
};
