/**
 * Індикатор кешу
 * Показується коли дані завантажено з кешу
 */

import { Badge } from '@/components/ui/Badge';

interface CacheIndicatorProps {
  className?: string;
}

export function CacheIndicator({ className }: CacheIndicatorProps) {
  return (
    <Badge
      variant="secondary"
      className={`text-xs px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 ${className || ''}`}
      title="Дані завантажено з кешу. Оновлення у фоновому режимі..."
    >
      📦 Кеш
    </Badge>
  );
}
