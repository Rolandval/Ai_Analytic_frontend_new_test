# Оновлення відображення прогресу масової генерації

## Потрібні зміни в Generation.tsx

### Рядок 2384-2385 - оновити відображення loader та прогресу:

**Замінити:**
```tsx
{massGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
{t('buttons.mass_generate')}{massGenerating && massProgress ? ` (${massProgress})` : ''}
```

**На:**
```tsx
{(activeTab === 'categories' ? categoryGeneration.categoryMassGenerating : massGenerating) && 
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
{t('buttons.mass_generate')}
{activeTab === 'categories' 
  ? (categoryGeneration.categoryMassGenerating && categoryGeneration.categoryMassProgress ? ` (${categoryGeneration.categoryMassProgress})` : '')
  : (massGenerating && massProgress ? ` (${massProgress})` : '')}
```

### Рядок 2481 - оновити відображення прогресу для кнопки "Заповнити вибрані":

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

### Аналогічно оновити нижню кнопку на рядку ~3562:

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

## Результат
Після цих змін:
- Кнопка "Масова генерація" буде показувати правильний прогрес для категорій
- Кнопка "Заповнити вибрані" буде показувати правильний прогрес для категорій
- Loader буде відображатися правильно для обох режимів
