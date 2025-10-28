import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  ChevronLeft,
  Save,
  Eye,
  Edit2,
  Trash2,
  Copy,
  Share2
} from 'lucide-react';
import { getArticles, updateArticle, createArticle } from '@/api/seoWriterApi';
import { Article } from '@/types/seoWriter';
import { useToast } from '@/hooks/use-toast';

export default function ArticleEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [article, setArticle] = useState<Article | null>(null);
  const [isEditing, setIsEditing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState<Partial<Article>>({});
  const isNewArticle = !id;

  useEffect(() => {
    const loadArticle = async () => {
      if (isNewArticle) {
        // Create new article template
        const newArticle: Article = {
          id: '',
          topicId: '',
          title: '',
          content: '',
          status: 'draft',
          platforms: [],
          mediaUrls: [],
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setArticle(newArticle);
        setEditData(newArticle);
      } else {
        try {
          const articles = await getArticles();
          const found = articles.find(a => a.id === id);
          if (found) {
            setArticle(found);
            setEditData(found);
            setIsEditing(false);
          } else {
            toast({
              title: 'Помилка',
              description: 'Статтю не знайдено',
              variant: 'destructive'
            });
            navigate('/seo-writer/articles');
          }
        } catch (error) {
          console.error('Error loading article:', error);
          toast({
            title: 'Помилка',
            description: 'Не вдалося завантажити статтю',
            variant: 'destructive'
          });
        }
      }
    };

    loadArticle();
  }, [id, isNewArticle, navigate, toast]);

  const handleSave = async () => {
    if (!article) return;
    
    if (!editData.title || !editData.content) {
      toast({
        title: 'Помилка',
        description: 'Заповніть назву та вміст статті',
        variant: 'destructive'
      });
      return;
    }
    
    setIsSaving(true);
    try {
      if (isNewArticle) {
        const newArticle = await createArticle(
          editData.topicId || '',
          editData.title,
          editData.content
        );
        setArticle(newArticle);
        toast({
          title: 'Успіх',
          description: 'Статтю створено'
        });
        navigate(`/seo-writer/article/${newArticle.id}`);
      } else {
        const updated = await updateArticle(article.id, editData);
        setArticle(updated);
        setEditData(updated);
        setIsEditing(false);
        toast({
          title: 'Успіх',
          description: 'Статтю збережено'
        });
      }
    } catch (error) {
      console.error('Error saving article:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося зберегти статтю',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (confirm('Ви впевнені, що хочете видалити цю статтю?')) {
      navigate('/seo-writer/articles');
    }
  };

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
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      draft: 'Чернетка',
      editing: 'На редагуванні',
      approved: 'Затверджено',
      published: 'Опубліковано'
    };
    return labels[status] || status;
  };

  if (!article) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400">Завантаження...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/seo-writer/articles')}
              className="p-2"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                {isNewArticle ? 'Нова стаття' : isEditing ? 'Редагування статті' : 'Перегляд статті'}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                {isNewArticle ? 'Створення нової статті' : `ID: ${article.id}`}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {!isEditing && !isNewArticle ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Редагувати
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  className="gap-2 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                  Видалити
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (isNewArticle) {
                      navigate('/seo-writer/articles');
                    } else {
                      setIsEditing(false);
                      setEditData(article || {});
                    }
                  }}
                >
                  Скасувати
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Збереження...' : 'Зберегти'}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(article.status)}`}>
              {getStatusLabel(article.status)}
            </span>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Версія {article.version}
            </span>
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="gap-2">
              <Copy className="w-4 h-4" />
              Копіювати
            </Button>
            <Button variant="ghost" size="sm" className="gap-2">
              <Share2 className="w-4 h-4" />
              Поділитися
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-3 gap-6">
          {/* Article Content */}
          <div className="col-span-2 space-y-6">
            {/* Title */}
            <Card className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Заголовок
              </label>
              {isEditing ? (
                <Input
                  value={editData.title || ''}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  className="w-full"
                />
              ) : (
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {article.title}
                </h2>
              )}
            </Card>

            {/* Content */}
            <Card className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Контент
              </label>
              {isEditing ? (
                <textarea
                  value={editData.content || ''}
                  onChange={(e) => setEditData({ ...editData, content: e.target.value })}
                  className="w-full h-64 p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                    {article.content}
                  </p>
                </div>
              )}
            </Card>

            {/* Media */}
            {article.mediaUrls.length > 0 && (
              <Card className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-4">
                  Медіа ({article.mediaUrls.length})
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {article.mediaUrls.map((url, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={url}
                        alt={`Media ${idx + 1}`}
                        className="w-full h-40 object-cover rounded-lg"
                      />
                      {isEditing && (
                        <button className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Platforms */}
            <Card className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
                Платформи
              </h3>
              <div className="space-y-2">
                {article.platforms.map(platform => (
                  <div
                    key={platform}
                    className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-sm font-medium text-slate-900 dark:text-white"
                  >
                    {platform === 'facebook' && '📘 Facebook'}
                    {platform === 'instagram' && '📷 Instagram'}
                    {platform === 'linkedin' && '💼 LinkedIn'}
                    {platform === 'tiktok' && '🎵 TikTok'}
                    {platform === 'google_business' && '🏢 Google Business'}
                    {platform === 'blog' && '📝 Blog'}
                  </div>
                ))}
              </div>
            </Card>

            {/* Dates */}
            <Card className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
                Дати
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-slate-600 dark:text-slate-400">Створено</p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {new Date(article.createdAt).toLocaleDateString('uk-UA')}
                  </p>
                </div>
                <div>
                  <p className="text-slate-600 dark:text-slate-400">Оновлено</p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {new Date(article.updatedAt).toLocaleDateString('uk-UA')}
                  </p>
                </div>
                {article.scheduledDate && (
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Запланована публікація</p>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {new Date(article.scheduledDate).toLocaleDateString('uk-UA')}
                    </p>
                  </div>
                )}
                {article.publishedDate && (
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Опубліковано</p>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {new Date(article.publishedDate).toLocaleDateString('uk-UA')}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Stats */}
            <Card className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
                Статистика
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Символів</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {article.content.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Слів</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {article.content.split(/\s+/).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Медіа</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {article.mediaUrls.length}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
