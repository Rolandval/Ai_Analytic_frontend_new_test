/**
 * Таблиця категорій
 * Використовує базову DataTable
 * Переиспользуема для генерації та перекладу
 */

import { useMemo } from 'react';
import { DataTable } from './DataTable';
import { EditableCell } from './EditableCell';
import { SiteCategoryDescription, ColumnConfig } from '../../types';
import { Badge } from '@/components/ui/Badge';

interface CategoriesTableProps {
  categories: SiteCategoryDescription[];
  loading?: boolean;
  selectedCells?: Record<string, boolean>;
  onCellSelect?: (cellKey: string, selected: boolean) => void;
  onCellEdit?: (categoryId: number, field: string, value: string) => void;
  cellGenerating?: Record<string, boolean>;
  getRowKey?: (category: SiteCategoryDescription, index: number) => string;
}

export function CategoriesTable({
  categories,
  loading,
  selectedCells = {},
  onCellSelect,
  onCellEdit,
  cellGenerating = {},
  getRowKey,
}: CategoriesTableProps) {
  // Конфігурація колонок
  const columns: ColumnConfig<SiteCategoryDescription>[] = useMemo(() => [
    {
      key: 'number',
      header: '№',
      width: 60,
      render: (_, index) => (
        <div className="text-center font-medium">{index + 1}</div>
      ),
    },
    {
      key: 'category',
      header: 'Назва категорії',
      minWidth: 200,
      editable: true,
      render: (category, index) => {
        const rowKey = getRowKey ? getRowKey(category, index) : `cat_${category.category_id}_${category.lang_code}`;
        const cellKey = `${rowKey}:category`;
        
        return (
          <EditableCell
            value={category.category || ''}
            onSave={(value) => onCellEdit?.(category.category_id, 'category', value)}
            selected={selectedCells[cellKey]}
            onSelect={(selected) => onCellSelect?.(cellKey, selected)}
            loading={cellGenerating[cellKey]}
          />
        );
      },
    },
    {
      key: 'description',
      header: 'Опис',
      minWidth: 300,
      editable: true,
      render: (category, index) => {
        const rowKey = getRowKey ? getRowKey(category, index) : `cat_${category.category_id}_${category.lang_code}`;
        const cellKey = `${rowKey}:description`;
        
        return (
          <EditableCell
            value={category.description || ''}
            onSave={(value) => onCellEdit?.(category.category_id, 'description', value)}
            selected={selectedCells[cellKey]}
            onSelect={(selected) => onCellSelect?.(cellKey, selected)}
            loading={cellGenerating[cellKey]}
            multiline
          />
        );
      },
    },
    {
      key: 'meta_keywords',
      header: 'Мета-ключові слова',
      minWidth: 180,
      editable: true,
      render: (category, index) => {
        const rowKey = getRowKey ? getRowKey(category, index) : `cat_${category.category_id}_${category.lang_code}`;
        const cellKey = `${rowKey}:meta_keywords`;
        
        return (
          <EditableCell
            value={category.meta_keywords || ''}
            onSave={(value) => onCellEdit?.(category.category_id, 'meta_keywords', value)}
            selected={selectedCells[cellKey]}
            onSelect={(selected) => onCellSelect?.(cellKey, selected)}
            loading={cellGenerating[cellKey]}
          />
        );
      },
    },
    {
      key: 'page_title',
      header: 'Заголовок сторінки',
      minWidth: 200,
      editable: true,
      render: (category, index) => {
        const rowKey = getRowKey ? getRowKey(category, index) : `cat_${category.category_id}_${category.lang_code}`;
        const cellKey = `${rowKey}:page_title`;
        
        return (
          <EditableCell
            value={category.page_title || ''}
            onSave={(value) => onCellEdit?.(category.category_id, 'page_title', value)}
            selected={selectedCells[cellKey]}
            onSelect={(selected) => onCellSelect?.(cellKey, selected)}
            loading={cellGenerating[cellKey]}
          />
        );
      },
    },
    {
      key: 'lang',
      header: 'Мова',
      width: 80,
      render: (category) => (
        <Badge variant="outline" className="text-xs">
          {(category.lang_code || 'ua').toUpperCase()}
        </Badge>
      ),
    },
  ], [selectedCells, onCellSelect, onCellEdit, cellGenerating, getRowKey]);

  return (
    <DataTable
      data={categories}
      columns={columns}
      loading={loading}
      emptyMessage="Немає категорій для відображення"
      getRowKey={getRowKey}
    />
  );
}
