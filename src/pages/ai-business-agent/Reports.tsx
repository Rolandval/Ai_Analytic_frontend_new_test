import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  FileBarChart,
  Download,
  Mail,
  MessageCircle,
  Bell,
  Plus,
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  ShoppingCart,
  Target,
  Activity,
  Clock,
  Filter,
  Search
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  category: string;
  frequency?: string;
  lastGenerated?: string;
}

interface ScheduledReport {
  id: string;
  templateId: string;
  name: string;
  frequency: string;
  recipients: string[];
  nextRun: string;
  status: 'active' | 'paused';
}

export default function BusinessAgentReports() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const reportTemplates: ReportTemplate[] = [
    {
      id: '1',
      name: 'Звіт про продажі',
      description: 'Детальна аналітика продажів за період',
      icon: ShoppingCart,
      category: 'sales',
      lastGenerated: '2 години тому'
    },
    {
      id: '2',
      name: 'Фінансовий звіт',
      description: 'Прибутки, витрати, cash flow',
      icon: DollarSign,
      category: 'finance',
      lastGenerated: '1 день тому'
    },
    {
      id: '3',
      name: 'Ефективність команди',
      description: 'KPI менеджерів та відділів',
      icon: Users,
      category: 'hr',
      lastGenerated: '3 дні тому'
    },
    {
      id: '4',
      name: 'Маркетингова аналітика',
      description: 'ROI кампаній, конверсії, трафік',
      icon: Target,
      category: 'marketing',
      lastGenerated: '5 годин тому'
    },
    {
      id: '5',
      name: 'Аналіз конкурентів',
      description: 'Порівняння з конкурентами',
      icon: Activity,
      category: 'market',
      lastGenerated: '1 тиждень тому'
    },
    {
      id: '6',
      name: 'Прогноз трендів',
      description: 'Прогнозування ринкових трендів',
      icon: TrendingUp,
      category: 'forecast',
      lastGenerated: '2 дні тому'
    }
  ];

  const scheduledReports: ScheduledReport[] = [
    {
      id: '1',
      templateId: '1',
      name: 'Щотижневий звіт продажів',
      frequency: 'Щотижня',
      recipients: ['ceo@company.com', 'sales@company.com'],
      nextRun: 'Понеділок, 9:00',
      status: 'active'
    },
    {
      id: '2',
      templateId: '2',
      name: 'Місячний фінансовий звіт',
      frequency: 'Щомісяця',
      recipients: ['cfo@company.com', 'accounting@company.com'],
      nextRun: '1 число, 10:00',
      status: 'active'
    },
    {
      id: '3',
      templateId: '3',
      name: 'Квартальний HR звіт',
      frequency: 'Щокварталу',
      recipients: ['hr@company.com'],
      nextRun: '1 липня, 14:00',
      status: 'paused'
    }
  ];

  const categories = [
    { value: 'all', label: 'Всі категорії' },
    { value: 'sales', label: 'Продажі' },
    { value: 'finance', label: 'Фінанси' },
    { value: 'hr', label: 'HR' },
    { value: 'marketing', label: 'Маркетинг' },
    { value: 'market', label: 'Ринок' },
    { value: 'forecast', label: 'Прогнози' }
  ];

  const filteredTemplates = reportTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const generateReport = (templateId: string) => {
    console.log('Generating report for template:', templateId);
    // Тут буде логіка генерації звіту
  };

  const scheduleReport = (templateId: string) => {
    console.log('Scheduling report for template:', templateId);
    setShowCreateModal(true);
  };

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <FileBarChart className="h-8 w-8 text-primary" />
            Звіти та аналітика
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Генеруйте детальні звіти та налаштовуйте автоматичну розсилку
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Створити шаблон
        </Button>
      </div>

      {/* Фільтри */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Пошук звітів..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Фільтри
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Шаблони звітів */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Шаблони звітів
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <template.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {template.description}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {template.lastGenerated && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <Clock className="h-3 w-3" />
                    Останній: {template.lastGenerated}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button 
                    onClick={() => generateReport(template.id)}
                    className="flex-1 flex items-center justify-center gap-2"
                    size="sm"
                  >
                    <Download className="h-4 w-4" />
                    Згенерувати
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => scheduleReport(template.id)}
                    className="flex-1 flex items-center justify-center gap-2"
                    size="sm"
                  >
                    <Calendar className="h-4 w-4" />
                    Запланувати
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Заплановані звіти */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Заплановані звіти
        </h2>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-700 dark:text-gray-300">
                      Назва
                    </th>
                    <th className="text-left p-4 font-medium text-gray-700 dark:text-gray-300">
                      Частота
                    </th>
                    <th className="text-left p-4 font-medium text-gray-700 dark:text-gray-300">
                      Отримувачі
                    </th>
                    <th className="text-left p-4 font-medium text-gray-700 dark:text-gray-300">
                      Наступний запуск
                    </th>
                    <th className="text-left p-4 font-medium text-gray-700 dark:text-gray-300">
                      Статус
                    </th>
                    <th className="text-left p-4 font-medium text-gray-700 dark:text-gray-300">
                      Дії
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {scheduledReports.map((report) => (
                    <tr key={report.id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="p-4">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {report.name}
                        </div>
                      </td>
                      <td className="p-4 text-gray-600 dark:text-gray-400">
                        {report.frequency}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {report.recipients.length} отримувачів
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-600 dark:text-gray-400">
                        {report.nextRun}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          report.status === 'active' 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                          {report.status === 'active' ? 'Активний' : 'Призупинено'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            Редагувати
                          </Button>
                          <Button variant="ghost" size="sm">
                            {report.status === 'active' ? 'Призупинити' : 'Активувати'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Налаштування сповіщень */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Налаштування сповіщень
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium">Email сповіщення</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Отримувати звіти на пошту
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Налаштувати
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium">Telegram сповіщення</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Отримувати звіти в Telegram
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Підключити
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
