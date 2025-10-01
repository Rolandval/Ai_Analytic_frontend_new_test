import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, Download, Sliders, Sun, Contrast, Palette } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Slider } from '@/components/ui/Slider';
import { Checkbox } from '@/components/ui/Checkbox';
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

interface EnhanceSettings {
  brightness: number;
  contrast: number;
  saturation: number;
  sharpness: number;
  noiseReduction: number;
  autoEnhance: boolean;
  hdrEffect: boolean;
  colorCorrection: boolean;
}

interface ProcessedPhoto extends PhotoFile {
  processedPreview: string;
  status: 'processing' | 'completed' | 'error';
  progress: number;
  enhanceSettings: EnhanceSettings;
}

export default function PhotoEnhance() {
  const [selectedFiles, setSelectedFiles] = useState<PhotoFile[]>([]);
  const [processedPhotos, setProcessedPhotos] = useState<ProcessedPhoto[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [settings, setSettings] = useState<EnhanceSettings>({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    sharpness: 0,
    noiseReduction: 50,
    autoEnhance: true,
    hdrEffect: false,
    colorCorrection: true
  });

  const handleFilesSelected = (files: PhotoFile[]) => {
    setSelectedFiles(files);
  };

  const updateSetting = (key: keyof EnhanceSettings, value: number | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettings({
      brightness: 0,
      contrast: 0,
      saturation: 0,
      sharpness: 0,
      noiseReduction: 50,
      autoEnhance: true,
      hdrEffect: false,
      colorCorrection: true
    });
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
      enhanceSettings: { ...settings }
    }));
    
    setProcessedPhotos(initialProcessed);

    // Симуляція обробки кожного фото
    for (let i = 0; i < selectedFiles.length; i++) {
      for (let progress = 0; progress <= 100; progress += 25) {
        await new Promise(resolve => setTimeout(resolve, 400));
        
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
    console.log('Завантаження покращеного фото:', photo.name);
  };

  const downloadAll = () => {
    const completedPhotos = processedPhotos.filter(p => p.status === 'completed');
    console.log('Завантаження всіх покращених фото:', completedPhotos.length);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-100 dark:from-gray-900 dark:to-gray-800">
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
            <div className="p-2 bg-violet-500 rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Покращення якості
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Покращуйте якість фото за допомогою AI алгоритмів
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
                    Налаштуйте параметри покращення та почніть обробку
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
                      {isProcessing ? 'Покращення...' : 'Покращити якість'}
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
                    Покращені фото
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
                          <Sparkles className="w-5 h-5" />
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
                            <span className="text-sm font-medium">Покращення якості...</span>
                            <span className="text-sm text-gray-500">{photo.progress}%</span>
                          </div>
                          <Progress value={photo.progress} className="w-full" />
                        </div>
                      )}

                      {photo.status === 'completed' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium mb-2">Оригінал</h4>
                            <img
                              src={photo.preview}
                              alt={`${photo.name} - оригінал`}
                              className="w-full h-48 object-cover rounded-lg"
                            />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium mb-2">Покращено</h4>
                            <img
                              src={photo.processedPreview}
                              alt={`${photo.name} - покращено`}
                              className="w-full h-48 object-cover rounded-lg"
                            />
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
                      <Sparkles className="w-4 h-4 mr-2" />
                      Покращити ще фото
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Налаштування */}
          <div className="space-y-6">
            {/* Автоматичні налаштування */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Автоматичне покращення
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="auto-enhance"
                    checked={settings.autoEnhance}
                    onCheckedChange={(checked: boolean) => updateSetting('autoEnhance', checked)}
                  />
                  <Label htmlFor="auto-enhance">AI автопокращення</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="color-correction"
                    checked={settings.colorCorrection}
                    onCheckedChange={(checked: boolean) => updateSetting('colorCorrection', checked)}
                  />
                  <Label htmlFor="color-correction">Корекція кольорів</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hdr-effect"
                    checked={settings.hdrEffect}
                    onCheckedChange={(checked: boolean) => updateSetting('hdrEffect', checked)}
                  />
                  <Label htmlFor="hdr-effect">HDR ефект</Label>
                </div>
              </CardContent>
            </Card>

            {/* Ручні налаштування */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sliders className="w-5 h-5" />
                  Ручні налаштування
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sun className="w-4 h-4" />
                    <Label>Яскравість ({settings.brightness > 0 ? '+' : ''}{settings.brightness})</Label>
                  </div>
                  <Slider
                    value={[settings.brightness]}
                    onValueChange={(value) => updateSetting('brightness', value[0])}
                    min={-100}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Contrast className="w-4 h-4" />
                    <Label>Контрастність ({settings.contrast > 0 ? '+' : ''}{settings.contrast})</Label>
                  </div>
                  <Slider
                    value={[settings.contrast]}
                    onValueChange={(value) => updateSetting('contrast', value[0])}
                    min={-100}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Palette className="w-4 h-4" />
                    <Label>Насиченість ({settings.saturation > 0 ? '+' : ''}{settings.saturation})</Label>
                  </div>
                  <Slider
                    value={[settings.saturation]}
                    onValueChange={(value) => updateSetting('saturation', value[0])}
                    min={-100}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div>
                  <Label className="mb-2 block">Різкість ({settings.sharpness > 0 ? '+' : ''}{settings.sharpness})</Label>
                  <Slider
                    value={[settings.sharpness]}
                    onValueChange={(value) => updateSetting('sharpness', value[0])}
                    min={-100}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div>
                  <Label className="mb-2 block">Зменшення шуму ({settings.noiseReduction}%)</Label>
                  <Slider
                    value={[settings.noiseReduction]}
                    onValueChange={(value) => updateSetting('noiseReduction', value[0])}
                    min={0}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>

                <Button variant="outline" onClick={resetSettings} className="w-full">
                  Скинути налаштування
                </Button>
              </CardContent>
            </Card>

            {/* Пресети */}
            <Card>
              <CardHeader>
                <CardTitle>Готові пресети</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setSettings({
                    brightness: 10,
                    contrast: 15,
                    saturation: 20,
                    sharpness: 10,
                    noiseReduction: 30,
                    autoEnhance: true,
                    hdrEffect: false,
                    colorCorrection: true
                  })}
                >
                  📸 Портрет
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setSettings({
                    brightness: 5,
                    contrast: 20,
                    saturation: 30,
                    sharpness: 15,
                    noiseReduction: 20,
                    autoEnhance: true,
                    hdrEffect: true,
                    colorCorrection: true
                  })}
                >
                  🌄 Пейзаж
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setSettings({
                    brightness: -5,
                    contrast: 25,
                    saturation: 10,
                    sharpness: 20,
                    noiseReduction: 40,
                    autoEnhance: true,
                    hdrEffect: false,
                    colorCorrection: true
                  })}
                >
                  🏙️ Архітектура
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setSettings({
                    brightness: 15,
                    contrast: 10,
                    saturation: 40,
                    sharpness: 5,
                    noiseReduction: 25,
                    autoEnhance: true,
                    hdrEffect: false,
                    colorCorrection: true
                  })}
                >
                  🍕 Їжа
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
