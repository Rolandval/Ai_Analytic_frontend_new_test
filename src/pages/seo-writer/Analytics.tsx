import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Filter
} from 'lucide-react';
import { getAnalytics } from '@/api/seoWriterApi';
import { Analytics } from '@/types/seoWriter';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const data = await getAnalytics();
        setAnalytics(data);
      } catch (error) {
        console.error('Error loading analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  const filteredAnalytics = selectedPlatform === 'all'
    ? analytics
    : analytics.filter(a => a.platform === selectedPlatform);

  // Prepare chart data
  const platformStats = analytics.reduce((acc, item) => {
    const existing = acc.find(p => p.platform === item.platform);
    if (existing) {
      existing.reach += item.reach;
      existing.likes += item.likes;
      existing.comments += item.comments;
      existing.shares += item.shares;
    } else {
      acc.push({
        platform: item.platform,
        reach: item.reach,
        likes: item.likes,
        comments: item.comments,
        shares: item.shares
      });
    }
    return acc;
  }, [] as any[]);

  const engagementData = filteredAnalytics.map(item => ({
    date: new Date(item.date).toLocaleDateString('uk-UA'),
    reach: item.reach,
    likes: item.likes,
    comments: item.comments,
    shares: item.shares
  }));

  const totalStats = filteredAnalytics.reduce(
    (acc, item) => ({
      reach: acc.reach + item.reach,
      likes: acc.likes + item.likes,
      comments: acc.comments + item.comments,
      shares: acc.shares + item.shares,
      clicks: acc.clicks + item.clicks
    }),
    { reach: 0, likes: 0, comments: 0, shares: 0, clicks: 0 }
  );

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  const platforms = ['facebook', 'instagram', 'linkedin', 'tiktok', 'google_business', 'blog'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Аналітика
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Статистика по постам та платформам
          </p>
        </div>

        {/* Platform Filter */}
        <Card className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Платформа:</span>
            <Button
              variant={selectedPlatform === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedPlatform('all')}
            >
              Всі
            </Button>
            {platforms.map(platform => (
              <Button
                key={platform}
                variant={selectedPlatform === platform ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedPlatform(platform)}
                className="capitalize"
              >
                {platform.replace('_', ' ')}
              </Button>
            ))}
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Охоплення</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {totalStats.reach.toLocaleString()}
                </p>
              </div>
              <Eye className="w-10 h-10 text-blue-500 opacity-20" />
            </div>
          </Card>

          <Card className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Лайки</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {totalStats.likes.toLocaleString()}
                </p>
              </div>
              <Heart className="w-10 h-10 text-red-500 opacity-20" />
            </div>
          </Card>

          <Card className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Коментарі</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {totalStats.comments.toLocaleString()}
                </p>
              </div>
              <MessageCircle className="w-10 h-10 text-green-500 opacity-20" />
            </div>
          </Card>

          <Card className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Поділи</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {totalStats.shares.toLocaleString()}
                </p>
              </div>
              <Share2 className="w-10 h-10 text-purple-500 opacity-20" />
            </div>
          </Card>

          <Card className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Кліки</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {totalStats.clicks.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-orange-500 opacity-20" />
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Platform Comparison */}
          <Card className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Порівняння платформ
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={platformStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="platform" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="reach" fill="#3b82f6" name="Охоплення" />
                <Bar dataKey="likes" fill="#ef4444" name="Лайки" />
                <Bar dataKey="comments" fill="#10b981" name="Коментарі" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Engagement Trend */}
          <Card className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Тренд залучення
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="reach" stroke="#3b82f6" name="Охоплення" />
                <Line type="monotone" dataKey="likes" stroke="#ef4444" name="Лайки" />
                <Line type="monotone" dataKey="comments" stroke="#10b981" name="Коментарі" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Platform Distribution */}
        <Card className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Розподіл охоплення по платформам
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={platformStats}
                dataKey="reach"
                nameKey="platform"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {platformStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
