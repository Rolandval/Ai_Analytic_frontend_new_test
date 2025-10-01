import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Download, Copy, Eye, Languages, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Progress } from '@/components/ui/Progress';
import { Badge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/Checkbox';
import PhotoUpload from './components/PhotoUpload';

interface PhotoFile {
  id: string;
  file: File;
  preview: string;
  name: string;
  size: number;
  type: string;
}

interface AltTextSettings {
  language: string;
  style: string;
  includeColors: boolean;
  includeObjects: boolean;
  includeActions: boolean;
  includeEmotions: boolean;
  maxLength: number;
}

interface ProcessedPhoto extends PhotoFile {
  status: 'processing' | 'completed' | 'error';
  progress: number;
  altText: string;
  detectedObjects: string[];
  dominantColors: string[];
  confidence: number;
  altTextSettings: AltTextSettings;
}

const languages = [
  { value: 'uk', label: 'Українська' },
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Русский' },
  { value: 'de', label: 'Deutsch' },
  { value: 'fr', label: 'Français' },
  { value: 'es', label: 'Español' }
];

const styles = [
  { value: 'descriptive', label: 'Описовий', description: 'Детальний опис зображення' },
  { value: 'concise', label: 'Стислий', description: 'Короткий та зрозумілий опис' },
  { value: 'technical', label: 'Технічний', description: 'Точний технічний опис' },
  { value: 'artistic', label: 'Художній', description: 'Емоційний та образний опис' },
  { value: 'seo', label: 'SEO', description: 'Оптимізований для пошукових систем' }
];

// Мок-дані для демонстрації
const mockAltTexts = [
  "Молода жінка в синьому светрі усміхається, стоячи біля вікна з природним освітленням",
  "Гірський пейзаж з зеленими деревами на передньому плані та засніженими вершинами на горизонті",
  "Червоний спортивний автомобіль припаркований на асфальтованій дорозі біля сучасного будинку",
  "Кіт сидить на підвіконні та дивиться у вікно, на задньому плані видно зелений сад"
];

const mockObjects = [
  ['людина', 'светр', 'вікно', 'усмішка'],
  ['гори', 'дерева', 'сніг', 'небо', 'пейзаж'],
  ['автомобіль', 'дорога', 'будинок', 'асфальт'],
  ['кіт', 'підвіконня', 'вікно', 'сад', 'рослини']
];

const mockColors = [
  ['синій', 'білий', 'бежевий'],
  ['зелений', 'білий', 'блакитний', 'коричневий'],
  ['червоний', 'чорний', 'сірий'],
  ['помаранчевий', 'зелений', 'коричневий']
];

export default function AltTextGenerator() {
  const [selectedFiles, setSelectedFiles] = useState<PhotoFile[]>([]);
  const [processedPhotos, setProcessedPhotos] = useState<ProcessedPhoto[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [settings, setSettings] = useState<AltTextSettings>({
    language: 'uk',
    style: 'descriptive',
    includeColors: true,
    includeObjects: true,
    includeActions: true,
    includeEmotions: false,
    maxLength: 125
  });

  const handleFilesSelected = (files: PhotoFile[]) => {
    setSelectedFiles(files);
  };

  const updateSetting = (key: keyof AltTextSettings, value: string | number | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const startProcessing = async () => {
    if (selectedFiles.length === 0) return;
    
    setIsProcessing(true);
    
    // Ініціалізуємо оброблені фото
    const initialProcessed: ProcessedPhoto[] = selectedFiles.map((file, index) => ({
      ...file,
      status: 'processing' as const,
      progress: 0,
      altText: '',
      detectedObjects: [],
      dominantColors: [],
      confidence: 0,
      altTextSettings: { ...settings }
    }));
    
    setProcessedPhotos(initialProcessed);

    // Симуляція обробки кожного фото
    for (let i = 0; i < selectedFiles.length; i++) {
      for (let progress = 0; progress <= 100; progress += 25) {
        await new Promise(resolve => setTimeout(resolve, 300));
        
        setProcessedPhotos(prev => prev.map((photo, index) => 
          index === i 
            ? { ...photo, progress }
            : photo
        ));
      }
      
      // Позначаємо як завершене з мок-даними
      setProcessedPhotos(prev => prev.map((photo, index) => 
        index === i 
          ? { 
              ...photo, 
              status: 'completed' as const,
              progress: 100,
              altText: mockAltTexts[i % mockAltTexts.length],
              detectedObjects: mockObjects[i % mockObjects.length],
              dominantColors: mockColors[i % mockColors.length],
              confidence: 85 + Math.random() * 10 // 85-95%
            }
          : photo
      ));
    }
    
    setIsProcessing(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Тут би показали toast повідомлення
    console.log('Скопійовано в буфер обміну:', text);
  };

  const downloadCSV = () => {
    const completedPhotos = processedPhotos.filter(p => p.status === 'completed');
    const csvContent = [
      'Filename,Alt Text,Objects,Colors,Confidence',
      ...completedPhotos.map(photo => 
        `"${photo.name}","${photo.altText}","${photo.detectedObjects.join(', ')}","${photo.dominantColors.join(', ')}",${photo.confidence.toFixed(1)}%`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'alt-texts.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button variant="ghost" asChild className="mr-4">
            <Link to="/ai-photo-editor">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад
            </Link>
          </Button>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-500 rounded-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Генерація Alt підписів
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Автоматично створюйте описи зображень для доступності
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Завантаження та результати */}
          <div className="lg:col-span-2">
            {selectedFiles.length === 0 && processedPhotos.length === 0 ? (
              <PhotoUpload onFilesSelected={handleFilesSelected} />
            ) : selectedFiles.length > 0 && processedPhotos.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Завантажені фото ({selectedFiles.length})</CardTitle>
                  <CardDescription>
                    Налаштуйте параметри генерації та почніть обробку
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    {selectedFiles.map((file) => (
                      <div key={file.id} className="relative">
                        <img
                          src={file.preview}
                          alt={file.name}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <div className="absolute bottom-2 left-2 right-2">
                          <div className="bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded truncate">
                            {file.name}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex space-x-4">
                    <Button 
                      onClick={startProcessing} 
                      disabled={isProcessing}
                      className="flex-1"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      {isProcessing ? 'Генерація...' : 'Згенерувати Alt тексти'}
                    </Button>
                    <Button variant="outline" onClick={() => setSelectedFiles([])}>
                      Очистити
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Результати обробки */
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Згенеровані Alt тексти
                  </h2>
                  {processedPhotos.every(p => p.status === 'completed') && (
                    <Button onClick={downloadCSV}>
                      <Download className="w-4 h-4 mr-2" />
                      Завантажити CSV
                    </Button>
                  )}
                </div>

                {processedPhotos.map((photo) => (
                  <Card key={photo.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          {photo.name}
                        </CardTitle>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={photo.status === 'completed' ? 'default' : 'secondary'}
                            className={
                              photo.status === 'completed' 
                                ? 'bg-green-500' 
                                : photo.status === 'processing' 
                                ? 'bg-blue-500' 
                                : 'bg-red-500'
                            }
                          >
                            {photo.status === 'completed' 
                              ? `Готово (${photo.confidence.toFixed(1)}%)` 
                              : photo.status === 'processing' 
                              ? 'Обробка' 
                              : 'Помилка'
                            }
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {photo.status === 'processing' && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Аналіз зображення...</span>
                            <span className="text-sm text-gray-500">{photo.progress}%</span>
                          </div>
                          <Progress value={photo.progress} className="w-full" />
                        </div>
                      )}

                      {photo.status === 'completed' && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Зображення */}
                            <div>
                              <img
                                src={photo.preview}
                                alt={photo.altText}
                                className="w-full h-32 object-cover rounded-lg"
                              />
                            </div>

                            {/* Alt текст */}
                            <div className="md:col-span-2">
                              <div className="flex items-center justify-between mb-2">
                                <Label htmlFor={`alt-${photo.id}`}>Alt текст</Label>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => copyToClipboard(photo.altText)}
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                              </div>
                              <Textarea
                                id={`alt-${photo.id}`}
                                value={photo.altText}
                                onChange={(e) => {
                                  setProcessedPhotos(prev => prev.map(p => 
                                    p.id === photo.id ? { ...p, altText: e.target.value } : p
                                  ));
                                }}
                                className="min-h-[80px]"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                {photo.altText.length} / {settings.maxLength} символів
                              </p>
                            </div>
                          </div>

                          {/* Деталі аналізу */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div>
                              <h4 className="font-medium mb-2 flex items-center gap-2">
                                <Eye className="w-4 h-4" />
                                Виявлені об'єкти
                              </h4>
                              <div className="flex flex-wrap gap-1">
                                {photo.detectedObjects.map((obj, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {obj}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <div>
                              <h4 className="font-medium mb-2 flex items-center gap-2">
                                <div className="w-4 h-4 bg-gradient-to-r from-red-500 to-blue-500 rounded-full" />
                                Домінуючі кольори
                              </h4>
                              <div className="flex flex-wrap gap-1">
                                {photo.dominantColors.map((color, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {color}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {/* Додати ще фото */}
                <Card>
                  <CardContent className="p-6 text-center">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSelectedFiles([]);
                        setProcessedPhotos([]);
                      }}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Обробити ще фото
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Налаштування */}
          <div className="space-y-6">
            {/* Мова */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Languages className="w-5 h-5" />
                  Мова
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={settings.language} onValueChange={(value) => updateSetting('language', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Стиль опису */}
            <Card>
              <CardHeader>
                <CardTitle>Стиль опису</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {styles.map((style) => (
                  <Button
                    key={style.value}
                    variant={settings.style === style.value ? 'default' : 'outline'}
                    onClick={() => updateSetting('style', style.value)}
                    className="w-full justify-start h-auto p-3"
                  >
                    <div className="text-left">
                      <div className="font-medium">{style.label}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {style.description}
                      </div>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Що включати */}
            <Card>
              <CardHeader>
                <CardTitle>Що включати в опис</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-objects"
                    checked={settings.includeObjects}
                    onCheckedChange={(checked: boolean) => updateSetting('includeObjects', checked)}
                  />
                  <Label htmlFor="include-objects">Об'єкти та предмети</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-colors"
                    checked={settings.includeColors}
                    onCheckedChange={(checked: boolean) => updateSetting('includeColors', checked)}
                  />
                  <Label htmlFor="include-colors">Кольори</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-actions"
                    checked={settings.includeActions}
                    onCheckedChange={(checked: boolean) => updateSetting('includeActions', checked)}
                  />
                  <Label htmlFor="include-actions">Дії та рухи</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-emotions"
                    checked={settings.includeEmotions}
                    onCheckedChange={(checked: boolean) => updateSetting('includeEmotions', checked)}
                  />
                  <Label htmlFor="include-emotions">Емоції та настрій</Label>
                </div>
              </CardContent>
            </Card>

            {/* Довжина тексту */}
            <Card>
              <CardHeader>
                <CardTitle>Довжина тексту</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="max-length">Максимум символів ({settings.maxLength})</Label>
                  <input
                    id="max-length"
                    type="range"
                    min="50"
                    max="200"
                    value={settings.maxLength}
                    onChange={(e) => updateSetting('maxLength', parseInt(e.target.value))}
                    className="w-full mt-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Коротко (50)</span>
                    <span>Детально (200)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Поради */}
            <Card>
              <CardHeader>
                <CardTitle>💡 Поради</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p>• Alt тексти покращують доступність сайту</p>
                  <p>• Оптимальна довжина: 100-125 символів</p>
                  <p>• Уникайте фраз "зображення" або "фото"</p>
                  <p>• Описуйте контекст, а не тільки об'єкти</p>
                  <p>• Для декоративних зображень використовуйте порожній alt=""</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
