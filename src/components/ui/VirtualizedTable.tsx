import { useMemo, useCallback, CSSProperties } from 'react';
import { FixedSizeList as List } from 'react-window';

interface VirtualizedTableProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  renderRow: (item: T, index: number, style: CSSProperties) => React.ReactNode;
  className?: string;
  overscan?: number;
}

export function VirtualizedTable<T>({
  items,
  height,
  itemHeight,
  renderRow,
  className = "",
  overscan = 5
}: VirtualizedTableProps<T>) {
  
  const Row = useCallback(({ index, style }: { index: number; style: CSSProperties }) => {
    const item = items[index];
    return renderRow(item, index, style);
  }, [items, renderRow]);

  const itemCount = items.length;

  return (
    <div className={`virtualized-table ${className}`}>
      <List
        height={height}
        itemCount={itemCount}
        itemSize={itemHeight}
        overscanCount={overscan}
        className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
      >
        {Row}
      </List>
    </div>
  );
}

// Спеціалізований компонент для таблиць постачальників
interface VirtualizedSupplierTableProps {
  suppliers: Array<{
    id: number;
    name: string;
    description?: string;
    cities: string[] | string;
    emails: string[] | string;
    phone_numbers: string[] | string;
  }>;
  onEdit: (supplier: any) => void;
  onDelete: (supplier: any) => void;
  className?: string;
}

export const VirtualizedSupplierTable = ({
  suppliers,
  onEdit,
  onDelete,
  className = ""
}: VirtualizedSupplierTableProps) => {
  const renderSupplierRow = useCallback((supplier: any, index: number, style: CSSProperties) => (
    <div 
      style={style} 
      className="flex items-center border-b border-gray-200 hover:bg-gray-50 px-4"
    >
      <div className="flex-1 grid grid-cols-6 gap-4 py-2 text-sm">
        <div className="truncate font-medium">{supplier.name}</div>
        <div className="truncate text-gray-600">{supplier.description || '-'}</div>
        <div className="truncate">
          {Array.isArray(supplier.cities) ? supplier.cities.join(', ') : supplier.cities}
        </div>
        <div className="truncate">
          {Array.isArray(supplier.emails) ? supplier.emails.join(', ') : supplier.emails}
        </div>
        <div className="truncate">
          {Array.isArray(supplier.phone_numbers) ? supplier.phone_numbers.join(', ') : supplier.phone_numbers}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(supplier)}
            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            Редагувати
          </button>
          <button
            onClick={() => onDelete(supplier)}
            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Видалити
          </button>
        </div>
      </div>
    </div>
  ), [onEdit, onDelete]);

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Заголовок таблиці */}
      <div className="grid grid-cols-6 gap-4 px-4 py-3 bg-gray-50 border-b font-medium text-sm text-gray-700">
        <div>Назва</div>
        <div>Опис</div>
        <div>Міста</div>
        <div>Контактна інформація</div>
        <div>Телефони</div>
        <div>Дії</div>
      </div>
      
      {/* Віртуалізована таблиця */}
      <VirtualizedTable
        items={suppliers}
        height={400}
        itemHeight={60}
        renderRow={renderSupplierRow}
        overscan={3}
      />
    </div>
  );
};
