import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteInverterSupplier } from '@/services/inverters.api';

export const useDeleteInverterSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteInverterSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inverter-suppliers'] });
    },
  });
};
