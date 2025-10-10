/**
 * Заголовок таблиці з сортуванням та вибором колонок
 */

import { TableHead, TableRow } from '@/components/ui/Table';
import { Checkbox } from '@/components/ui/Checkbox';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { Column } from './types';

interface TableHeaderProps<T> {
  columns: Column<T>[];
  sortBy?: string | null;
  sortDir?: 'asc' | 'desc';
  columnSelection?: Record<string, boolean>;
  onSort?: (columnKey: string) => void;
  onColumnSelect?: (columnKey: string, selected: boolean) => void;
  onResizeStart?: (columnKey: string) => (e: React.MouseEvent) => void;
}

export function TableHeader<T>({
  columns,
  sortBy,
  sortDir,
  columnSelection = {},
  onSort,
  onColumnSelect,
  onResizeStart,
}: TableHeaderProps<T>) {
  const getSortIcon = (columnKey: string) => {
    if (sortBy !== columnKey) return <ArrowUpDown className="h-3 w-3 opacity-30" />;
    return sortDir === 'asc' 
      ? <ArrowUp className="h-3 w-3" />
      : <ArrowDown className="h-3 w-3" />;
  };

  return (
    <TableRow className="bg-gray-50 dark:bg-neutral-800">
      {/* Колонка номера */}
      <TableHead className="w-24 text-center font-semibold">№</TableHead>

      {/* Колонки даних */}
      {columns.map((column) => (
        <TableHead
          key={column.key}
          className="relative group"
          style={column.width ? {
            width: column.width,
            minWidth: column.width,
            maxWidth: column.width,
          } : undefined}
        >
          <div className="flex items-center gap-2">
            {/* Чекбокс для вибору всієї колонки */}
            {onColumnSelect && (
              <Checkbox
                checked={columnSelection[column.key] || false}
                onCheckedChange={(checked) => onColumnSelect(column.key, checked === true)}
                size="xs"
                className="shrink-0"
                title="Вибрати всю колонку"
              />
            )}

            {/* Назва колонки */}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-xs truncate">
                {column.label}
              </div>
            </div>

            {/* Кнопка сортування */}
            {column.sortable && onSort && (
              <button
                onClick={() => onSort(column.key)}
                className="shrink-0 p-1 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded transition-colors"
                title="Сортувати"
              >
                {getSortIcon(column.key)}
              </button>
            )}

            {/* Ресайзер */}
            {onResizeStart && (
              <div
                onMouseDown={onResizeStart(column.key)}
                className="
                  absolute right-0 top-0 bottom-0 w-1 cursor-col-resize
                  hover:bg-blue-500 dark:hover:bg-blue-400
                  opacity-0 group-hover:opacity-100 transition-opacity
                "
              />
            )}
          </div>
        </TableHead>
      ))}

      {/* Колонки дій */}
      <TableHead className="w-[120px] text-center">Генерація</TableHead>
      <TableHead className="w-[100px] text-center">Переклад</TableHead>
    </TableRow>
  );
}
