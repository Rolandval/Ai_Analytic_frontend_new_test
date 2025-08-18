import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addBatterySupplier } from '@/services/batteries.api';

export const useAddBatterySupplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addBatterySupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['battery-suppliers'] });
    },
  });
};
