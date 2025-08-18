import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLostInverters } from '@/hooks/useLostInverters';
import { useCreateInverter } from '@/hooks/useCreateInverter';
import { useUpdateInverter } from '@/hooks/useUpdateInverter';
import { useDeleteInverter } from '@/hooks/useDeleteInverter';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { Card } from '@/components/ui/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';

export const InvertersLostDirectory = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const { data, isLoading, isError, error } = useLostInverters(page, pageSize);

  const addMut = useCreateInverter();
  const updMut = useUpdateInverter();
  const delMut = useDeleteInverter();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [current, setCurrent] = useState<any | null>(null);

  const openDialog = (row: any | null = null) => {
    setCurrent(
      row ?? {
        full_name: '',
        brand: '',
        power_w: undefined,
        voltage_v: undefined,
        phases: undefined,
        region: undefined,
      },
    );
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
        <h1 className="text-2xl md:text-3xl font-bold">Дані, які потребують уточнення: Інвертори</h1>
        <Button variant="secondary" onClick={() => navigate('/inverters/directory')}>← Назад до довідника</Button>
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
                  <TableHead>Потужність (Вт)</TableHead>
                  <TableHead>К-ть фаз</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Покоління</TableHead>
                  <TableHead>Стрінги</TableHead>
                  <TableHead>ПЗ</TableHead>
                  <TableHead className="w-32">Дії</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.inverters.map((inv: any) => (
                  <TableRow key={inv.id}>
                    <TableCell>{inv.full_name || '—'}</TableCell>
                    <TableCell>{inv.brand || '—'}</TableCell>
                    <TableCell>{inv.power_w ?? '—'}</TableCell>
                    <TableCell>{inv.phases ?? '—'}</TableCell>
                     <TableCell>{inv.inverter_type ?? '—'}</TableCell>
                     <TableCell>{inv.generation ?? '—'}</TableCell>
                     <TableCell>{inv.string_count ?? '—'}</TableCell>
                     <TableCell>{inv.firmware ?? '—'}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => openDialog(inv)}>Редагувати</Button>
                      <Button size="sm" variant="destructive" className="ml-2" onClick={() => delMut.mutate(inv.id)}>Видалити</Button>
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
            <DialogTitle>{current?.id ? 'Редагувати запис' : 'Додати інвертор'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Повна назва" value={current?.full_name || ''} onChange={e => setCurrent({ ...current, full_name: e.target.value })} />
            <Input placeholder="Бренд" value={current?.brand || ''} onChange={e => setCurrent({ ...current, brand: e.target.value })} />
            <Input placeholder="Потужність (Вт)" type="number" value={current?.power_w ?? ''} onChange={e => setCurrent({ ...current, power_w: Number(e.target.value) || undefined })} />
            <Input placeholder="К-ть фаз" type="number" value={current?.phases ?? ''} onChange={e => setCurrent({ ...current, phases: Number(e.target.value) || undefined })} />
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

export default InvertersLostDirectory;
