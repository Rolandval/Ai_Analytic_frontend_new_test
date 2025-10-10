# 🔧 Виправлення: 16 товарів замість 50 у кеші

## Проблема

В кеші зберігалося 50 товарів, але в таблиці показувалося тільки 16. 

## Причина

Проблема була в порядку операцій:

### ❌ Старий алгоритм (неправильний):
```
1. Отримати ВСІ товари з API (150 товарів різних мов)
2. Зберегти перші 50 в кеш (змішані мови: ua, en, ru)
3. При показі - фільтрувати по мові
4. Результат: 50 товарів → фільтр → 16 товарів для 'ua'
```

**Приклад:**
```javascript
// З API прийшло 150 товарів:
// - 50 товарів 'ua'
// - 50 товарів 'en'  
// - 50 товарів 'ru'

// Зберегли перші 50 (змішані):
// - 16 товарів 'ua'  ← тільки стільки потрапило в перші 50!
// - 20 товарів 'en'
// - 14 товарів 'ru'

// При показі фільтруємо по 'ua':
// Результат: 16 товарів ❌
```

## Рішення

Змінено порядок операцій - спочатку фільтруємо, потім кешуємо:

### ✅ Новий алгоритм (правильний):
```
1. Отримати ВСІ товари з API (150 товарів різних мов)
2. Відфільтрувати по поточній мові (50 товарів 'ua')
3. Зберегти перші 50 відфільтрованих в кеш
4. При показі - всі 50 товарів вже потрібної мови
```

**Приклад:**
```javascript
// З API прийшло 150 товарів:
// - 50 товарів 'ua'
// - 50 товарів 'en'  
// - 50 товарів 'ru'

// Фільтруємо по 'ua':
// - 50 товарів 'ua' ✅

// Зберегли перші 50:
// - 50 товарів 'ua' ✅

// При показі:
// Результат: 50 товарів ✅
```

## Код змін

### Для товарів:

#### До:
```typescript
const serverItems = response.items;

// Зберігаємо у кеш (перші 50 товарів)
await dataCache.cacheProducts(serverItems, selectedLang);
```

#### Після:
```typescript
const serverItems = response.items;

// Фільтруємо товари по мові перед збереженням в кеш
const itemsForCurrentLang = serverItems.filter((item: any) => {
  const lang = (item.site_lang_code || '').toLowerCase();
  return selectedLang === 'ua' 
    ? (lang === 'ua' || lang === 'uk')
    : lang === selectedLang;
});

console.log(`Total items: ${serverItems.length}, for lang '${selectedLang}': ${itemsForCurrentLang.length}`);

// Зберігаємо у кеш (перші 50 товарів для поточної мови)
await dataCache.cacheProducts(itemsForCurrentLang, selectedLang);
```

### Для категорій:

#### До:
```typescript
const itemsToCache = response.items || [];
await dataCache.cacheCategories(itemsToCache, selectedLang);
```

#### Після:
```typescript
const allItems = response.items || [];

// Фільтруємо категорії по мові перед збереженням в кеш
const itemsForCurrentLang = allItems.filter((item: any) => {
  const lang = (item.lang_code || '').toLowerCase();
  return selectedLang === 'ua' 
    ? (lang === 'ua' || lang === 'uk')
    : lang === selectedLang;
});

console.log(`Total categories: ${allItems.length}, for lang '${selectedLang}': ${itemsForCurrentLang.length}`);

// Зберігаємо у кеш (перші 50 категорій для поточної мови)
await dataCache.cacheCategories(itemsForCurrentLang, selectedLang);
```

## Переваги нового підходу

### 1. Правильна кількість у кеші
- ✅ Завжди 50 товарів для обраної мови
- ✅ Не залежить від порядку товарів в API
- ✅ Передбачувана поведінка

### 2. Ефективність
- ✅ Менше даних в кеші (тільки потрібна мова)
- ✅ Швидше читання з кешу
- ✅ Менше пам'яті

### 3. Окремий кеш для кожної мови
- ✅ Кеш для 'ua' містить 50 товарів 'ua'
- ✅ Кеш для 'en' містить 50 товарів 'en'
- ✅ Кеш для 'ru' містить 50 товарів 'ru'

## Логування

Тепер в консолі ви побачите:

### При збереженні в кеш:
```
[Generation] Total items from API: 150, items for lang 'ua': 50
[DataCache] cacheProducts called with 50 items, lang: ua
[DataCache] Caching 50 items (first 50 from 50)
[Generation] Successfully cached 50 products for lang 'ua'
```

### При читанні з кешу:
```
[DataCache] getCachedProducts returned 50 items for lang: ua
[Generation] ✅ Cache hit! Showing 50 cached products
```

## Тестування

### Тест 1: Перевірка кількості
1. Очистіть кеш: `indexedDB.deleteDatabase('AiAnalyticCache')`
2. Оновіть сторінку
3. Перевірте консоль:
   ```
   [Generation] Total items from API: ???, items for lang 'ua': ???
   [Generation] Successfully cached ??? products for lang 'ua'
   ```
4. **Очікуваний результат:** Має бути 50 (або скільки є в базі для цієї мови)

### Тест 2: Перевірка IndexedDB
1. DevTools → Application → IndexedDB → AiAnalyticCache
2. products → latest → data
3. **Очікуваний результат:** Масив з 50 елементів, всі з `site_lang_code: 'ua'`

### Тест 3: Перевірка таблиці
1. Оновіть сторінку (дані з кешу)
2. Подивіться скільки товарів в таблиці
3. **Очікуваний результат:** 50 товарів (або скільки є в базі)

### Тест 4: Зміна мови
1. Змініть мову з 'ua' на 'en'
2. Перевірте консоль
3. **Очікуваний результат:** 
   ```
   [Generation] Total items from API: ???, items for lang 'en': ???
   [Generation] Successfully cached ??? products for lang 'en'
   ```

## Порівняння

### До виправлення:
```
┌─────────────────────────────────────────┐
│ API: 150 товарів (ua+en+ru)            │
│   ↓                                     │
│ Кеш: 50 товарів (16 ua + 20 en + 14 ru)│
│   ↓                                     │
│ Фільтр по 'ua'                          │
│   ↓                                     │
│ Таблиця: 16 товарів ❌                  │
└─────────────────────────────────────────┘
```

### Після виправлення:
```
┌─────────────────────────────────────────┐
│ API: 150 товарів (ua+en+ru)            │
│   ↓                                     │
│ Фільтр по 'ua'                          │
│   ↓                                     │
│ 50 товарів 'ua'                         │
│   ↓                                     │
│ Кеш: 50 товарів (всі ua)               │
│   ↓                                     │
│ Таблиця: 50 товарів ✅                  │
└─────────────────────────────────────────┘
```

## Важливо

### Очистіть старий кеш!
Після оновлення коду обов'язково очистіть старий кеш:

```javascript
// В консолі браузера:
indexedDB.deleteDatabase('AiAnalyticCache');
location.reload();
```

Інакше в кеші залишаться старі дані (змішані мови).

## Висновок

Тепер в кеші завжди зберігається **50 товарів для обраної мови**, а не змішані дані. Це забезпечує:

- ✅ Правильну кількість товарів у таблиці
- ✅ Ефективне використання кешу
- ✅ Передбачувану поведінку
- ✅ Окремий кеш для кожної мови

**Проблема вирішена!** 🎉

---

*Версія: 1.2.0*  
*Дата: 2025-10-09*  
*Статус: ✅ Виправлено*
