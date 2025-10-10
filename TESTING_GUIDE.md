# 🧪 Інструкція з тестування системи кешування

## Швидкий старт

### 1. Базове тестування (через UI)

#### Крок 1: Перший візит
1. Відкрийте браузер (Chrome/Firefox/Edge)
2. Натисніть `F12` для відкриття DevTools
3. Перейдіть на вкладку **Network**
4. Відкрийте сторінку генерації товарів
5. **Очікуваний результат:**
   - ⏳ Показується лоадер
   - 🌐 У Network з'являється запит до API
   - ✅ Дані відображаються в таблиці
   - 💾 Немає індикатора "📦 Кеш"

#### Крок 2: Перевірка IndexedDB
1. У DevTools перейдіть на вкладку **Application**
2. Розгорніть **IndexedDB** → **AiAnalyticCache**
3. **Очікуваний результат:**
   - ✅ База даних створена
   - ✅ Є сховища `products` та `categories`
   - ✅ У `products` є запис з 50 товарами

#### Крок 3: Повторний візит
1. Оновіть сторінку (`F5` або `Ctrl+R`)
2. **Очікуваний результат:**
   - ⚡ Дані з'являються **миттєво** (без лоадера)
   - 📦 З'являється індикатор "📦 Кеш"
   - 🔄 Через ~100ms у Network з'являється фоновий запит
   - ✅ Після завантаження індикатор зникає

#### Крок 4: Тест зміни мови
1. Змініть мову з `ua` на `en`
2. **Очікуваний результат:**
   - ⏳ Показується лоадер (кешу для `en` ще немає)
   - 🌐 Запит до API
   - ✅ Дані завантажуються
3. Поверніться на `ua`
4. **Очікуваний результат:**
   - ⚡ Миттєве завантаження з кешу
   - 📦 Індикатор "📦 Кеш"

#### Крок 5: Тест категорій
1. Перейдіть на вкладку **Категорії**
2. Повторіть кроки 1-3 для категорій
3. **Очікуваний результат:**
   - Працює так само як для товарів
   - Окремий кеш для категорій

---

## 2. Тестування через консоль

### Підготовка
1. Відкрийте DevTools (`F12`)
2. Перейдіть на вкладку **Console**
3. Переконайтеся, що з'явилося повідомлення:
   ```
   🧪 Cache test utilities loaded. Available commands:
   ```

### Доступні команди

#### `testCache()`
Запускає повний набір тестів:
```javascript
testCache()
```

**Що перевіряється:**
- ✅ Доступність IndexedDB
- ✅ Збереження даних
- ✅ Читання даних
- ✅ Валідація мови
- ✅ Статистика кешу
- ✅ Продуктивність

**Очікуваний вивід:**
```
🧪 Cache Test Suite
1️⃣ Checking IndexedDB availability...
   ✅ IndexedDB available: true
2️⃣ Current cache stats:
   [таблиця зі статистикою]
...
✅ All tests passed!
```

#### `showCacheInfo()`
Показує детальну інформацію про кеш:
```javascript
showCacheInfo()
```

**Очікуваний вивід:**
```
📊 Cache Information
Statistics:
  📦 Товари: 50 записів (UA)
  📦 Категорії: 50 записів (UA)
  💾 Розмір: ~250 KB
```

#### `benchmarkCache()`
Запускає тест продуктивності:
```javascript
benchmarkCache()
```

**Очікуваний вивід:**
```
⚡ Cache Benchmark
Running 10 iterations...
Results:
  Write Avg (ms): 15.23
  Read Avg (ms): 2.45
📈 Read is 6.2x faster than write
```

#### `clearTestCache()`
Очищає весь кеш:
```javascript
clearTestCache()
```

**Очікуваний вивід:**
```
🧹 Clearing test cache...
✅ Cache cleared successfully
```

---

## 3. Ручне тестування IndexedDB

### Перегляд даних
1. DevTools → **Application** → **IndexedDB** → **AiAnalyticCache**
2. Клікніть на `products` або `categories`
3. Побачите збережені дані

### Видалення бази даних
В консолі:
```javascript
indexedDB.deleteDatabase('AiAnalyticCache')
```

### Перевірка розміру
В консолі:
```javascript
navigator.storage.estimate().then(estimate => {
  console.log('Used:', (estimate.usage / 1024 / 1024).toFixed(2), 'MB');
  console.log('Quota:', (estimate.quota / 1024 / 1024).toFixed(2), 'MB');
});
```

---

## 4. Тестування продуктивності

### Вимірювання часу завантаження

#### Без кешу:
1. Очистіть кеш: `clearTestCache()`
2. Оновіть сторінку
3. У Network подивіться час запиту до API
4. **Очікуваний час:** 300-800ms

#### З кешем:
1. Оновіть сторінку вдруге
2. Подивіться час появи даних
3. **Очікуваний час:** 10-50ms

### Порівняння швидкості
```javascript
// Тест без кешу
await clearTestCache();
const start1 = performance.now();
// Оновити сторінку вручну
const time1 = performance.now() - start1;
console.log('Without cache:', time1, 'ms');

// Тест з кешем
const start2 = performance.now();
// Оновити сторінку вручну
const time2 = performance.now() - start2;
console.log('With cache:', time2, 'ms');
console.log('Speedup:', (time1 / time2).toFixed(1) + 'x');
```

