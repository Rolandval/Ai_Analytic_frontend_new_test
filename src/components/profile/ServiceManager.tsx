import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import { Checkbox } from '@/components/ui/Checkbox';
import { aiServices, currentService } from '@/config/services';
import { 
  Plus, 
  Settings, 
  Trash2, 
  ExternalLink, 
  Crown, 
  Zap, 
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';

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

interface ServiceManagerProps {
  subscriptions: ServiceSubscription[];
  onToggleService: (serviceId: string) => void;
  onUpgradePlan: (serviceId: string, newPlan: 'free' | 'pro' | 'enterprise') => void;
  onRemoveService: (serviceId: string) => void;
}

const ServiceManager: React.FC<ServiceManagerProps> = ({
  subscriptions,
  onToggleService,
  onUpgradePlan,
  onRemoveService
}) => {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);

  const allServices = [currentService, ...aiServices];

  const getServiceSubscription = (serviceId: string) => {
    return subscriptions.find(sub => sub.serviceId === serviceId) || 
           { serviceId, isActive: false, plan: 'free' as const };
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'enterprise': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'pro': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'enterprise': return <Crown className="w-3 h-3" />;
      case 'pro': return <Zap className="w-3 h-3" />;
      default: return null;
    }
  };

  const getPlanPrice = (plan: string) => {
    switch (plan) {
      case 'enterprise': return '₴2999/міс';
      case 'pro': return '₴999/міс';
      default: return 'Безкоштовно';
    }
  };

  const getUsageStatus = (usage?: ServiceSubscription['usage']) => {
    if (!usage) return null;
    
    const percentage = (usage.current / usage.limit) * 100;
    
    if (percentage >= 90) {
      return { color: 'text-red-600', icon: AlertTriangle, text: 'Ліміт майже вичерпано' };
    } else if (percentage >= 70) {
      return { color: 'text-yellow-600', icon: Clock, text: 'Помірне використання' };
    } else {
      return { color: 'text-green-600', icon: CheckCircle, text: 'Нормальне використання' };
    }
  };

  const activeServices = subscriptions.filter(sub => sub.isActive);
  const availableServices = allServices.filter(service => 
    !subscriptions.some(sub => sub.serviceId === service.path && sub.isActive)
  );
  const serviceToRemove = allServices.find(s => s.path === confirmRemoveId);

  return (
    <div className="space-y-6">
      {/* Активні сервіси */}
      <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Активні сервіси ({activeServices.length})
          </CardTitle>
          <CardDescription>
            Сервіси, які зараз активні у вашому акаунті
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeServices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Немає активних сервісів</p>
              <p className="text-sm">Активуйте потрібні сервіси нижче</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeServices.map((subscription) => {
                const service = allServices.find(s => s.path === subscription.serviceId);
                if (!service) return null;
                
                const IconComponent = service.icon;
                const usageStatus = getUsageStatus(subscription.usage);
                
                return (
                  <Card key={subscription.serviceId} className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                          style={{ backgroundColor: service.color }}
                        >
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-sm truncate">
                              {service.name}
                            </h3>
                            <Badge className={`text-xs ${getPlanBadgeColor(subscription.plan)}`}>
                              {getPlanIcon(subscription.plan)}
                              {subscription.plan.toUpperCase()}
                            </Badge>
                          </div>
                          
                          {subscription.usage && (
                            <div className="mb-2">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span>Використання</span>
                                <span>{subscription.usage.current}/{subscription.usage.limit} {subscription.usage.unit}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div 
                                  className={`h-1.5 rounded-full transition-all duration-300 ${
                                    (subscription.usage.current / subscription.usage.limit) >= 0.9 
                                      ? 'bg-red-500' 
                                      : (subscription.usage.current / subscription.usage.limit) >= 0.7 
                                        ? 'bg-yellow-500' 
                                        : 'bg-green-500'
                                  }`}
                                  style={{ width: `${(subscription.usage.current / subscription.usage.limit) * 100}%` }}
                                />
                              </div>
                              {usageStatus && (
                                <div className={`flex items-center gap-1 mt-1 text-xs ${usageStatus.color}`}>
                                  <usageStatus.icon className="w-3 h-3" />
                                  {usageStatus.text}
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={subscription.isActive}
                                onCheckedChange={() => onToggleService(subscription.serviceId)}
                              />
                              <span className="text-xs text-gray-600">
                                {getPlanPrice(subscription.plan)}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <Link to={service.path}>
                                <Button size="sm" variant="ghost" className="h-6 px-2">
                                  <ExternalLink className="w-3 h-3" />
                                </Button>
                              </Link>
                              
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-6 px-2"
                                onClick={() => { setConfirmRemoveId(subscription.serviceId); setIsRemoveDialogOpen(true); }}
                                title="Видалити сервіс"
                              >
                                <Trash2 className="w-3 h-3 text-red-600" />
                              </Button>

                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="ghost" className="h-6 px-2">
                                    <Settings className="w-3 h-3" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Налаштування сервісу</DialogTitle>
                                    <DialogDescription>
                                      {service.name}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <label className="text-sm font-medium">Тарифний план</label>
                                      <Select 
                                        value={subscription.plan} 
                                        onValueChange={(value: 'free' | 'pro' | 'enterprise') => 
                                          onUpgradePlan(subscription.serviceId, value)
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="free">Free - Безкоштовно</SelectItem>
                                          <SelectItem value="pro">Pro - ₴999/міс</SelectItem>
                                          <SelectItem value="enterprise">Enterprise - ₴2999/міс</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    
                                    <div className="flex justify-between">
                                      <Button 
                                        variant="destructive" 
                                        size="sm"
                                        onClick={() => onRemoveService(subscription.serviceId)}
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Видалити сервіс
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                          
                          {subscription.activatedDate && (
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
          )}
        </CardContent>
      </Card>

      {/* Доступні сервіси */}
      <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Доступні сервіси ({availableServices.length})
          </CardTitle>
          <CardDescription>
            Сервіси, які ви можете додати до свого акаунту
          </CardDescription>
        </CardHeader>
        <CardContent>
          {availableServices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Всі сервіси вже активовані</p>
              <p className="text-sm">Ви використовуєте всі доступні AI інструменти</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableServices.map((service) => {
                const IconComponent = service.icon;
                
                return (
                  <Card key={service.path} className="bg-gray-50 border-gray-200 hover:shadow-md transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                          style={{ backgroundColor: service.color }}
                        >
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm mb-1 truncate">
                            {service.name}
                          </h3>
                          <p className="text-xs text-gray-600 line-clamp-2 mb-3">
                            {service.description}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              Безкоштовно
                            </Badge>
                            <div className="flex items-center gap-1">
                              <Link to={service.path}>
                                <Button size="sm" variant="ghost" className="h-6 px-2" title="Відкрити сервіс">
                                  <ExternalLink className="w-3 h-3" />
                                </Button>
                              </Link>
                              <Button 
                                size="sm" 
                                onClick={() => onToggleService(service.path)}
                                className="h-6 px-3 text-xs"
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Додати
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Підтвердження видалення */}
      <Dialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Видалити сервіс?</DialogTitle>
            <DialogDescription>
              {serviceToRemove ? (
                <>
                  Ви збираєтесь видалити сервіс "{serviceToRemove.name}" з вашого акаунту. Доступ до його функцій буде вимкнено.
                </>
              ) : (
                <>Ви збираєтесь видалити сервіс з вашого акаунту.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsRemoveDialogOpen(false)}>Скасувати</Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (confirmRemoveId) {
                  onRemoveService(confirmRemoveId);
                }
                setIsRemoveDialogOpen(false);
              }}
            >
              Видалити
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServiceManager;
