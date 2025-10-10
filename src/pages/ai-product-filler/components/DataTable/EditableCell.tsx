/**
 * Редагована клітинка таблиці
 */

import { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { Loader2 } from 'lucide-react';

interface EditableCellProps {
  value: string;
  rowKey: string;
  columnKey: string;
  isSelected?: boolean;
  isEditing?: boolean;
  isGenerating?: boolean;
  isDirty?: boolean;
  long?: boolean;
  onEdit?: (value: string) => void;
  onSelect?: (selected: boolean) => void;
  onStartEdit?: () => void;
  onEndEdit?: () => void;
}

export function EditableCell({
  value,
  rowKey,
  columnKey,
  isSelected = false,
  isEditing = false,
  isGenerating = false,
  isDirty = false,
  long = false,
  onEdit,
  onSelect,
  onStartEdit,
  onEndEdit,
}: EditableCellProps) {
  const [localValue, setLocalValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    if (localValue !== value && onEdit) {
      onEdit(localValue);
    }
    onEndEdit?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setLocalValue(value);
      onEndEdit?.();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    }
  };

  const cellKey = `${rowKey}:${columnKey}`;
  const isEmpty = !value || value.trim() === '';

  return (
    <div className="flex items-center gap-1 min-w-0">
      {/* Чекбокс для вибору */}
      <Checkbox
        checked={isSelected}
        onCheckedChange={(checked) => onSelect?.(checked === true)}
        onClick={(e) => e.stopPropagation()}
        size="xs"
        className="shrink-0 dark:bg-neutral-800/70"
        disabled={!isEmpty}
        title={isEmpty ? 'Вибрати для генерації' : 'Вже заповнено'}
      />

      {/* Індикатор генерації */}
      {isGenerating && (
        <Loader2 className="h-3 w-3 animate-spin text-amber-600 shrink-0" />
      )}

      {/* Текстове поле */}
      {isEditing ? (
        <Textarea
          ref={textareaRef}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="min-h-[60px] text-xs resize-none"
          rows={3}
        />
      ) : (
        <div
          onClick={onStartEdit}
          className={`
            flex-1 min-w-0 cursor-pointer px-2 py-1 rounded
            ${isDirty ? 'bg-amber-50 dark:bg-amber-900/20 ring-1 ring-amber-200 dark:ring-amber-800' : ''}
            hover:bg-gray-50 dark:hover:bg-gray-800
            transition-colors
          `}
          title={value || 'Клікніть для редагування'}
        >
          {value ? (
            <span className={`text-xs ${long ? 'line-clamp-2' : 'truncate block'}`}>
              {value}
            </span>
          ) : (
            <span className="text-xs text-gray-400 italic">Порожньо</span>
          )}
        </div>
      )}
    </div>
  );
}
