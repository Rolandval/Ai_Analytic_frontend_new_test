/**
 * Базова переиспользуема таблиця
 * Використовується для товарів, категорій, аналізу, характеристик
 */

import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from '@/components/ui/Table';
import { Loader2 } from 'lucide-react';
import { ColumnConfig } from '../../types';

interface DataTableProps<T> {
  data: T[];
  columns: ColumnConfig<T>[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T, index: number) => void;
  getRowKey?: (item: T, index: number) => string;
  className?: string;
}

export function DataTable<T = any>({
  data,
  columns,
  loading,
  emptyMessage = 'Немає даних для відображення',
  onRowClick,
  getRowKey,
  className,
}: DataTableProps<T>) {
  // Лоадер
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Порожній стан
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className || ''}`}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.key}
                style={{
                  width: column.width,
                  minWidth: column.minWidth,
                  maxWidth: column.maxWidth,
                }}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => {
            const rowKey = getRowKey ? getRowKey(item, index) : `row-${index}`;
            
            return (
              <TableRow
                key={rowKey}
                onClick={() => onRowClick?.(item, index)}
                className={onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''}
              >
                {columns.map((column) => (
                  <TableCell key={`${rowKey}-${column.key}`}>
                    {column.render ? column.render(item, index) : (item as any)[column.key]}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
