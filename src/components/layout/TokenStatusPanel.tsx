import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Database, Cpu, DollarSign, Coins, Server, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { useTokenBalances, useDatabaseStatus, useSystemMetrics } from '@/hooks/useSystemStatus';
import type { TokenBalance, DatabaseStatus, SystemStatus } from '@/api/systemStatusApi';

// Fallback дані (якщо API недоступне)
const fallbackTokenBalances: TokenBalance[] = [
  {
    source: 'OpenAI',
    tokens: 15420,
    cost: 23.45,
    lastOperation: '2 хв тому',
    status: 'active'
  },
  {
    source: 'Gemini',
    tokens: 8750,
    cost: 12.30,
    lastOperation: '5 хв тому',
    status: 'active'
  },
  {
    source: 'Oper Router',
    tokens: 3200,
    cost: 5.80,
    lastOperation: '1 год тому',
    status: 'inactive'
  }
];

const fallbackDatabaseStatus: DatabaseStatus[] = [
  { name: 'MySQL', status: 'connected', responseTime: 12 },
  { name: 'PostgreSQL', status: 'connected', responseTime: 8 },
  { name: 'MSSQL', status: 'connected', responseTime: 15 },
  { name: 'Qdrant', status: 'connected', responseTime: 5 }
];

const fallbackSystemStatus: SystemStatus = {
  cpuUsage: 45,
  memoryUsage: 68,
  uptime: '2д 14г 30хв'
};

export const TokenStatusPanel: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Використовуємо хуки для отримання даних (з fallback на мок-дані)
  const { data: tokenBalances, isLoading: tokensLoading, error: tokensError } = useTokenBalances();
  const { data: databaseStatus, isLoading: dbLoading, error: dbError } = useDatabaseStatus();
  const { data: systemMetrics, isLoading: systemLoading, error: systemError } = useSystemMetrics();
  
  // Використовуємо fallback дані якщо API недоступне
  const displayTokenBalances = tokenBalances || fallbackTokenBalances;
  const displayDatabaseStatus = databaseStatus || fallbackDatabaseStatus;
  const displaySystemMetrics = systemMetrics || fallbackSystemStatus;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active':
        return 'bg-green-500';
      case 'disconnected':
      case 'inactive':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'підключено';
      case 'active':
        return 'активний';
      case 'disconnected':
        return 'відключено';
      case 'inactive':
        return 'неактивний';
      case 'error':
        return 'помилка';
      default:
        return 'невідомо';
    }
  };

  const totalTokens = displayTokenBalances.reduce((sum: number, balance: TokenBalance) => sum + balance.tokens, 0);
  const totalCost = displayTokenBalances.reduce((sum: number, balance: TokenBalance) => sum + balance.cost, 0);
  
  // Перевіряємо чи є помилки або завантаження
  const hasErrors = tokensError || dbError || systemError;
  const isLoading = tokensLoading || dbLoading || systemLoading;

  return (
    <div className="fixed right-0 bottom-0 z-50 w-64 bg-white dark:bg-neutral-900 border-l border-t border-border shadow-lg">
      {/* Кнопка розгортання/згортання */}
      <Button
        variant="ghost"
        size="sm"
        className="w-full h-8 rounded-none border-b border-border flex items-center justify-between px-2"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-1.5">
          {isLoading ? (
            <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
          ) : hasErrors ? (
            <Server className="w-3 h-3 text-red-500" />
          ) : (
            <Server className="w-3 h-3 text-green-500" />
          )}
          <span className="text-xs font-medium">
            {isLoading ? 'Завантаження...' : hasErrors ? 'Помилка' : 'Статус'}
          </span>
        </div>
        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
      </Button>

      {/* Розгорнутий контент */}
      {isExpanded && (
        <div className="p-3 space-y-3 max-h-80 overflow-y-auto">
          {/* Загальний баланс токенів */}
          <Card className="p-2">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <Coins className="w-3 h-3 text-blue-500" />
                <span className="text-xs font-medium">Баланс</span>
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Токени:</span>
                <span className="font-medium">{totalTokens.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Вартість:</span>
                <span className="font-medium">${totalCost.toFixed(2)}</span>
              </div>
            </div>
          </Card>

          {/* Детальний баланс по джерелах */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-medium flex items-center gap-1.5">
              <DollarSign className="w-3 h-3  " />
              Джерела
            </h4>
            {displayTokenBalances.map((balance: TokenBalance, index: number) => (
              <Card key={index} className="p-1.5">
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(balance.status)}`} />
                    <span className="text-xs font-medium">{balance.source}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] px-1 py-0">
                    {getStatusText(balance.status)}
                  </Badge>
                </div>
                <div className="space-y-0.5 text-[10px] text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Токени:</span>
                    <span>{balance.tokens.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Вартість:</span>
                    <span>${balance.cost.toFixed(2)}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Статус БД */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-medium flex items-center gap-1.5">
              <Database className="w-3 h-3 text-blue-500" />
              БД
            </h4>
            <div className="grid grid-cols-2 gap-1">
              {displayDatabaseStatus.map((db: DatabaseStatus, index: number) => (
                <div key={index} className="flex items-center gap-1.5 p-1.5 rounded-md bg-muted/50">
                  <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(db.status)}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-medium truncate">{db.name}</div>
                    <div className="text-[9px] text-muted-foreground">
                      {db.responseTime ? `${db.responseTime}ms` : getStatusText(db.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Статус системи */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-medium flex items-center gap-1.5">
              <Cpu className="w-3 h-3 text-purple-500" />
              Система
            </h4>
            <Card className="p-1.5">
              <div className="space-y-0.5 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CPU:</span>
                  <span className="font-medium">{displaySystemMetrics.cpuUsage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Пам'ять:</span>
                  <span className="font-medium">{displaySystemMetrics.memoryUsage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Uptime:</span>
                  <span className="font-medium">{displaySystemMetrics.uptime}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
