/**
 * IndexedDB Cache для товарів та категорій
 * Зберігає перші 50 записів для швидкого відображення при наступних візитах
 */

const DB_NAME = 'AiAnalyticCache';
const DB_VERSION = 1;
const PRODUCTS_STORE = 'products';
const CATEGORIES_STORE = 'categories';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 години

interface CacheEntry<T> {
  data: T[];
  timestamp: number;
  lang: string;
}

class DataCache {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Ініціалізація бази даних
   */
  private async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('[DataCache] Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[DataCache] IndexedDB opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Створюємо сховище для товарів
        if (!db.objectStoreNames.contains(PRODUCTS_STORE)) {
          db.createObjectStore(PRODUCTS_STORE);
          console.log('[DataCache] Created products store');
        }

        // Створюємо сховище для категорій
        if (!db.objectStoreNames.contains(CATEGORIES_STORE)) {
          db.createObjectStore(CATEGORIES_STORE);
          console.log('[DataCache] Created categories store');
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Збереження даних у кеш
   */
  private async setCache<T>(storeName: string, key: string, data: T[], lang: string): Promise<void> {
    try {
      await this.init();
      if (!this.db) throw new Error('Database not initialized');

      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        lang,
      };

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(entry, key);

        request.onsuccess = () => {
          console.log(`[DataCache] Saved ${data.length} items to ${storeName} (lang: ${lang})`);
          resolve();
        };

        request.onerror = () => {
          console.error(`[DataCache] Failed to save to ${storeName}:`, request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('[DataCache] setCache error:', error);
      // Не кидаємо помилку, щоб не зламати основний функціонал
    }
  }

  /**
   * Отримання даних з кешу
   */
  private async getCache<T>(storeName: string, key: string, lang: string): Promise<T[] | null> {
    try {
      await this.init();
      if (!this.db) return null;

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);

        request.onsuccess = () => {
          const entry = request.result as CacheEntry<T> | undefined;
          
          if (!entry) {
            console.log(`[DataCache] No cache found for ${storeName}`);
            resolve(null);
            return;
          }

          // Перевіряємо актуальність кешу
          const age = Date.now() - entry.timestamp;
          if (age > CACHE_DURATION) {
            console.log(`[DataCache] Cache expired for ${storeName} (age: ${Math.round(age / 1000 / 60)} min)`);
            resolve(null);
            return;
          }

          // Перевіряємо відповідність мови
          if (entry.lang !== lang) {
            console.log(`[DataCache] Cache lang mismatch for ${storeName} (cached: ${entry.lang}, requested: ${lang})`);
            resolve(null);
            return;
          }

          console.log(`[DataCache] Retrieved ${entry.data.length} items from ${storeName} (age: ${Math.round(age / 1000)} sec)`);
          resolve(entry.data);
        };

        request.onerror = () => {
          console.error(`[DataCache] Failed to get from ${storeName}:`, request.error);
          resolve(null);
        };
      });
    } catch (error) {
      console.error('[DataCache] getCache error:', error);
      return null;
    }
  }

  /**
   * Очищення кешу
   */
  async clearCache(storeName?: string): Promise<void> {
    try {
      await this.init();
      if (!this.db) return;

      const stores = storeName ? [storeName] : [PRODUCTS_STORE, CATEGORIES_STORE];

      for (const store of stores) {
        await new Promise<void>((resolve, reject) => {
          const transaction = this.db!.transaction([store], 'readwrite');
          const objectStore = transaction.objectStore(store);
          const request = objectStore.clear();

          request.onsuccess = () => {
            console.log(`[DataCache] Cleared ${store}`);
            resolve();
          };

          request.onerror = () => {
            console.error(`[DataCache] Failed to clear ${store}:`, request.error);
            reject(request.error);
          };
        });
      }
    } catch (error) {
      console.error('[DataCache] clearCache error:', error);
    }
  }

  // ===== PUBLIC API =====

  /**
   * Збереження товарів у кеш (перші 50)
   */
  async cacheProducts<T>(products: T[], lang: string): Promise<void> {
    console.log(`[DataCache] cacheProducts called with ${products?.length ?? 0} items, lang: ${lang}`);
    const toCache = products.slice(0, 50);
    console.log(`[DataCache] Caching ${toCache.length} items (first 50 from ${products?.length ?? 0})`);
    await this.setCache(PRODUCTS_STORE, 'latest', toCache, lang);
  }

  /**
   * Отримання товарів з кешу
   */
  async getCachedProducts<T>(lang: string): Promise<T[] | null> {
    const result = await this.getCache<T>(PRODUCTS_STORE, 'latest', lang);
    console.log(`[DataCache] getCachedProducts returned ${result?.length ?? 0} items for lang: ${lang}`);
    return result;
  }

  /**
   * Збереження категорій у кеш (перші 50)
   */
  async cacheCategories<T>(categories: T[], lang: string): Promise<void> {
    console.log(`[DataCache] cacheCategories called with ${categories?.length ?? 0} items, lang: ${lang}`);
    const toCache = categories.slice(0, 50);
    console.log(`[DataCache] Caching ${toCache.length} items (first 50 from ${categories?.length ?? 0})`);
    await this.setCache(CATEGORIES_STORE, 'latest', toCache, lang);
  }

  /**
   * Отримання категорій з кешу
   */
  async getCachedCategories<T>(lang: string): Promise<T[] | null> {
    const result = await this.getCache<T>(CATEGORIES_STORE, 'latest', lang);
    console.log(`[DataCache] getCachedCategories returned ${result?.length ?? 0} items for lang: ${lang}`);
    return result;
  }

  /**
   * Очищення всього кешу
   */
  async clearAll(): Promise<void> {
    await this.clearCache();
  }
}

// Експортуємо singleton
export const dataCache = new DataCache();
