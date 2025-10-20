# Гайд по категорійним промптам

## Проблема
Категорії не генеруються, тому що:
1. Немає категорійних промптів в базі даних
2. Користувач не вибирає клітинки для генерації

## Кроки для налаштування категорійних промптів:

### 1. Створення категорійних промптів
1. Перейдіть на сторінку **Templates** (`/ai-product-filler/templates`)
2. Переключіться на таб **Category** (замість Product)
3. Введіть промпти для полів:
   - **Meta-tag Title** (page_title)
   - **Meta-tag Description** (meta_description) 
   - **Description** (short_description)
   - **Meta-tag Keywords** (meta_keywords)
4. Натисніть кнопку **Зберегти**

### 2. Перевірка створених промптів
1. Відкрийте консоль браузера (F12)
2. Перейдіть на сторінку **Generation** (`/ai-product-filler/generation`)
3. Переключіться на таб **Categories**
4. В консолі повинні з'явитися логи:
   ```
   [Generation] Category prompts state: {...}
   [Generation] Prompts for product: {category: X, regular: Y, ...}
   ```

### 3. Генерація категорій
1. На сторінці **Generation**, таб **Categories**
2. **Виберіть клітинки** для генерації, натиснувши на чекбокси поруч з полями
3. Натисніть **"Генерувати вибрані"** або **"Масова генерація"**

## Діагностика проблем:

### Якщо категорійні промпти не створюються:
- Перевірте консоль на помилки API
- Переконайтеся, що бекенд підтримує endpoint `/content/get_site_category_prompts`
- Перевірте, чи правильно передається `is_category: true` при створенні

### Якщо генерація не працює:
- Переконайтеся, що вибрані клітинки (чекбокси)
- Перевірте консоль на логи `resolvePromptForCategoryColumn`
- Переконайтеся, що є активні промпти для потрібної мови

### Логи для діагностики:
```javascript
// В консолі браузера на сторінці Generation
console.log('Category prompts:', window.categoryPrompts);
console.log('Selected cells:', window.categorySelectedCells);
```

## Тестування API:
Запустіть тестовий скрипт `test-category-prompts.js` в консолі браузера для перевірки API.
