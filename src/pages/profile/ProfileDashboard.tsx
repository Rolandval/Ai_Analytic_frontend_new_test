import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/Checkbox';
import { aiServices } from '@/config/services';
import { 
  User, 
  Settings, 
  CreditCard, 
  Shield, 
  Check,
  ExternalLink,
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { UserProfile, ServiceSubscription } from '@/api/profileApi';

export default function ProfileDashboard() {
  // Мок-дані користувача
  const [userProfile] = useState<UserProfile>({
    id: 'user-1',
    name: 'Олександр Петренко',
    email: 'alex.petrenko@example.com',
    plan: 'pro',
    joinDate: '2024-01-15',
    settings: {
      notifications: true,
      language: 'uk',
      theme: 'light'
    }
  });

  // Мок-дані підписок на сервіси
  const [serviceSubscriptions] = useState<ServiceSubscription[]>([
    {
      id: '1',
      serviceId: '/ai-supply',
      serviceName: 'AI Supply Manager',
      plan: 'pro',
      isActive: true,
      activatedDate: '2024-01-20',
      features: ['Advanced analytics', 'Priority support'],
      billing: {
        amount: 999,
        currency: 'UAH',
        interval: 'monthly',
        nextBillingDate: '2024-02-20'
      }
    },
    {
      id: '2',
      serviceId: '/ai-analytic',
      serviceName: 'AI Analytics',
      plan: 'free',
      isActive: true,
      activatedDate: '2024-01-15',
      features: ['Basic analytics'],
      billing: {
        amount: 0,
        currency: 'UAH',
        interval: 'monthly'
      }
    },
    {
      id: '3',
      serviceId: '/ai-accountant',
      serviceName: 'AI Accountant',
      plan: 'enterprise',
      isActive: false,
      features: ['Full accounting suite', '24/7 support'],
      billing: {
        amount: 2999,
        currency: 'UAH',
        interval: 'monthly'
      }
    }
  ]);

  const allServices = aiServices;

  const getServiceSubscription = (serviceId: string): ServiceSubscription => {
    return serviceSubscriptions.find(sub => sub.serviceId === serviceId) || {
      id: 'temp',
      serviceId,
      serviceName: 'Unknown Service',
      plan: 'free',
      isActive: false,
      features: [],
      billing: {
        amount: 0,
        currency: 'UAH',
        interval: 'monthly'
      }
    };
  };

  const toggleService = (serviceId: string) => {
    // TODO: Implement service toggle logic
    console.log('Toggle service:', serviceId);
  };

  const activeServicesCount = serviceSubscriptions.filter(sub => sub.isActive).length;
  const totalServicesCount = allServices.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Заголовок */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-lg border border-white/20">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Профіль користувача
              </h1>
              <p className="text-gray-600">Управління акаунтом та сервісами</p>
            </div>
          </div>
        </div>

        {/* Інформація про користувача */}
        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Особиста інформація
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-600">Ім'я</p>
                <p className="font-semibold">{userProfile.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-semibold">{userProfile.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">План</p>
                <Badge variant={userProfile.plan === 'pro' ? 'default' : 'secondary'}>
                  {userProfile.plan.toUpperCase()}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600">Дата реєстрації</p>
                <p className="font-semibold">
                  {new Date(userProfile.joinDate).toLocaleDateString('uk-UA')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

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

        {/* Доступні сервіси */}
        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Доступні AI сервіси
            </CardTitle>
            <CardDescription>
              Активуйте потрібні сервіси для роботи з AI інструментами
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allServices.map((service) => {
                const subscription = getServiceSubscription(service.path);
                const IconComponent = service.icon;
                
                return (
                  <Card key={service.path} className="relative overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: service.color + '20', color: service.color }}
                        >
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-sm truncate">
                              {service.name}
                            </h3>
                            {subscription.isActive && (
                              <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2 mb-3">
                            {service.description}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={subscription.isActive}
                                onCheckedChange={() => toggleService(service.path)}
                              />
                              <Badge 
                                variant={subscription.plan === 'pro' ? 'default' : subscription.plan === 'enterprise' ? 'destructive' : 'secondary'}
                                className="text-xs"
                              >
                                {subscription.plan.toUpperCase()}
                              </Badge>
                            </div>
                            <Link to={service.path}>
                              <Button size="sm" variant="ghost" className="h-6 px-2" title="Відкрити сервіс">
                                <ExternalLink className="w-3 h-3" />
                              </Button>
                            </Link>
                          </div>
                          
                          {subscription.isActive && subscription.activatedDate && (
                            <p className="text-xs text-gray-500 mt-2">
                              Активовано: {new Date(subscription.activatedDate).toLocaleDateString('uk-UA')}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Швидкі дії */}
        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Швидкі дії
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link to="/profile/services">
                <Button variant="outline" className="w-full h-16 flex-col gap-2">
                  <Zap className="w-5 h-5" />
                  <span className="text-sm">Мої сервіси</span>
                </Button>
              </Link>
              
              <Link to="/profile/settings">
                <Button variant="outline" className="w-full h-16 flex-col gap-2">
                  <Settings className="w-5 h-5" />
                  <span className="text-sm">Налаштування</span>
                </Button>
              </Link>
              
              <Button variant="outline" className="w-full h-16 flex-col gap-2">
                <CreditCard className="w-5 h-5" />
                <span className="text-sm">Підписки</span>
              </Button>
              
              <Button variant="outline" className="w-full h-16 flex-col gap-2">
                <Shield className="w-5 h-5" />
                <span className="text-sm">Безпека</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
