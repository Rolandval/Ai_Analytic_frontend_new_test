import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RefreshDataButtonProps {
  onRefresh: () => Promise<any>;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary';
}

export function RefreshDataButton({ 
  onRefresh, 
  className,
  variant = 'outline'
}: RefreshDataButtonProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleRefresh = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const data = await onRefresh();
      setResult('Дані успішно оновлено!');
      console.log('Оновлення даних:', data);
    } catch (error) {
      setResult('Помилка при оновленні даних. Спробуйте пізніше.');
      console.error('Помилка при оновленні даних:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <Button 
        onClick={handleRefresh}
        disabled={loading}
        variant={variant}
        size="sm"
        className={cn(
          "transition-all duration-200 ease-in-out",
          "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50",
          className
        )}
      >
        {loading ? (
          <>
            <Loader2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
            <span className="hidden sm:inline">Оновлення...</span>
            <span className="sm:hidden">Оновл...</span>
          </>
        ) : (
          <>
            <RefreshCw className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span>Оновити</span>
          </>
        )}
      </Button>
      
      {result && (
        <div className={cn(
          "text-xs sm:text-sm mt-1 animate-fadeIn transition-all",
          result.includes('Помилка') ? 'text-red-500' : 'text-green-500'
        )}>
          {result}
        </div>
      )}
    </div>
  );
}
