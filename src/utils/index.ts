/**
 * Центральний експорт всіх утиліт
 */

export { dataCache } from './dataCache';
export { cacheManager } from './cacheManager';
export type { CacheStats, CacheInfo } from './cacheManager';

// Завантажуємо тестові утиліти тільки в режимі розробки
if (process.env.NODE_ENV === 'development') {
  import('./cacheTest').then(() => {
    console.log('🧪 Cache test utilities loaded in development mode');
  });
}
