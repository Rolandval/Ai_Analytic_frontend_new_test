import { useQuery } from '@tanstack/react-query';
import { systemStatusApi } from '@/api/systemStatusApi';

// Хук для отримання балансу токенів
export const useTokenBalances = () => {
  return useQuery({
    queryKey: ['tokenBalances'],
    queryFn: systemStatusApi.getTokenBalances,
    refetchInterval: 30000, // Оновлювати кожні 30 секунд
    staleTime: 15000, // Дані вважаються свіжими 15 секунд
  });
};

// Хук для отримання статусу БД
export const useDatabaseStatus = () => {
  return useQuery({
    queryKey: ['databaseStatus'],
    queryFn: systemStatusApi.getDatabaseStatus,
    refetchInterval: 10000, // Оновлювати кожні 10 секунд
    staleTime: 5000, // Дані вважаються свіжими 5 секунд
  });
};

// Хук для отримання метрик системи
export const useSystemMetrics = () => {
  return useQuery({
    queryKey: ['systemMetrics'],
    queryFn: systemStatusApi.getSystemMetrics,
    refetchInterval: 5000, // Оновлювати кожні 5 секунд
    staleTime: 2000, // Дані вважаються свіжими 2 секунди
  });
};

// Хук для отримання всього статусу системи
export const useSystemStatus = () => {
  return useQuery({
    queryKey: ['systemStatus'],
    queryFn: systemStatusApi.getSystemStatus,
    refetchInterval: 15000, // Оновлювати кожні 15 секунд
    staleTime: 10000, // Дані вважаються свіжими 10 секунд
  });
};
