# 🔍 Діагностика проблеми з кешуванням

## Проблема
Замість очікуваних 50 товарів у кеші зберігається лише 16.

## Додане детальне логування

Для діагностики проблеми додано детальне логування в наступні файли:

### 1. `src/utils/dataCache.ts`
```typescript
// При збереженні товарів:
console.log(`[DataCache] cacheProducts called with ${products?.length ?? 0} items, lang: ${lang}`);
console.log(`[DataCache] Caching ${toCache.length} items (first 50 from ${products?.length ?? 0})`);

// При отриманні товарів:
console.log(`[DataCache] getCachedProducts returned ${result?.length ?? 0} items for lang: ${lang}`);
```

### 2. `src/pages/ai-product-filler/Generation.tsx`
```typescript
// При збереженні:
console.log(`[Generation] Attempting to cache products. Total items from API: ${serverItems?.length ?? 0}`);
console.log(`[Generation] Successfully cached first ${Math.min(50, serverItems?.length ?? 0)} products`);
```

## Як діагностувати

### Крок 1: Очистити кеш
```javascript
// В консолі браузера:
indexedDB.deleteDatabase('AiAnalyticCache');
location.reload();
```

### Крок 2: Відкрити консоль
1. Натисніть F12
2. Перейдіть на вкладку Console
3. Очистіть консоль (Ctrl+L)

### Крок 3: Завантажити сторінку генерації
Відкрийте сторінку генерації товарів

### Крок 4: Перевірити логи

Шукайте в консолі наступні логи:

#### Логи при завантаженні з API:
```
[Generation] fetchContentDescriptions response: {
  itemsCount: ???,  // <-- Скільки товарів прийшло з API?
  total: ???,
  ...
}

[Generation] Attempting to cache products. Total items from API: ???  // <-- Скільки передається в кеш?

[DataCache] cacheProducts called with ??? items, lang: ua  // <-- Скільки отримано в dataCache?

[DataCache] Caching ??? items (first 50 from ???)  // <-- Скільки насправді кешується?
```

#### Логи при читанні з кешу:
```
[Generation] Checking cache for products...

[DataCache] getCachedProducts returned ??? items for lang: ua  // <-- Скільки повернулося з кешу?

[Generation] ✅ Cache hit! Showing ??? cached products  // <-- Скільки показується?
```

### Крок 5: Перевірити IndexedDB

1. DevTools (F12) → Application → IndexedDB → AiAnalyticCache
2. Розгорнути products → latest
3. Подивитися на поле `data` - скільки там елементів?

## Можливі причини проблеми

### 1. З API приходить менше 50 товарів
**Перевірка:** Подивіться на `itemsCount` в логах  
**Рішення:** Збільшити `limit` в запиті або перевірити фільтри

### 2. Дані фільтруються по мові
**Перевірка:** Подивіться на `sampleLangs` в логах  
**Рішення:** Переконатися що в базі є товари для обраної мови

### 3. Помилка при збереженні в IndexedDB
**Перевірка:** Шукайте помилки в консолі  
**Рішення:** Перевірити квоту сховища, права доступу

### 4. Дані обрізаються при читанні
**Перевірка:** Порівняйте кількість при збереженні та при читанні  
**Рішення:** Перевірити логіку в `getCache()`

## Приклад очікуваних логів

### При першому завантаженні (збереження):
```
[Generation] fetchContentDescriptions request: {category_ids: [], page: 1, limit: 9999}
[Generation] fetchContentDescriptions response: {itemsCount: 150, total: 150, page: 1, limit: 9999}
[Generation] Attempting to cache products. Total items from API: 150
[DataCache] cacheProducts called with 150 items, lang: ua
[DataCache] Caching 50 items (first 50 from 150)
[DataCache] Saved 50 items to products (lang: ua)
[Generation] Successfully cached first 50 products
```

### При повторному завантаженні (читання):
```
[Generation] Checking cache for products...
[DataCache] getCachedProducts returned 50 items for lang: ua
[Generation] ✅ Cache hit! Showing 50 cached products
[Generation] Starting background refresh for products...
```

## Команди для швидкої діагностики

```javascript
// 1. Перевірити скільки в кеші зараз
const cached = await dataCache.getCachedProducts('ua');
console.log('Cached products:', cached?.length);

// 2. Перевірити IndexedDB напряму
const db = await new Promise((resolve, reject) => {
  const request = indexedDB.open('AiAnalyticCache', 1);
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});
const tx = db.transaction(['products'], 'readonly');
const store = tx.objectStore('products');
const request = store.get('latest');
request.onsuccess = () => {
  console.log('IndexedDB data:', request.result);
  console.log('Items count:', request.result?.data?.length);
};

// 3. Запустити тест
testCache();
```

## Що робити після діагностики

1. **Збережіть логи з консолі** (скопіюйте весь вивід)
2. **Зробіть скріншот IndexedDB** (Application → IndexedDB → AiAnalyticCache)
3. **Запишіть кількість товарів** на кожному етапі:
   - З API: ___
   - Передано в dataCache: ___
   - Збережено в IndexedDB: ___
   - Прочитано з кешу: ___

## Тимчасове рішення

Якщо проблема не вирішується, можна збільшити кількість кешованих товарів:

```typescript
// В src/utils/dataCache.ts змінити:
const toCache = products.slice(0, 100); // Замість 50
```

Або зменшити, якщо проблема в обмеженні:

```typescript
const toCache = products.slice(0, 20); // Для тестування
```

---

**Після виконання діагностики надайте логи для подальшого аналізу.**
