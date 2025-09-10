'use client';

import { useState, useMemo, useEffect } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/Popover';
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
  /** Enable client-side pagination for long lists (e.g., suppliers). Default: false */
  enablePagination?: boolean;
  /** Page size for pagination. Default: 100 */
  pageSize?: number;
  /** Show a small selector to change page size (10/50/100). Default: false */
  showPageSizeSelector?: boolean;
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
  enablePagination = false,
  pageSize = 100,
  showPageSizeSelector = false,
}: MultiSelectPopoverProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [localPageSize, setLocalPageSize] = useState(pageSize);
  const selected = values ?? [];
  const label = (v: Option) => (getLabel ? getLabel(v) : v);

  // Filter options by search query (case-insensitive)
  const filtered = useMemo(
    () => options.filter(o => o.toLowerCase().includes(search.toLowerCase())),
    [options, search]
  );

  // Reset page when search, options or open state changes
  useEffect(() => {
    setPage(1);
  }, [search, options, open]);

  const effectivePageSize = showPageSizeSelector ? localPageSize : pageSize;
  const total = filtered.length;
  const totalPages = enablePagination ? Math.max(1, Math.ceil(total / effectivePageSize)) : 1;
  const currentPage = Math.min(page, totalPages);
  const paged = enablePagination
    ? filtered.slice((currentPage - 1) * effectivePageSize, currentPage * effectivePageSize)
    : filtered;

  // Sync local page size when prop changes (e.g., parent re-render) or when popover opens
  useEffect(() => {
    setLocalPageSize(pageSize);
  }, [pageSize, open, options]);

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
          {/* Always show placeholder */}
          <div className="flex flex-wrap gap-1 items-center max-w-[85%]">
            <span className="text-muted-foreground flex items-center gap-1">
              <Plus className="w-4 h-4" /> {placeholder}
            </span>
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
        <div className="max-h-56 overflow-y-auto space-y-1 scroll-hint">
          {filtered.length === 0 && (
            <div className="py-2 px-3 text-sm text-muted-foreground">Не знайдено</div>
          )}

          {paged.map(opt => {
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

        {/* Pagination controls */}
        {enablePagination && (
          <div className="mt-2 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="text-muted-foreground">Всього: {total}</div>
              {showPageSizeSelector && (
                <div className="flex items-center gap-1">
                  <span>Показати:</span>
                  <select
                    className="h-6 border rounded px-1 bg-background"
                    value={localPageSize}
                    onChange={(e) => {
                      // Update page size by lifting via a synthetic rerender: use local state workaround
                      // As pageSize is a prop, we can't set it here; instead, restart from page 1 and rely on parent to pass a new prop if controlled.
                      // For internal usage, just reset page to 1; parent can re-render with new pageSize if it passes a different prop.
                      // Here we manage local page size for internal pagination.
                      const el = e.target as HTMLSelectElement;
                      const next = Number(el.value);
                      setLocalPageSize(next);
                      setPage(1);
                    }}
                  >
                    <option value={10}>10</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="px-2 py-1 rounded-md border border-border hover:bg-background"
                onClick={() => setPage(1)}
                disabled={currentPage === 1}
                aria-label="Перша сторінка"
              >
                «
              </button>
              <button
                type="button"
                className="px-2 py-1 rounded-md border border-border hover:bg-background"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                aria-label="Попередня сторінка"
              >
                ‹
              </button>
              <span className="px-2 select-none">
                {currentPage} з {totalPages}
              </span>
              <button
                type="button"
                className="px-2 py-1 rounded-md border border-border hover:bg-background"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                aria-label="Наступна сторінка"
              >
                ›
              </button>
              <button
                type="button"
                className="px-2 py-1 rounded-md border border-border hover:bg-background"
                onClick={() => setPage(totalPages)}
                disabled={currentPage === totalPages}
                aria-label="Остання сторінка"
              >
                »
              </button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
