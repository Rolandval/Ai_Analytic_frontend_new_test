import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Extension, UpdateExtensionDto } from '@/types/extensions';

interface EditExtensionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  extension: Extension;
  onSuccess: () => void;
}

export const EditExtensionModal = ({
  open,
  onOpenChange,
  extension,
  onSuccess,
}: EditExtensionModalProps) => {
  const [tableName, setTableName] = useState(extension.table_name);
  const [dbName, setDbName] = useState(extension.db_name);
  const [description, setDescription] = useState(extension.descriptions); // Changed from description to descriptions
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update form fields when extension prop changes
  useEffect(() => {
    if (extension) {
      setTableName(extension.table_name);
      setDbName(extension.db_name);
      setDescription(extension.descriptions); // Changed from description to descriptions
    }
  }, [extension]);

  const handleClose = () => {
    onOpenChange(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tableName || !dbName || !description) {
      setError('Всі поля повинні бути заповнені');
      return;
    }

    const updatedExtension: UpdateExtensionDto = {
      id: extension.id,
      table_name: tableName,
      db_name: dbName,
      descriptions: description, // Changed from description to descriptions
    };

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/extentions/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedExtension),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Помилка оновлення розширення');
      }

      // Success
      onSuccess();
    } catch (err: any) {
      console.error('Failed to update extension:', err);
      setError(err.message || 'Помилка при оновленні розширення');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-gray-900 border border-white/10 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium">Редагувати розширення</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/40 rounded text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="edit-tableName" className="text-sm font-medium text-gray-300">
              Назва таблиці
            </label>
            <Input
              id="edit-tableName"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="Введіть назву таблиці"
              className="bg-white/5 border-white/10"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="edit-dbName" className="text-sm font-medium text-gray-300">
              Назва бази даних
            </label>
            <Input
              id="edit-dbName"
              value={dbName}
              onChange={(e) => setDbName(e.target.value)}
              placeholder="Введіть назву бази даних"
              className="bg-white/5 border-white/10"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="edit-description" className="text-sm font-medium text-gray-300">
              Опис
            </label>
            <Textarea
              id="edit-description"
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
                  Оновлення...
                </>
              ) : (
                'Зберегти зміни'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
