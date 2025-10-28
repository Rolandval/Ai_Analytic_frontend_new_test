import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  ArrowLeft,
  Save,
  X,
  Eye,
  Edit,
  Copy,
  Check,
  Calendar,
  User,
  Tag,
  Share2
} from 'lucide-react';
import { Article, getArticles, updateArticle } from '@/api/seoWriterApi';
import { useToast } from '@/hooks/use-toast';

export default function ArticleViewEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [article, setArticle] = useState<Article | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editedArticle, setEditedArticle] = useState<Partial<Article>>({});

  useEffect(() => {
    const loadArticle = async () => {
      try {
        const articles = await getArticles();
        const found = articles.find(a => a.id === id);
        if (found) {
          setArticle(found);
          setEditedArticle(found);
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
    };

    if (id) {
      loadArticle();
    }
  }, [id, navigate, toast]);

  const handleSave = async () => {
    if (!article) return;

    setIsSaving(true);
    try {
      const updated = await updateArticle(article.id, editedArticle);
      setArticle(updated);
      setIsEditing(false);
      toast({
        title: 'Успіх',
        description: 'Статтю збережено'
      });
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

  const handleCancel = () => {
    setEditedArticle(article || {});
    setIsEditing(false);
  };

  const handleCopyContent = () => {
    if (article?.content) {
      navigator.clipboard.writeText(article.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Скопійовано',
        description: 'Текст статті скопійований в буфер обміну'
      });
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

  if (!article) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <p className="text-slate-600 dark:text-slate-400">Завантаження...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/seo-writer/articles')}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Назад до статей
          </button>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyContent}
                  className="flex items-center gap-2"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Скопійовано' : 'Копіювати'}
                </Button>
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Редагувати
                </Button>
              </>
            )}
            {isEditing && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Скасувати
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Збереження...' : 'Зберегти'}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Article Card */}
        <Card className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden mb-6">
          {/* Meta Information */}
          <div className="bg-slate-50 dark:bg-slate-700/50 p-6 border-b border-slate-200 dark:border-slate-600">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">ID</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{article.id}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Статус</p>
                <span className={`text-xs px-3 py-1 rounded-full font-medium inline-block ${getStatusColor(article.status)}`}>
                  {getStatusLabel(article.status)}
                </span>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Версія</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">v{article.version}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Дата оновлення</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {new Date(article.updatedAt).toLocaleDateString('uk-UA')}
                </p>
              </div>
            </div>

            {/* Platforms */}
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Платформи</p>
              <div className="flex flex-wrap gap-2">
                {article.platforms.map(platform => (
                  <span
                    key={platform}
                    className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 px-3 py-1 rounded-full"
                  >
                    {platform}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-600">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Назва статті</p>
            {isEditing ? (
              <Input
                value={editedArticle.title || ''}
                onChange={(e) => setEditedArticle({ ...editedArticle, title: e.target.value })}
                className="text-2xl font-bold"
              />
            ) : (
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{article.title}</h1>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Вміст статті</p>
            {isEditing ? (
              <textarea
                value={editedArticle.content || ''}
                onChange={(e) => setEditedArticle({ ...editedArticle, content: e.target.value })}
                className="w-full h-96 p-4 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg border border-slate-200 dark:border-slate-600">
                <p className="text-slate-900 dark:text-white whitespace-pre-wrap leading-relaxed">
                  {article.content}
                </p>
              </div>
            )}
          </div>

          {/* Media */}
          {article.mediaUrls && article.mediaUrls.length > 0 && (
            <div className="p-6 border-t border-slate-200 dark:border-slate-600">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Медіа</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {article.mediaUrls.map((url, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={url}
                      alt={`Media ${idx + 1}`}
                      className="w-full h-48 object-cover rounded-lg border border-slate-200 dark:border-slate-600"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition rounded-lg flex items-center justify-center">
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white hover:underline"
                      >
                        Відкрити
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Additional Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Створено</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {new Date(article.createdAt).toLocaleDateString('uk-UA')}
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <Tag className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Тема</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {article.topicId}
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <Share2 className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Платформи</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {article.platforms.length}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
