import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useRef, useCallback } from 'react';
import { useDebounce } from 'use-debounce';

interface UseOptimizedQueryOptions<T> {
  queryKey: (string | number | object)[];
  queryFn: () => Promise<T>;
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
  debounceMs?: number;
  dependencies?: any[];
}

export function useOptimizedQuery<T>({
  queryKey,
  queryFn,
  enabled = true,
  staleTime = 5 * 60 * 1000, // 5 хвилин
  cacheTime = 10 * 60 * 1000, // 10 хвилин
  debounceMs = 300,
  dependencies = []
}: UseOptimizedQueryOptions<T>) {
  
  // Debounce dependencies для зменшення кількості запитів
  const [debouncedDeps] = useDebounce(dependencies, debounceMs);
  
  // Мемоізований query key з debounced dependencies
  const memoizedQueryKey = useMemo(() => [
    ...queryKey,
    ...debouncedDeps
  ], [queryKey, debouncedDeps]);

  // Мемоізована query function
  const memoizedQueryFn = useCallback(queryFn, debouncedDeps);

  return useQuery({
    queryKey: memoizedQueryKey,
    queryFn: memoizedQueryFn,
    enabled,
    staleTime,
    cacheTime,
    // Додаткові оптимізації
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
  });
}

// Хук для оптимізованого завантаження метаданих
export function useOptimizedMetadata() {
  const queryClient = useQueryClient();
  
  const prefetchMetadata = useCallback(async (type: 'brands' | 'suppliers', fetcher: () => Promise<any>) => {
    const queryKey = [`${type}Metadata`];
    
    // Перевіряємо чи є дані в кеші
    const cachedData = queryClient.getQueryData(queryKey);
    if (cachedData) return cachedData;
    
    // Prefetch якщо немає в кеші
    await queryClient.prefetchQuery({
      queryKey,
      queryFn: fetcher,
      staleTime: 10 * 60 * 1000, // 10 хвилин
    });
    
    return queryClient.getQueryData(queryKey);
  }, [queryClient]);

  return { prefetchMetadata };
}

// Хук для batch запитів
export function useBatchQueries<T>(
  queries: Array<{
    queryKey: (string | number)[];
    queryFn: () => Promise<T>;
    enabled?: boolean;
  }>
) {
  const queryClient = useQueryClient();
  
  const batchFetch = useCallback(async () => {
    const enabledQueries = queries.filter(q => q.enabled !== false);
    
    // Виконуємо всі запити паралельно
    const results = await Promise.allSettled(
      enabledQueries.map(async (query) => {
        // Перевіряємо кеш спочатку
        const cached = queryClient.getQueryData(query.queryKey);
        if (cached) return cached;
        
        // Виконуємо запит якщо немає в кеші
        return query.queryFn();
      })
    );
    
    return results.map((result, index) => ({
      queryKey: enabledQueries[index].queryKey,
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null
    }));
  }, [queries, queryClient]);

  return { batchFetch };
}
