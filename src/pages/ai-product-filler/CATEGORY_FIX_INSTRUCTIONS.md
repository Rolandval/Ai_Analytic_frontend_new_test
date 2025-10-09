# Інструкція для виправлення генерації категорій

## Проблема
При натисканні кнопок "Заповнити вибрані" та "Масова генерація" на вкладці категорій викликаються функції для товарів, а не для категорій.

## Вже виправлено ✅
1. **Кнопка "Заповнити вибрані" (рядки ~2454-2472 та ~3537-3555)**:
   - `onClick` тепер перевіряє `activeTab === 'categories'` і викликає правильну функцію
   - `disabled` тепер використовує правильні стани для категорій
   - `title` оновлено для категорій

2. **Кнопка "Масова генерація" (рядки ~2381-2382)**:
   - `onClick` тепер викликає `handleMassGenerateCategories` для категорій
   - `disabled` тепер використовує `categoryGeneration.categoryMassGenerating`

## Потрібно виправити вручну ❌

### 1. Рядок 2384 - Loader для масової генерації:
**Замінити:**
```tsx
{massGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
```
**На:**
```tsx
{(activeTab === 'categories' ? categoryGeneration.categoryMassGenerating : massGenerating) && 
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
```

### 2. Рядок 2385 - Прогрес масової генерації:
**Замінити:**
```tsx
{t('buttons.mass_generate')}{massGenerating && massProgress ? ` (${massProgress})` : ''}
```
**На:**
```tsx
{t('buttons.mass_generate')}
{activeTab === 'categories' 
  ? (categoryGeneration.categoryMassGenerating && categoryGeneration.categoryMassProgress ? ` (${categoryGeneration.categoryMassProgress})` : '')
  : (massGenerating && massProgress ? ` (${massProgress})` : '')}
```

### 3. Рядок 2481 - Прогрес для "Заповнити вибрані":
**Замінити:**
```tsx
: `${t('buttons.generate_selected')}${selectedProgress ? ` (${selectedProgress})` : ''}`}
```
**На:**
```tsx
: `${t('buttons.generate_selected')}${
    activeTab === 'categories' 
      ? (categoryGeneration.categorySelectedProgress ? ` (${categoryGeneration.categorySelectedProgress})` : '')
      : (selectedProgress ? ` (${selectedProgress})` : '')
  }`}
```

### 4. Рядок ~3562 - Прогрес для нижньої кнопки "Заповнити вибрані":
**Замінити:**
```tsx
: `${t('buttons.generate_selected')}${selectedProgress ? ` (${selectedProgress})` : ''}`}
```
**На:**
```tsx
: `${t('buttons.generate_selected')}${
    activeTab === 'categories' 
      ? (categoryGeneration.categorySelectedProgress ? ` (${categoryGeneration.categorySelectedProgress})` : '')
      : (selectedProgress ? ` (${selectedProgress})` : '')
  }`}
```

## Перевірка
Після внесення змін:
1. Відкрийте сторінку AI Product Filler
2. Перейдіть на вкладку "Категорії"
3. Виберіть категорії для генерації
4. Натисніть "Заповнити вибрані" - має генеруватися контент для категорій
5. Натисніть "Масова генерація" - мають генеруватися всі порожні поля категорій

## Статус
- ✅ Основна логіка виправлена (onClick, disabled, title)
- ❌ Відображення прогресу потребує ручного виправлення
- ❌ Loader для масової генерації потребує виправлення
