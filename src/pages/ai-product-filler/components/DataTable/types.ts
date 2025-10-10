/**
 * Типи для універсальної таблиці даних
 */

export interface Column<T = any> {
  key: string;
  label: string;
  width?: number;
  sortable?: boolean;
  editable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  getValue?: (row: T) => any;
}

export interface TableRow {
  id: string | number;
  [key: string]: any;
}

export interface CellState {
  isSelected: boolean;
  isEditing: boolean;
  isGenerating: boolean;
  isTranslating: boolean;
  isDirty: boolean;
}

export interface TableSelection {
  selectedCells: Record<string, boolean>;
  selectedRows: Record<string, boolean>;
  selectedColumns: Record<string, boolean>;
}

export interface TableActions<T> {
  onCellEdit?: (rowId: string, columnKey: string, value: any) => void;
  onCellSelect?: (rowId: string, columnKey: string, selected: boolean) => void;
  onRowSelect?: (rowId: string, selected: boolean) => void;
  onColumnSelect?: (columnKey: string, selected: boolean) => void;
  onGenerate?: (rowId: string, columnKey: string) => Promise<void>;
  onTranslate?: (rowId: string, columnKey: string) => Promise<void>;
}

export interface TableProps<T extends TableRow> {
  data: T[];
  columns: Column<T>[];
  selection?: TableSelection;
  actions?: TableActions<T>;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  className?: string;
}
