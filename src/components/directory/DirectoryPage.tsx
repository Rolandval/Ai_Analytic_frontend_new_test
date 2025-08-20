import { useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { MultiSelect } from '@/components/ui/MultiSelect';

export type FilterField =
  | { type: 'text'; name: string; label: string }
  | { type: 'number'; name: string; label: string }
  | { type: 'select'; name: string; label: string; options: { label: string; value: string }[] }
  | { type: 'multiselect'; name: string; label: string; options: { label: string; value: string }[] }
  | { type: 'list-multiselect'; name: string; label: string; options: { label: string; value: string }[] }
  | { type: 'range-number'; nameMin: string; nameMax: string; label: string };

export interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
}

export interface DirectoryPageProps<T, P extends Record<string, any>> {
  title: string;
  columns: Column<T>[];
  filterFields: FilterField[];
  useList: (params: P) => { data?: { items: T[]; total: number }; isLoading: boolean; isError: boolean; error: any };
  useCreate: () => { mutate: (data: Partial<T>) => any };
  useUpdate: () => { mutate: (args: { id: number; data: Partial<T> }) => any };
  useDelete: () => { mutate: (id: number) => any };
  initialParams: P;
  lostPath: string;
  formSelectOptions?: Record<string, { label: string; value: string }[]>;
}

