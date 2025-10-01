import React, { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Scissors, Download, Eye, Layers, Palette } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
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

interface ProcessedPhoto extends PhotoFile {
  processedPreview: string;
  status: 'processing' | 'completed' | 'error';
  progress: number;
}

// Компонент для порівняння зображень (до/після)
const ImageComparisonSlider = ({ originalSrc, processedSrc, alt }: { 
  originalSrc: string; 
  processedSrc: string; 
  alt: string; 
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, [isDragging]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-64 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden cursor-ew-resize select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleClick}
    >
      {/* Оригінальне зображення */}
      <img
        src={originalSrc}
        alt={`${alt} - оригінал`}
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Оброблене зображення */}
      <div 
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img
          src={processedSrc}
          alt={`${alt} - оброблено`}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Слайдер */}
      <div 
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg cursor-ew-resize"
        style={{ left: `${sliderPosition}%` }}
        onMouseDown={handleMouseDown}
      >
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform">
          <div className="w-1 h-4 bg-gray-400 rounded-full mx-0.5"></div>
          <div className="w-1 h-4 bg-gray-400 rounded-full mx-0.5"></div>
        </div>
      </div>

      {/* Підписи */}
      <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
        Оригінал
      </div>
      <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
        Без фону
      </div>

      {/* Індикатор позиції */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
        {Math.round(sliderPosition)}%
      </div>
    </div>
  );
};

export default function RemoveBackground() {
  const [selectedFiles, setSelectedFiles] = useState<PhotoFile[]>([]);
  const [processedPhotos, setProcessedPhotos] = useState<ProcessedPhoto[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFilesSelected = (files: PhotoFile[]) => {
    setSelectedFiles(files);
  };

  const startProcessing = async () => {
    if (selectedFiles.length === 0) return;
    
    setIsProcessing(true);
    
    // Ініціалізуємо оброблені фото
    const initialProcessed: ProcessedPhoto[] = selectedFiles.map(file => ({
      ...file,
      processedPreview: file.preview, // Поки що використовуємо оригінал
      status: 'processing' as const,
      progress: 0
    }));
    
    setProcessedPhotos(initialProcessed);

    // Симуляція обробки кожного фото
    for (let i = 0; i < selectedFiles.length; i++) {
      // Симуляція прогресу для поточного фото
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise(resolve => setTimeout(resolve, 300));
        
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
              progress: 100,
              // В реальному додатку тут би був URL обробленого зображення
              processedPreview: photo.preview
            }
          : photo
      ));
    }
    
    setIsProcessing(false);
  };

  const downloadPhoto = (photo: ProcessedPhoto) => {
    // В реальному додатку тут би була логіка завантаження
    console.log('Завантаження фото:', photo.name);
  };

  const downloadAll = () => {
    const completedPhotos = processedPhotos.filter(p => p.status === 'completed');
    console.log('Завантаження всіх фото:', completedPhotos.length);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 dark:from-gray-900 dark:to-gray-800">
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
            <div className="p-2 bg-red-500 rounded-lg">
              <Scissors className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Видалення фону
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Автоматично видаляйте фон з фотографій за допомогою AI
              </p>
            </div>
          </div>
        </div>

        {/* Завантаження файлів */}
        {selectedFiles.length === 0 && processedPhotos.length === 0 && (
          <div className="mb-8">
            <PhotoUpload onFilesSelected={handleFilesSelected} />
          </div>
        )}

        {/* Завантажені файли (до обробки) */}
        {selectedFiles.length > 0 && processedPhotos.length === 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Завантажені фото ({selectedFiles.length})</CardTitle>
              <CardDescription>
                Готові до видалення фону
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
                  <Scissors className="w-4 h-4 mr-2" />
                  {isProcessing ? 'Обробка...' : 'Видалити фон'}
                </Button>
                <Button variant="outline" onClick={() => setSelectedFiles([])}>
                  Очистити
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Результати обробки */}
        {processedPhotos.length > 0 && (
          <div className="space-y-6">
            {/* Заголовок результатів */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Результати обробки
              </h2>
              {processedPhotos.every(p => p.status === 'completed') && (
                <Button onClick={downloadAll}>
                  <Download className="w-4 h-4 mr-2" />
                  Завантажити все
                </Button>
              )}
            </div>

            {/* Список оброблених фото */}
            {processedPhotos.map((photo) => (
              <Card key={photo.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Layers className="w-5 h-5" />
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
                        <span className="text-sm font-medium">Видалення фону...</span>
                        <span className="text-sm text-gray-500">{photo.progress}%</span>
                      </div>
                      <Progress value={photo.progress} className="w-full" />
                    </div>
                  )}

                  {photo.status === 'completed' && (
                    <div className="space-y-4">
                      <ImageComparisonSlider
                        originalSrc={photo.preview}
                        processedSrc={photo.processedPreview}
                        alt={photo.name}
                      />
                      <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                        Перетягуйте слайдер для порівняння результатів
                      </p>
                    </div>
                  )}

                  {photo.status === 'error' && (
                    <div className="text-center py-8">
                      <div className="text-red-500 mb-2">
                        Помилка при обробці фото
                      </div>
                      <Button variant="outline" size="sm">
                        Спробувати знову
                      </Button>
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
                  <Palette className="w-4 h-4 mr-2" />
                  Обробити ще фото
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Інформаційна секція */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Як працює видалення фону</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">1. Аналіз зображення</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  AI аналізує зображення та визначає об'єкти на передньому плані
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Scissors className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">2. Точне вирізання</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Алгоритм точно відділяє об'єкт від фону, зберігаючи деталі
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Download className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">3. Готовий результат</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Отримайте зображення з прозорим фоном у форматі PNG
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
