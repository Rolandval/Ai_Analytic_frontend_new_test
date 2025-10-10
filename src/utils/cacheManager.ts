/**
 * Менеджер кешу - розширені функції для управління кешем
 */

import { dataCache } from './dataCache';

interface CacheStats {
  productsCount: number;
  categoriesCount: number;
  productsAge: number | null;
  categoriesAge: number | null;
  productsLang: string | null;
  categoriesLang: string | null;
  totalSize: number;
}

interface CacheInfo {
  exists: boolean;
  age: number | null;
  lang: string | null;
  count: number;
  isExpired: boolean;
}

class CacheManager {
  /**
   * Отримати статистику кешу
   */
  async getStats(): Promise<CacheStats> {
    const stats: CacheStats = {
      productsCount: 0,
      categoriesCount: 0,
      productsAge: null,
      categoriesAge: null,
      productsLang: null,
      categoriesLang: null,
      totalSize: 0,
    };

    try {
      // Отримуємо інформацію про товари
      const productsInfo = await this.getCacheInfo('products');
      if (productsInfo.exists) {
        stats.productsCount = productsInfo.count;
        stats.productsAge = productsInfo.age;
        stats.productsLang = productsInfo.lang;
      }

      // Отримуємо інформацію про категорії
      const categoriesInfo = await this.getCacheInfo('categories');
      if (categoriesInfo.exists) {
        stats.categoriesCount = categoriesInfo.count;
        stats.categoriesAge = categoriesInfo.age;
        stats.categoriesLang = categoriesInfo.lang;
      }

      // Приблизний розмір (не точний, але дає уявлення)
      stats.totalSize = this.estimateSize(stats.productsCount + stats.categoriesCount);
    } catch (error) {
      console.error('[CacheManager] Failed to get stats:', error);
    }

    return stats;
  }

  /**
   * Отримати інформацію про конкретний кеш
   */
  private async getCacheInfo(type: 'products' | 'categories'): Promise<CacheInfo> {
    const info: CacheInfo = {
      exists: false,
      age: null,
      lang: null,
      count: 0,
      isExpired: false,
    };

    try {
      // Пробуємо отримати дані для всіх мов
      const langs = ['ua', 'en', 'ru'];
      
      for (const lang of langs) {
        const data = type === 'products' 
          ? await dataCache.getCachedProducts(lang)
          : await dataCache.getCachedCategories(lang);

        if (data && data.length > 0) {
          info.exists = true;
          info.count = data.length;
          info.lang = lang;
          // Вік кешу можна отримати з timestamp (якщо додати в майбутньому)
          break;
        }
      }
    } catch (error) {
      console.error(`[CacheManager] Failed to get ${type} info:`, error);
    }

    return info;
  }

  /**
   * Приблизна оцінка розміру кешу в KB
   */
  private estimateSize(itemCount: number): number {
    // Припускаємо ~5KB на один запис (дуже приблизно)
    return Math.round(itemCount * 5);
  }

  /**
   * Форматування віку кешу для відображення
   */
  formatAge(ageMs: number | null): string {
    if (ageMs === null) return 'Невідомо';

    const seconds = Math.floor(ageMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours} год ${minutes % 60} хв`;
    } else if (minutes > 0) {
      return `${minutes} хв`;
    } else {
      return `${seconds} сек`;
    }
  }

  /**
   * Форматування розміру для відображення
   */
  formatSize(sizeKB: number): string {
    if (sizeKB < 1024) {
      return `${sizeKB} KB`;
    } else {
      return `${(sizeKB / 1024).toFixed(2)} MB`;
    }
  }

  /**
   * Перевірка, чи потрібно оновити кеш
   */
  async shouldRefresh(type: 'products' | 'categories', lang: string): Promise<boolean> {
    try {
      const data = type === 'products'
        ? await dataCache.getCachedProducts(lang)
        : await dataCache.getCachedCategories(lang);

      // Якщо кешу немає - потрібно оновити
      if (!data || data.length === 0) {
        return true;
      }

      // Тут можна додати додаткову логіку перевірки
      // Наприклад, перевірка часу останнього оновлення
      return false;
    } catch (error) {
      console.error('[CacheManager] Failed to check refresh:', error);
      return true;
    }
  }

  /**
   * Очищення застарілого кешу
   */
  async clearExpired(): Promise<void> {
    try {
      console.log('[CacheManager] Clearing expired cache...');
      
      // IndexedDB автоматично перевіряє вік при getCachedProducts/Categories
      // Тут можна додати додаткову логіку очищення
      
      const stats = await this.getStats();
      console.log('[CacheManager] Current cache stats:', stats);
    } catch (error) {
      console.error('[CacheManager] Failed to clear expired:', error);
    }
  }

  /**
   * Експорт статистики для відображення в UI
   */
  async getDisplayStats(): Promise<string[]> {
    const stats = await this.getStats();
    const lines: string[] = [];

    if (stats.productsCount > 0) {
      lines.push(`📦 Товари: ${stats.productsCount} записів (${stats.productsLang?.toUpperCase()})`);
    }

    if (stats.categoriesCount > 0) {
      lines.push(`📦 Категорії: ${stats.categoriesCount} записів (${stats.categoriesLang?.toUpperCase()})`);
    }

    if (stats.totalSize > 0) {
      lines.push(`💾 Розмір: ~${this.formatSize(stats.totalSize)}`);
    }

    if (lines.length === 0) {
      lines.push('Кеш порожній');
    }

    return lines;
  }

  /**
   * Перевірка доступності IndexedDB
   */
  async isAvailable(): Promise<boolean> {
    try {
      if (!window.indexedDB) {
        return false;
      }

      // Пробуємо відкрити тестову базу
      const testDB = await new Promise<boolean>((resolve) => {
        const request = indexedDB.open('__test__');
        request.onsuccess = () => {
          request.result.close();
          indexedDB.deleteDatabase('__test__');
          resolve(true);
        };
        request.onerror = () => resolve(false);
      });

      return testDB;
    } catch {
      return false;
    }
  }

  /**
   * Отримати рекомендації щодо кешу
   */
  async getRecommendations(): Promise<string[]> {
    const recommendations: string[] = [];
    const stats = await this.getStats();

    if (stats.productsCount === 0 && stats.categoriesCount === 0) {
      recommendations.push('💡 Відкрийте сторінку генерації для створення кешу');
    }

    if (stats.productsCount > 0 && stats.categoriesCount === 0) {
      recommendations.push('💡 Відкрийте вкладку "Категорії" для кешування категорій');
    }

    if (stats.categoriesCount > 0 && stats.productsCount === 0) {
      recommendations.push('💡 Відкрийте вкладку "Товари" для кешування товарів');
    }

    if (stats.totalSize > 5000) {
      recommendations.push('⚠️ Кеш займає багато місця. Розгляньте можливість очищення.');
    }

    return recommendations;
  }
}

// Експортуємо singleton
export const cacheManager = new CacheManager();

// Експортуємо типи
export type { CacheStats, CacheInfo };
