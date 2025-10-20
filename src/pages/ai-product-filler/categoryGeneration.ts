import { generateAiCategoryDescription } from '@/api/contentDescriptions';
import { type SiteColumnName, type SiteContentPrompt, fetchCategoryPrompts } from '@/api/contentPrompts';
import type { SiteCategoryDescription } from '@/api/siteCategoriesDescriptions';

// Колонки для категорій (відповідають полям SiteCategoryDescription)
export const CATEGORY_COLUMNS = ['category', 'description', 'meta_keywords', 'page_title'] as const;
export type CategoryColumnName = typeof CATEGORY_COLUMNS[number];

// Мапінг колонок категорій до полів об'єкта SiteCategoryDescription
export const mapCategoryColumnToField: Record<CategoryColumnName, keyof SiteCategoryDescription> = {
  category: 'category',
  description: 'description',
  meta_keywords: 'meta_keywords',
  page_title: 'page_title',
};

// Мапінг колонок категорій до ключів API генерації
export const mapCategoryColumnToApiField: Record<CategoryColumnName, string> = {
  category: 'site_product',
  description: 'site_short_description',
  meta_keywords: 'site_meta_keywords',
  page_title: 'site_page_title',
};

// Отримати промпт для колонки категорії
export const resolvePromptForCategoryColumn = (
  prompts: Record<string, SiteContentPrompt[]>,
  categoryPrompts: Record<string, SiteContentPrompt[]>,
  col: CategoryColumnName,
  selectedLang: 'ua' | 'en' | 'ru'
): string | null => {
  // Мапимо колонку категорії до колонки товару для промптів
  const productColumnMap: Record<CategoryColumnName, SiteColumnName> = {
    category: 'product',
    description: 'short_description',
    meta_keywords: 'meta_keywords',
    page_title: 'page_title',
  };
  
  const productCol = productColumnMap[col];
  
  console.log(`🔍 [resolvePromptForCategoryColumn] Resolving prompt for col: ${col} -> ${productCol}, lang: ${selectedLang}`);
  console.log('Available category prompts:', Object.keys(categoryPrompts));
  console.log('Available regular prompts:', Object.keys(prompts));
  
  const norm = (s?: string) => (s || '').toLowerCase();
  const want = norm(selectedLang);
  const isSameLang = (code?: string) => (want === 'ua' ? (norm(code) === 'ua' || norm(code) === 'uk') : norm(code) === want);
  
  // First, try to get category-specific prompts
  const categoryList = categoryPrompts[productCol] || [];
  console.log(`📋 Category prompts for ${productCol}:`, categoryList.length, categoryList.map(p => ({ id: p.id, name: p.name, is_active: p.is_active, lang_code: p.lang_code })));
  
  if (categoryList.length > 0) {
    const byLang = categoryList.filter(p => isSameLang(p.lang_code as any));
    const pool = byLang.length > 0 ? byLang : categoryList;
    
    console.log(`🎯 Filtered by language (${selectedLang}):`, pool.length, pool.map(p => ({ id: p.id, is_active: p.is_active })));
    
    const active = pool.find(p => p.is_active);
    if (active?.prompt) {
      console.log(`✅ Found active category prompt:`, active.id, active.name);
      return active.prompt;
    }
    
    if (Array.isArray(pool) && pool.length > 0) {
      const latest = [...pool].filter(x => typeof x?.prompt === 'string').sort((a, b) => (b.id ?? 0) - (a.id ?? 0))[0];
      if (latest && typeof latest.prompt === 'string') {
        console.log(`📝 Using latest category prompt:`, latest.id, latest.name);
        return latest.prompt;
      }
    }
  }
  
  // Fallback to regular product prompts if no category-specific prompts found
  console.log(`🔄 Falling back to regular prompts for ${productCol}`);
  const list = prompts[productCol] || [];
  console.log(`📋 Regular prompts for ${productCol}:`, list.length, list.map(p => ({ id: p.id, name: p.name, is_active: p.is_active, lang_code: p.lang_code })));
  
  const byLang = list.filter(p => isSameLang(p.lang_code as any));
  const pool = byLang.length > 0 ? byLang : list;
  
  console.log(`🎯 Filtered regular prompts by language (${selectedLang}):`, pool.length, pool.map(p => ({ id: p.id, is_active: p.is_active })));
  
  const active = pool.find(p => p.is_active);
  if (active?.prompt) {
    console.log(`✅ Found active regular prompt:`, active.id, active.name);
    return active.prompt;
  }
  
  if (Array.isArray(pool) && pool.length > 0) {
    const latest = [...pool].filter(x => typeof x?.prompt === 'string').sort((a, b) => (b.id ?? 0) - (a.id ?? 0))[0];
    if (latest && typeof latest.prompt === 'string') {
      console.log(`📝 Using latest regular prompt:`, latest.id, latest.name);
      return latest.prompt;
    }
  }
  
  console.log(`❌ No prompt found for ${col} -> ${productCol}, lang: ${selectedLang}`);
  return null;
};

