import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import ProfileSidebar from '@/components/profile/ProfileSidebar';
import { 
  Settings, 
  DollarSign, 
  Sun,
  Cpu,
  Save,
  RotateCcw
} from 'lucide-react';
import { profileApi } from '@/api/profileApi';
import { useToast } from '@/hooks/use-toast';

interface StatsSettings {
  id: number;
  usd_rate: number;
  solar_panels_site_markup_percent: number;
  solar_panels_report_markup: number;
  solar_panels_ws_report_markup: number;
  inverters_markup_report_12: number;
  inverters_markup_report_25: number;
  inverters_markup_report_50: number;
  inverters_markup_report_100: number;
  inverters_markup_report_101: number;
  inverters_ws_markup_report_12: number;
  inverters_ws_markup_report_25: number;
  inverters_ws_markup_report_50: number;
  inverters_ws_markup_report_100: number;
  inverters_ws_markup_report_101: number;
}

export default function StatsSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<StatsSettings>({
    id: 0,
    usd_rate: 0,
    solar_panels_site_markup_percent: 0,
    solar_panels_report_markup: 0,
    solar_panels_ws_report_markup: 0,
    inverters_markup_report_12: 0,
    inverters_markup_report_25: 0,
    inverters_markup_report_50: 0,
    inverters_markup_report_100: 0,
    inverters_markup_report_101: 0,
    inverters_ws_markup_report_12: 0,
    inverters_ws_markup_report_25: 0,
    inverters_ws_markup_report_50: 0,
    inverters_ws_markup_report_100: 0,
    inverters_ws_markup_report_101: 0,
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await profileApi.getStatsSettings();
      console.log('Loaded settings:', data);
      setSettings(data);
      toast({
        title: 'Успішно',
        description: 'Налаштування завантажено',
      });
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      // Якщо endpoint не існує або повертає помилку, залишаємо дефолтні значення
      if (error?.response?.status === 404) {
        toast({
          title: 'Інформація',
          description: 'Використовуються початкові налаштування. Збережіть для створення.',
        });
      } else {
        toast({
          title: 'Попередження',
          description: 'Не вдалося завантажити налаштування. Використовуються дефолтні значення.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await profileApi.updateStatsSettings(settings);
      toast({
        title: 'Успішно',
        description: 'Налаштування збережено',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося зберегти налаштування',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    fetchSettings();
    toast({
      title: 'Скинуто',
      description: 'Налаштування повернуто до збережених значень',
    });
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleInputChange = (field: keyof StatsSettings, value: string) => {
    const numValue = parseFloat(value) || 0;
    setSettings(prev => ({ ...prev, [field]: numValue }));
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <ProfileSidebar />
      
      <div className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Налаштування статистики</h1>
            <p className="text-slate-600 dark:text-slate-400">Управління курсами валют та наценками</p>
          </div>

          {loading ? (
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardContent className="py-12">
                <div className="text-center">
                  <Settings className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                  <p className="text-slate-600 dark:text-slate-400">Завантаження налаштувань...</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* USD Rate */}
              <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                    <DollarSign className="w-5 h-5 text-green-500" />
                    Курс валют
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    Поточний курс USD до UAH
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-w-xs">
                    <Label htmlFor="usd_rate" className="text-slate-700 dark:text-slate-300">
                      Курс USD
                    </Label>
                    <Input
                      id="usd_rate"
                      type="number"
                      step="0.01"
                      value={settings.usd_rate}
                      onChange={(e) => handleInputChange('usd_rate', e.target.value)}
                      className="mt-2 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Solar Panels Settings */}
              <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                    <Sun className="w-5 h-5 text-yellow-500" />
                    Налаштування сонячних панелей
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    Наценки для сонячних панелей
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="solar_panels_site_markup_percent" className="text-slate-700 dark:text-slate-300">
                        Наценка сайту (%)
                      </Label>
                      <Input
                        id="solar_panels_site_markup_percent"
                        type="number"
                        step="0.1"
                        value={settings.solar_panels_site_markup_percent}
                        onChange={(e) => handleInputChange('solar_panels_site_markup_percent', e.target.value)}
                        className="mt-2 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="solar_panels_report_markup" className="text-slate-700 dark:text-slate-300">
                        Наценка звіту
                      </Label>
                      <Input
                        id="solar_panels_report_markup"
                        type="number"
                        step="0.1"
                        value={settings.solar_panels_report_markup}
                        onChange={(e) => handleInputChange('solar_panels_report_markup', e.target.value)}
                        className="mt-2 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="solar_panels_ws_report_markup" className="text-slate-700 dark:text-slate-300">
                        Наценка WS звіту
                      </Label>
                      <Input
                        id="solar_panels_ws_report_markup"
                        type="number"
                        step="0.1"
                        value={settings.solar_panels_ws_report_markup}
                        onChange={(e) => handleInputChange('solar_panels_ws_report_markup', e.target.value)}
                        className="mt-2 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Inverters Settings - Regular Report */}
              <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                    <Cpu className="w-5 h-5 text-red-500" />
                    Налаштування інверторів - Звіт
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    Наценки для інверторів (звичайний звіт) за потужністю
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="inverters_markup_report_12" className="text-slate-700 dark:text-slate-300">
                        До 12 кВт
                      </Label>
                      <Input
                        id="inverters_markup_report_12"
                        type="number"
                        step="0.1"
                        value={settings.inverters_markup_report_12}
                        onChange={(e) => handleInputChange('inverters_markup_report_12', e.target.value)}
                        className="mt-2 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="inverters_markup_report_25" className="text-slate-700 dark:text-slate-300">
                        12-25 кВт
                      </Label>
                      <Input
                        id="inverters_markup_report_25"
                        type="number"
                        step="0.1"
                        value={settings.inverters_markup_report_25}
                        onChange={(e) => handleInputChange('inverters_markup_report_25', e.target.value)}
                        className="mt-2 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="inverters_markup_report_50" className="text-slate-700 dark:text-slate-300">
                        25-50 кВт
                      </Label>
                      <Input
                        id="inverters_markup_report_50"
                        type="number"
                        step="0.1"
                        value={settings.inverters_markup_report_50}
                        onChange={(e) => handleInputChange('inverters_markup_report_50', e.target.value)}
                        className="mt-2 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="inverters_markup_report_100" className="text-slate-700 dark:text-slate-300">
                        50-100 кВт
                      </Label>
                      <Input
                        id="inverters_markup_report_100"
                        type="number"
                        step="0.1"
                        value={settings.inverters_markup_report_100}
                        onChange={(e) => handleInputChange('inverters_markup_report_100', e.target.value)}
                        className="mt-2 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="inverters_markup_report_101" className="text-slate-700 dark:text-slate-300">
                        Більше 100 кВт
                      </Label>
                      <Input
                        id="inverters_markup_report_101"
                        type="number"
                        step="0.1"
                        value={settings.inverters_markup_report_101}
                        onChange={(e) => handleInputChange('inverters_markup_report_101', e.target.value)}
                        className="mt-2 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Inverters Settings - WS Report */}
              <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                    <Cpu className="w-5 h-5 text-purple-500" />
                    Налаштування інверторів - WS Звіт
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    Наценки для інверторів (WS звіт) за потужністю
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="inverters_ws_markup_report_12" className="text-slate-700 dark:text-slate-300">
                        До 12 кВт
                      </Label>
                      <Input
                        id="inverters_ws_markup_report_12"
                        type="number"
                        step="0.1"
                        value={settings.inverters_ws_markup_report_12}
                        onChange={(e) => handleInputChange('inverters_ws_markup_report_12', e.target.value)}
                        className="mt-2 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="inverters_ws_markup_report_25" className="text-slate-700 dark:text-slate-300">
                        12-25 кВт
                      </Label>
                      <Input
                        id="inverters_ws_markup_report_25"
                        type="number"
                        step="0.1"
                        value={settings.inverters_ws_markup_report_25}
                        onChange={(e) => handleInputChange('inverters_ws_markup_report_25', e.target.value)}
                        className="mt-2 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="inverters_ws_markup_report_50" className="text-slate-700 dark:text-slate-300">
                        25-50 кВт
                      </Label>
                      <Input
                        id="inverters_ws_markup_report_50"
                        type="number"
                        step="0.1"
                        value={settings.inverters_ws_markup_report_50}
                        onChange={(e) => handleInputChange('inverters_ws_markup_report_50', e.target.value)}
                        className="mt-2 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="inverters_ws_markup_report_100" className="text-slate-700 dark:text-slate-300">
                        50-100 кВт
                      </Label>
                      <Input
                        id="inverters_ws_markup_report_100"
                        type="number"
                        step="0.1"
                        value={settings.inverters_ws_markup_report_100}
                        onChange={(e) => handleInputChange('inverters_ws_markup_report_100', e.target.value)}
                        className="mt-2 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="inverters_ws_markup_report_101" className="text-slate-700 dark:text-slate-300">
                        Більше 100 кВт
                      </Label>
                      <Input
                        id="inverters_ws_markup_report_101"
                        type="number"
                        step="0.1"
                        value={settings.inverters_ws_markup_report_101}
                        onChange={(e) => handleInputChange('inverters_ws_markup_report_101', e.target.value)}
                        className="mt-2 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex items-center gap-4 justify-end">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={saving}
                  className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Скинути
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Збереження...' : 'Зберегти'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
