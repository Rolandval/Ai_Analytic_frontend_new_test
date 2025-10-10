/**
 * Універсальна таблиця даних для AI Product Filler
 */

import { Table, TableBody } from '@/components/ui/Table';
import { Loader2 } from 'lucide-react';
import { TableHeader } from './TableHeader';
import { TableRowComponent } from './TableRowComponent';
import type { TableProps, TableRow } from './types';

export function DataTable<T extends TableRow>({
  data,
  columns,
  selection,
  actions,
  loading = false,
  error = null,
  emptyMessage = 'Немає даних для відображення',
  className = '',
}: TableProps<T>) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <Table>
        <TableHeader
          columns={columns}
          columnSelection={selection?.selectedColumns}
          onColumnSelect={actions?.onColumnSelect}
        />
        <TableBody>
          {data.map((row, index) => (
            <TableRowComponent
              key={row.id}
              row={row}
              index={index}
              columns={columns}
              rowKey={String(row.id)}
              selection={selection}
              actions={actions}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// Експорт типів
export type { TableProps, TableRow, Column, TableSelection, TableActions } from './types';
