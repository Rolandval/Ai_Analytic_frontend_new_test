import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { CreateExtensionDto } from '@/types/extensions';

interface CreateExtensionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreateExtensionModal = ({
  open,
  onOpenChange,
  onSuccess,
}: CreateExtensionModalProps) => {
  const [tableName, setTableName] = useState('');
  const [dbName, setDbName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setTableName('');
    setDbName('');
    setDescription('');
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tableName || !dbName || !description) {
      setError('Всі поля повинні бути заповнені');
      return;
    }

    const newExtension: CreateExtensionDto = {
      table_name: tableName,
      db_name: dbName,
      descriptions: description, // Changed from description to descriptions
    };

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/extentions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newExtension),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Помилка створення розширення');
      }

      // Success
      resetForm();
      onSuccess();
    } catch (err: any) {
      console.error('Failed to create extension:', err);
      setError(err.message || 'Помилка при створенні розширення');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-gray-900 border border-white/10 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium">Нове AI розширення</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/40 rounded text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="tableName" className="text-sm font-medium text-gray-300">
              Назва таблиці
            </label>
            <Input
              id="tableName"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="Введіть назву таблиці"
              className="bg-white/5 border-white/10"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="dbName" className="text-sm font-medium text-gray-300">
              Назва бази даних
            </label>
            <Input
              id="dbName"
              value={dbName}
              onChange={(e) => setDbName(e.target.value)}
              placeholder="Введіть назву бази даних"
              className="bg-white/5 border-white/10"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-gray-300">
              Опис
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Опишіть призначення розширення"
              rows={4}
              className="bg-white/5 border-white/10 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="border-white/10 hover:bg-white/5"
              disabled={loading}
            >
              Скасувати
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Створення...
                </>
              ) : (
                'Створити розширення'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
