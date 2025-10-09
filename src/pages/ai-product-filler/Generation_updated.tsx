// Тимчасовий файл для додавання хука
  const resizingRef = useRef<{ col: SiteColumnName; startX: number; startWidth: number } | null>(null);
  
  // Хук для генерації категорій
  const categoryGeneration = useCategoryGeneration(
    categoryDescriptions,
    setCategoryDescriptions,
    templatesState?.prompts || {},
    selectedLang,
    selectedChatModel || 'GPT-4o-mini',
    getCategoryRowKey
  );
  
  // Промпти керуються на сторінці Templates; тут використовуємо активний з бекенду
