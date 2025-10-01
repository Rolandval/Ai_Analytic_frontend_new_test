import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Download, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Progress } from '@/components/ui/Progress';
import { Badge } from '@/components/ui/Badge';
import PhotoUpload from './components/PhotoUpload';

interface PhotoFile {
  id: string;
  file: File;
  preview: string;
  name: string;
  size: number;
  type: string;
}

interface UpscaleSettings {
  scale: number;
  model: string;
  format: string;
  quality: number;
}

interface ProcessedPhoto extends PhotoFile {
  processedPreview: string;
  status: 'processing' | 'completed' | 'error';
  progress: number;
  originalDimensions: { width: number; height: number };
  newDimensions: { width: number; height: number };
  upscaleSettings: UpscaleSettings;
}

const upscaleModels = [
  { value: 'real-esrgan', label: 'Real-ESRGAN (Універсальний)', description: 'Найкращий для більшості зображень' },
  { value: 'waifu2x', label: 'Waifu2x (Аніме)', description: 'Оптимізований для аніме та мультфільмів' },
  { value: 'esrgan', label: 'ESRGAN (Фото)', description: 'Ідеальний для реальних фотографій' },
  { value: 'srcnn', label: 'SRCNN (Швидкий)', description: 'Швидка обробка з хорошою якістю' }
];

