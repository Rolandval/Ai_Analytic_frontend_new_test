// Мок-дані для системного статусу
export interface TokenBalance {
  source: string;
  tokens: number;
  cost: number;
  lastOperation: string;
  status: 'active' | 'inactive' | 'error';
}

export interface DatabaseStatus {
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  responseTime?: number;
}

export interface SystemStatus {
  cpuUsage: number;
  memoryUsage: number;
  uptime: string;
}

export interface SystemStatusResponse {
  tokenBalances: TokenBalance[];
  databaseStatus: DatabaseStatus[];
  systemStatus: SystemStatus;
}

// Мок-дані
const mockTokenBalances: TokenBalance[] = [
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

const mockDatabaseStatus: DatabaseStatus[] = [
  { name: 'MySQL', status: 'connected', responseTime: 12 },
  { name: 'PostgreSQL', status: 'connected', responseTime: 8 },
  { name: 'MSSQL', status: 'connected', responseTime: 15 },
  { name: 'Qdrant', status: 'connected', responseTime: 5 }
];

const mockSystemStatus: SystemStatus = {
  cpuUsage: Math.floor(Math.random() * 30) + 40, // 40-70%
  memoryUsage: Math.floor(Math.random() * 20) + 60, // 60-80%
  uptime: '2д 14г 30хв'
};

// Функція для симуляції затримки API
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const systemStatusApi = {
  // Отримати статус системи
  getSystemStatus: async (): Promise<SystemStatusResponse> => {
    await delay(500); // Симуляція затримки мережі
    return {
      tokenBalances: mockTokenBalances,
      databaseStatus: mockDatabaseStatus,
      systemStatus: mockSystemStatus
    };
  },

  // Отримати баланс токенів
  getTokenBalances: async (): Promise<TokenBalance[]> => {
    await delay(300);
    // Симулюємо зміни в балансі
    return mockTokenBalances.map(balance => ({
      ...balance,
      tokens: balance.tokens + Math.floor(Math.random() * 100) - 50,
      cost: balance.cost + (Math.random() * 2 - 1)
    }));
  },

  // Отримати статус БД
  getDatabaseStatus: async (): Promise<DatabaseStatus[]> => {
    await delay(200);
    // Симулюємо зміни в часі відгуку
    return mockDatabaseStatus.map(db => ({
      ...db,
      responseTime: db.responseTime ? db.responseTime + Math.floor(Math.random() * 10) - 5 : undefined
    }));
  },

  // Отримати статус системи (CPU, пам'ять, uptime)
  getSystemMetrics: async (): Promise<SystemStatus> => {
    await delay(100);
    return {
      cpuUsage: Math.floor(Math.random() * 30) + 40, // 40-70%
      memoryUsage: Math.floor(Math.random() * 20) + 60, // 60-80%
      uptime: mockSystemStatus.uptime
    };
  }
};
