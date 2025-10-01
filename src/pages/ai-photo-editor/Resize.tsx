import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Maximize, Lock, Unlock, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Checkbox } from '@/components/ui/Checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Progress } from '@/components/ui/Progress';
import PhotoUpload from './components/PhotoUpload';

interface PhotoFile {
  id: string;
  file: File;
  preview: string;
  name: string;
  size: number;
  type: string;
}

interface ResizeSettings {
  width: number;
  height: number;
  maintainAspectRatio: boolean;
  quality: number;
  format: string;
  resizeMode: 'exact' | 'fit' | 'fill' | 'crop';
}

const presetSizes = [
  { name: 'Instagram Post', width: 1080, height: 1080 },
  { name: 'Instagram Story', width: 1080, height: 1920 },
  { name: 'Facebook Cover', width: 1200, height: 630 },
  { name: 'YouTube Thumbnail', width: 1280, height: 720 },
  { name: 'Twitter Header', width: 1500, height: 500 },
  { name: 'LinkedIn Banner', width: 1584, height: 396 },
  { name: 'Full HD', width: 1920, height: 1080 },
  { name: '4K', width: 3840, height: 2160 }
];

export default function PhotoResize() {
  const [selectedFiles, setSelectedFiles] = useState<PhotoFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [settings, setSettings] = useState<ResizeSettings>({
    width: 1920,
    height: 1080,
    maintainAspectRatio: true,
    quality: 90,
    format: 'jpeg',
    resizeMode: 'fit'
  });

  const handleFilesSelected = (files: PhotoFile[]) => {
    setSelectedFiles(files);
  };

  const updateSettings = (key: keyof ResizeSettings, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      
      // Якщо змінюється ширина і включено збереження пропорцій
      if (key === 'width' && prev.maintainAspectRatio && selectedFiles.length > 0) {
        const firstFile = selectedFiles[0];
        // Тут би ми отримали оригінальні розміри з файлу
        // Для демо використовуємо стандартні пропорції
        const aspectRatio = 16 / 9; // Приклад
        newSettings.height = Math.round(value / aspectRatio);
      }
      
      // Якщо змінюється висота і включено збереження пропорцій
      if (key === 'height' && prev.maintainAspectRatio && selectedFiles.length > 0) {
        const aspectRatio = 16 / 9; // Приклад
        newSettings.width = Math.round(value * aspectRatio);
      }
      
      return newSettings;
    });
  };

  const applyPreset = (preset: typeof presetSizes[0]) => {
    setSettings(prev => ({
      ...prev,
      width: preset.width,
      height: preset.height
    }));
  };

  const resetToOriginal = () => {
    // В реальному додатку тут би ми отримували оригінальні розміри
    setSettings(prev => ({
      ...prev,
      width: 1920,
      height: 1080
    }));
  };

  const startProcessing = async () => {
    if (selectedFiles.length === 0) return;
    
    setIsProcessing(true);
    setProgress(0);
    
    // Симуляція обробки
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setProgress(i);
    }
    
    setIsProcessing(false);
    // Тут би ми показали результати або перенаправили на сторінку результатів
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
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
            <div className="p-2 bg-blue-500 rounded-lg">
              <Maximize className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Ресайз зображень
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Змінюйте розмір фото зі збереженням якості
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Завантаження файлів */}
          <div className="lg:col-span-2">
            {selectedFiles.length === 0 ? (
              <PhotoUpload onFilesSelected={handleFilesSelected} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Завантажені фото ({selectedFiles.length})</CardTitle>
                  <CardDescription>
                    Налаштуйте параметри ресайзу та почніть обробку
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
                          <div className="bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                            {file.name}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Прогрес обробки */}
                  {isProcessing && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Обробка фото...</span>
                        <span className="text-sm text-gray-500">{progress}%</span>
                      </div>
                      <Progress value={progress} className="w-full" />
                    </div>
                  )}

                  {/* Кнопка обробки */}
                  <div className="flex space-x-4">
                    <Button 
                      onClick={startProcessing} 
                      disabled={isProcessing}
                      className="flex-1"
                    >
                      {isProcessing ? 'Обробка...' : 'Почати ресайз'}
                    </Button>
                    <Button variant="outline" onClick={() => setSelectedFiles([])}>
                      Очистити
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Налаштування */}
          <div className="space-y-6">
            {/* Розміри */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Maximize className="w-5 h-5" />
                  Розміри
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="width">Ширина (px)</Label>
                    <Input
                      id="width"
                      type="number"
                      value={settings.width}
                      onChange={(e) => updateSettings('width', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="height">Висота (px)</Label>
                    <Input
                      id="height"
                      type="number"
                      value={settings.height}
                      onChange={(e) => updateSettings('height', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="aspect-ratio"
                    checked={settings.maintainAspectRatio}
                    onCheckedChange={(checked: boolean) => updateSettings('maintainAspectRatio', checked)}
                  />
                  <Label htmlFor="aspect-ratio" className="flex items-center gap-2">
                    {settings.maintainAspectRatio ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    Зберігати пропорції
                  </Label>
                </div>

                <Button variant="outline" onClick={resetToOriginal} className="w-full">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Скинути до оригіналу
                </Button>
              </CardContent>
            </Card>

            {/* Пресети */}
            <Card>
              <CardHeader>
                <CardTitle>Готові розміри</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-2">
                  {presetSizes.map((preset, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      onClick={() => applyPreset(preset)}
                      className="justify-between h-auto p-3"
                    >
                      <span className="font-medium">{preset.name}</span>
                      <span className="text-sm text-gray-500">
                        {preset.width} × {preset.height}
                      </span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Додаткові налаштування */}
            <Card>
              <CardHeader>
                <CardTitle>Налаштування якості</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="quality">Якість ({settings.quality}%)</Label>
                  <Input
                    id="quality"
                    type="range"
                    min="10"
                    max="100"
                    value={settings.quality}
                    onChange={(e) => updateSettings('quality', parseInt(e.target.value))}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="format">Формат файлу</Label>
                  <Select value={settings.format} onValueChange={(value) => updateSettings('format', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jpeg">JPEG</SelectItem>
                      <SelectItem value="png">PNG</SelectItem>
                      <SelectItem value="webp">WEBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="resize-mode">Режим ресайзу</Label>
                  <Select value={settings.resizeMode} onValueChange={(value) => updateSettings('resizeMode', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fit">Вписати (fit)</SelectItem>
                      <SelectItem value="fill">Заповнити (fill)</SelectItem>
                      <SelectItem value="exact">Точний розмір</SelectItem>
                      <SelectItem value="crop">Обрізати (crop)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
