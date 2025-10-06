import { useMutation } from '@tanstack/react-query';
import { enhanceQuality, QualityEnhancementRequest, QualityEnhancementResponse } from '@/api/qualityEnhancementApi';
import { toast } from '@/hooks/use-toast';

export function useQualityEnhancement() {
  return useMutation<QualityEnhancementResponse, Error, QualityEnhancementRequest>({
    mutationFn: enhanceQuality,
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: 'Успіх!',
          description: 'Якість успішно покращено',
        });
      } else {
        toast({
          title: 'Помилка',
          description: data.message || 'Не вдалося покращити якість',
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
