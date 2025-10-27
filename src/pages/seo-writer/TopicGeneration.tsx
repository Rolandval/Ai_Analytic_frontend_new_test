import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  Zap, 
  Trash2, 
  Check,
  Loader
} from 'lucide-react';
import { generateTopics } from '@/api/seoWriterApi';
import { Topic } from '@/types/seoWriter';

export default function TopicGeneration() {
  const [keywords, setKeywords] = useState('');
  const [generatedTopics, setGeneratedTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [approvedTopics, setApprovedTopics] = useState<string[]>([]);

  const handleGenerate = async () => {
    if (!keywords.trim()) return;

    setLoading(true);
    try {
      const topics = await generateTopics(keywords);
      setGeneratedTopics(topics);
      setApprovedTopics([]);
    } catch (error) {
      console.error('Error generating topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleApprove = (topicId: string) => {
    setApprovedTopics(prev =>
      prev.includes(topicId)
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  const handleDeleteTopic = (topicId: string) => {
    setGeneratedTopics(prev => prev.filter(t => t.id !== topicId));
    setApprovedTopics(prev => prev.filter(id => id !== topicId));
  };

  const handleApproveSelected = () => {
    // Тут буде логіка збереження затверджених тем
    console.log('Approved topics:', approvedTopics);
    alert(`Затверджено ${approvedTopics.length} тем(и)`);
    setGeneratedTopics([]);
    setApprovedTopics([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Генерація тем
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Введіть ключові слова для генерації ідей статей
          </p>
        </div>

        {/* Input Section */}
        <Card className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Ключові слова
              </label>
              <Input
                placeholder="Наприклад: сонячні панелі, енергія, дім (розділяйте комою)"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                className="w-full"
                disabled={loading}
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={!keywords.trim() || loading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white h-10 rounded-lg flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Генерую...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Згенерувати ідеї
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Generated Topics */}
        {generatedTopics.length > 0 && (
          <Card className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Згенеровані теми ({generatedTopics.length})
              </h2>
              {approvedTopics.length > 0 && (
                <Button
                  onClick={handleApproveSelected}
                  className="bg-green-500 hover:bg-green-600 text-white h-9 rounded-lg flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Затвердити ({approvedTopics.length})
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {generatedTopics.map(topic => (
                <div
                  key={topic.id}
                  className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 transition"
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={approvedTopics.includes(topic.id)}
                      onChange={() => toggleApprove(topic.id)}
                      className="mt-1 w-5 h-5 rounded border-slate-300 text-blue-600 cursor-pointer"
                    />

                    {/* Content */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                        {topic.title}
                      </h3>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {topic.keywords.map((keyword, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded-full"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Категорія: <span className="font-medium">{topic.category}</span>
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTopic(topic.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Empty State */}
        {generatedTopics.length === 0 && !loading && keywords && (
          <Card className="bg-white dark:bg-slate-800 p-12 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
            <Zap className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">
              Введіть ключові слова та натисніть "Згенерувати ідеї"
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
