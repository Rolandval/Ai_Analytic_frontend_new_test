import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSolarGoogleTables,
  addSolarGoogleTable,
  updateSolarGoogleTable,
  deleteSolarGoogleTable,
} from '@/services/solarGoogleTables.api';
import { GoogleTable } from '@/types/googleTable';

const queryKey = ['solar-google-tables'];

export const useGetSolarGoogleTables = () => useQuery({ queryKey, queryFn: getSolarGoogleTables });

export const useAddSolarGoogleTable = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<GoogleTable, 'id' | 'product_type'>) => addSolarGoogleTable(data),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });
};

export const useUpdateSolarGoogleTable = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Omit<GoogleTable, 'id' | 'product_type'> }) =>
      updateSolarGoogleTable(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });
};

export const useDeleteSolarGoogleTable = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteSolarGoogleTable(id),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });
};
