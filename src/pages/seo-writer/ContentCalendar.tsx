import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Clock,
  Facebook,
  Instagram,
  Linkedin,
  Music2,
  Store,
  FileText
} from 'lucide-react';
import { getContentPlan, getArticles } from '@/api/seoWriterApi';
import { ContentPlan, Article } from '@/types/seoWriter';

export default function ContentCalendar() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date(2025, 9, 1));
  const [contentPlan, setContentPlan] = useState<ContentPlan[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [plan, arts] = await Promise.all([
          getContentPlan(),
          getArticles()
        ]);
        setContentPlan(plan);
        setArticles(arts);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getPlanForDate = (day: number) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      .toISOString()
      .split('T')[0];
    
    return contentPlan.filter(plan => {
      const planDateStr = new Date(plan.date).toISOString().split('T')[0];
      return planDateStr === dateStr && (selectedStatus === 'all' || plan.status === selectedStatus);
    });
  };

  const getArticleTitle = (articleId: string) => {
    return articles.find(a => a.id === articleId)?.title || 'Невідома стаття';
  };

  const renderPlatformIcon = (platform: string) => {
    const commonProps = { className: 'w-3.5 h-3.5' } as const;
    switch (platform as any) {
      case 'facebook':
        return <Facebook {...commonProps} />;
      case 'instagram':
        return <Instagram {...commonProps} />;
      case 'linkedin':
        return <Linkedin {...commonProps} />;
      case 'tiktok':
        return <Music2 {...commonProps} />; // tiktok placeholder icon
      case 'google_business':
        return <Store {...commonProps} />;
      case 'blog':
        return <FileText {...commonProps} />;
      default:
        return null;
    }
  };

  const monthNames = [
    'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
    'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
  ];

  const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = [];

  // Попередні дні
  for (let i = 0; i < firstDay - 1; i++) {
    days.push(null);
  }

  // Дні місяця
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200';
      case 'scheduled':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-200';
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Контент-план
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Календар публікацій та управління постами
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevMonth}
              className="p-2"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white min-w-[200px] text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNextMonth}
              className="p-2"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
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
              variant={selectedStatus === 'scheduled' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedStatus('scheduled')}
            >
              Запланировано
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

        {/* Calendar */}
        <Card className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
          {/* Day names */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {dayNames.map(day => (
              <div
                key={day}
                className="text-center font-semibold text-slate-600 dark:text-slate-400 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, idx) => {
              const plansForDay = day ? getPlanForDate(day) : [];
              
              return (
                <div
                  key={idx}
                  className={`min-h-[120px] p-2 rounded-lg border-2 transition relative overflow-hidden ${
                    day
                      ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 hover:border-blue-300 dark:hover:border-blue-500'
                      : 'border-transparent bg-slate-100 dark:bg-slate-800'
                  }`}
                >
                  {day && (
                    <>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-9xl font-black text-white/20 dark:text-white/15 leading-none">
                          {day}
                        </span>
                      </div>
                      <div className="relative z-10 space-y-1">
                        {plansForDay.map(plan => (
                          <div key={plan.id} className="relative group">
                            <div
                              className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 transition ${getStatusColor(plan.status)}`}
                              title={getArticleTitle(plan.articleId)}
                            >
                              <div className="flex items-center gap-1">
                                <div className="flex items-center gap-0.5 mr-1">
                                  {plan.platforms.slice(0,3).map((p) => (
                                    <span key={p} className="inline-flex items-center justify-center w-4 h-4 rounded-sm bg-white/70 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                                      {renderPlatformIcon(p)}
                                    </span>
                                  ))}
                                </div>
                                <div className="font-medium truncate">
                                  {getArticleTitle(plan.articleId).substring(0, 20)}...
                                </div>
                              </div>
                            </div>
                            
                            {/* Dropdown Menu */}
                            <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition z-10">
                              <button
                                onClick={() => setOpenMenuId(openMenuId === plan.id ? null : plan.id)}
                                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600"
                              >
                                <MoreVertical className="w-3 h-3" />
                              </button>
                              
                              {openMenuId === plan.id && (
                                <div className="absolute top-full right-0 mt-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-20 min-w-[180px]">
                                  <button
                                    onClick={() => {
                                      navigate(`/seo-writer/article/${plan.articleId}`);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-900 dark:text-white"
                                  >
                                    <Eye className="w-4 h-4" />
                                    Переглянути
                                  </button>
                                  <button
                                    onClick={() => {
                                      navigate(`/seo-writer/article/${plan.articleId}`);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700"
                                  >
                                    <Edit className="w-4 h-4" />
                                    Редагувати
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (plan.status === 'scheduled') {
                                        alert('Публікація запланована на ' + plan.scheduledTime);
                                      } else if (plan.status === 'published') {
                                        alert('Пост вже опубліковано');
                                      }
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700"
                                  >
                                    <Clock className="w-4 h-4" />
                                    Статус: {plan.status === 'scheduled' ? 'Запланировано' : plan.status === 'published' ? 'Опубліковано' : 'Помилка'}
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm('Видалити цей пост?')) {
                                        alert('Пост видалено');
                                      }
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-red-100 dark:hover:bg-red-900 flex items-center gap-2 text-red-600 dark:text-red-400 border-t border-slate-200 dark:border-slate-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Видалити
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-100 dark:bg-blue-900" />
            <span className="text-sm text-slate-600 dark:text-slate-400">Запланировано</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900" />
            <span className="text-sm text-slate-600 dark:text-slate-400">Опубліковано</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-900" />
            <span className="text-sm text-slate-600 dark:text-slate-400">Помилка</span>
          </div>
        </div>
      </div>
    </div>
  );
}
