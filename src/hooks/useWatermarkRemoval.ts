import { useMutation } from '@tanstack/react-query';
import { removeWatermark, RemoveWatermarkRequest, RemoveWatermarkResponse } from '@/api/watermarkRemovalApi';
import { toast } from '@/hooks/use-toast';

export function useRemoveWatermark() {
  return useMutation<RemoveWatermarkResponse, Error, RemoveWatermarkRequest>({
    mutationFn: removeWatermark,
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: 'Успіх!',
          description: 'Водяний знак успішно видалено',
        });
      } else {
        toast({
          title: 'Помилка',
          description: data.message || 'Не вдалося видалити водяний знак',
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