export default function PhotoUpscale() {
  const [selectedFiles, setSelectedFiles] = useState<PhotoFile[]>([]);
  const [processedPhotos, setProcessedPhotos] = useState<ProcessedPhoto[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [settings, setSettings] = useState<UpscaleSettings>({
    scale: 2,
    model: 'real-esrgan',
    format: 'png',
    quality: 95
  });

  const handleFilesSelected = (files: PhotoFile[]) => {
    setSelectedFiles(files);
  };

  const updateSetting = (key: keyof UpscaleSettings, value: number | string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const startProcessing = async () => {
    if (selectedFiles.length === 0) return;
    
    setIsProcessing(true);
    
    // Ініціалізуємо оброблені фото
    const initialProcessed: ProcessedPhoto[] = selectedFiles.map(file => ({
      ...file,
      processedPreview: file.preview,
      status: 'processing' as const,
      progress: 0,
      originalDimensions: { width: 1920, height: 1080 }, // Мок-дані
      newDimensions: { width: 1920 * settings.scale, height: 1080 * settings.scale },
      upscaleSettings: { ...settings }
    }));
    
    setProcessedPhotos(initialProcessed);

    // Симуляція обробки кожного фото
    for (let i = 0; i < selectedFiles.length; i++) {
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setProcessedPhotos(prev => prev.map((photo, index) => 
          index === i 
            ? { ...photo, progress }
            : photo
        ));
      }
      
      // Позначаємо як завершене
      setProcessedPhotos(prev => prev.map((photo, index) => 
        index === i 
          ? { 
              ...photo, 
              status: 'completed' as const,
              progress: 100
            }
          : photo
      ));
    }
    
    setIsProcessing(false);
  };

  const downloadPhoto = (photo: ProcessedPhoto) => {
    console.log('Завантаження апскейленого фото:', photo.name);
  };

  const downloadAll = () => {
    const completedPhotos = processedPhotos.filter(p => p.status === 'completed');
    console.log('Завантаження всіх апскейлених фото:', completedPhotos.length);
  };

  const calculateNewSize = (originalSize: number) => {
    return (originalSize * Math.pow(settings.scale, 2) / (1024 * 1024)).toFixed(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800">
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
            <div className="p-2 bg-green-500 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Апскейл зображень
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Збільшуйте роздільну здатність фото за допомогою AI
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
                    Налаштуйте параметри апскейлу та почніть обробку
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
                      <TrendingUp className="w-4 h-4 mr-2" />
                      {isProcessing ? 'Апскейл...' : 'Почати апскейл'}
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
                    Апскейлені фото
                  </h2>
                  {processedPhotos.every(p => p.status === 'completed') && (
                    <Button onClick={downloadAll}>
                      <Download className="w-4 h-4 mr-2" />
                      Завантажити все
                    </Button>
                  )}
                </div>

                {processedPhotos.map((photo) => (
                  <Card key={photo.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="w-5 h-5" />
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
                              ? 'Готово' 
                              : photo.status === 'processing' 
                              ? 'Обробка' 
                              : 'Помилка'
                            }
                          </Badge>
                          {photo.status === 'completed' && (
                            <Button size="sm" onClick={() => downloadPhoto(photo)}>
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {photo.status === 'processing' && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Апскейл зображення...</span>
                            <span className="text-sm text-gray-500">{photo.progress}%</span>
                          </div>
                          <Progress value={photo.progress} className="w-full" />
                        </div>
                      )}

                      {photo.status === 'completed' && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-medium mb-2">Оригінал</h4>
                              <img
                                src={photo.preview}
                                alt={`${photo.name} - оригінал`}
                                className="w-full h-48 object-cover rounded-lg"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                {photo.originalDimensions.width} × {photo.originalDimensions.height}
                              </p>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium mb-2">Апскейлено ({photo.upscaleSettings.scale}x)</h4>
                              <img
                                src={photo.processedPreview}
                                alt={`${photo.name} - апскейлено`}
                                className="w-full h-48 object-cover rounded-lg"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                {photo.newDimensions.width} × {photo.newDimensions.height}
                              </p>
                            </div>
                          </div>

                          {/* Статистика */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="text-center">
                              <div className="text-lg font-bold text-green-600">
                                {photo.upscaleSettings.scale}x
                              </div>
                              <div className="text-xs text-gray-500">Масштаб</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-blue-600">
                                {calculateNewSize(photo.size)} МБ
                              </div>
                              <div className="text-xs text-gray-500">Новий розмір</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-purple-600">
                                {photo.upscaleSettings.model.toUpperCase()}
                              </div>
                              <div className="text-xs text-gray-500">Модель</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-orange-600">
                                {photo.upscaleSettings.quality}%
                              </div>
                              <div className="text-xs text-gray-500">Якість</div>
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
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Апскейлити ще фото
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Налаштування */}
          <div className="space-y-6">
            {/* Масштаб */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Масштаб
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="scale">Коефіцієнт збільшення</Label>
                  <Select value={settings.scale.toString()} onValueChange={(value) => updateSetting('scale', parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2x (подвоїти)</SelectItem>
                      <SelectItem value="3">3x (потроїти)</SelectItem>
                      <SelectItem value="4">4x (почетверити)</SelectItem>
                      <SelectItem value="6">6x (максимум)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Більший масштаб = довша обробка
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* AI Модель */}
            <Card>
              <CardHeader>
                <CardTitle>AI Модель</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upscaleModels.map((model) => (
                    <Button
                      key={model.value}
                      variant={settings.model === model.value ? 'default' : 'outline'}
                      onClick={() => updateSetting('model', model.value)}
                      className="w-full justify-start h-auto p-4"
                    >
                      <div className="text-left">
                        <div className="font-medium">{model.label}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {model.description}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Вихідні налаштування */}
            <Card>
              <CardHeader>
                <CardTitle>Вихідні налаштування</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="format">Формат файлу</Label>
                  <Select value={settings.format} onValueChange={(value) => updateSetting('format', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="png">PNG (без втрат)</SelectItem>
                      <SelectItem value="jpg">JPEG (стиснутий)</SelectItem>
                      <SelectItem value="webp">WEBP (сучасний)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="quality">Якість ({settings.quality}%)</Label>
                  <input
                    id="quality"
                    type="range"
                    min="60"
                    max="100"
                    value={settings.quality}
                    onChange={(e) => updateSetting('quality', parseInt(e.target.value))}
                    className="w-full mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Інформація */}
            <Card>
              <CardHeader>
                <CardTitle>Інформація</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Обрана модель:</span>
                    <span className="font-medium">
                      {upscaleModels.find(m => m.value === settings.model)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Масштаб:</span>
                    <span className="font-medium">{settings.scale}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Формат:</span>
                    <span className="font-medium">{settings.format.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Якість:</span>
                    <span className="font-medium">{settings.quality}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
