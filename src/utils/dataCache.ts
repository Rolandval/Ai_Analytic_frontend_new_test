/**
 * IndexedDB Cache для товарів та категорій
 * Зберігає ВСІ записи (2820+ товарів) для миттєвого відображення при наступних візитах
 * Кеш діє 24 години, після чого автоматично оновлюється
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
  isFull?: boolean;
}

export interface CachedData<T> {
  data: T[];
  isFull: boolean;
  timestamp: number;
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
  private async setCache<T>(storeName: string, key: string, data: T[], lang: string, isFull: boolean = false): Promise<void> {
    try {
      await this.init();
      if (!this.db) throw new Error('Database not initialized');

      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        lang,
        isFull,
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
  private async getCache<T>(storeName: string, key: string, lang: string): Promise<CacheEntry<T> | null> {
    try {
      await this.init();
      if (!this.db) return null;

      return new Promise((resolve) => {
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

          console.log(`[DataCache] Retrieved ${entry.data.length} items from ${storeName} (age: ${Math.round(age / 1000)} sec, full: ${entry.isFull === true})`);
          resolve(entry);
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
   */
  async cacheProducts<T>(products: T[], lang: string, isFull: boolean = false): Promise<void> {
    console.log(`[DataCache] cacheProducts called with ${products?.length ?? 0} items, lang: ${lang}, isFull: ${isFull}`);
    const key = isFull ? 'full' : 'latest';
    console.log(`[DataCache] Caching ${products.length} items to key '${key}' for lang: ${lang}`);
    await this.setCache(PRODUCTS_STORE, key, products, lang, isFull);
  }

  /**
   * Отримання товарів з кешу (спочатку шукає повний кеш, потім швидкий)
   */
  async getCachedProducts<T>(lang: string): Promise<CachedData<T> | null> {
    // Спочатку шукаємо повний кеш
    let entry = await this.getCache<T>(PRODUCTS_STORE, 'full', lang);
    if (entry && entry.data.length > 0) {
      console.log(`[DataCache] getCachedProducts returned FULL cache: ${entry.data.length} items for lang: ${lang}`);
      return {
        data: entry.data,
        isFull: entry.isFull ?? true,
        timestamp: entry.timestamp,
      };
    }

    // Якщо повного немає - беремо швидкий
    entry = await this.getCache<T>(PRODUCTS_STORE, 'latest', lang);
    console.log(`[DataCache] getCachedProducts returned quick cache: ${entry?.data.length ?? 0} items for lang: ${lang}`);
    return entry
      ? {
          data: entry.data,
          isFull: entry.isFull === true,
          timestamp: entry.timestamp,
        }
      : null;
  }

  /**
   * Збереження категорій у кеш (всі категорії)
   */
  async cacheCategories<T>(categories: T[], lang: string, isFull: boolean = false): Promise<void> {
    console.log(`[DataCache] cacheCategories called with ${categories?.length ?? 0} items, lang: ${lang}, isFull: ${isFull}`);
    const key = isFull ? 'full' : 'latest';
    console.log(`[DataCache] Caching ${categories.length} items to key '${key}' for lang: ${lang}`);
    await this.setCache(CATEGORIES_STORE, key, categories, lang, isFull);
  }

  /**
   * Отримання категорій з кешу (спочатку шукає повний кеш, потім швидкий)
   */
  async getCachedCategories<T>(lang: string): Promise<CachedData<T> | null> {
    // Спочатку шукаємо повний кеш
    let entry = await this.getCache<T>(CATEGORIES_STORE, 'full', lang);
    if (entry && entry.data.length > 0) {
      console.log(`[DataCache] getCachedCategories returned FULL cache: ${entry.data.length} items for lang: ${lang}`);
      return {
        data: entry.data,
        isFull: entry.isFull ?? true,
        timestamp: entry.timestamp,
      };
    }

    // Якщо повного немає - беремо швидкий
    entry = await this.getCache<T>(CATEGORIES_STORE, 'latest', lang);
    console.log(`[DataCache] getCachedCategories returned quick cache: ${entry?.data.length ?? 0} items for lang: ${lang}`);
    return entry
      ? {
          data: entry.data,
          isFull: entry.isFull === true,
          timestamp: entry.timestamp,
        }
      : null;
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
