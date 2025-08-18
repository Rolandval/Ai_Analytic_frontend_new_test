import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getInverterGoogleTables,
  addInverterGoogleTable,
  updateInverterGoogleTable,
  deleteInverterGoogleTable,
} from '@/services/inverterGoogleTables.api';
import { GoogleTable } from '@/types/googleTable';

const queryKey = ['inverter-google-tables'];

export const useGetInverterGoogleTables = () => useQuery({ queryKey, queryFn: getInverterGoogleTables });

export const useAddInverterGoogleTable = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<GoogleTable, 'id' | 'product_type'>) => addInverterGoogleTable(data),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });
};

export const useUpdateInverterGoogleTable = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Omit<GoogleTable, 'id' | 'product_type'> }) =>
      updateInverterGoogleTable(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });
};

export const useDeleteInverterGoogleTable = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteInverterGoogleTable(id),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });
};
