import { useState } from 'react';

// Типи для сортування
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  key: string;
  direction: SortDirection;
}

// Універсальна функція для сортування будь-якого масиву за ключем
export function useSortableTable<T>(items: T[], defaultSortConfig: SortConfig | null = null) {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(defaultSortConfig);
  
  // Функція для виконання сортування
  const sortedItems = [...items].sort((a: any, b: any) => {
    if (!sortConfig) return 0;
    
    // Отримуємо значення за вказаним ключем
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];
    
    // Обробка вкладених властивостей через крапку (наприклад "supplier_prices.length")
    if (sortConfig.key.includes('.')) {
      const keys = sortConfig.key.split('.');
      aValue = keys.reduce((obj, key) => obj?.[key], a);
      bValue = keys.reduce((obj, key) => obj?.[key], b);
    }
    
    // Обробка null або undefined значень
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    
    // Сортування чисел
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    // Сортування рядків
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      // Обробка українських символів
      return sortConfig.direction === 'asc' 
        ? aValue.localeCompare(bValue, 'uk-UA') 
        : bValue.localeCompare(aValue, 'uk-UA');
    }
    
    // За замовчуванням
    return 0;
  });
  
  // Функція для зміни конфігурації сортування
  const requestSort = (key: string) => {
    let direction: SortDirection = 'asc';
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ key, direction });
  };
  
  return { 
    items: sortedItems, 
    requestSort, 
    sortConfig 
  };
}
