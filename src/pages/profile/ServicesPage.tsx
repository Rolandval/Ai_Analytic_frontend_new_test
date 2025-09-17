import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import ServiceManager from '@/components/profile/ServiceManager';
import { aiServices } from '@/config/services';
import { Search, Filter, Grid, List } from 'lucide-react';

interface ServiceSubscription {
  serviceId: string;
  isActive: boolean;
  plan: 'free' | 'pro' | 'enterprise';
  activatedDate?: string;
  usage?: {
    current: number;
    limit: number;
    unit: string;
  };
}

const ServicesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterPlan, setFilterPlan] = useState<'all' | 'free' | 'pro' | 'enterprise'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Мок-дані підписок
  const [serviceSubscriptions, setServiceSubscriptions] = useState<ServiceSubscription[]>([
    { 
      serviceId: '/', 
      isActive: true, 
      plan: 'pro', 
      activatedDate: '2024-01-15',
      usage: { current: 1250, limit: 5000, unit: 'запитів' }
    },
    { 
      serviceId: '/ai-product-filler', 
      isActive: true, 
      plan: 'pro', 
      activatedDate: '2024-02-01',
      usage: { current: 850, limit: 2000, unit: 'товарів' }
    },
    { 
      serviceId: '/ai-content', 
      isActive: true, 
      plan: 'free', 
      activatedDate: '2024-02-15',
      usage: { current: 45, limit: 50, unit: 'статей' }
    },
    { serviceId: '/ai-supply', isActive: false, plan: 'free' },
    { serviceId: '/ai-forecast', isActive: false, plan: 'free' },
    { serviceId: '/ai-ads', isActive: false, plan: 'free' },
    { serviceId: '/ai-accountant', isActive: false, plan: 'free' },
  ]);

  const allServices = aiServices;

  const toggleService = (serviceId: string) => {
    setServiceSubscriptions(prev => {
      const existing = prev.find(sub => sub.serviceId === serviceId);
      if (existing) {
        return prev.map(sub =>
          sub.serviceId === serviceId
            ? {
                ...sub,
                isActive: !sub.isActive,
                activatedDate: !sub.isActive
                  ? new Date().toISOString().split('T')[0]
                  : sub.activatedDate,
              }
            : sub
        );
      }
      // Додати нову підписку, якщо її не існує
      return [
        ...prev,
        {
          serviceId,
          isActive: true,
          plan: 'free' as const,
          activatedDate: new Date().toISOString().split('T')[0],
        },
      ];
    });
  };

  const upgradePlan = (serviceId: string, newPlan: 'free' | 'pro' | 'enterprise') => {
    setServiceSubscriptions(prev => 
      prev.map(sub => 
        sub.serviceId === serviceId 
          ? { ...sub, plan: newPlan }
          : sub
      )
    );
  };

  const removeService = (serviceId: string) => {
    setServiceSubscriptions(prev => prev.filter(sub => sub.serviceId !== serviceId));
  };

  // Фільтрація сервісів
  const filteredServices = allServices.filter(service => {
    const subscription = serviceSubscriptions.find(sub => sub.serviceId === service.path);
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && subscription?.isActive) ||
                         (filterStatus === 'inactive' && !subscription?.isActive);
    
    const matchesPlan = filterPlan === 'all' || subscription?.plan === filterPlan;
    
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const activeServicesCount = serviceSubscriptions.filter(sub => sub.isActive).length;
  const totalServicesCount = allServices.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Заголовок */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-lg border border-white/20">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Grid className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Мої AI сервіси
              </h1>
              <p className="text-gray-600">Управління підключеними інструментами</p>
            </div>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{activeServicesCount}</div>
              <div className="text-sm text-gray-600">Активні сервіси</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{totalServicesCount - activeServicesCount}</div>
              <div className="text-sm text-gray-600">Доступні для активації</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {serviceSubscriptions.filter(sub => sub.plan === 'pro').length}
              </div>
              <div className="text-sm text-gray-600">Pro підписки</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">₴2997</div>
              <div className="text-sm text-gray-600">Місячна вартість</div>
            </CardContent>
          </Card>
        </div>

        {/* Фільтри та пошук */}
        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Пошук сервісів..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Статус" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Всі сервіси</SelectItem>
                    <SelectItem value="active">Активні</SelectItem>
                    <SelectItem value="inactive">Неактивні</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filterPlan} onValueChange={(value: any) => setFilterPlan(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="План" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Всі плани</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex border rounded-md">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-r-none"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-l-none"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Активні фільтри */}
            <div className="flex gap-2 mt-4">
              {searchTerm && (
                <Badge variant="secondary" className="gap-1">
                  Пошук: {searchTerm}
                  <button onClick={() => setSearchTerm('')} className="ml-1 hover:bg-gray-300 rounded-full p-0.5">
                    ×
                  </button>
                </Badge>
              )}
              {filterStatus !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Статус: {filterStatus === 'active' ? 'Активні' : 'Неактивні'}
                  <button onClick={() => setFilterStatus('all')} className="ml-1 hover:bg-gray-300 rounded-full p-0.5">
                    ×
                  </button>
                </Badge>
              )}
              {filterPlan !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  План: {filterPlan.toUpperCase()}
                  <button onClick={() => setFilterPlan('all')} className="ml-1 hover:bg-gray-300 rounded-full p-0.5">
                    ×
                  </button>
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Результати пошуку */}
        {filteredServices.length === 0 ? (
          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
            <CardContent className="p-12 text-center">
              <Filter className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">Сервіси не знайдено</h3>
              <p className="text-gray-600">Спробуйте змінити критерії пошуку або фільтри</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                Знайдено сервісів: {filteredServices.length}
              </h2>
            </div>
            
            <ServiceManager
              subscriptions={serviceSubscriptions}
              onToggleService={toggleService}
              onUpgradePlan={upgradePlan}
              onRemoveService={removeService}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ServicesPage;
