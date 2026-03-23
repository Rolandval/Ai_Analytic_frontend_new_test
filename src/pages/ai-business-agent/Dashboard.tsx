import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  AlertCircle,
  ArrowRight,
  Brain,
  MessageSquare,
  FileBarChart,
  Activity
} from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { useNavigate } from 'react-router-dom';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface MetricCard {
  title: string;
  value: string | number;
  change: number;
  icon: React.ElementType;
  color: string;
}

interface QuickAction {
  title: string;
  description: string;
  action: () => void;
}

export default function BusinessAgentDashboard() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [competitorActivity, setCompetitorActivity] = useState<number[]>([]);

  useEffect(() => {
    // Симуляція завантаження даних
    setTimeout(() => {
      setMetrics([
        {
          title: 'Прибуток',
          value: '$900,000',
          change: 12.5,
          icon: DollarSign,
          color: 'text-green-600'
        },
        {
          title: 'Продажі',
          value: 550,
          change: 8.3,
          icon: ShoppingCart,
          color: 'text-blue-600'
        },
        {
          title: 'Витрати',
          value: '$200,000',
          change: -6.2,
          icon: TrendingDown,
          color: 'text-red-600'
        },
        {
          title: 'Активність конкурентів',
          value: '5.5%',
          change: 2.1,
          icon: Activity,
          color: 'text-purple-600'
        }
      ]);

      setCompetitorActivity([4.2, 4.5, 4.8, 5.0, 5.2, 5.5]);
      setLoading(false);
    }, 1000);
  }, []);

  const quickActions: QuickAction[] = [
    {
      title: 'Які ризики в відділі продажів цього місяця?',
      description: 'Аналіз потенційних проблем та загроз',
      action: () => navigate('/ai-business-agent/chat?q=sales-risks')
    },
    {
      title: 'Зробити прогноз ринку на 6 місяців',
      description: 'Прогнозування трендів та можливостей',
      action: () => navigate('/ai-business-agent/chat?q=market-forecast')
    },
    {
      title: 'Порівняти наш маркетинг з конкурентом X',
      description: 'Детальний аналіз маркетингових стратегій',
      action: () => navigate('/ai-business-agent/chat?q=marketing-comparison')
    }
  ];

  const salesChartData = {
    labels: ['Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер'],
    datasets: [
      {
        label: 'Продажі',
        data: [420, 450, 480, 510, 530, 550],
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const expensesChartData = {
    labels: ['Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер'],
    datasets: [
      {
        label: 'Витрати',
        data: [180000, 185000, 190000, 195000, 198000, 200000],
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            AI Business Agent
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Привіт, ось останні дані про вашу компанію
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/ai-business-agent/chat')}
            className="flex items-center gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            Чат з агентом
          </Button>
          <Button
            onClick={() => navigate('/ai-business-agent/reports')}
            className="flex items-center gap-2"
          >
            <FileBarChart className="h-4 w-4" />
            Звіти
          </Button>
        </div>
      </div>

      {/* Метрики */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {metric.title}
              </CardTitle>
              <metric.icon className={`h-5 w-5 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center mt-2">
                {metric.change > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm ${metric.change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {Math.abs(metric.change)}%
                </span>
                <span className="text-sm text-gray-500 ml-1">vs минулий місяць</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Графіки */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Динаміка продажів</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Line data={salesChartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Витрати</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Bar data={expensesChartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Швидкі дії */}
      <Card>
        <CardHeader>
          <CardTitle>Задати питання</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {quickActions.map((action, index) => (
              <div
                key={index}
                onClick={action.action}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
              >
                <div>
                  <h3 className="font-medium">{action.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {action.description}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Активність конкурентів */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Активність конкурентів
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32">
            <Line
              data={{
                labels: ['Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер'],
                datasets: [
                  {
                    data: competitorActivity,
                    borderColor: 'rgb(147, 51, 234)',
                    backgroundColor: 'rgba(147, 51, 234, 0.1)',
                    tension: 0.4,
                    fill: true
                  }
                ]
              }}
              options={{
                ...chartOptions,
                scales: {
                  ...chartOptions.scales,
                  y: {
                    ...chartOptions.scales.y,
                    display: false
                  }
                }
              }}
            />
          </div>
          <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-purple-900 dark:text-purple-300">
                  Підвищена активність конкурентів
                </p>
                <p className="text-purple-700 dark:text-purple-400 mt-1">
                  Виявлено зростання маркетингової активності на 5.5% за останній місяць
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
