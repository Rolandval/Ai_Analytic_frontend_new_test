import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search
} from 'lucide-react';
import { getArticles } from '@/api/seoWriterApi';
import { Article } from '@/types/seoWriter';

export default function ArticleManagement() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    const loadArticles = async () => {
      try {
        const data = await getArticles();
        setArticles(data);
        setFilteredArticles(data);
      } catch (error) {
        console.error('Error loading articles:', error);
      }
    };

    loadArticles();
  }, []);

  useEffect(() => {
    let filtered = articles;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(a => a.status === selectedStatus);
    }

    setFilteredArticles(filtered);
  }, [searchTerm, selectedStatus, articles]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200';
      case 'approved':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200';
      case 'editing':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200';
      case 'draft':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'published':
        return 'Опубліковано';
      case 'approved':
        return 'Затверджено';
      case 'editing':
        return 'На редагуванні';
      case 'draft':
        return 'Чернетка';
      default:
        return status;
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Ви впевнені, що хочете видалити цю статтю?')) {
      setArticles(prev => prev.filter(a => a.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Статті
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Управління та редагування статей
            </p>
          </div>
          <Button
            onClick={() => navigate('/seo-writer/articles/new')}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white h-10 rounded-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Нова стаття
          </Button>
        </div>

        {/* Filters */}
        <Card className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Пошук статей..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedStatus === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedStatus('all')}
              >
                Всі
              </Button>
              <Button
                variant={selectedStatus === 'draft' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedStatus('draft')}
              >
                Чернетки
              </Button>
              <Button
                variant={selectedStatus === 'editing' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedStatus('editing')}
              >
                На редагуванні
              </Button>
              <Button
                variant={selectedStatus === 'approved' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedStatus('approved')}
              >
                Затверджено
              </Button>
              <Button
                variant={selectedStatus === 'published' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedStatus('published')}
              >
                Опубліковано
              </Button>
            </div>
          </div>
        </Card>

        {/* Articles Table */}
        <Card className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                    Назва
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                    Платформи
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                    Версія
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                    Дата оновлення
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900 dark:text-white">
                    Дії
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredArticles.map((article, idx) => (
                  <tr
                    key={article.id}
                    className={`border-b border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition ${
                      idx % 2 === 0
                        ? 'bg-white dark:bg-slate-800'
                        : 'bg-slate-50 dark:bg-slate-700/30'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {article.title}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            ID: {article.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(article.status)}`}>
                        {getStatusLabel(article.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {article.platforms.map(platform => (
                          <span
                            key={platform}
                            className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded"
                          >
                            {platform}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      v{article.version}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {new Date(article.updatedAt).toLocaleDateString('uk-UA')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          title="Переглянути"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-orange-500 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                          title="Редагувати"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => handleDelete(article.id)}
                          title="Видалити"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredArticles.length === 0 && (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">
                {searchTerm || selectedStatus !== 'all'
                  ? 'Статей не знайдено'
                  : 'Немає статей. Створіть першу статтю!'}
              </p>
            </div>
          )}
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <Card className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Всього статей</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{articles.length}</p>
          </Card>
          <Card className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Чернеток</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {articles.filter(a => a.status === 'draft').length}
            </p>
          </Card>
          <Card className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Затверджено</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {articles.filter(a => a.status === 'approved').length}
            </p>
          </Card>
          <Card className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Опубліковано</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {articles.filter(a => a.status === 'published').length}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
