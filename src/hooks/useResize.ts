import { useMutation } from '@tanstack/react-query';
import { resizeImage, ResizeImageRequest, ResizeImageResponse } from '@/api/resizeApi';
import { toast } from '@/hooks/use-toast';

export function useResize() {
  return useMutation<ResizeImageResponse, Error, ResizeImageRequest>({
    mutationFn: resizeImage,
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: 'Успіх!',
          description: 'Розмір зображення успішно змінено',
        });
      } else {
        toast({
          title: 'Помилка',
          description: data.message || 'Не вдалося змінити розмір',
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
