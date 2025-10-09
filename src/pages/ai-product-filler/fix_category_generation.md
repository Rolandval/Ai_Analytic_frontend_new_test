# Виправлення для генерації категорій

## Проблема
При натисканні кнопки "Заповнити вибрані" на вкладці категорій викликається функція для генерації товарів (`handleGenerateSelected`), а не для категорій (`handleGenerateSelectedCategories`).

## Рішення
Потрібно змінити обробник `onClick` кнопки "Заповнити вибрані" так, щоб він перевіряв активну вкладку.

## Зміни в файлі Generation.tsx

### 1. Знайдіть кнопку на рядку 2453-2465:
```tsx
<Button
  onClick={isTranslateMode ? handleTranslateSelected : handleGenerateSelected}
  disabled={isTranslateMode ? translating : (selectedGenerating || !templatesState)}
  title={isTranslateMode ? 'Перекласти вибрані клітинки поточної сторінки' : 'Згенерувати AI-контент для вибраних клітинок поточної сторінки'}
  className={!isTranslateMode ? 'bg-red-600 hover:bg-red-700 text-white font-semibold px-4' : ''}
  variant={isTranslateMode ? 'outline' : undefined}
>
  {(!isTranslateMode && selectedGenerating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  {(isTranslateMode && translating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  {isTranslateMode
    ? `${t('buttons.translate_selected')}${translateProgress ? ` (${translateProgress})` : ''}`
    : `${t('buttons.generate_selected')}${selectedProgress ? ` (${selectedProgress})` : ''}`}
</Button>
```

### 2. Замініть на:
```tsx
<Button
  onClick={
    isTranslateMode 
      ? handleTranslateSelected 
      : (activeTab === 'categories' ? handleGenerateSelectedCategories : handleGenerateSelected)
  }
  disabled={
    isTranslateMode 
      ? translating 
      : (activeTab === 'categories' 
          ? (categoryGeneration.categorySelectedGenerating || !templatesState)
          : (selectedGenerating || !templatesState))
  }
  title={
    isTranslateMode 
      ? 'Перекласти вибрані клітинки поточної сторінки' 
      : (activeTab === 'categories' 
          ? 'Згенерувати AI-контент для вибраних категорій'
          : 'Згенерувати AI-контент для вибраних клітинок поточної сторінки')
  }
  className={!isTranslateMode ? 'bg-red-600 hover:bg-red-700 text-white font-semibold px-4' : ''}
  variant={isTranslateMode ? 'outline' : undefined}
>
  {(!isTranslateMode && (activeTab === 'categories' ? categoryGeneration.categorySelectedGenerating : selectedGenerating)) && 
    <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  {(isTranslateMode && translating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  {isTranslateMode
    ? `${t('buttons.translate_selected')}${translateProgress ? ` (${translateProgress})` : ''}`
    : `${t('buttons.generate_selected')}${
        activeTab === 'categories' 
          ? (categoryGeneration.categorySelectedProgress ? ` (${categoryGeneration.categorySelectedProgress})` : '')
          : (selectedProgress ? ` (${selectedProgress})` : '')
      }`}
</Button>
```

### 3. Також потрібно оновити кнопку "Масова генерація" на рядку 2379-2386:
```tsx
{!isTranslateMode && (
  <Button
    className="bg-purple-600 hover:bg-purple-700 text-white"
    onClick={handleMassGenerate}
    disabled={massGenerating || !templatesState}
  >
    {massGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
    {t('buttons.mass_generate')}{massGenerating && massProgress ? ` (${massProgress})` : ''}
  </Button>
)}
```

### 4. Замініть на:
```tsx
{!isTranslateMode && (
  <Button
    className="bg-purple-600 hover:bg-purple-700 text-white"
    onClick={activeTab === 'categories' ? handleMassGenerateCategories : handleMassGenerate}
    disabled={
      activeTab === 'categories' 
        ? (categoryGeneration.categoryMassGenerating || !templatesState)
        : (massGenerating || !templatesState)
    }
  >
    {(activeTab === 'categories' ? categoryGeneration.categoryMassGenerating : massGenerating) && 
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
    {t('buttons.mass_generate')}
    {activeTab === 'categories' 
      ? (categoryGeneration.categoryMassGenerating && categoryGeneration.categoryMassProgress ? ` (${categoryGeneration.categoryMassProgress})` : '')
      : (massGenerating && massProgress ? ` (${massProgress})` : '')}
  </Button>
)}
```

### 5. Аналогічно оновіть дублюючу кнопку внизу сторінки (рядок ~3520):
Знайдіть схожу кнопку внизу і застосуйте ті ж самі зміни.

## Результат
Після цих змін:
- При активній вкладці "Категорії" кнопка "Заповнити вибрані" буде викликати `handleGenerateSelectedCategories`
- При активній вкладці "Товари" кнопка буде викликати `handleGenerateSelected` як і раніше
- Кнопка "Масова генерація" також буде працювати правильно для обох вкладок