// Генерація для вибраних клітинок категорій
export const generateSelectedCategories = async (
  categoryDescriptions: SiteCategoryDescription[],
  selectedCells: Record<string, boolean>,
  prompts: Record<string, SiteContentPrompt[]>,
  categoryPrompts: Record<string, SiteContentPrompt[]>,
  selectedLang: 'ua' | 'en' | 'ru',
  selectedChatModel: string,
  getCategoryRowKey: (cat: SiteCategoryDescription, index: number) => string,
  onProgress: (progress: string) => void,
  onCellGeneratingChange: (key: string, generating: boolean) => void,
  onCategoryUpdate: (updatedCategory: SiteCategoryDescription) => void,
  onCellSelectionChange: (key: string, selected: boolean) => void,
  onRowGenerated: (category: SiteCategoryDescription) => void
) => {
  console.log('🚀 [generateSelectedCategories] Starting generation!');
  console.log('Parameters:', {
    categoryDescriptions: categoryDescriptions.length,
    selectedCells: selectedCells,
    selectedCellsType: typeof selectedCells,
    selectedCellsKeys: Object.keys(selectedCells || {}),
    selectedCellsTrue: Object.keys(selectedCells || {}).filter(k => selectedCells[k]),
    selectedCellsActual: selectedCells,
    selectedLang,
    selectedChatModel,
    prompts: Object.keys(prompts)
  });
  const cols = CATEGORY_COLUMNS;
  type Job = { 
    globalIdx: number; 
    category: SiteCategoryDescription; 
    rowKey: string; 
    col: CategoryColumnName;
    index: number;
  };
  const jobs: Job[] = [];

  // Збираємо всі вибрані клітинки
  console.log('📋 [generateSelectedCategories] Processing categories...');
  categoryDescriptions.forEach((cat, idx) => {
    const rowKey = getCategoryRowKey(cat, idx);
    console.log(`Processing category ${idx}: ${rowKey} - ${cat.category}`);
    
    cols.forEach((col) => {
      const cellKey = `${rowKey}:${col}`;
      const isSelected = selectedCells[cellKey];
      
      if (idx === 0) { // Логуємо тільки для першої категорії, щоб не засмічувати консоль
        console.log(`  Checking ${cellKey}: ${isSelected}`);
        console.log(`  Available keys:`, Object.keys(selectedCells));
        console.log(`  Key exists:`, cellKey in selectedCells);
        console.log(`  Direct value:`, selectedCells[cellKey]);
      }
      
      if (isSelected) {
        jobs.push({ globalIdx: idx, category: cat, rowKey, col, index: idx });
        console.log(`  ✅ Added job for ${cellKey}`);
      }
    });
  });

  console.log(`📊 [generateSelectedCategories] Created ${jobs.length} jobs:`, jobs.map(j => ({ rowKey: j.rowKey, col: j.col })));

  if (jobs.length === 0) {
    console.warn('[generateSelectedCategories] No jobs created!');
    console.warn('Possible reasons:');
    console.warn('1. No cells selected (selectedCells is empty)');
    console.warn('2. selectedCells keys do not match expected format');
    console.warn('Expected format: "cat_{category_id}_{lang_code}_{index}:{column}"');
    onProgress('❌ Нічого не вибрано для генерації');
    return;
  }

  let done = 0;
  for (const job of jobs) {
    console.log(`🔄 [generateSelectedCategories] Processing job ${done + 1}/${jobs.length}:`, {
      rowKey: job.rowKey,
      col: job.col,
      category: job.category.category
    });
    
    try {
      const cat = job.category;
      const prompt = resolvePromptForCategoryColumn(prompts, categoryPrompts, job.col, selectedLang);
      
      if (!prompt) {
        console.warn(`❌ [GenerateSelectedCategories] Skip: no prompt resolved for col ${job.col}, lang: ${selectedLang}`);
        console.warn('Available category prompts:', Object.keys(categoryPrompts));
        console.warn('Available regular prompts:', Object.keys(prompts));
        console.warn('💡 Hint: Create category prompts in Templates page (Category tab) or regular prompts will be used as fallback');
        done++; 
        onProgress(`${done}/${jobs.length} (пропущено: немає промпта для ${job.col})`); 
        continue;
      }

      // Підготовка payload з мапінгом ключів
      const payload = {
        category_id: cat.category_id,
        lang_code: cat.lang_code,
        category: cat.category,
        site_short_description: cat.description || '',
        site_meta_keywords: cat.meta_keywords || '',
        site_page_title: cat.page_title || '',
        prompt: prompt,
        model_name: selectedChatModel?.trim() || 'GPT-4o-mini'
      };

      console.log('🚀 [generateSelectedCategories] About to call API for job:', {
        col: job.col,
        category_id: cat.category_id,
        lang_code: cat.lang_code,
        category: cat.category,
        payload
      });

      const genKey = `${job.rowKey}:${job.col}`;
      onCellGeneratingChange(genKey, true);

      console.log('⏳ [generateSelectedCategories] Calling generateAiCategoryDescription...');
      const result = await generateAiCategoryDescription(payload);
      console.log('✅ [generateSelectedCategories] API response received:', result?.substring(0, 100) + '...');

      if (result && typeof result === 'string') {
        const field = mapCategoryColumnToField[job.col];
        // Передаємо ТІЛЬКИ ідентифікатори та оновлене поле
        const updatedCategory = { 
          category_id: cat.category_id,
          lang_code: cat.lang_code,
          [field]: result
        } as any;
        
        console.log('[generateSelectedCategories] Sending update:', { field, value: result });
        onCategoryUpdate(updatedCategory);
        onCellSelectionChange(`${job.rowKey}:${job.col}`, false);
        onRowGenerated(cat);
      }
    } catch (e) {
      console.error('[GenerateSelectedCategories] Помилка', e);
    } finally {
      const genKey = `${job.rowKey}:${job.col}`;
      onCellGeneratingChange(genKey, false);
      done++;
      onProgress(`${done}/${jobs.length}`);
    }
  }
};

