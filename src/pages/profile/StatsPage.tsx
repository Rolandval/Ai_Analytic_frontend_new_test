import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import ProfileSidebar from '@/components/profile/ProfileSidebar';
import { 
  BarChart3, 
  TrendingUp, 
  Database, 
  Zap,
  Calendar,
  Activity,
  FileText,
  Battery,
  Sun,
  Cpu
} from 'lucide-react';
import { profileApi } from '@/api/profileApi';
import { useToast } from '@/hooks/use-toast';

interface StatsItem {
  id: number;
  total_token_count: number;
  total_response_token_count: number;
  updated_prices: number;
  site_supplier_solar_panels: number;
  report_solar_panels: number;
  report_inverters: number;
  catalog_batteries: number;
  catalog_inverters: number;
  catalog_solar_panels: number;
  created_at: string;
}

interface StatsResponse {
  prices_count: number;
  total_token_count: number;
  total_response_token_count: number;
  catalog_batteries: number;
  catalog_inverters: number;
  catalog_solar_panels: number;
  items: StatsItem[];
}

export default function StatsPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await profileApi.getStats(selectedMonth, selectedYear);
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося завантажити статистику',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [selectedMonth, selectedYear]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('uk-UA').format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const months = [
    { value: 1, label: 'Січень' },
    { value: 2, label: 'Лютий' },
    { value: 3, label: 'Березень' },
    { value: 4, label: 'Квітень' },
    { value: 5, label: 'Травень' },
    { value: 6, label: 'Червень' },
    { value: 7, label: 'Липень' },
    { value: 8, label: 'Серпень' },
    { value: 9, label: 'Вересень' },
    { value: 10, label: 'Жовтень' },
    { value: 11, label: 'Листопад' },
    { value: 12, label: 'Грудень' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <ProfileSidebar />
      
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Статистика використання</h1>
            <p className="text-slate-600 dark:text-slate-400">Детальна аналітика роботи системи</p>
          </div>

          {/* Date Filters */}
          <Card className="mb-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Період:</span>
                </div>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  {months.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <Button onClick={fetchStats} disabled={loading}>
                  {loading ? 'Завантаження...' : 'Оновити'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {loading && !stats ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Activity className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400">Завантаження статистики...</p>
              </div>
            </div>
          ) : stats ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Database className="w-5 h-5" />
                      Всього цін
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{formatNumber(stats.prices_count)}</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Zap className="w-5 h-5" />
                      Токени (запит)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{formatNumber(stats.total_token_count)}</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <TrendingUp className="w-5 h-5" />
                      Токени (відповідь)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{formatNumber(stats.total_response_token_count)}</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Battery className="w-5 h-5" />
                      Каталог батарей
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{formatNumber(stats.catalog_batteries)}</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Sun className="w-5 h-5" />
                      Каталог панелей
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{formatNumber(stats.catalog_solar_panels)}</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Cpu className="w-5 h-5" />
                      Каталог інверторів
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{formatNumber(stats.catalog_inverters)}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Stats Table */}
              <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                    <FileText className="w-5 h-5" />
                    Детальна статистика по днях
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    Історія операцій за обраний період
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Дата</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Токени</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Відповідь</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Оновлено цін</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Панелі</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Звіти панелі</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Звіти інвертори</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.items.map((item) => (
                          <tr key={item.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                            <td className="py-3 px-4 text-sm text-slate-900 dark:text-slate-200">
                              {formatDate(item.created_at)}
                            </td>
                            <td className="py-3 px-4 text-sm text-slate-900 dark:text-slate-200 text-right">
                              {formatNumber(item.total_token_count)}
                            </td>
                            <td className="py-3 px-4 text-sm text-slate-900 dark:text-slate-200 text-right">
                              {formatNumber(item.total_response_token_count)}
                            </td>
                            <td className="py-3 px-4 text-sm text-right">
                              <Badge variant={item.updated_prices > 0 ? 'default' : 'secondary'}>
                                {formatNumber(item.updated_prices)}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-sm text-slate-900 dark:text-slate-200 text-right">
                              {formatNumber(item.site_supplier_solar_panels)}
                            </td>
                            <td className="py-3 px-4 text-sm text-slate-900 dark:text-slate-200 text-right">
                              {formatNumber(item.report_solar_panels)}
                            </td>
                            <td className="py-3 px-4 text-sm text-slate-900 dark:text-slate-200 text-right">
                              {formatNumber(item.report_inverters)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {stats.items.length === 0 && (
                    <div className="text-center py-8">
                      <BarChart3 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-500 dark:text-slate-400">Немає даних за обраний період</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardContent className="py-12">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400">Виберіть період для перегляду статистики</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
