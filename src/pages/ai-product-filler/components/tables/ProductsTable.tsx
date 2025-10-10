/**
 * Таблиця товарів
 * Використовує базову DataTable
 * Переиспользуема для генерації та перекладу
 */

import { useMemo } from 'react';
import { DataTable } from './DataTable';
import { EditableCell } from './EditableCell';
import { ContentDescription, ColumnConfig } from '../../types';
import { Badge } from '@/components/ui/Badge';

interface ProductsTableProps {
  products: ContentDescription[];
  loading?: boolean;
  selectedCells?: Record<string, boolean>;
  onCellSelect?: (cellKey: string, selected: boolean) => void;
  onCellEdit?: (productId: number, field: string, value: string) => void;
  cellGenerating?: Record<string, boolean>;
  getRowKey?: (product: ContentDescription, index: number) => string;
}

export function ProductsTable({
  products,
  loading,
  selectedCells = {},
  onCellSelect,
  onCellEdit,
  cellGenerating = {},
  getRowKey,
}: ProductsTableProps) {
  // Конфігурація колонок
  const columns: ColumnConfig<ContentDescription>[] = useMemo(() => [
    {
      key: 'number',
      header: '№',
      width: 60,
      render: (_, index) => (
        <div className="text-center font-medium">{index + 1}</div>
      ),
    },
    {
      key: 'site_product',
      header: 'Назва товару',
      minWidth: 200,
      editable: true,
      render: (product, index) => {
        const rowKey = getRowKey ? getRowKey(product, index) : `${product.id}`;
        const cellKey = `${rowKey}:site_product`;
        
        return (
          <EditableCell
            value={product.site_product || ''}
            onSave={(value) => onCellEdit?.(product.id!, 'site_product', value)}
            selected={selectedCells[cellKey]}
            onSelect={(selected) => onCellSelect?.(cellKey, selected)}
            loading={cellGenerating[cellKey]}
            multiline
          />
        );
      },
    },
    {
      key: 'site_shortname',
      header: 'Коротка назва',
      minWidth: 150,
      editable: true,
      render: (product, index) => {
        const rowKey = getRowKey ? getRowKey(product, index) : `${product.id}`;
        const cellKey = `${rowKey}:site_shortname`;
        
        return (
          <EditableCell
            value={product.site_shortname || ''}
            onSave={(value) => onCellEdit?.(product.id!, 'site_shortname', value)}
            selected={selectedCells[cellKey]}
            onSelect={(selected) => onCellSelect?.(cellKey, selected)}
            loading={cellGenerating[cellKey]}
          />
        );
      },
    },
    {
      key: 'site_short_description',
      header: 'Короткий опис',
      minWidth: 200,
      editable: true,
      render: (product, index) => {
        const rowKey = getRowKey ? getRowKey(product, index) : `${product.id}`;
        const cellKey = `${rowKey}:site_short_description`;
        
        return (
          <EditableCell
            value={product.site_short_description || ''}
            onSave={(value) => onCellEdit?.(product.id!, 'site_short_description', value)}
            selected={selectedCells[cellKey]}
            onSelect={(selected) => onCellSelect?.(cellKey, selected)}
            loading={cellGenerating[cellKey]}
            multiline
          />
        );
      },
    },
    {
      key: 'site_full_description',
      header: 'Повний опис',
      minWidth: 250,
      editable: true,
      render: (product, index) => {
        const rowKey = getRowKey ? getRowKey(product, index) : `${product.id}`;
        const cellKey = `${rowKey}:site_full_description`;
        
        return (
          <EditableCell
            value={product.site_full_description || ''}
            onSave={(value) => onCellEdit?.(product.id!, 'site_full_description', value)}
            selected={selectedCells[cellKey]}
            onSelect={(selected) => onCellSelect?.(cellKey, selected)}
            loading={cellGenerating[cellKey]}
            multiline
          />
        );
      },
    },
    {
      key: 'site_promo_text',
      header: 'Промо-текст',
      minWidth: 200,
      editable: true,
      render: (product, index) => {
        const rowKey = getRowKey ? getRowKey(product, index) : `${product.id}`;
        const cellKey = `${rowKey}:site_promo_text`;
        
        return (
          <EditableCell
            value={product.site_promo_text || ''}
            onSave={(value) => onCellEdit?.(product.id!, 'site_promo_text', value)}
            selected={selectedCells[cellKey]}
            onSelect={(selected) => onCellSelect?.(cellKey, selected)}
            loading={cellGenerating[cellKey]}
            multiline
          />
        );
      },
    },
    {
      key: 'site_meta_keywords',
      header: 'Мета-ключові слова',
      minWidth: 180,
      editable: true,
      render: (product, index) => {
        const rowKey = getRowKey ? getRowKey(product, index) : `${product.id}`;
        const cellKey = `${rowKey}:site_meta_keywords`;
        
        return (
          <EditableCell
            value={product.site_meta_keywords || ''}
            onSave={(value) => onCellEdit?.(product.id!, 'site_meta_keywords', value)}
            selected={selectedCells[cellKey]}
            onSelect={(selected) => onCellSelect?.(cellKey, selected)}
            loading={cellGenerating[cellKey]}
          />
        );
      },
    },
    {
      key: 'site_meta_description',
      header: 'Мета-опис',
      minWidth: 200,
      editable: true,
      render: (product, index) => {
        const rowKey = getRowKey ? getRowKey(product, index) : `${product.id}`;
        const cellKey = `${rowKey}:site_meta_description`;
        
        return (
          <EditableCell
            value={product.site_meta_description || ''}
            onSave={(value) => onCellEdit?.(product.id!, 'site_meta_description', value)}
            selected={selectedCells[cellKey]}
            onSelect={(selected) => onCellSelect?.(cellKey, selected)}
            loading={cellGenerating[cellKey]}
            multiline
          />
        );
      },
    },
    {
      key: 'site_searchwords',
      header: 'Пошукові слова',
      minWidth: 150,
      editable: true,
      render: (product, index) => {
        const rowKey = getRowKey ? getRowKey(product, index) : `${product.id}`;
        const cellKey = `${rowKey}:site_searchwords`;
        
        return (
          <EditableCell
            value={product.site_searchwords || ''}
            onSave={(value) => onCellEdit?.(product.id!, 'site_searchwords', value)}
            selected={selectedCells[cellKey]}
            onSelect={(selected) => onCellSelect?.(cellKey, selected)}
            loading={cellGenerating[cellKey]}
          />
        );
      },
    },
    {
      key: 'site_page_title',
      header: 'Заголовок сторінки',
      minWidth: 200,
      editable: true,
      render: (product, index) => {
        const rowKey = getRowKey ? getRowKey(product, index) : `${product.id}`;
        const cellKey = `${rowKey}:site_page_title`;
        
        return (
          <EditableCell
            value={product.site_page_title || ''}
            onSave={(value) => onCellEdit?.(product.id!, 'site_page_title', value)}
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
      render: (product) => (
        <Badge variant="outline" className="text-xs">
          {(product.site_lang_code || 'ua').toUpperCase()}
        </Badge>
      ),
    },
  ], [selectedCells, onCellSelect, onCellEdit, cellGenerating, getRowKey]);

  return (
    <DataTable
      data={products}
      columns={columns}
      loading={loading}
      emptyMessage="Немає товарів для відображення"
      getRowKey={getRowKey}
    />
  );
}
