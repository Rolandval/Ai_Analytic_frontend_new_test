# Інструкція з інтеграції генерації категорій

## Кроки для додавання генерації категорій до Generation.tsx:

### 1. Додати імпорти
```typescript
import { useCategoryGeneration } from './useCategoryGeneration';
import { CATEGORY_COLUMNS, type CategoryColumnName } from './categoryGeneration';
```

### 2. Додати хук в компонент (після рядка ~150)
```typescript
// Хук для генерації категорій
const categoryGeneration = useCategoryGeneration(
  categoryDescriptions,
  setCategoryDescriptions,
  templatesState?.prompts || {},
  selectedLang,
  selectedChatModel || 'GPT-4o-mini',
  getCategoryRowKey
);
```

### 3. Додати функції для категорій (після рядка ~1425)
```typescript
// Генерація для вибраних клітинок категорій
const handleGenerateSelectedCategories = async () => {
  if (!templatesState) {
    console.warn('[GenerateSelectedCategories] Шаблони ще не готові');
    return;
  }
  
  await categoryGeneration.handleGenerateSelectedCategories(
    categorySelectedCells,
    onCategoryCellCheckedChange,
    () => {
      setCategorySelectedCells({});
      setCategoryRowCheckedRows({});
      setCategoryColumnHeaderChecked({});
    }
  );
};

// Масова генерація категорій
const handleMassGenerateCategories = async () => {
  if (!templatesState) {
    console.warn('[MassGenerateCategories] Шаблони ще не готові');
    return;
  }
  
  await categoryGeneration.handleMassGenerateCategories(
    (key: string, selected: boolean) => {
      setCategorySelectedCells(prev => ({ ...prev, [key]: selected }));
    }
  );
};
```

### 4. Оновити кнопки в UI для категорій

Знайти секцію з кнопками для категорій (приблизно рядок 2400+) і додати:

```typescript
{/* Кнопки для генерації категорій */}
{activeTab === 'categories' && !isTranslateMode && (
  <>
    <Button
      className="bg-purple-600 hover:bg-purple-700 text-white"
      onClick={handleMassGenerateCategories}
      disabled={categoryGeneration.categoryMassGenerating || !templatesState}
    >
      {categoryGeneration.categoryMassGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {categoryGeneration.categoryMassGenerating ? `Генерую... ${categoryGeneration.categoryMassProgress}` : 'Заповнити всі порожні'}
    </Button>
    
    <Button
      onClick={handleGenerateSelectedCategories}
      disabled={categoryGeneration.categorySelectedGenerating || !templatesState}
      className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4"
    >
      {categoryGeneration.categorySelectedGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {categoryGeneration.categorySelectedGenerating ? `Генерую... ${categoryGeneration.categorySelectedProgress}` : 'Заповнити вибрані'}
    </Button>
  </>
)}
```

### 5. Оновити таблицю категорій

У таблиці категорій (приблизно рядок 2600+) замінити статичні клітинки на інтерактивні з підтримкою генерації:

```typescript
{/* Колонка Опис */}
<TableCell style={{ width: '280px', minWidth: '280px' }}>
  <div className="relative">
    <Textarea
      value={c.description || ''}
      onChange={(e) => {
        const newValue = e.target.value;
        setCategoryDescriptions(prev => prev.map(cat => 
          cat.category_id === c.category_id && cat.lang_code === c.lang_code 
            ? { ...cat, description: newValue }
            : cat
        ));
      }}
      className="w-full min-h-[60px] text-sm resize-none"
      placeholder="Опис категорії..."
    />
    {categoryGeneration.categoryCellGenerating[`${rowKey}:description`] && (
      <div className="absolute inset-0 bg-blue-50/80 dark:bg-blue-900/20 flex items-center justify-center rounded">
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        <span className="ml-2 text-xs text-blue-600">генерую…</span>
      </div>
    )}
  </div>
</TableCell>

{/* Колонка Мета ключові слова */}
<TableCell style={{ width: '220px', minWidth: '220px' }}>
  <div className="relative">
    <Textarea
      value={c.meta_keywords || ''}
      onChange={(e) => {
        const newValue = e.target.value;
        setCategoryDescriptions(prev => prev.map(cat => 
          cat.category_id === c.category_id && cat.lang_code === c.lang_code 
            ? { ...cat, meta_keywords: newValue }
            : cat
        ));
      }}
      className="w-full min-h-[60px] text-sm resize-none"
      placeholder="Ключові слова..."
    />
    {categoryGeneration.categoryCellGenerating[`${rowKey}:meta_keywords`] && (
      <div className="absolute inset-0 bg-blue-50/80 dark:bg-blue-900/20 flex items-center justify-center rounded">
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        <span className="ml-2 text-xs text-blue-600">генерую…</span>
      </div>
    )}
  </div>
</TableCell>

{/* Колонка Заголовок сторінки */}
<TableCell style={{ width: '240px', minWidth: '240px' }}>
  <div className="relative">
    <Textarea
      value={c.page_title || ''}
      onChange={(e) => {
        const newValue = e.target.value;
        setCategoryDescriptions(prev => prev.map(cat => 
          cat.category_id === c.category_id && cat.lang_code === c.lang_code 
            ? { ...cat, page_title: newValue }
            : cat
        ));
      }}
      className="w-full min-h-[60px] text-sm resize-none"
      placeholder="Заголовок сторінки..."
    />
    {categoryGeneration.categoryCellGenerating[`${rowKey}:page_title`] && (
      <div className="absolute inset-0 bg-blue-50/80 dark:bg-blue-900/20 flex items-center justify-center rounded">
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        <span className="ml-2 text-xs text-blue-600">генерую…</span>
      </div>
    )}
  </div>
</TableCell>
```

### 6. Додати чекбокси для вибору клітинок категорій

У заголовках колонок категорій додати чекбокси:

```typescript
{/* Заголовок колонки Опис */}
<TableHead style={{ width: '280px', minWidth: '280px' }}>
  <div className="flex items-center gap-2">
    {!isTranslateMode && (
      <Checkbox
        checked={getCategoryColumnCheckedState('description')}
        onCheckedChange={(checked) => onCategoryColumnCheckedChange('description', checked)}
      />
    )}
    <span>Опис</span>
  </div>
</TableHead>
```

### 7. Додати чекбокси в клітинки категорій

У кожну клітинку категорії додати чекбокс:

```typescript
{!isTranslateMode && (
  <Checkbox
    className="absolute top-1 right-1 z-10"
    checked={isCategoryCellChecked(rowKey, 'description')}
    onCheckedChange={(checked) => onCategoryCellCheckedChange(rowKey, 'description', checked)}
    onClick={(e) => e.stopPropagation()}
  />
)}
```

## Результат

Після цих змін у вас буде:
- ✅ Повна підтримка генерації для категорій
- ✅ Масова генерація всіх порожніх полів категорій  
- ✅ Генерація вибраних клітинок категорій
- ✅ Візуальні індикатори завантаження
- ✅ Правильний мапінг ключів між категоріями та API генерації
- ✅ Інтеграція з існуючою системою промптів

Структура відповіді категорій автоматично мапиться на правильні ключі API генерації:
- `description` → `site_short_description`
- `meta_keywords` → `site_meta_keywords`  
- `page_title` → `site_page_title`
- `category` → `site_product`
