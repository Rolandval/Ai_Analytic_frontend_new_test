import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Save,
  Lock,
  Bell,
  Zap,
  Globe
} from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState({
    autoPublish: false,
    notificationsEnabled: true,
    dailyDigest: true,
    language: 'uk',
    timezone: 'Europe/Kyiv',
    apiKey: '••••••••••••••••',
    maxPostsPerDay: 5
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Налаштування
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Керування параметрами SEO Writer
          </p>
        </div>

        {/* Success Message */}
        {saved && (
          <Card className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg mb-6">
            <p className="text-green-700 dark:text-green-200 font-medium">
              ✓ Налаштування збережено успішно
            </p>
          </Card>
        )}

        {/* General Settings */}
        <Card className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Загальні налаштування
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Мова
              </label>
              <select
                value={settings.language}
                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="uk">Українська</option>
                <option value="ru">Російська</option>
                <option value="en">English</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Часовий пояс
              </label>
              <select
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="Europe/Kyiv">Europe/Kyiv (UTC+2)</option>
                <option value="Europe/Moscow">Europe/Moscow (UTC+3)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Publishing Settings */}
        <Card className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Налаштування публікацій
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  Автоматичний постинг
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Автоматично публікувати заплановані пости
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoPublish}
                onChange={(e) => setSettings({ ...settings, autoPublish: e.target.checked })}
                className="w-5 h-5 rounded border-slate-300 text-blue-600 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Максимум постів на день
              </label>
              <Input
                type="number"
                value={settings.maxPostsPerDay}
                onChange={(e) => setSettings({ ...settings, maxPostsPerDay: parseInt(e.target.value) })}
                min="1"
                max="50"
                className="w-full"
              />
            </div>
          </div>
        </Card>

        {/* Notification Settings */}
        <Card className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Сповіщення
          </h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  Увімкнути сповіщення
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Отримувати сповіщення про важливі события
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.notificationsEnabled}
                onChange={(e) => setSettings({ ...settings, notificationsEnabled: e.target.checked })}
                className="w-5 h-5 rounded border-slate-300 text-blue-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  Щоденний дайджест
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Отримувати щоденний звіт про активність
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.dailyDigest}
                onChange={(e) => setSettings({ ...settings, dailyDigest: e.target.checked })}
                className="w-5 h-5 rounded border-slate-300 text-blue-600 cursor-pointer"
              />
            </div>
          </div>
        </Card>

        {/* Security Settings */}
        <Card className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Безпека
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                API Ключ
              </label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  value={settings.apiKey}
                  readOnly
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  className="text-blue-500 hover:text-blue-700"
                >
                  Скопіювати
                </Button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Використовуйте цей ключ для інтеграції з іншими сервісами
              </p>
            </div>

            <Button
              variant="ghost"
              className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 w-full justify-start"
            >
              Змінити пароль
            </Button>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex gap-3">
          <Button
            onClick={handleSave}
            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white h-10 rounded-lg flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Зберегти налаштування
          </Button>
          <Button
            variant="ghost"
            className="flex-1"
          >
            Скасувати
          </Button>
        </div>
      </div>
    </div>
  );
}
