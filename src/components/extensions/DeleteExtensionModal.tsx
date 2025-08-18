import { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Extension } from '@/types/extensions';

interface DeleteExtensionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  extension: Extension;
  onSuccess: () => void;
}

export const DeleteExtensionModal = ({
  open,
  onOpenChange,
  extension,
  onSuccess,
}: DeleteExtensionModalProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    onOpenChange(false);
    setError(null);
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/extentions/delete?id=${extension.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Помилка видалення розширення');
      }

      // Success
      onSuccess();
    } catch (err: any) {
      console.error('Failed to delete extension:', err);
      setError(err.message || 'Помилка при видаленні розширення');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-gray-900 border border-white/10 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <span>Видалити розширення</span>
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-gray-300 mb-2">
            Ви впевнені, що хочете видалити розширення:
          </p>
          <p className="font-medium text-white bg-black/30 p-3 rounded-md border border-white/10">
            {extension.table_name}
          </p>

          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/40 rounded text-sm text-red-200">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
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
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border-0"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Видалення...
              </>
            ) : (
              'Видалити'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