export function DirectoryPage<T extends { id?: number }, P extends Record<string, any>>({
  title,
  columns,
  filterFields,
  useList,
  useCreate,
  useUpdate,
  useDelete,
  initialParams,
  lostPath,
  formSelectOptions = {},
}: DirectoryPageProps<T, P>) {
  const PAGE_SIZE = initialParams.page_size ?? 15;
  const [params, setParams] = useState<P>(initialParams);
  const debouncedSetParams = useDebouncedCallback(setParams, 300);

  const { data, isLoading, isError, error } = useList(params);
  const [info, setInfo] = useState<string | null>(null);
  const createMut = useCreate();
  const updateMut = useUpdate();
  const deleteMut = useDelete();

  /* dialog */
  const [dialogOpen, setDialogOpen] = useState(false);
  const [current, setCurrent] = useState<Partial<T> | null>(null);

  const openDialog = (row: Partial<T> | null = null) => {
    setCurrent(row ?? {});
    setInfo(null);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!current) return;
    if (current.id) {
      const { id, ...rest } = current as any;
      (updateMut as any).mutate({ id, data: rest }, {
        onSuccess: () => { setInfo('Запис оновлено'); },
        onError: (err: any) => { console.error(err); setInfo('Помилка під час оновлення'); }
      })


    } else {
      (createMut as any).mutate(current, {
        onSuccess: () => { setInfo('Запис успішно створено'); },
        onError: (err: any) => { console.error(err); setInfo('Помилка під час створення'); }
      })


    }
  
  };

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  /* -------------------- render ------------------- */
  return (
    <div className="p-4 md:p-6 text-foreground min-h-screen">
      <h1 className="text-3xl font-bold mb-2">{title}</h1>
      {info && <div className="mb-4 text-green-500 dark:text-green-400 text-sm">{info}</div>}

      {/* Filters */}
      <Card className="mb-6">
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {filterFields.map((f) => {
            if (f.type === 'text' || f.type === 'number') {
              const value = (params as any)[f.name] ?? '';
              return (
                <Input
                  key={f.name}
                  type={f.type === 'number' ? 'number' : 'text'}
                  placeholder={f.label}
                  value={value}
                  onChange={(e) =>
                    debouncedSetParams((prev: any) => ({
                      ...prev,
                      [f.name]: e.target.value || undefined,
                      page: 1,
                    }))
                  }
                />
              );
            }
            if (f.type === 'range-number') {
              const minVal = (params as any)[f.nameMin] ?? '';
              const maxVal = (params as any)[f.nameMax] ?? '';
              return (
                <div key={f.label} className="flex gap-2 items-center">
                  <Input
                    type="number"
                    placeholder={`${f.label} від`}
                    value={minVal}
                    onChange={(e) =>
                      debouncedSetParams((prev: any) => ({
                        ...prev,
                        [f.nameMin]: e.target.value || undefined,
                        page: 1,
                      }))
                    }
                  />
                  <Input
                    type="number"
                    placeholder={`до`}
                    value={maxVal}
                    onChange={(e) =>
                      debouncedSetParams((prev: any) => ({
                        ...prev,
                        [f.nameMax]: e.target.value || undefined,
                        page: 1,
                      }))
                    }
                  />
                </div>
              );
            }
            if (f.type === 'select') {
              // Skip pagination dropdown - it will be moved to bottom
              if (f.name === 'page_size') {
                return null;
              }
              
              // Use radio buttons for small option sets (3 or fewer)
              if (f.options.length <= 3) {
                return (
                  <div key={f.name} className="flex flex-col gap-1 p-1">
                    <span className="text-[14px] font-semibold text-slate-700">{f.label}</span>
                    <div className="flex flex-nowrap gap-2 text-[14px] leading-tight overflow-hidden">
                      {f.options.map((o) => (
                        <label key={o.value} className="inline-flex items-center gap-1 cursor-pointer text-slate-700 whitespace-nowrap">
                          <input
                            type="radio"
                            name={f.name}
                            checked={(params as any)[f.name] === o.value}
                            onChange={() => setParams((prev: any) => ({
                              ...prev,
                              [f.name]: o.value,
                              page: 1,
                            }))}
                            className="peer accent-primary"
                          />
                          <span className="truncate max-w-[80px]" title={o.label}>{o.label}</span>
                        </label>
                      ))}
                      <label className="inline-flex items-center gap-1 cursor-pointer text-slate-700 whitespace-nowrap">
                        <input
                          type="radio"
                          name={f.name}
                          checked={!(params as any)[f.name]}
                          onChange={() => setParams((prev: any) => ({
                            ...prev,
                            [f.name]: undefined,
                            page: 1,
                          }))}
                          className="peer accent-primary"
                        />
                        <span>всі</span>
                      </label>
                    </div>
                  </div>
                );
              }
              
              // Use dropdown for larger option sets
              return (
                <Select
                  key={f.name}
                  value={String((params as any)[f.name] ?? '__all__')}
                  onValueChange={(val) => setParams((prev: any) => ({
                    ...prev,
                    [f.name]: val === '__all__' ? undefined : val,
                    page: 1,
                  }))} 
                >
                  <SelectTrigger>
                    <SelectValue placeholder={f.label} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Всі</SelectItem>
                    {f.options.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              );
            }
            if (f.type === 'multiselect') {
              return (
                <MultiSelect
                  key={f.name}
                  options={f.options}
                  placeholder={f.label}
                  onValueChange={(vals) => debouncedSetParams((prev: any) => ({
                    ...prev,
                    [f.name]: vals.length ? vals : undefined,
                    page: 1,
                  }))}
                />
              );
            }
            if (f.type === 'list-multiselect') {
              return (
                <div key={f.name} className="flex flex-col gap-1">
                  <span className="text-xs text-slate-400">{f.label}</span>
                  <select
                    multiple
                    value={(params as any)[f.name] ?? []}
                    onChange={(e) => {
                      const opts = Array.from(e.target.selectedOptions).map((o) => o.value);
                      debouncedSetParams((prev: any) => ({
                        ...prev,
                        [f.name]: opts.length ? opts : undefined,
                        page: 1,
                      }));
                    }}
                    className="border border-slate-700 bg-slate-800 rounded-md px-2 py-1 h-28 w-48 text-sm focus:ring-2 focus:ring-slate-600 scrollbar-thin scrollbar-thumb-slate-600"
                  >
                    {f.options.map((o) => (
                      <option key={o.value} value={o.value} className="py-1">
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            }
            return null;
          })}
        </div>
      </Card>

      {/* Table */}
      <Card className="shadow-md">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((c) => (
                  <TableHead key={String(c.key)}>{c.label}</TableHead>
                ))}
                <TableHead className="w-32">Дії</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <TableRow key={`sk-${i}`}>
                    {columns.map((_c, idx) => (
                      <TableCell key={idx}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                    <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} className="text-center text-destructive py-10">
                    Помилка: {error?.message}
                  </TableCell>
                </TableRow>
              ) : (
                data?.items.map((row: any) => (
                  <TableRow key={row.id}>
                    {columns.map((c) => (
                      <TableCell key={String(c.key)}>{c.render ? c.render(row) : row[c.key]}</TableCell>
                    ))}
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => openDialog(row)}>
                        Редагувати
                      </Button>
                      <Button size="sm" variant="destructive" className="ml-2" onClick={() => deleteMut.mutate(row.id)}>
                        Видалити
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Pagination with page size selector */}
      {!!totalPages && (
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Показати:</span>
            <Select
              value={String((params as any).page_size ?? PAGE_SIZE)}
              onValueChange={(val) => setParams((prev: any) => ({
                ...prev,
                page_size: Number(val),
                page: 1,
              }))}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">записів</span>
          </div>
          <Pagination 
            currentPage={(params as any).page || 1} 
            totalPages={totalPages} 
            onPageChange={(p) => setParams((prev: any) => ({ ...prev, page: p }))} 
          />
        </div>
      )}

      {/* Buttons */}
      <div className="mt-6 flex gap-4">
        <Button onClick={() => openDialog(null)}>Додати до довідника</Button>
        <Button variant="secondary" onClick={() => window.location.href = lostPath}>Дані, що потребують уточнення</Button>
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{current?.id ? 'Редагувати запис' : 'Додати запис'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {columns.map((c) => {
              if (c.key === 'id') return null;
              const opts = formSelectOptions[String(c.key)];
              if (opts) {
                return (
                  <div key={String(c.key)} className="flex flex-col gap-1">
                    <span className="text-xs text-slate-400">{c.label}</span>
                    <select
                      className="p-2 rounded bg-background border border-input"
                      value={(current as any)?.[c.key] ?? ''}
                      onChange={(e) => setCurrent((prev: any) => ({ ...prev, [c.key]: e.target.value || undefined }))}
                    >
                      <option value="">—</option>
                      {opts.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                );
              }
              return (
                <Input
                  key={String(c.key)}
                  placeholder={c.label}
                  value={(current as any)?.[c.key] ?? ''}
                  onChange={(e) => setCurrent((prev: any) => ({ ...prev, [c.key]: e.target.value || undefined }))}
                />
              );
            })}
          </div>
          {info && (<p className="text-center text-sm mt-2 text-emerald-500">{info}</p>)}
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline">Скасувати</Button>
            </DialogClose>
            <Button onClick={handleSave} className="bg-emerald-600 text-white">Зберегти</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
