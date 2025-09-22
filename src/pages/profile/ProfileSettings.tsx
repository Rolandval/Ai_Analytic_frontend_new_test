import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Checkbox } from '@/components/ui/Checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { 
  User, 
  Shield, 
  Bell, 
  Palette,
  Save,
  Eye,
  EyeOff,
  Mail,
  AlertTriangle
} from 'lucide-react';
import ProfileSidebar from '@/components/profile/ProfileSidebar';

interface UserSettings {
  personal: {
    name: string;
    email: string;
    phone: string;
    company: string;
    position: string;
    avatar?: string;
  };
  security: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    twoFactorEnabled: boolean;
    loginNotifications: boolean;
  };
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    usageAlerts: boolean;
    billingAlerts: boolean;
    newFeatures: boolean;
    weeklyReports: boolean;
  };
  preferences: {
    language: string;
    theme: 'light' | 'dark' | 'auto';
    timezone: string;
    dateFormat: string;
    currency: string;
  };
}

const ProfileSettings = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [settings, setSettings] = useState<UserSettings>({
    personal: {
      name: 'Олександр Петренко',
      email: 'alex.petrenko@example.com',
      phone: '+380501234567',
      company: 'ТОВ "Сонячна Енергія"',
      position: 'Менеджер з закупівель'
    },
    security: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      twoFactorEnabled: true,
      loginNotifications: true
    },
    notifications: {
      email: true,
      push: true,
      sms: false,
      usageAlerts: true,
      billingAlerts: true,
      newFeatures: true,
      weeklyReports: false
    },
    preferences: {
      language: 'uk',
      theme: 'auto',
      timezone: 'Europe/Kiev',
      dateFormat: 'DD.MM.YYYY',
      currency: 'UAH'
    }
  });

  const updatePersonalInfo = (field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      personal: { ...prev.personal, [field]: value }
    }));
  };

  const updateSecuritySettings = (field: string, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      security: { ...prev.security, [field]: value }
    }));
  };

  const updateNotificationSettings = (field: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [field]: value }
    }));
  };

  const updatePreferences = (field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      preferences: { ...prev.preferences, [field]: value }
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    // Симуляція збереження
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    // Показати повідомлення про успіх
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[260px,1fr] gap-6">
          <ProfileSidebar />
          <div className="space-y-8">
            {/* Налаштування */}
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="personal" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Особисте
                  </TabsTrigger>
                  <TabsTrigger value="security" className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Безпека
                  </TabsTrigger>
                  <TabsTrigger value="notifications" className="flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    Сповіщення
                  </TabsTrigger>
                  <TabsTrigger value="preferences" className="flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Налаштування
                  </TabsTrigger>
                </TabsList>
                

            {/* Особиста інформація */}
            <TabsContent value="personal" className="space-y-6">
              <CardHeader>
                <CardTitle>Особиста інформація</CardTitle>
                <CardDescription>
                  Оновіть свою особисту інформацію та контактні дані
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Повне ім'я</Label>
                    <Input
                      id="name"
                      value={settings.personal.name}
                      onChange={(e) => updatePersonalInfo('name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={settings.personal.email}
                      onChange={(e) => updatePersonalInfo('email', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Телефон</Label>
                    <Input
                      id="phone"
                      value={settings.personal.phone}
                      onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Компанія</Label>
                    <Input
                      id="company"
                      value={settings.personal.company}
                      onChange={(e) => updatePersonalInfo('company', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="position">Посада</Label>
                    <Input
                      id="position"
                      value={settings.personal.position}
                      onChange={(e) => updatePersonalInfo('position', e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={() => handleSave()} disabled={isLoading}>
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Збереження...' : 'Зберегти зміни'}
                </Button>
              </CardContent>
            </TabsContent>

            {/* Безпека */}
            <TabsContent value="security" className="space-y-6">
              <CardHeader>
                <CardTitle>Безпека акаунту</CardTitle>
                <CardDescription>
                  Керування паролем та налаштуваннями безпеки
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Поточний пароль</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={settings.security.currentPassword}
                        onChange={(e) => updateSecuritySettings('currentPassword', e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Новий пароль</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? 'text' : 'password'}
                          value={settings.security.newPassword}
                          onChange={(e) => updateSecuritySettings('newPassword', e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Підтвердити пароль</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={settings.security.confirmPassword}
                        onChange={(e) => updateSecuritySettings('confirmPassword', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="my-6 h-px w-full bg-gray-200" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Двофакторна автентифікація</Label>
                      <p className="text-sm text-gray-600">
                        Додатковий рівень захисту для вашого акаунту
                      </p>
                    </div>
                    <Checkbox
                      checked={settings.security.twoFactorEnabled}
                      onCheckedChange={(checked) => updateSecuritySettings('twoFactorEnabled', !!checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Сповіщення про вхід</Label>
                      <p className="text-sm text-gray-600">
                        Отримувати сповіщення про нові входи в акаунт
                      </p>
                    </div>
                    <Checkbox
                      checked={settings.security.loginNotifications}
                      onCheckedChange={(checked) => updateSecuritySettings('loginNotifications', !!checked)}
                    />
                  </div>
                </div>

                <Button onClick={() => handleSave()} disabled={isLoading}>
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Збереження...' : 'Зберегти зміни'}
                </Button>
              </CardContent>
            </TabsContent>

            {/* Сповіщення */}
            <TabsContent value="notifications" className="space-y-6">
              <CardHeader>
                <CardTitle>Налаштування сповіщень</CardTitle>
                <CardDescription>
                  Керування типами сповіщень, які ви хочете отримувати
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Канали сповіщень
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Email сповіщення</Label>
                          <p className="text-sm text-gray-600">Отримувати сповіщення на email</p>
                        </div>
                        <Checkbox
                          checked={settings.notifications.email}
                          onCheckedChange={(checked) => updateNotificationSettings('email', !!checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Push сповіщення</Label>
                          <p className="text-sm text-gray-600">Сповіщення в браузері</p>
                        </div>
                        <Checkbox
                          checked={settings.notifications.push}
                          onCheckedChange={(checked) => updateNotificationSettings('push', !!checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>SMS сповіщення</Label>
                          <p className="text-sm text-gray-600">Сповіщення на телефон</p>
                        </div>
                        <Checkbox
                          checked={settings.notifications.sms}
                          onCheckedChange={(checked) => updateNotificationSettings('sms', !!checked)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="my-6 h-px w-full bg-gray-200" />

                  <div>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <Bell className="w-4 h-4" />
                      Типи сповіщень
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Попередження про використання</Label>
                          <p className="text-sm text-gray-600">Коли наближаєтесь до ліміту</p>
                        </div>
                        <Checkbox
                          checked={settings.notifications.usageAlerts}
                          onCheckedChange={(checked) => updateNotificationSettings('usageAlerts', !!checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Сповіщення про платежі</Label>
                          <p className="text-sm text-gray-600">Нагадування про платежі та рахунки</p>
                        </div>
                        <Checkbox
                          checked={settings.notifications.billingAlerts}
                          onCheckedChange={(checked) => updateNotificationSettings('billingAlerts', !!checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Нові функції</Label>
                          <p className="text-sm text-gray-600">Повідомлення про оновлення</p>
                        </div>
                        <Checkbox
                          checked={settings.notifications.newFeatures}
                          onCheckedChange={(checked) => updateNotificationSettings('newFeatures', !!checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Тижневі звіти</Label>
                          <p className="text-sm text-gray-600">Статистика використання сервісів</p>
                        </div>
                        <Checkbox
                          checked={settings.notifications.weeklyReports}
                          onCheckedChange={(checked) => updateNotificationSettings('weeklyReports', !!checked)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Button onClick={() => handleSave()} disabled={isLoading}>
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Збереження...' : 'Зберегти зміни'}
                </Button>
              </CardContent>
            </TabsContent>

            {/* Налаштування */}
            <TabsContent value="preferences" className="space-y-6">
              <CardHeader>
                <CardTitle>Налаштування інтерфейсу</CardTitle>
                <CardDescription>
                  Персоналізуйте свій досвід використання платформи
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="language">Мова інтерфейсу</Label>
                    <Select value={settings.preferences.language} onValueChange={(value) => updatePreferences('language', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="uk">🇺🇦 Українська</SelectItem>
                        <SelectItem value="en">🇺🇸 English</SelectItem>
                        <SelectItem value="ru">🇷🇺 Русский</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="theme">Тема оформлення</Label>
                    <Select value={settings.preferences.theme} onValueChange={(value) => updatePreferences('theme', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">☀️ Світла</SelectItem>
                        <SelectItem value="dark">🌙 Темна</SelectItem>
                        <SelectItem value="auto">🔄 Автоматично</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Часовий пояс</Label>
                    <Select value={settings.preferences.timezone} onValueChange={(value) => updatePreferences('timezone', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Europe/Kiev">🇺🇦 Київ (UTC+2)</SelectItem>
                        <SelectItem value="Europe/London">🇬🇧 Лондон (UTC+0)</SelectItem>
                        <SelectItem value="America/New_York">🇺🇸 Нью-Йорк (UTC-5)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dateFormat">Формат дати</Label>
                    <Select value={settings.preferences.dateFormat} onValueChange={(value) => updatePreferences('dateFormat', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DD.MM.YYYY">31.12.2024</SelectItem>
                        <SelectItem value="MM/DD/YYYY">12/31/2024</SelectItem>
                        <SelectItem value="YYYY-MM-DD">2024-12-31</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="currency">Валюта</Label>
                    <Select value={settings.preferences.currency} onValueChange={(value) => updatePreferences('currency', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UAH">₴ Українська гривня</SelectItem>
                        <SelectItem value="USD">$ Долар США</SelectItem>
                        <SelectItem value="EUR">€ Євро</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={() => handleSave()} disabled={isLoading}>
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Збереження...' : 'Зберегти зміни'}
                </Button>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Небезпечна зона */}
        <Card className="bg-red-50 border-red-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Небезпечна зона
            </CardTitle>
            <CardDescription className="text-red-600">
              Дії, які неможливо скасувати
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium text-red-800">Видалити акаунт</h4>
                <p className="text-sm text-red-600">
                  Назавжди видалити ваш акаунт та всі дані
                </p>
              </div>
              <Button variant="destructive">
                Видалити акаунт
              </Button>
            </div>
          </CardContent>
        </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
