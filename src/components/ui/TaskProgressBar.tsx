import React from 'react';
import { Progress } from '@/components/ui/Progress';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface TaskProgressData {
  status: 'started' | 'finished' | 'error' | 'done';
  table?: string;
  updated_prices?: number;
  error?: string;
  total_updated_prices?: number;
  results?: Array<{ name: string; updated_prices: number }>;
}

interface TaskProgressBarProps {
  isVisible: boolean;
  progress: number;
  currentTables: string[]; // Changed to array for multiple tables
  completedTables: string[];
  totalTables: number;
  totalUpdatedPrices: number;
  supplierPrices: Array<{ name: string; updated_prices: number }>;
  errors: Array<{ table: string; error: string }>;
  isComplete: boolean;
}

const TaskProgressBar: React.FC<TaskProgressBarProps> = ({
  isVisible,
  progress,
  currentTables,
  completedTables,
  totalTables,
  totalUpdatedPrices,
  supplierPrices,
  errors,
  isComplete,
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80 z-50">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Виконання завдання</h3>
          {isComplete ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
          )}
        </div>

        <Progress value={progress} className="w-full" />
        
        <div className="text-sm text-gray-600">
          <div>Прогрес: {completedTables.length} з {totalTables} таблиць</div>
          <div>Оновлено цін: {totalUpdatedPrices}</div>
        </div>

        {currentTables.length > 0 && !isComplete && (
          <div className="text-sm">
            <span className="text-blue-600">Завантажуються зараз ({currentTables.length}): </span>
            <div className="mt-1 max-h-20 overflow-y-auto">
              {currentTables.map((table, index) => (
                <div key={index} className="flex items-center text-xs text-blue-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                  <span className="font-medium truncate">{table}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {completedTables.length > 0 && (
          <div className="max-h-32 overflow-y-auto">
            <div className="text-xs text-gray-500 mb-1">Завершені таблиці:</div>
            {completedTables.map((table, index) => {
              const supplierData = supplierPrices.find(s => s.name === table);
              const pricesCount = supplierData?.updated_prices || 0;
              return (
                <div key={index} className="flex items-center justify-between text-xs text-green-600">
                  <div className="flex items-center">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    <span className="truncate">{table}</span>
                  </div>
                  {pricesCount > 0 && (
                    <span className="ml-2 bg-green-100 text-green-800 px-1 rounded text-xs font-medium">
                      +{pricesCount}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {errors.length > 0 && (
          <div className="max-h-24 overflow-y-auto">
            <div className="text-xs text-red-500 mb-1">Помилки:</div>
            {errors.map((error, index) => (
              <div key={index} className="flex items-start text-xs text-red-600">
                <XCircle className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium">{error.table}</div>
                  <div className="text-red-500">{error.error}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {isComplete && (
          <div className="text-sm font-medium text-green-600">
            Завдання завершено успішно!
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskProgressBar;
export type { TaskProgressData };
