'use client';

import { useState, useMemo } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/Popover';
import { Badge } from '@/components/ui/Badge';
import { Check, ChevronDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Option = string;

export interface MultiSelectPopoverProps {
  getLabel?: (val: Option) => string;
  placeholder?: string;
  options: Option[];
  values: Option[] | undefined;
  onChange: (vals: Option[] | undefined) => void;
  className?: string;
  /** Show 'Select all' and 'Clear' quick actions. Default: false */
  showSelectAll?: boolean;
  /** Custom label for the select all button */
  selectAllLabel?: string;
  /** Custom label for the clear button */
  clearLabel?: string;
}

/**
 * A headless multi-select popover with search and checkbox list.
 * Keeps API compatible with old component (placeholder, options, values, onChange).
 */
export function MultiSelectPopover({
  placeholder = 'Обрати...',
  options,
  values,
  onChange,
  className,
  getLabel,
  showSelectAll = false,
  selectAllLabel = 'Вибрати всі',
  clearLabel = 'Скинути',
}: MultiSelectPopoverProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selected = values ?? [];
  const label = (v: Option) => (getLabel ? getLabel(v) : v);

  // Filter options by search query (case-insensitive)
  const filtered = useMemo(
    () => options.filter(o => o.toLowerCase().includes(search.toLowerCase())),
    [options, search]
  );

  const toggle = (value: Option) => {
    const exists = selected.includes(value);
    const next = exists ? selected.filter(v => v !== value) : [...selected, value];
    onChange(next.length ? next : undefined);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'min-w-[220px] inline-flex items-center justify-between gap-1 rounded-xl border border-border bg-background/40 px-3 py-2 text-sm backdrop-blur-md transition-colors hover:bg-background/60',
            className
          )}
        >
          {/* Selected values / placeholder */}
          <div className="flex flex-wrap gap-1 items-center max-w-[85%]">
            {selected.length === 0 ? (
              <span className="text-muted-foreground flex items-center gap-1">
                <Plus className="w-4 h-4" /> {placeholder}
              </span>
            ) : (
              <>
                {selected.slice(0, 2).map(v => (
                  <Badge key={v} variant="secondary" className="truncate max-w-[90px]">
                    {v}
                  </Badge>
                ))}
                {selected.length > 2 && (
                  <Badge variant="secondary">+{selected.length - 2}</Badge>
                )}
              </>
            )}
          </div>
          <ChevronDown className="w-4 h-4 shrink-0 opacity-70" />
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2 z-50 rounded-xl border border-border bg-background/90 backdrop-blur-md">
        {/* Search input */}
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Пошук..."
          className="mb-2 w-full rounded-md border bg-background px-2 py-1 text-sm outline-none focus:ring-1 ring-primary"
        />

        {/* Quick actions */}
        {showSelectAll && (
          <div className="flex items-center justify-between gap-2 mb-2">
            <button
              type="button"
              onClick={() => onChange(options.length ? [...options] : undefined)}
              className="text-xs px-2 py-1 rounded-md border border-border hover:bg-primary/5"
            >
              {selectAllLabel}
            </button>
            <button
              type="button"
              onClick={() => onChange(undefined)}
              className="text-xs px-2 py-1 rounded-md border border-border hover:bg-destructive/5"
            >
              {clearLabel}
            </button>
          </div>
        )}

        {/* List */}
        <div className="max-h-56 overflow-y-auto space-y-1 scroll-hint" style={{ WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent)' }}>
          {filtered.length === 0 && (
            <div className="py-2 px-3 text-sm text-muted-foreground">Не знайдено</div>
          )}

          {filtered.map(opt => {
            const checked = selected.includes(opt);
            return (
              <label
                key={opt}
                className={cn(
                  'flex items-center gap-2 px-3 py-1 cursor-pointer rounded-md hover:bg-primary/5',
                  checked && 'bg-primary/10'
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(opt)}
                  className="accent-primary focus:ring-0"
                />
                <span className="text-sm flex-1 select-none">{label(opt)}</span>
                {checked && <Check className="w-4 h-4 text-primary" />}
              </label>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
