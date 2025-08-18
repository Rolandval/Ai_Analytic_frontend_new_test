import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateBatterySupplier } from '@/services/batteries.api';

export const useUpdateBatterySupplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateBatterySupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['battery-suppliers'] });
    },
  });
};
