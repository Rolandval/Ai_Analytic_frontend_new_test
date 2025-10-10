import { useState, useEffect, useCallback, useRef } from 'react';
import { dataCache } from '@/utils/dataCache';

interface UseCachedDataOptions<T> {
  /**
   * Функція для завантаження даних з API
   */
  fetchFn: () => Promise<T[]>;
  
  /**
   * Функція для збереження даних у кеш
   */
  cacheFn: (data: T[], lang: string) => Promise<void>;
  
  /**
   * Функція для отримання даних з кешу
   */
  getCacheFn: (lang: string) => Promise<T[] | null>;
  
  /**
   * Поточна мова
   */
  lang: string;
  
  /**
   * Чи потрібно завантажувати дані
   */
  enabled?: boolean;
  
  /**
   * Ключ для логування
   */
  logKey?: string;
}

interface UseCachedDataReturn<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isFromCache: boolean;
}

/**
 * Хук для роботи з кешованими даними
 * 
 * Логіка роботи:
 * 1. При першому завантаженні перевіряє наявність даних у кеші
 * 2. Якщо кеш є - миттєво показує його користувачу
 * 3. Паралельно завантажує свіжі дані з API у фоновому режимі
 * 4. Після отримання свіжих даних - оновлює кеш і плавно оновлює UI
 * 5. Якщо кешу немає - показує лоадер і чекає на дані з API
 */
export function useCachedData<T>({
  fetchFn,
  cacheFn,
  getCacheFn,
  lang,
  enabled = true,
  logKey = 'useCachedData',
}: UseCachedDataOptions<T>): UseCachedDataReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  
  // Ref для відстеження, чи вже завантажуємо дані
  const isFetchingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /**
   * Завантаження даних з API та оновлення кешу
   */
  const fetchFromAPI = useCallback(async (showLoader: boolean = true) => {
    if (isFetchingRef.current) {
      console.log(`[${logKey}] Already fetching, skipping...`);
      return;
    }

    isFetchingRef.current = true;
    
    if (showLoader) {
      setLoading(true);
    }
    
    setError(null);

    try {
      console.log(`[${logKey}] Fetching fresh data from API...`);
      const freshData = await fetchFn();
      
      if (!mountedRef.current) return;

      console.log(`[${logKey}] Received ${freshData.length} items from API`);
      
      // Оновлюємо стан
      setData(freshData);
      setIsFromCache(false);
      
      // Зберігаємо у кеш (перші 50)
      try {
        await cacheFn(freshData, lang);
        console.log(`[${logKey}] Cached first 50 items`);
      } catch (cacheError) {
        console.warn(`[${logKey}] Failed to cache data:`, cacheError);
        // Не кидаємо помилку, щоб не зламати основний функціонал
      }
    } catch (err) {
      if (!mountedRef.current) return;
      
      const errorMessage = (err as Error)?.message || 'Помилка завантаження даних';
      console.error(`[${logKey}] API fetch error:`, err);
      setError(errorMessage);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        isFetchingRef.current = false;
      }
    }
  }, [fetchFn, cacheFn, lang, logKey]);

  /**
   * Основна логіка завантаження з кешем
   */
  const loadData = useCallback(async () => {
    if (!enabled) {
      console.log(`[${logKey}] Disabled, skipping...`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Спробуємо отримати дані з кешу
      console.log(`[${logKey}] Checking cache for lang: ${lang}...`);
      const cachedData = await getCacheFn(lang);

      if (cachedData && cachedData.length > 0) {
        // Є кеш - показуємо його миттєво
        console.log(`[${logKey}] ✅ Cache hit! Showing ${cachedData.length} cached items`);
        setData(cachedData);
        setIsFromCache(true);
        setLoading(false);

        // Запускаємо фонове оновлення без лоадера
        console.log(`[${logKey}] Starting background refresh...`);
        fetchFromAPI(false);
      } else {
        // Кешу немає - завантажуємо з API з лоадером
        console.log(`[${logKey}] ❌ Cache miss. Fetching from API...`);
        await fetchFromAPI(true);
      }
    } catch (err) {
      console.error(`[${logKey}] Load error:`, err);
      setError((err as Error)?.message || 'Помилка завантаження');
      setLoading(false);
    }
  }, [enabled, lang, getCacheFn, fetchFromAPI, logKey]);

  /**
   * Ручне оновлення даних
   */
  const refetch = useCallback(async () => {
    console.log(`[${logKey}] Manual refetch triggered`);
    await fetchFromAPI(true);
  }, [fetchFromAPI, logKey]);

  // Завантажуємо дані при монтуванні або зміні мови
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    loading,
    error,
    refetch,
    isFromCache,
  };
}
