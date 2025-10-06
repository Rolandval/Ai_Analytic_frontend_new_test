import { useMutation } from '@tanstack/react-query';
import { removeBackground, RemoveBackgroundRequest, RemoveBackgroundResponse } from '@/api/removeBackgroundApi';
import { toast } from '@/hooks/use-toast';

export function useRemoveBackground() {
  return useMutation<RemoveBackgroundResponse, Error, RemoveBackgroundRequest>({
    mutationFn: removeBackground,
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: 'Успіх!',
          description: 'Фон успішно видалено',
        });
      } else {
        toast({
          title: 'Помилка',
          description: data.message || 'Не вдалося видалити фон',
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
