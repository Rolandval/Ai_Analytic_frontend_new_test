import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  FileText, 
  Calendar, 
  TrendingUp, 
  BookOpen,
  Zap
} from 'lucide-react';
import { getTopics, getArticles, getContentPlan } from '@/api/seoWriterApi';
import { Topic, Article } from '@/types/seoWriter';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    plannedPosts: 0,
    publishedPosts: 0,
    draftPosts: 0
  });
  const [recentTopics, setRecentTopics] = useState<Topic[]>([]);
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [topics, articles, plans] = await Promise.all([
          getTopics(),
          getArticles(),
          getContentPlan()
        ]);

        setRecentTopics(topics.slice(0, 3));
        setRecentArticles(articles.slice(0, 3));
        
        setStats({
          plannedPosts: plans.filter(p => p.status === 'scheduled').length,
          publishedPosts: plans.filter(p => p.status === 'published').length,
          draftPosts: articles.filter(a => a.status === 'draft').length
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };

    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            SEO Writer & Auto Poster
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Управління контентом для соцмереж та блогу
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Запланованих постів</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.plannedPosts}</p>
              </div>
              <Calendar className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </Card>

          <Card className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Опублікованих постів</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.publishedPosts}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </Card>

          <Card className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Чернеток</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.draftPosts}</p>
              </div>
              <FileText className="w-12 h-12 text-orange-500 opacity-20" />
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Button
            onClick={() => navigate('/seo-writer/topics')}
            className="h-16 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg flex items-center justify-center gap-2"
          >
            <Zap className="w-5 h-5" />
            <span>Генерувати теми</span>
          </Button>

          <Button
            onClick={() => navigate('/seo-writer/calendar')}
            className="h-16 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg flex items-center justify-center gap-2"
          >
            <Calendar className="w-5 h-5" />
            <span>Контент-план</span>
          </Button>

          <Button
            onClick={() => navigate('/seo-writer/articles')}
            className="h-16 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg flex items-center justify-center gap-2"
          >
            <BookOpen className="w-5 h-5" />
            <span>Статті</span>
          </Button>
        </div>

        {/* Recent Topics and Articles */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Topics */}
          <Card className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Останні теми</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/seo-writer/topics')}
              >
                Все
              </Button>
            </div>
            <div className="space-y-3">
              {recentTopics.map(topic => (
                <div
                  key={topic.id}
                  className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer transition"
                >
                  <p className="font-medium text-slate-900 dark:text-white text-sm">{topic.title}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      topic.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200' :
                      topic.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {topic.status === 'approved' ? 'Затверджено' : 
                       topic.status === 'pending' ? 'На розгляді' : 'Відхилено'}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {topic.platforms.join(', ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Articles */}
          <Card className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Останні статті</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/seo-writer/articles')}
              >
                Все
              </Button>
            </div>
            <div className="space-y-3">
              {recentArticles.map(article => (
                <div
                  key={article.id}
                  className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer transition"
                >
                  <p className="font-medium text-slate-900 dark:text-white text-sm">{article.title}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      article.status === 'published' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200' :
                      article.status === 'approved' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' :
                      article.status === 'editing' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                      {article.status === 'published' ? 'Опубліковано' :
                       article.status === 'approved' ? 'Затверджено' :
                       article.status === 'editing' ? 'На редагуванні' : 'Чернетка'}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      v{article.version}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
