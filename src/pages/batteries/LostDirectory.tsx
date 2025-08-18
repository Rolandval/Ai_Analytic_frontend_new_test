import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLostBatteries } from '@/hooks/useLostBatteries';
import { useCreateBattery } from '@/hooks/useCreateBattery';
import { useUpdateBattery } from '@/hooks/useUpdateBattery';
import { useDeleteBattery } from '@/hooks/useDeleteBattery';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { Card } from '@/components/ui/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';

export const BatteriesLostDirectory = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const { data, isLoading, isError, error } = useLostBatteries(page, pageSize);

  const addMut = useCreateBattery();
  const updMut = useUpdateBattery();
  const delMut = useDeleteBattery();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [current, setCurrent] = useState<any | null>(null);

  const openDialog = (row: any | null = null) => {
    setCurrent(row ? { ...row } : { full_name: '', brand: '', volume: undefined, c_amps: undefined });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!current) return;
    if ('id' in current && current.id) {
      const { id, ...rest } = current;
      updMut.mutate({ id, data: rest });
    } else {
      addMut.mutate(current);
    }
    setDialogOpen(false);
  };

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  return (
    <div className="p-4 md:p-6 bg-background text-foreground min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl md:text-3xl font-bold">Дані, які потребують уточнення: Акумулятори</h1>
        <Button variant="secondary" onClick={() => navigate('/batteries/directory')}>← Назад до довідника</Button>
      </div>

      {isLoading && <p>Завантаження...</p>}
      {isError && <p className="text-destructive">Помилка: {error?.message}</p>}

      {data && (
        <>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Повна назва</TableHead>
                  <TableHead>Бренд</TableHead>
                  <TableHead>Об'єм</TableHead>
                  <TableHead>Пуск. струм</TableHead>
                  <TableHead>Регіон</TableHead>
                  <TableHead>Полярність</TableHead>
                  <TableHead>Електроліт</TableHead>
                  <TableHead className="w-32">Дії</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.batteries.map((battery: any) => (
                  <TableRow key={battery.id}>
                    <TableCell>{battery.full_name || '—'}</TableCell>
                    <TableCell>{battery.brand || '—'}</TableCell>
                    <TableCell>{battery.volume ?? '—'}</TableCell>
                    <TableCell>{battery.c_amps ?? '—'}</TableCell>
                    <TableCell>{battery.region ?? '—'}</TableCell>
                    <TableCell>{battery.polarity ?? '—'}</TableCell>
                    <TableCell>{battery.electrolyte ?? '—'}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => openDialog(battery)}>Редагувати</Button>
                      <Button size="sm" variant="destructive" className="ml-2" onClick={() => delMut.mutate(battery.id)}>Видалити</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          <Pagination className="mt-4" currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{current?.id ? 'Редагувати запис' : 'Додати акумулятор'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Повна назва" value={current?.full_name || ''} onChange={e => setCurrent({ ...current, full_name: e.target.value })} />
            <Input placeholder="Бренд" value={current?.brand || ''} onChange={e => setCurrent({ ...current, brand: e.target.value })} />
            <Input placeholder="Обʼєм" type="number" value={current?.volume ?? ''} onChange={e => setCurrent({ ...current, volume: Number(e.target.value) || undefined })} />
            <Input placeholder="C-Ампер" type="number" value={current?.c_amps ?? ''} onChange={e => setCurrent({ ...current, c_amps: Number(e.target.value) || undefined })} />
          </div>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline">Скасувати</Button>
            </DialogClose>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">Зберегти</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BatteriesLostDirectory;
