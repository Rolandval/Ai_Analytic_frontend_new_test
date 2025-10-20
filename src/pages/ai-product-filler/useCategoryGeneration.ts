import { useState, useCallback } from 'react';
import { generateSelectedCategories, massGenerateCategories } from './categoryGeneration';
import type { SiteCategoryDescription } from '@/api/siteCategoriesDescriptions';
import type { SiteContentPrompt } from '@/api/contentPrompts';

export const useCategoryGeneration = (
  categoryDescriptions: SiteCategoryDescription[],
  setCategoryDescriptions: (updater: (prev: SiteCategoryDescription[]) => SiteCategoryDescription[]) => void,
  prompts: Record<string, SiteContentPrompt[]>,
  categoryPrompts: Record<string, SiteContentPrompt[]>,
  selectedLang: 'ua' | 'en' | 'ru',
  selectedChatModel: string,
  getCategoryRowKey: (cat: SiteCategoryDescription, index: number) => string,
  saveCategoryUnsavedField?: (cat: SiteCategoryDescription, key: keyof SiteCategoryDescription, value: any) => void
) => {
  // Стани для генерації категорій
  const [categoryMassGenerating, setCategoryMassGenerating] = useState(false);
  const [categoryMassProgress, setCategoryMassProgress] = useState<string>('');
  const [categorySelectedGenerating, setCategorySelectedGenerating] = useState(false);
  const [categorySelectedProgress, setCategorySelectedProgress] = useState<string>('');
  const [categoryCellGenerating, setCategoryCellGenerating] = useState<Record<string, boolean>>({});
  const [categoryGeneratedRows, setCategoryGeneratedRows] = useState<Record<string, boolean>>({});

  // Callback для оновлення категорії
  const handleCategoryUpdate = useCallback((updatedCategory: SiteCategoryDescription) => {
    console.log('[handleCategoryUpdate] Updating category:', {
      category_id: updatedCategory.category_id,
      lang_code: updatedCategory.lang_code,
      updatedFields: updatedCategory
    });
    
    // Зберігаємо зміни в localStorage
    if (saveCategoryUnsavedField) {
      const fields: Array<keyof SiteCategoryDescription> = ['category', 'description', 'meta_keywords', 'page_title'];
      fields.forEach((field) => {
        if (updatedCategory[field] !== undefined) {
          console.log('[handleCategoryUpdate] Saving to localStorage:', field, updatedCategory[field]);
          saveCategoryUnsavedField(updatedCategory, field, updatedCategory[field]);
        }
      });
    }
    
    setCategoryDescriptions(prev => {
      const index = prev.findIndex(cat => 
        cat.category_id === updatedCategory.category_id && 
        cat.lang_code === updatedCategory.lang_code
      );
      if (index === -1) {
        console.warn('[handleCategoryUpdate] Category not found!');
        return prev;
      }
      
      const currentCategory = prev[index];
      console.log('[handleCategoryUpdate] Current category:', currentCategory);
      
      const next = [...prev];
      // Мерджимо поля замість повної заміни, щоб не втратити інші згенеровані поля
      next[index] = { ...currentCategory, ...updatedCategory };
      
      console.log('[handleCategoryUpdate] Merged category:', next[index]);
      return next;
    });
  }, [setCategoryDescriptions, saveCategoryUnsavedField]);

  // Callback для зміни стану генерації клітинки
  const handleCellGeneratingChange = useCallback((key: string, generating: boolean) => {
    setCategoryCellGenerating(prev => {
      if (generating) {
        return { ...prev, [key]: true };
      } else {
        const next = { ...prev };
        delete next[key];
        return next;
      }
    });
  }, []);

  // Callback для позначення рядка як згенерованого
  const handleRowGenerated = useCallback((category: SiteCategoryDescription) => {
    const key = `cat_${category.category_id}_${category.lang_code}`;
    setCategoryGeneratedRows(prev => ({ ...prev, [key]: true }));
  }, []);

  // Генерація для вибраних клітинок категорій
  const handleGenerateSelectedCategories = useCallback(async (
    selectedCells: Record<string, boolean>,
    onCellSelectionChange: (key: string, selected: boolean) => void,
    onClearSelection: () => void
  ) => {
    setCategorySelectedGenerating(true);
    setCategorySelectedProgress('');
    
    try {
      await generateSelectedCategories(
        categoryDescriptions,
        selectedCells,
        prompts,
        categoryPrompts,
        selectedLang,
        selectedChatModel,
        getCategoryRowKey,
        setCategorySelectedProgress,
        handleCellGeneratingChange,
        handleCategoryUpdate,
        onCellSelectionChange,
        handleRowGenerated
      );
      
      // Очищаємо вибір після генерації
      onClearSelection();
    } finally {
      setCategorySelectedGenerating(false);
    }
  }, [
    categoryDescriptions,
    prompts,
    categoryPrompts,
    selectedLang,
    selectedChatModel,
    getCategoryRowKey,
    handleCellGeneratingChange,
    handleCategoryUpdate,
    handleRowGenerated
  ]);

  // Масова генерація категорій
  const handleMassGenerateCategories = useCallback(async (
    onCellSelectionChange: (key: string, selected: boolean) => void
  ) => {
    setCategoryMassGenerating(true);
    setCategoryMassProgress('');
    
    try {
      await massGenerateCategories(
        categoryDescriptions,
        prompts,
        categoryPrompts,
        selectedLang,
        selectedChatModel,
        getCategoryRowKey,
        setCategoryMassProgress,
        handleCellGeneratingChange,
        handleCategoryUpdate,
        onCellSelectionChange,
        handleRowGenerated
      );
    } finally {
      setCategoryMassGenerating(false);
    }
  }, [
    categoryDescriptions,
    prompts,
    categoryPrompts,
    selectedLang,
    selectedChatModel,
    getCategoryRowKey,
    handleCellGeneratingChange,
    handleCategoryUpdate,
    handleRowGenerated
  ]);

  return {
    // Стани
    categoryMassGenerating,
    categoryMassProgress,
    categorySelectedGenerating,
    categorySelectedProgress,
    categoryCellGenerating,
    categoryGeneratedRows,
    
    // Функції
    handleGenerateSelectedCategories,
    handleMassGenerateCategories,
    handleCategoryUpdate,
    handleRowGenerated
  };
};
