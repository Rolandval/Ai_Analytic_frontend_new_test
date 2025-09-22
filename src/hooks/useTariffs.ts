import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tariffsApi, type TariffCreateRequest, type SubscribeRequest } from '@/api/tariffs';
import { useToast } from '@/hooks/use-toast';

// Хук для отримання списку тарифів
export const useTariffs = () => {
  return useQuery({
    queryKey: ['tariffs'],
    queryFn: tariffsApi.getTariffs,
    staleTime: 5 * 60 * 1000, // 5 хвилин
  });
};

// Хук для отримання конкретного тарифу
export const useTariff = (tariffId: number) => {
  return useQuery({
    queryKey: ['tariff', tariffId],
    queryFn: () => tariffsApi.getTariff(tariffId),
    enabled: !!tariffId,
    staleTime: 5 * 60 * 1000, // 5 хвилин
  });
};

// Хук для отримання поточної підписки користувача
export const useMySubscription = () => {
  return useQuery({
    queryKey: ['my-subscription'],
    queryFn: tariffsApi.getMySubscription,
    staleTime: 2 * 60 * 1000, // 2 хвилини
  });
};

// Хук для створення нового тарифу (адміністратор)
export const useCreateTariff = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: TariffCreateRequest) => tariffsApi.createTariff(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tariffs'] });
      toast({
        title: 'Успіх',
        description: 'Тариф успішно створено',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Помилка',
        description: error.response?.data?.message || 'Помилка при створенні тарифу',
        variant: 'destructive',
      });
    },
  });
};

// Хук для підписки на тариф
export const useSubscribe = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: SubscribeRequest) => tariffsApi.subscribe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-subscription'] });
      toast({
        title: 'Успіх',
        description: 'Підписка успішно оформлена',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Помилка',
        description: error.response?.data?.message || 'Помилка при оформленні підписки',
        variant: 'destructive',
      });
    },
  });
};

// Хук для оновлення тарифу (адміністратор)
export const useUpdateTariff = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ tariffId, data }: { tariffId: number; data: Partial<TariffCreateRequest> }) => 
      tariffsApi.updateTariff(tariffId, data),
    onSuccess: (_, { tariffId }) => {
      queryClient.invalidateQueries({ queryKey: ['tariffs'] });
      queryClient.invalidateQueries({ queryKey: ['tariff', tariffId] });
      toast({
        title: 'Успіх',
        description: 'Тариф успішно оновлено',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Помилка',
        description: error.response?.data?.message || 'Помилка при оновленні тарифу',
        variant: 'destructive',
      });
    },
  });
};

// Хук для видалення тарифу (адміністратор)
export const useDeleteTariff = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (tariffId: number) => tariffsApi.deleteTariff(tariffId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tariffs'] });
      toast({
        title: 'Успіх',
        description: 'Тариф успішно видалено',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Помилка',
        description: error.response?.data?.message || 'Помилка при видаленні тарифу',
        variant: 'destructive',
      });
    },
  });
};

// Хук для скасування підписки
export const useCancelSubscription = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: tariffsApi.cancelSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-subscription'] });
      toast({
        title: 'Успіх',
        description: 'Підписка успішно скасована',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Помилка',
        description: error.response?.data?.message || 'Помилка при скасуванні підписки',
        variant: 'destructive',
      });
    },
  });
};
