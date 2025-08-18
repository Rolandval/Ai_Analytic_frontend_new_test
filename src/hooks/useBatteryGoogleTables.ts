import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getBatteryGoogleTables,
  addBatteryGoogleTable,
  updateBatteryGoogleTable,
  deleteBatteryGoogleTable,
} from '@/services/batteryGoogleTables.api';
import { GoogleTable } from '@/types/googleTable';

const queryKey = ['battery-google-tables'];

export const useGetBatteryGoogleTables = () =>
  useQuery({ queryKey, queryFn: getBatteryGoogleTables });

export const useAddBatteryGoogleTable = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<GoogleTable, 'id' | 'product_type'>) => addBatteryGoogleTable(data),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });
};

export const useUpdateBatteryGoogleTable = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Omit<GoogleTable, 'id' | 'product_type'> }) =>
      updateBatteryGoogleTable(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });
};

export const useDeleteBatteryGoogleTable = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteBatteryGoogleTable(id),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });
};
