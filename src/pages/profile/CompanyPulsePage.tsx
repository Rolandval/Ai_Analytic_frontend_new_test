import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import ProfileSidebar from '@/components/profile/ProfileSidebar';
import { 
  Activity, 
  Heart, 
  Wifi, 
  WifiOff, 
  Server, 
  Database, 
  Globe, 
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw
} from 'lucide-react';

interface MCPConnection {
  id: string;
  name: string;
  type: 'database' | 'api' | 'service' | 'integration';
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  lastPing: Date;
  responseTime: number;
  uptime: number;
  description: string;
}

export default function CompanyPulsePage() {
  const [connections, setConnections] = useState<MCPConnection[]>([
    {
      id: '1',
      name: 'PostgreSQL Database',
      type: 'database',
      status: 'connected',
      lastPing: new Date(),
      responseTime: 45,
      uptime: 99.8,
      description: 'Основна база даних компанії'
    },
    {
      id: '2',
      name: 'AI Analytics API',
      type: 'api',
      status: 'connected',
      lastPing: new Date(Date.now() - 2000),
      responseTime: 120,
      uptime: 98.5,
      description: 'API для аналітики та машинного навчання'
    },
    {
      id: '3',
      name: 'Payment Gateway',
      type: 'service',
      status: 'connected',
      lastPing: new Date(Date.now() - 1500),
      responseTime: 95,
      uptime: 98.2,
      description: 'Платіжний шлюз для обробки транзакцій'
    },
    {
      id: '4',
      name: 'Email Service',
      type: 'integration',
      status: 'connected',
      lastPing: new Date(Date.now() - 800),
      responseTime: 65,
      uptime: 99.1,
      description: 'Сервіс розсилки електронної пошти'
    },
    {
      id: '5',
      name: 'Cloud Storage',
      type: 'service',
      status: 'connected',
      lastPing: new Date(Date.now() - 1000),
      responseTime: 89,
      uptime: 99.9,
      description: 'Хмарне сховище для файлів та резервних копій'
    },
    {
      id: '6',
      name: 'Monitoring Service',
      type: 'service',
      status: 'connected',
      lastPing: new Date(Date.now() - 500),
      responseTime: 55,
      uptime: 99.3,
      description: 'Система моніторингу та алертів'
    }
  ]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Симуляція оновлення статусів
  useEffect(() => {
    const interval = setInterval(() => {
      setConnections(prev => prev.map(conn => {
        if (conn.status === 'connected') {
          return {
            ...conn,
            lastPing: new Date(),
            responseTime: Math.floor(Math.random() * 200) + 20
          };
        }
        return conn;
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: MCPConnection['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'disconnected':
        return <WifiOff className="w-4 h-4 text-gray-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Wifi className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: MCPConnection['status']) => {
    const variants = {
      connected: 'bg-green-100 text-green-800 border-green-200',
      disconnected: 'bg-gray-100 text-gray-800 border-gray-200',
      error: 'bg-red-100 text-red-800 border-red-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };

    const labels = {
      connected: 'Підключено',
      disconnected: 'Відключено',
      error: 'Помилка',
      pending: 'Очікування'
    };

    return (
      <Badge className={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const getTypeIcon = (type: MCPConnection['type']) => {
    switch (type) {
      case 'database':
        return <Database className="w-5 h-5 text-blue-500" />;
      case 'api':
        return <Globe className="w-5 h-5 text-purple-500" />;
      case 'service':
        return <Server className="w-5 h-5 text-orange-500" />;
      case 'integration':
        return <Zap className="w-5 h-5 text-indigo-500" />;
      default:
        return <Server className="w-5 h-5" />;
    }
  };

  const connectedCount = connections.filter(c => c.status === 'connected').length;
  const totalCount = connections.length;
  const healthPercentage = Math.round((connectedCount / totalCount) * 100);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Симуляція оновлення
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[260px,1fr] gap-6">
          <ProfileSidebar />
          <div className="space-y-8">
            
            {/* Загальний статус */}
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {healthPercentage > 80 ? (
                        <Heart className={`w-8 h-8 text-red-500 ${healthPercentage > 80 ? 'animate-pulse' : ''}`} />
                      ) : (
                        <Activity className="w-8 h-8 text-gray-400" />
                      )}
                      {healthPercentage > 80 && (
                        <div className="absolute -inset-1 bg-red-500/20 rounded-full animate-ping" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-2xl">Пульс компанії</CardTitle>
                      <CardDescription>
                        Моніторинг MCP з'єднань та системних сервісів
                      </CardDescription>
                    </div>
                  </div>
                  <Button 
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    variant="outline"
                    size="sm"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Оновити
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-1">
                      {connectedCount}/{totalCount}
                    </div>
                    <div className="text-sm text-gray-600">Активні з'єднання</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-1">
                      {healthPercentage}%
                    </div>
                    <div className="text-sm text-gray-600">Загальне здоров'я</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-1">
                      {Math.round(connections.filter(c => c.status === 'connected').reduce((acc, c) => acc + c.responseTime, 0) / connectedCount || 0)}ms
                    </div>
                    <div className="text-sm text-gray-600">Середній відгук</div>
                  </div>
                </div>

                {/* Пульсова лінія ЕКГ на всю ширину */}
                <div className="mt-6 h-24 bg-gray-50 rounded-lg p-4 relative overflow-hidden">
                  {healthPercentage > 80 ? (
                    <div className="w-full h-full relative">
                      {/* Базова лінія */}
                      <div className="absolute top-1/2 w-full h-0.5 bg-red-300/30"></div>
                      
                      {/* Анімована ЕКГ лінія */}
                      <svg className="w-full h-full" viewBox="0 0 800 80" preserveAspectRatio="none">
                        <defs>
                          <path 
                            id="heartbeat-path"
                            d="M0,40 L50,40 L60,20 L80,60 L100,10 L120,70 L140,40 L200,40 L210,35 L230,45 L250,40 L300,40 L310,30 L330,50 L350,40 L400,40 L410,25 L430,55 L450,40 L500,40 L510,20 L530,60 L550,15 L570,65 L590,40 L650,40 L660,35 L680,45 L700,40 L800,40"
                          />
                        </defs>
                        
                        <use 
                          href="#heartbeat-path" 
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth="2"
                          className="animate-pulse"
                        />
                        
                        {/* Рухомий пульс по ЕКГ кривій */}
                        <circle
                          r="4"
                          fill="#ef4444"
                          className="opacity-90"
                        >
                          <animateMotion
                            dur="4s"
                            repeatCount="indefinite"
                          >
                            <mpath href="#heartbeat-path"/>
                          </animateMotion>
                        </circle>
                        
                        {/* Світловий ефект за точкою */}
                        <circle
                          r="8"
                          fill="#ef4444"
                          className="opacity-20"
                        >
                          <animateMotion
                            dur="4s"
                            repeatCount="indefinite"
                          >
                            <mpath href="#heartbeat-path"/>
                          </animateMotion>
                        </circle>
                      </svg>
                      
                      {/* Додаткові пульсуючі точки */}
                      <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-red-500 rounded-full animate-ping" style={{ animationDelay: '0s' }}></div>
                      <div className="absolute top-1/2 left-2/4 w-2 h-2 bg-red-500 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
                      <div className="absolute top-1/2 left-3/4 w-2 h-2 bg-red-500 rounded-full animate-ping" style={{ animationDelay: '2s' }}></div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center relative">
                      <div className="w-full h-0.5 bg-gray-400 relative">
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                          <div className="text-center text-gray-500 text-sm bg-gray-50 px-4 py-1 rounded">
                            Система в критичному стані
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Список з'єднань */}
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
              <CardHeader>
                <CardTitle>MCP З'єднання</CardTitle>
                <CardDescription>
                  Статус всіх зовнішніх з'єднань та інтеграцій
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {connections.map((connection) => (
                    <div
                      key={connection.id}
                      className="flex items-center justify-between p-4 bg-gray-50/50 rounded-lg border"
                    >
                      <div className="flex items-center gap-4">
                        {getTypeIcon(connection.type)}
                        <div>
                          <div className="font-medium text-gray-900">
                            {connection.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {connection.description}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Останній пінг: {connection.lastPing.toLocaleTimeString('uk-UA')}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right text-sm">
                          <div className="font-medium">
                            {connection.status === 'connected' ? `${connection.responseTime}ms` : '—'}
                          </div>
                          <div className="text-gray-500">
                            {connection.uptime}% uptime
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {getStatusIcon(connection.status)}
                          {getStatusBadge(connection.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Історія подій */}
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
              <CardHeader>
                <CardTitle>Останні події</CardTitle>
                <CardDescription>
                  Журнал змін статусу з'єднань
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-gray-600">19:20</span>
                    <span>PostgreSQL Database відновлено з'єднання</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="text-gray-600">19:15</span>
                    <span>Payment Gateway втратив з'єднання</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <WifiOff className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">19:10</span>
                    <span>Email Service відключено для технічного обслуговування</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-gray-600">19:05</span>
                    <span>Cloud Storage успішно підключено</span>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}
