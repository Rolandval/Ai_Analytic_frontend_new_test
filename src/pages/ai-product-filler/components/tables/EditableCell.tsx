/**
 * Редагована клітинка таблиці
 * Використовується в ProductsTable, CategoriesTable
 */

import { useState, useRef, useEffect } from 'react';
import { Checkbox } from '@/components/ui/Checkbox';
import { Textarea } from '@/components/ui/Textarea';
import { Loader2 } from 'lucide-react';

interface EditableCellProps {
  value: string;
  onSave?: (value: string) => void;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
  multiline?: boolean;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function EditableCell({
  value,
  onSave,
  selected,
  onSelect,
  multiline = false,
  placeholder = '—',
  disabled = false,
  loading = false,
  className,
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Синхронізуємо editValue з value
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value);
    }
  }, [value, isEditing]);

  // Автофокус при редагуванні
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editValue !== value && onSave) {
      onSave(editValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    } else if (e.key === 'Enter' && !multiline && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      {/* Чекбокс для вибору */}
      {onSelect && (
        <Checkbox
          checked={selected}
          onCheckedChange={onSelect}
          onClick={(e) => e.stopPropagation()}
          disabled={disabled}
          size="xs"
          className="shrink-0"
        />
      )}

      {/* Індикатор завантаження */}
      {loading && (
        <Loader2 className="h-3 w-3 animate-spin text-blue-600 shrink-0" />
      )}

      {/* Редагування */}
      {isEditing ? (
        <Textarea
          ref={textareaRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="min-h-[32px] text-sm"
          rows={multiline ? 3 : 1}
        />
      ) : (
        <div
          className={`flex-1 min-w-0 px-2 py-1 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          onClick={() => !disabled && setIsEditing(true)}
          title={value || placeholder}
        >
          {value ? (
            <span className="text-sm truncate block">{value}</span>
          ) : (
            <span className="text-sm text-gray-400 dark:text-gray-500">{placeholder}</span>
          )}
        </div>
      )}
    </div>
  );
}
