/**
 * Рядок таблиці з редагованими клітинками
 */

import { useState } from 'react';
import { TableRow, TableCell } from '@/components/ui/Table';
import { Checkbox } from '@/components/ui/Checkbox';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { EditableCell } from './EditableCell';
import type { Column, TableRow as TRow, TableSelection, TableActions } from './types';

interface TableRowComponentProps<T extends TRow> {
  row: T;
  index: number;
  columns: Column<T>[];
  rowKey: string;
  selection?: TableSelection;
  actions?: TableActions<T>;
  expandable?: boolean;
  renderExpanded?: (row: T) => React.ReactNode;
}

export function TableRowComponent<T extends TRow>({
  row,
  index,
  columns,
  rowKey,
  selection,
  actions,
  expandable = false,
  renderExpanded,
}: TableRowComponentProps<T>) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingCell, setEditingCell] = useState<string | null>(null);

  const isRowSelected = selection?.selectedRows[rowKey] || false;

  const handleRowSelect = (selected: boolean) => {
    actions?.onRowSelect?.(rowKey, selected);
  };

  const handleCellSelect = (columnKey: string, selected: boolean) => {
    actions?.onCellSelect?.(rowKey, columnKey, selected);
  };

  const handleCellEdit = (columnKey: string, value: any) => {
    actions?.onCellEdit?.(rowKey, columnKey, value);
  };

  const isCellSelected = (columnKey: string) => {
    return selection?.selectedCells[`${rowKey}:${columnKey}`] || false;
  };

  return (
    <>
      <TableRow className="hover:bg-gray-50 dark:hover:bg-neutral-800/50">
        {/* Номер рядка + чекбокс + розгортання */}
        <TableCell className="text-center">
          <div className="flex items-center justify-center gap-2">
            {expandable && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            )}
            <Checkbox
              checked={isRowSelected}
              onCheckedChange={handleRowSelect}
              size="xs"
              title="Вибрати рядок"
            />
            <span className="text-sm">{index + 1}</span>
          </div>
        </TableCell>

        {/* Клітинки даних */}
        {columns.map((column) => {
          const value = column.getValue?.(row) ?? row[column.key];
          const cellKey = `${rowKey}:${column.key}`;

          return (
            <TableCell
              key={column.key}
              style={column.width ? {
                width: column.width,
                minWidth: column.width,
                maxWidth: column.width,
              } : undefined}
            >
              {column.editable ? (
                <EditableCell
                  value={value}
                  rowKey={rowKey}
                  columnKey={column.key}
                  isSelected={isCellSelected(column.key)}
                  isEditing={editingCell === cellKey}
                  onSelect={(selected) => handleCellSelect(column.key, selected)}
                  onEdit={(newValue) => handleCellEdit(column.key, newValue)}
                  onStartEdit={() => setEditingCell(cellKey)}
                  onEndEdit={() => setEditingCell(null)}
                  long={true}
                />
              ) : column.render ? (
                column.render(value, row)
              ) : (
                <span className="text-xs">{value}</span>
              )}
            </TableCell>
          );
        })}

        {/* Колонка генерації */}
        <TableCell className="text-center">
          <button
            onClick={() => actions?.onGenerate?.(rowKey, 'all')}
            className="px-3 py-1 text-xs bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-800 rounded transition-colors"
          >
            Генерувати
          </button>
        </TableCell>

        {/* Колонка перекладу */}
        <TableCell className="text-center">
          <button
            onClick={() => actions?.onTranslate?.(rowKey, 'all')}
            className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 rounded transition-colors"
          >
            Перекласти
          </button>
        </TableCell>
      </TableRow>

      {/* Розгорнутий вміст */}
      {isExpanded && expandable && renderExpanded && (
        <TableRow className="bg-gray-50/50 dark:bg-neutral-900/50">
          <TableCell colSpan={columns.length + 3}>
            {renderExpanded(row)}
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
