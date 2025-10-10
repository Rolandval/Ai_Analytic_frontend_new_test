/**
 * Загальні типи
 */

export type LanguageCode = 'ua' | 'en' | 'ru';

export interface CustomFilter {
  id: string;
  name: string;
  field: string;
  value: string;
  active: boolean;
}

export interface ChatModel {
  id: number;
  name: string;
  icon: string;
  input_tokens_price?: number;
  output_tokens_price?: number;
}

export interface ColumnConfig<T = any> {
  key: string;
  header: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  sortable?: boolean;
  editable?: boolean;
  render?: (item: T, index: number) => React.ReactNode;
}
