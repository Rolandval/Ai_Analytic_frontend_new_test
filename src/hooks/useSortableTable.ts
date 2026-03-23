import { useMemo, useState } from 'react';

// Типи для сортування
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  key: string;
  direction: SortDirection;
}

// Універсальна функція для сортування будь-якого масиву за ключем
export function useSortableTable<T>(items: T[], defaultSortConfig: SortConfig | null = null) {
  // Підтримуємо як одиночне сортування (зворотна сумісність), так і стек сортувань
  const [sortStack, setSortStack] = useState<SortConfig[]>(
    defaultSortConfig ? [defaultSortConfig] : []
  );

  const getValueByKey = (obj: any, key: string) => {
    if (!key) return undefined;
    if (key.includes('.')) {
      const keys = key.split('.');
      return keys.reduce((acc, k) => acc?.[k], obj);
    }
    return obj?.[key];
  };

  const compareBy = (a: any, b: any, cfg: SortConfig) => {
    const aValue = getValueByKey(a, cfg.key);
    const bValue = getValueByKey(b, cfg.key);

    // null/undefined в кінець
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return cfg.direction === 'asc' ? aValue - bValue : bValue - aValue;
    }
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return cfg.direction === 'asc'
        ? aValue.localeCompare(bValue, 'uk-UA')
        : bValue.localeCompare(aValue, 'uk-UA');
    }
    return 0;
  };

  const sortedItems = useMemo(() => {
    if (!sortStack.length) return [...items];
    const arr = [...items];
    arr.sort((a: any, b: any) => {
      for (const cfg of sortStack) {
        const res = compareBy(a, b, cfg);
        if (res !== 0) return res;
      }
      return 0;
    });
    return arr;
  }, [items, sortStack]);

  // API сумісний: requestSort(key) — скидає стек до одного ключа
  // requestSort(key, true) — додає/оновлює ключ у стеку (Shift+Click)
  const requestSort = (key: string, additive?: boolean) => {
    setSortStack(prev => {
      // Якщо не additive — починаємо нове сортування з одним ключем
      if (!additive) {
        // Якщо ключ той самий — просто перемикаємо напрямок
        if (prev.length === 1 && prev[0].key === key) {
          const nextDir: SortDirection = prev[0].direction === 'asc' ? 'desc' : 'asc';
          return [{ key, direction: nextDir }];
        }
        return [{ key, direction: 'asc' }];
      }

      // additive: оновлюємо або додаємо ключ у кінець стеку
      const existingIndex = prev.findIndex(c => c.key === key);
      if (existingIndex !== -1) {
        // Перемикаємо напрямок для існуючого ключа, зберігаючи його позицію
        const next = [...prev];
        const current = next[existingIndex];
        next[existingIndex] = {
          key,
          direction: current.direction === 'asc' ? 'desc' : 'asc',
        };
        return next;
      }
      // Додаємо новий ключ з напрямком asc у кінець стеку (менший пріоритет ніж попередні)
      return [...prev, { key, direction: 'asc' }];
    });
  };

  // Для зворотної сумісності залишаємо sortConfig як "поточний" (останній) елемент стеку
  const sortConfig = sortStack.length ? sortStack[sortStack.length - 1] : null;

  return {
    items: sortedItems,
    requestSort,
    sortConfig,
    sortStack,
  };
}
