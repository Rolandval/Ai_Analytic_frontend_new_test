import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  header: string;
  accessor?: (item: T) => React.ReactNode;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string | number;
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  rowClassName?: (item: T) => string;
  stickyHeader?: boolean;
  compact?: boolean;
  className?: string;
  variant?: 'default' | 'minimal';
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  isLoading = false,
  emptyMessage = 'Немає даних для відображення',
  onRowClick,
  rowClassName,
  stickyHeader = false,
  compact = false,
  className,
  variant = 'default',
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  const handleSort = (columnKey: string) => {
    setSortConfig((current) => {
      if (current?.key === columnKey) {
        if (current.direction === 'asc') {
          return { key: columnKey, direction: 'desc' };
        }
        return null;
      }
      return { key: columnKey, direction: 'asc' };
    });
  };

  const sortedData = React.useMemo(() => {
    if (!sortConfig) return data;

    const column = columns.find((col) => col.key === sortConfig.key);
    if (!column?.accessor) return data;

    return [...data].sort((a, b) => {
      const aValue = column.accessor!(a);
      const bValue = column.accessor!(b);

      if (aValue === bValue) return 0;

      const comparison = aValue > bValue ? 1 : -1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [data, sortConfig, columns]);

  const getSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <ChevronsUpDown className="w-4 h-4 ml-1 opacity-30" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="w-4 h-4 ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 ml-1" />
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isMinimal = variant === 'minimal';
  const tableClassName = cn(
    'table-fixed min-w-full',
    compact || isMinimal ? 'text-xs' : 'text-sm'
  );
  
  const headerClassName = cn(
    stickyHeader && 'sticky top-0 z-10',
    isMinimal && '[&>tr>th]:bg-[#EBF3F6] dark:[&>tr>th]:bg-gray-900',
    isMinimal && '[&>tr>th]:px-1 [&>tr>th]:h-10',
    !isMinimal && '[&>tr>th]:px-4 [&>tr>th]:py-3'
  );

  return (
    <div className={cn('relative overflow-x-auto rounded-lg', className)}>
      <Table className={tableClassName}>
        <TableHeader className={headerClassName}>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead
                key={column.key}
                className={cn(
                  'text-center text-gray-700 dark:text-gray-300 font-medium',
                  column.headerClassName,
                  column.sortable && 'cursor-pointer select-none hover:bg-muted/50',
                  column.align === 'left' && 'text-left',
                  column.align === 'right' && 'text-right',
                  isMinimal && index === 0 && 'rounded-tl-lg',
                  isMinimal && index === columns.length - 1 && 'rounded-tr-lg'
                )}
                style={column.width ? { width: column.width, minWidth: column.width, maxWidth: column.width } : undefined}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className={cn(
                  'flex items-center justify-center',
                  column.align === 'left' && 'justify-start',
                  column.align === 'right' && 'justify-end'
                )}>
                  <span className="truncate">{column.header}</span>
                  {column.sortable && getSortIcon(column.key)}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody className={isMinimal ? '[&>tr>td]:px-1 [&>tr>td]:py-2' : '[&>tr>td]:px-4 [&>tr>td]:py-3'}>
          {sortedData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center text-muted-foreground py-8">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            sortedData.map((item) => (
              <TableRow
                key={keyExtractor(item)}
                className={cn(
                  'hover:bg-muted/30 transition-colors',
                  onRowClick && 'cursor-pointer',
                  rowClassName?.(item)
                )}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((column) => (
                  <TableCell 
                    key={column.key} 
                    className={cn(
                      'text-center',
                      column.align === 'left' && 'text-left',
                      column.align === 'right' && 'text-right',
                      column.className
                    )}
                  >
                    {column.render
                      ? column.render(item)
                      : column.accessor
                      ? column.accessor(item)
                      : (item as any)[column.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
