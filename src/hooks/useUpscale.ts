import { useMutation } from '@tanstack/react-query';
import { upscaleImage, UpscaleRequest, UpscaleResponse } from '@/api/upscaleApi';
import { toast } from '@/hooks/use-toast';

export function useUpscale() {
  return useMutation<UpscaleResponse, Error, UpscaleRequest>({
    mutationFn: upscaleImage,
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: 'Успіх!',
          description: 'Зображення успішно збільшено',
        });
      } else {
        toast({
          title: 'Помилка',
          description: data.message || 'Не вдалося збільшити зображення',
          variant: 'destructive',
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Помилка',
        description: error.message || 'Не вдалося обробити зображення',
        variant: 'destructive',
      });
    },
  });
}
