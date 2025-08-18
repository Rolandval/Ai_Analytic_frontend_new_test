import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteBatterySupplier } from '@/services/batteries.api';

export const useDeleteBatterySupplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteBatterySupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['battery-suppliers'] });
    },
  });
};
