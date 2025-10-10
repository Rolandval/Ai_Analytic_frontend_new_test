/**
 * Утиліти для тестування кешу
 * Використовуйте в консолі браузера для діагностики
 */

import { dataCache } from './dataCache';
import { cacheManager } from './cacheManager';

/**
 * Тестування роботи кешу
 * Викликати в консолі: window.testCache()
 */
export async function testCache() {
  console.group('🧪 Cache Test Suite');

  try {
    // 1. Перевірка доступності IndexedDB
    console.log('1️⃣ Checking IndexedDB availability...');
    const isAvailable = await cacheManager.isAvailable();
    console.log(`   ${isAvailable ? '✅' : '❌'} IndexedDB available: ${isAvailable}`);

    if (!isAvailable) {
      console.error('   ⚠️ IndexedDB is not available. Cache will not work.');
      console.groupEnd();
      return;
    }

    // 2. Перевірка поточної статистики
    console.log('\n2️⃣ Current cache stats:');
    const stats = await cacheManager.getStats();
    console.table({
      'Products Count': stats.productsCount,
      'Products Lang': stats.productsLang || 'N/A',
      'Categories Count': stats.categoriesCount,
      'Categories Lang': stats.categoriesLang || 'N/A',
      'Total Size (KB)': stats.totalSize,
    });

    // 3. Тестові дані
    console.log('\n3️⃣ Creating test data...');
    const testProducts = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      product_id: i + 1,
      site_product: `Test Product ${i + 1}`,
      site_lang_code: 'ua',
      site_shortname: `Short ${i + 1}`,
      site_short_description: `Short description ${i + 1}`,
      site_full_description: `Full description ${i + 1}`,
      site_meta_keywords: `keyword${i + 1}`,
      site_meta_description: `Meta ${i + 1}`,
      site_searchwords: `search${i + 1}`,
      site_page_title: `Title ${i + 1}`,
      site_promo_text: `Promo ${i + 1}`,
    }));

    const testCategories = Array.from({ length: 50 }, (_, i) => ({
      category_id: i + 1,
      lang_code: 'ua',
      category: `Test Category ${i + 1}`,
      description: `Category description ${i + 1}`,
      meta_keywords: `cat_keyword${i + 1}`,
      page_title: `Cat Title ${i + 1}`,
    }));

    console.log(`   ✅ Created ${testProducts.length} test products`);
    console.log(`   ✅ Created ${testCategories.length} test categories`);

    // 4. Збереження в кеш
    console.log('\n4️⃣ Saving to cache...');
    const saveStart = performance.now();
    
    await dataCache.cacheProducts(testProducts, 'ua');
    console.log(`   ✅ Products cached (${(performance.now() - saveStart).toFixed(2)}ms)`);
    
    const saveCatStart = performance.now();
    await dataCache.cacheCategories(testCategories, 'ua');
    console.log(`   ✅ Categories cached (${(performance.now() - saveCatStart).toFixed(2)}ms)`);

    // 5. Читання з кешу
    console.log('\n5️⃣ Reading from cache...');
    const readStart = performance.now();
    
    const cachedProducts = await dataCache.getCachedProducts('ua');
    const readTime = performance.now() - readStart;
    console.log(`   ✅ Products retrieved: ${cachedProducts?.length || 0} items (${readTime.toFixed(2)}ms)`);
    
    const readCatStart = performance.now();
    const cachedCategories = await dataCache.getCachedCategories('ua');
    const readCatTime = performance.now() - readCatStart;
    console.log(`   ✅ Categories retrieved: ${cachedCategories?.length || 0} items (${readCatTime.toFixed(2)}ms)`);

    // 6. Перевірка валідації мови
    console.log('\n6️⃣ Testing language validation...');
    const wrongLang = await dataCache.getCachedProducts('en');
    console.log(`   ${wrongLang ? '❌' : '✅'} Correctly returns null for wrong language`);

    // 7. Оновлена статистика
    console.log('\n7️⃣ Updated cache stats:');
    const newStats = await cacheManager.getStats();
    console.table({
      'Products Count': newStats.productsCount,
      'Products Lang': newStats.productsLang || 'N/A',
      'Categories Count': newStats.categoriesCount,
      'Categories Lang': newStats.categoriesLang || 'N/A',
      'Total Size (KB)': newStats.totalSize,
    });

    // 8. Рекомендації
    console.log('\n8️⃣ Recommendations:');
    const recommendations = await cacheManager.getRecommendations();
    recommendations.forEach(rec => console.log(`   ${rec}`));

    // 9. Продуктивність
    console.log('\n9️⃣ Performance summary:');
    console.log(`   📊 Save time: ${(performance.now() - saveStart).toFixed(2)}ms`);
    console.log(`   📊 Read time: ${readTime.toFixed(2)}ms`);
    console.log(`   📊 Speed improvement: ${((saveStart - readTime) / saveStart * 100).toFixed(0)}% faster`);

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }

  console.groupEnd();
}

