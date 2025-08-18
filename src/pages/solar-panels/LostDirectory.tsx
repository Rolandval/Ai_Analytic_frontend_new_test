import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLostSolarPanels } from '@/hooks/useLostSolarPanels';
import { useCreateSolarPanel } from '@/hooks/useCreateSolarPanel';
import { useUpdateSolarPanel } from '@/hooks/useUpdateSolarPanel';
import { useDeleteSolarPanel } from '@/hooks/useDeleteSolarPanel';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { Card } from '@/components/ui/Card';

const PAGE_SIZE = 15;

const SolarPanelsLostDirectory = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error } = useLostSolarPanels(page, PAGE_SIZE);

  const addMut = useCreateSolarPanel();
  const updMut = useUpdateSolarPanel();
  const delMut = useDeleteSolarPanel();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [current, setCurrent] = useState<any | null>(null);

  const openDialog = (row: any | null = null) => {
    setCurrent(
      row ?? {
        full_name: '',
        brand: '',
        power: undefined,
        panel_type: undefined,
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

  const panels = data ? (data.solar_panels ?? data.panels ?? data.items ?? []) : [];
  const total = data ? (data.total ?? data.count ?? panels.length) : 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-4 md:p-6 bg-background text-foreground min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl md:text-3xl font-bold">Дані, які потребують уточнення: Сонячні панелі</h1>
        <Button variant="secondary" onClick={() => navigate('/solar-panels/directory')}>← Назад до довідника</Button>
      </div>

      {isLoading && <p>Завантаження...</p>}
      {isError && <p className="text-destructive">Помилка: {error?.message}</p>}

      {data && (
        <>
          <Card className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Повна назва</TableHead>
                  <TableHead>Бренд</TableHead>
                  <TableHead>Потужність (Вт)</TableHead>
                  <TableHead>Тип панелі</TableHead>
                  <TableHead>Cell Type</TableHead>
                  <TableHead>Товщина</TableHead>
                  <TableHead>Колір панелі</TableHead>
                  <TableHead>Колір рами</TableHead>
                  <TableHead className="w-32">Дії</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {panels.map((panel: any) => (
                  <TableRow key={panel.id}>
                    <TableCell className="font-medium">{panel.id}</TableCell>
                    <TableCell>{panel.full_name || '—'}</TableCell>
                    <TableCell>{panel.brand?.name ?? panel.brand ?? '—'}</TableCell>
                    <TableCell>{panel.power ?? '—'}</TableCell>
                    <TableCell>{panel.panel_type ?? '—'}</TableCell>
                    <TableCell>{panel.cell_type ?? '—'}</TableCell>
                    <TableCell>{panel.thickness ?? '—'}</TableCell>
                    <TableCell>{panel.panel_color ?? '—'}</TableCell>
                    <TableCell>{panel.frame_color ?? '—'}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => openDialog(panel)}>Редагувати</Button>
                      <Button size="sm" variant="destructive" className="ml-2" onClick={() => delMut.mutate(panel.id)}>Видалити</Button>
                    </TableCell>
                  </TableRow>
                    ))}
              </TableBody>
            </Table>
          </Card>
          <Pagination className="mt-4" currentPage={page} totalPages={totalPages} onPageChange={setPage} />

          {/* Dialog */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{current?.id ? 'Редагувати запис' : 'Додати сонячну панель'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input placeholder="Повна назва" value={current?.full_name || ''} onChange={e => setCurrent({ ...current, full_name: e.target.value })} />
                <Input placeholder="Бренд" value={current?.brand || ''} onChange={e => setCurrent({ ...current, brand: e.target.value })} />
                <Input placeholder="Потужність (Вт)" type="number" value={current?.power ?? ''} onChange={e => setCurrent({ ...current, power: Number(e.target.value) || undefined })} />
                <Input placeholder="Тип панелі" value={current?.panel_type || ''} onChange={e => setCurrent({ ...current, panel_type: e.target.value })} />
              </div>
              <DialogFooter className="mt-4">
                <DialogClose asChild>
                  <Button variant="outline">Скасувати</Button>
                </DialogClose>
                <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">Зберегти</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};

export default SolarPanelsLostDirectory;
