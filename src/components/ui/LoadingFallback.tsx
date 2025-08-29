import { Loader2 } from 'lucide-react';

interface LoadingFallbackProps {
  message?: string;
  className?: string;
}

export const LoadingFallback = ({ 
  message = "Завантаження...", 
  className = "" 
}: LoadingFallbackProps) => {
  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};

// Спеціалізовані fallback компоненти
export const TableLoadingFallback = () => (
  <LoadingFallback 
    message="Завантаження таблиці..." 
    className="min-h-[400px]"
  />
);

export const ChartLoadingFallback = () => (
  <LoadingFallback 
    message="Завантаження графіків..." 
    className="min-h-[300px]"
  />
);

export const FormLoadingFallback = () => (
  <LoadingFallback 
    message="Завантаження форми..." 
    className="min-h-[200px]"
  />
);