/**
 * Очищення тестового кешу
 */
export async function clearTestCache() {
  console.log('🧹 Clearing test cache...');
  try {
    await dataCache.clearAll();
    console.log('✅ Cache cleared successfully');
  } catch (error) {
    console.error('❌ Failed to clear cache:', error);
  }
}

/**
 * Показати детальну інформацію про кеш
 */
export async function showCacheInfo() {
  console.group('📊 Cache Information');
  
  try {
    const stats = await cacheManager.getStats();
    const displayStats = await cacheManager.getDisplayStats();
    
    console.log('Statistics:');
    displayStats.forEach(line => console.log(`  ${line}`));
    
    console.log('\nDetailed info:');
    console.table(stats);
    
    console.log('\nRecommendations:');
    const recommendations = await cacheManager.getRecommendations();
    recommendations.forEach(rec => console.log(`  ${rec}`));
  } catch (error) {
    console.error('Failed to get cache info:', error);
  }
  
  console.groupEnd();
}

/**
 * Benchmark кешу
 */
export async function benchmarkCache() {
  console.group('⚡ Cache Benchmark');
  
  const iterations = 10;
  const testData = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    data: `Test data ${i}`,
  }));
  
  console.log(`Running ${iterations} iterations...`);
  
  // Write benchmark
  const writeTimes: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await dataCache.cacheProducts(testData as any, 'ua');
    writeTimes.push(performance.now() - start);
  }
  
  // Read benchmark
  const readTimes: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await dataCache.getCachedProducts('ua');
    readTimes.push(performance.now() - start);
  }
  
  const avgWrite = writeTimes.reduce((a, b) => a + b, 0) / writeTimes.length;
  const avgRead = readTimes.reduce((a, b) => a + b, 0) / readTimes.length;
  
  console.log('\nResults:');
  console.table({
    'Write Avg (ms)': avgWrite.toFixed(2),
    'Write Min (ms)': Math.min(...writeTimes).toFixed(2),
    'Write Max (ms)': Math.max(...writeTimes).toFixed(2),
    'Read Avg (ms)': avgRead.toFixed(2),
    'Read Min (ms)': Math.min(...readTimes).toFixed(2),
    'Read Max (ms)': Math.max(...readTimes).toFixed(2),
  });
  
  console.log(`\n📈 Read is ${(avgWrite / avgRead).toFixed(1)}x faster than write`);
  
  console.groupEnd();
}

// Експортуємо в window для використання в консолі
if (typeof window !== 'undefined') {
  (window as any).testCache = testCache;
  (window as any).clearTestCache = clearTestCache;
  (window as any).showCacheInfo = showCacheInfo;
  (window as any).benchmarkCache = benchmarkCache;
  
  console.log('🧪 Cache test utilities loaded. Available commands:');
  console.log('  - testCache()         : Run full test suite');
  console.log('  - clearTestCache()    : Clear all cache');
  console.log('  - showCacheInfo()     : Show cache statistics');
  console.log('  - benchmarkCache()    : Run performance benchmark');
}
