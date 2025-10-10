/**
 * Діалог для відображення статистики кешу
 * Можна додати в меню налаштувань або як окрему кнопку
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog';
import { cacheManager, type CacheStats } from '@/utils/cacheManager';
import { dataCache } from '@/utils/dataCache';
import { Database, Trash2, RefreshCw, Info } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function CacheStatsDialog() {
  const [open, setOpen] = useState(false);
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (open) {
      loadStats();
    }
  }, [open]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await cacheManager.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load cache stats:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося завантажити статистику кешу',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = async () => {
    if (!confirm('Ви впевнені, що хочете очистити весь кеш? Це не вплине на збережені дані, але наступне завантаження буде повільнішим.')) {
      return;
    }

    setClearing(true);
    try {
      await dataCache.clearAll();
      toast({
        title: 'Успіх',
        description: 'Кеш успішно очищено',
      });
      await loadStats();
    } catch (error) {
      console.error('Failed to clear cache:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося очистити кеш',
        variant: 'destructive',
      });
    } finally {
      setClearing(false);
    }
  };

  const formatSize = (sizeKB: number): string => {
    if (sizeKB < 1024) {
      return `${sizeKB} KB`;
    }
    return `${(sizeKB / 1024).toFixed(2)} MB`;
  };

  const hasCache = stats && (stats.productsCount > 0 || stats.categoriesCount > 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Database className="h-4 w-4" />
          Кеш
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Статистика кешу
          </DialogTitle>
          <DialogDescription>
            Інформація про локально збережені дані для швидкого завантаження
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : stats ? (
            <>
              {/* Товари */}
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium flex items-center gap-2">
                    📦 Товари
                    {stats.productsLang && (
                      <Badge variant="secondary" className="text-xs">
                        {stats.productsLang.toUpperCase()}
                      </Badge>
                    )}
                  </h3>
                  {stats.productsCount > 0 && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300">
                      Активний
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {stats.productsCount > 0 ? (
                    <>
                      <div>Записів: <strong>{stats.productsCount}</strong></div>
                      {stats.productsAge !== null && (
                        <div>Вік: {cacheManager.formatAge(stats.productsAge)}</div>
                      )}
                    </>
                  ) : (
                    <div className="text-gray-400">Кеш порожній</div>
                  )}
                </div>
              </div>

              {/* Категорії */}
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium flex items-center gap-2">
                    📁 Категорії
                    {stats.categoriesLang && (
                      <Badge variant="secondary" className="text-xs">
                        {stats.categoriesLang.toUpperCase()}
                      </Badge>
                    )}
                  </h3>
                  {stats.categoriesCount > 0 && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300">
                      Активний
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {stats.categoriesCount > 0 ? (
                    <>
                      <div>Записів: <strong>{stats.categoriesCount}</strong></div>
                      {stats.categoriesAge !== null && (
                        <div>Вік: {cacheManager.formatAge(stats.categoriesAge)}</div>
                      )}
                    </>
                  ) : (
                    <div className="text-gray-400">Кеш порожній</div>
                  )}
                </div>
              </div>

              {/* Загальна інформація */}
              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-900 dark:text-blue-100 space-y-1">
                    <div>
                      <strong>Приблизний розмір:</strong> {formatSize(stats.totalSize)}
                    </div>
                    <div className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                      Кеш зберігається локально в браузері та автоматично оновлюється при завантаженні сторінки.
                      Термін дії: 24 години.
                    </div>
                  </div>
                </div>
              </div>

              {/* Переваги кешування */}
              {hasCache && (
                <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4">
                  <div className="text-sm text-green-900 dark:text-green-100">
                    <div className="font-medium mb-2">✅ Переваги кешування:</div>
                    <ul className="space-y-1 text-xs text-green-700 dark:text-green-300">
                      <li>• Миттєве завантаження сторінки</li>
                      <li>• Зменшене навантаження на сервер</li>
                      <li>• Робота при повільному інтернеті</li>
                      <li>• Автоматичне оновлення у фоні</li>
                    </ul>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-400">
              Немає даних
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={loadStats}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Оновити
          </Button>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearCache}
              disabled={clearing || !hasCache}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Очистити кеш
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Закрити
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
