import { useMutation } from '@tanstack/react-query';
import { uploadInverterReport } from '@/services/inverters.api';

export const useUploadInverterReport = () => {
  return useMutation({ 
    mutationFn: uploadInverterReport 
  });
};
