import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Scissors, Download, Upload, X, ArrowLeftRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { useRemoveBackground } from '@/hooks/useRemoveBackground';

interface ProcessedImage {
  id: string;
  name: string;
  file: File;
  originalUrl: string;
  processedUrl: string | null;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
}

// Функція для очищення base64 від пробілів та переносів
const cleanBase64 = (base64: string): string => {
  return base64.replace(/\s/g, '');
};

// Функція для визначення MIME типу з base64
const detectImageMimeType = (base64: string): string => {
  const cleaned = cleanBase64(base64);
  if (cleaned.startsWith('/9j/')) return 'image/jpeg';
  if (cleaned.startsWith('iVBORw0KGgo')) return 'image/png';
  if (cleaned.startsWith('R0lGOD')) return 'image/gif';
  if (cleaned.startsWith('UklGR')) return 'image/webp';
  if (cleaned.startsWith('Qk')) return 'image/bmp';
  return 'image/png'; // default fallback
};

export default function RemoveBackground() {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const removeBackgroundMutation = useRemoveBackground();
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  }, []);

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024
    );

    const newImages: ProcessedImage[] = validFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      file: file,
      originalUrl: URL.createObjectURL(file),
      processedUrl: null,
      status: 'pending',
      progress: 0,
    }));

    setImages(prev => [...prev, ...newImages]);

    // Process each image
    newImages.forEach(img => {
      const file = validFiles.find(f => f.name === img.name);
      if (file) {
        processImage(img.id, file);
      }
    });
  };

  const processImage = async (imageId: string, file: File) => {
    setImages(prev => prev.map(img => 
      img.id === imageId 
        ? { ...img, status: 'processing' as const, progress: 0 }
        : img
    ));

    try {
      const result = await removeBackgroundMutation.mutateAsync({
        image: file,
        data: {
          model_name: 'Claude-Opus',
          format: 'png',
          quality: 100,
        },
      });

      if (result.success && result.processed_image) {
        // Визначаємо MIME тип та формуємо data URL
        let processedUrl: string;
        if (result.processed_image.startsWith('data:')) {
          processedUrl = result.processed_image;
        } else {
          const cleanedBase64 = cleanBase64(result.processed_image);
          const mimeType = detectImageMimeType(result.processed_image);
          processedUrl = `data:${mimeType};base64,${cleanedBase64}`;
        }

        setImages(prev => prev.map(img => 
          img.id === imageId 
            ? { ...img, status: 'completed' as const, progress: 100, processedUrl }
            : img
        ));
      } else {
        throw new Error(result.message || 'Обробка не вдалася');
      }
    } catch (error: any) {
      setImages(prev => prev.map(img => 
        img.id === imageId 
          ? { ...img, status: 'error' as const, error: error.message }
          : img
      ));
    }
  };

  const removeImage = (imageId: string) => {
    setImages(prev => {
      const img = prev.find(i => i.id === imageId);
      if (img) {
        URL.revokeObjectURL(img.originalUrl);
        if (img.processedUrl && img.processedUrl.startsWith('blob:')) {
          URL.revokeObjectURL(img.processedUrl);
        }
      }
      return prev.filter(i => i.id !== imageId);
    });
  };

  const downloadImage = (url: string, name: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `no-bg_${name.replace(/\.[^/.]+$/, '')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button variant="ghost" asChild className="mr-4">
            <Link to="/ai-photo-editor">Назад</Link>
          </Button>
          <div className="flex items-center gap-3">
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

        {/* Upload Area */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                dragActive
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">
                Перетягніть зображення сюди
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                або натисніть кнопку нижче
              </p>
              <input
                type="file"
                id="file-upload"
                className="hidden"
                multiple
                accept="image/*"
                onChange={handleFileInput}
              />
              <Button asChild>
                <label htmlFor="file-upload" className="cursor-pointer">
                  Вибрати файли
                </label>
              </Button>
              <p className="text-xs text-gray-400 mt-4">
                Підтримувані формати: JPG, PNG, WEBP (макс. 10MB)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Images List */}
        {images.length > 0 && (
          <div className="space-y-4">
            {images.map((image) => (
              <Card key={image.id}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Original Image */}
                    <div className="flex-1">
                      <div className="text-sm font-medium mb-2">Оригінал</div>
                      <img
                        src={image.originalUrl}
                        alt={image.name}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>

                    {/* Arrow */}
                    {image.processedUrl && (
                      <div className="flex items-center justify-center pt-8">
                        <ArrowLeftRight className="w-6 h-6 text-gray-400" />
                      </div>
                    )}

                    {/* Processed Image */}
                    <div className="flex-1">
                      <div className="text-sm font-medium mb-2">
                        Без фону
                      </div>
                      {image.status === 'processing' && (
                        <div className="w-full h-48 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Обробка...
                            </p>
                          </div>
                        </div>
                      )}
                      {image.processedUrl && (
                        <img
                          src={image.processedUrl}
                          alt={`Processed ${image.name}`}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      )}
                      {image.status === 'error' && (
                        <div className="w-full h-48 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                          <p className="text-sm text-red-600 dark:text-red-400">
                            {image.error || 'Помилка обробки'}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeImage(image.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      {image.processedUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadImage(image.processedUrl!, image.name)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Progress */}
                  {image.status === 'processing' && (
                    <div className="mt-4">
                      <Progress value={image.progress} className="h-2" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Як це працює</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>Завантажте зображення</li>
              <li>AI автоматично видалить фон</li>
              <li>Порівняйте результат з оригіналом</li>
              <li>Завантажте оброблене зображення у форматі PNG</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