// Масова генерація всіх порожніх полів категорій
export const massGenerateCategories = async (
  categoryDescriptions: SiteCategoryDescription[],
  prompts: Record<string, SiteContentPrompt[]>,
  categoryPrompts: Record<string, SiteContentPrompt[]>,
  selectedLang: 'ua' | 'en' | 'ru',
  selectedChatModel: string,
  getCategoryRowKey: (cat: SiteCategoryDescription, index: number) => string,
  onProgress: (progress: string) => void,
  onCellGeneratingChange: (key: string, generating: boolean) => void,
  onCategoryUpdate: (updatedCategory: SiteCategoryDescription) => void,
  onCellSelectionChange: (key: string, selected: boolean) => void,
  onRowGenerated: (category: SiteCategoryDescription) => void
) => {
  const cols = CATEGORY_COLUMNS;
  type Job = { 
    category: SiteCategoryDescription; 
    col: CategoryColumnName; 
    rowKey: string;
    index: number;
  };
  const jobs: Job[] = [];

  // Збираємо всі порожні поля
  categoryDescriptions.forEach((cat, index) => {
    cols.forEach((col) => {
      const field = mapCategoryColumnToField[col];
      const currentVal = cat[field] as string | null | undefined;
      if (!currentVal || String(currentVal).trim() === '') {
        jobs.push({ category: cat, col, rowKey: getCategoryRowKey(cat, index), index });
      }
    });
  });

  if (jobs.length === 0) {
    onProgress('Немає порожніх полів');
    return;
  }

  let done = 0;
  for (const job of jobs) {
    try {
      const cat = job.category;
      const prompt = resolvePromptForCategoryColumn(prompts, categoryPrompts, job.col, selectedLang);
      
      if (!prompt) {
        done++; 
        onProgress(`${done}/${jobs.length}`); 
        continue;
      }

      // Підготовка payload з мапінгом ключів
      const payload = {
        category_id: cat.category_id,
        lang_code: cat.lang_code,
        category: cat.category,
        site_short_description: cat.description || '',
        site_meta_keywords: cat.meta_keywords || '',
        site_page_title: cat.page_title || '',
        prompt: prompt,
        model_name: selectedChatModel?.trim() || 'GPT-4o-mini'
      };

      const genKey = `${job.rowKey}:${job.col}`;
      onCellGeneratingChange(genKey, true);

      const result = await generateAiCategoryDescription(payload);

      if (result && typeof result === 'string') {
        const field = mapCategoryColumnToField[job.col];
        const updatedCategory = { ...cat, [field]: result };
        
        onCategoryUpdate(updatedCategory);
        onCellSelectionChange(`${job.rowKey}:${job.col}`, false);
        onRowGenerated(cat);
      }
    } catch (e) {
      console.error('[MassGenerateCategories] Помилка', e);
    } finally {
      const genKey = `${job.rowKey}:${job.col}`;
      onCellGeneratingChange(genKey, false);
      done++;
      onProgress(`${done}/${jobs.length}`);
    }
  }
};
