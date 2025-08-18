import { useState } from 'react';
import { Loader2 } from 'lucide-react';
// імпортуємо API-функцію для ручного запуску імпорту
import { runBatteryGoogleTableImport } from '@/services/batteryGoogleTables.api';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/Dialog";
import { Input } from '@/components/ui/Input';
import {
  useGetBatteryGoogleTables,
  useAddBatteryGoogleTable,
  useUpdateBatteryGoogleTable,
  useDeleteBatteryGoogleTable,
} from '@/hooks/useBatteryGoogleTables';
import { GoogleTable } from '@/types/googleTable';

const BatteryGoogleTablesPage = () => {
  const { data = [], isLoading, refetch } = useGetBatteryGoogleTables();
  const addMut = useAddBatteryGoogleTable();
  const updMut = useUpdateBatteryGoogleTable();
  const delMut = useDeleteBatteryGoogleTable();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [current, setCurrent] = useState<Partial<GoogleTable> | null>(null);
  const [loadingImport, setLoadingImport] = useState<number | null>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);

  const openDialog = (row: Partial<GoogleTable> | null = null) => {
    setCurrent(row ? { ...row } : { name: '', doc_url: '', prompt: '' });
    setDialogOpen(true);
  };
  
  const handleRunImport = async (id: number) => {
    try {
      setImportResult(null);
      setLoadingImport(id);
      
      // Використовуємо API-функцію замість прямого axios
      const data = await runBatteryGoogleTableImport(id);
      
      setImportResult(data);
      setResultDialogOpen(true);
      
      // Оновлюємо список таблиць, щоб отримати актуальну дату оновлення
      refetch();
    } catch (error: any) {
      console.error('Помилка при імпорті даних:', error);
      setImportResult({
        error: true,
        message: error.response?.data?.detail || 'Сталася помилка при імпорті даних'
      });
      setResultDialogOpen(true);
    } finally {
      setLoadingImport(null);
    }
  };

  const handleSave = () => {
    if (!current) return;
    const payload = { name: current.name!, doc_url: current.doc_url!, prompt: current.prompt };
    if ('id' in current && current.id) {
      updMut.mutate({ id: current.id, data: payload });
    } else {
      addMut.mutate(payload);
    }
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Збережені таблиці (Акумулятори)</h1>
        <Button onClick={() => openDialog()}>Додати посилання</Button>
      </div>

      {isLoading ? (
        <p>Завантаження...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Назва</TableHead>
              <TableHead>Посилання</TableHead>
              <TableHead>Prompt</TableHead>
              <TableHead>Дата оновлення</TableHead>
              <TableHead>Дії</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.name}</TableCell>
                <TableCell>
                  <a href={row.doc_url} className="text-primary underline break-all" target="_blank" rel="noreferrer">
                    {row.doc_url}
                  </a>
                </TableCell>
                <TableCell className="max-w-[300px] truncate">{row.prompt || '—'}</TableCell>
                <TableCell>
                  {row.last_update 
                    ? new Date(row.last_update).toLocaleDateString('uk-UA', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) 
                    : '—'}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openDialog(row)}>
                      Редагувати
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => delMut.mutate(row.id)}>
                      Видалити
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="bg-emerald-600 hover:bg-emerald-700 min-w-[100px]"
                      onClick={() => handleRunImport(row.id)}
                      disabled={loadingImport === row.id}
                    >
                      {loadingImport === row.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Завантаження...
                        </>
                      ) : (
                        'Загрузити'
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{current?.id ? 'Редагувати' : 'Додати'} таблицю</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Назва"
              value={current?.name || ''}
              onChange={(e) => setCurrent({ ...current, name: e.target.value })}
            />
            <Input
              placeholder="URL Google Sheets"
              value={current?.doc_url || ''}
              onChange={(e) => setCurrent({ ...current, doc_url: e.target.value })}
            />
            <Input
              placeholder="Prompt (необов'язково)"
              value={current?.prompt || ''}
              onChange={(e) => setCurrent({ ...current, prompt: e.target.value })}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Скасувати</Button>
            </DialogClose>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">Зберегти</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resultDialogOpen} onOpenChange={setResultDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className={`text-xl font-bold ${importResult?.error ? 'text-red-500' : 'text-green-600'}`}>
              {importResult?.error 
                ? 'Помилка імпорту' 
                : 'Успішно імпортовано'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="max-h-[60vh] overflow-auto my-4">
            {importResult?.error ? (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4 rounded-md">
                <h3 className="text-red-700 dark:text-red-400 font-medium mb-2">Помилка:</h3>
                <p className="text-red-600 dark:text-red-400">{importResult.message}</p>
              </div>
            ) : importResult ? (
              <div className="space-y-4">
                {importResult.message && (
                  <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-4 rounded-md">
                    <p className="text-green-700 dark:text-green-400">{importResult.message}</p>
                  </div>
                )}
                
                {importResult.imported_records_count !== undefined && (
                  <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4 rounded-md">
                    <span className="font-medium dark:text-blue-300">Імпортовано записів:</span>
                    <span className="text-blue-700 dark:text-blue-300 font-bold text-lg">{importResult.imported_records_count}</span>
                  </div>
                )}
                
                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 rounded-md">
                    <h3 className="text-amber-700 dark:text-amber-400 font-medium mb-2">Попередження:</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {importResult.errors.map((error: string, idx: number) => (
                        <li key={idx} className="text-amber-600 dark:text-amber-400">{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {importResult.details && (
                  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 rounded-md">
                    <h3 className="text-slate-700 dark:text-slate-300 font-medium mb-2">Детальна інформація:</h3>
                    <pre className="whitespace-pre-wrap bg-white dark:bg-slate-800 p-3 rounded text-sm overflow-auto border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-300">
                      {JSON.stringify(importResult.details, null, 2)}
                    </pre>
                  </div>
                )}
                
                {/* Для інших полів, які ми не обробили окремо */}
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 rounded-md">
                  <h3 className="text-slate-700 dark:text-slate-300 font-medium mb-2">Повний результат:</h3>
                  <pre className="whitespace-pre-wrap bg-white dark:bg-slate-800 p-3 rounded text-sm overflow-auto border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-300">
                    {JSON.stringify(importResult, null, 2)}
                  </pre>
                </div>
              </div>
            ) : null}
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="default">Закрити</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BatteryGoogleTablesPage;