---

## 5. Тестування крайніх випадків

### Тест 1: Застарілий кеш
1. Відкрийте DevTools → Application → IndexedDB
2. Знайдіть запис у `products`
3. Змініть `timestamp` на старе значення (24+ години тому)
4. Оновіть сторінку
5. **Очікуваний результат:** Кеш ігнорується, завантаження з API

### Тест 2: Пошкоджені дані
1. У IndexedDB видаліть поле `data` із запису
2. Оновіть сторінку
3. **Очікуваний результат:** Помилка в консолі, fallback на API

### Тест 3: Відсутність IndexedDB
1. У консолі:
   ```javascript
   Object.defineProperty(window, 'indexedDB', { value: undefined });
   ```
2. Оновіть сторінку
3. **Очікуваний результат:** Звичайне завантаження без кешу

### Тест 4: Повільна мережа
1. DevTools → Network → Throttling → **Slow 3G**
2. Очистіть кеш: `clearTestCache()`
3. Оновіть сторінку (перший візит)
4. **Очікуваний результат:** Повільне завантаження
5. Оновіть сторінку (другий візит)
6. **Очікуваний результат:** Миттєве завантаження з кешу

### Тест 5: Офлайн режим
1. DevTools → Network → **Offline**
2. Оновіть сторінку
3. **Очікуваний результат:** Дані з кешу відображаються
4. Фоновий запит не виконується (немає мережі)

---

## 6. Автоматизоване тестування

### Створення тестового сценарію

```javascript
async function runFullTest() {
  console.log('🚀 Starting full cache test...\n');
  
  // 1. Очистити кеш
  console.log('Step 1: Clear cache');
  await clearTestCache();
  
  // 2. Запустити тести
  console.log('\nStep 2: Run tests');
  await testCache();
  
  // 3. Benchmark
  console.log('\nStep 3: Benchmark');
  await benchmarkCache();
  
  // 4. Показати інфо
  console.log('\nStep 4: Show info');
  await showCacheInfo();
  
  console.log('\n✅ Full test completed!');
}

// Запустити
runFullTest();
```

---

## 7. Перевірка логування

### Очікувані логи при першому візиті:
```
[DataCache] IndexedDB opened successfully
[Generation] Checking cache for products...
[Generation] ❌ Cache miss. Fetching from API...
[Generation] fetchContentDescriptions request: {...}
[Generation] fetchContentDescriptions response: {...}
[Generation] Cached first 50 products
```

### Очікувані логи при повторному візиті:
```
[DataCache] IndexedDB opened successfully
[Generation] Checking cache for products...
[Generation] ✅ Cache hit! Showing 50 cached products
[Generation] Starting background refresh for products...
[Generation] fetchContentDescriptions response: {...}
[Generation] Cached first 50 products
```

---

## 8. Чеклист тестування

### Базові функції
- [ ] Кеш створюється при першому візиті
- [ ] Кеш відображається при повторному візиті
- [ ] Індикатор "📦 Кеш" з'являється і зникає
- [ ] Фонове оновлення працює
- [ ] Окремий кеш для кожної мови
- [ ] Окремий кеш для товарів і категорій

### Продуктивність
- [ ] Завантаження з кешу < 50ms
- [ ] Завантаження з API > 300ms
- [ ] Прискорення мінімум 5x

### Валідація
- [ ] Застарілий кеш (>24 год) ігнорується
- [ ] Неправильна мова ігнорується
- [ ] Пошкоджені дані обробляються

### Помилки
- [ ] Помилки IndexedDB не ламають додаток
- [ ] Fallback на API працює
- [ ] Помилки логуються в консоль

### UI/UX
- [ ] Індикатор кешу видимий
- [ ] Tooltip інформативний
- [ ] Плавне оновлення таблиці
- [ ] Немає мерехтіння

---

## 9. Відомі проблеми та рішення

### Проблема: Кеш не працює в приватному режимі
**Рішення:** IndexedDB може бути заблокований у приватному режимі. Це нормально, система автоматично використовує fallback.

### Проблема: Кеш не очищається
**Рішення:** 
```javascript
// Примусове очищення
indexedDB.deleteDatabase('AiAnalyticCache');
location.reload();
```

### Проблема: Дані не оновлюються
**Рішення:** Натисніть кнопку "Оновити" вручну або очистіть кеш.

### Проблема: Помилка "QuotaExceededError"
**Рішення:** Браузер досяг ліміту сховища. Очистіть кеш або збільште квоту.

---

## 10. Метрики успіху

### Мінімальні вимоги
- ✅ Кеш працює у 95%+ випадків
- ✅ Прискорення мінімум 5x
- ✅ Немає помилок у консолі
- ✅ Fallback працює при помилках

### Оптимальні показники
- 🎯 Завантаження з кешу < 30ms
- 🎯 Прискорення 10x+
- 🎯 Кеш hit rate > 80%
- 🎯 Розмір кешу < 1MB

---

## Підтримка

При виникненні проблем:
1. Перевірте консоль на помилки
2. Запустіть `testCache()` для діагностики
3. Перевірте IndexedDB в DevTools
4. Очистіть кеш і спробуйте знову
5. Перевірте версію браузера (потрібна підтримка IndexedDB)

---

**Успішного тестування! 🚀**
