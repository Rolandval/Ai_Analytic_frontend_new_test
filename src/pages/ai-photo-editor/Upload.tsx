import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import PhotoUpload from './components/PhotoUpload';

interface PhotoFile {
  id: string;
  file: File;
  preview: string;
  name: string;
  size: number;
  type: string;
}

const quickActions = [
  {
    title: 'Ресайз зображень',
    description: 'Змінити розмір фото',
    path: '/ai-photo-editor/resize',
    color: 'bg-blue-500'
  },
  {
    title: 'Видалення фону',
    description: 'Прибрати фон з фото',
    path: '/ai-photo-editor/remove-background',
    color: 'bg-red-500'
  },
  {
    title: 'Покращення якості',
    description: 'Покращити якість AI',
    path: '/ai-photo-editor/enhance',
    color: 'bg-violet-500'
  },
  {
    title: 'Апскейл',
    description: 'Збільшити роздільність',
    path: '/ai-photo-editor/upscale',
    color: 'bg-green-500'
  }
];

export default function PhotoUploadPage() {
  const [selectedFiles, setSelectedFiles] = useState<PhotoFile[]>([]);

  const handleFilesSelected = (files: PhotoFile[]) => {
    setSelectedFiles(files);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button variant="ghost" asChild className="mr-4">
            <Link to="/ai-photo-editor">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Завантаження фото
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Завантажте фото для обробки за допомогою AI
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Основна область завантаження */}
          <div className="lg:col-span-2">
            <PhotoUpload 
              onFilesSelected={handleFilesSelected}
              maxFiles={20}
              maxFileSize={15 * 1024 * 1024} // 15MB
            />
          </div>

          {/* Бічна панель з швидкими діями */}
          <div className="space-y-6">
            {/* Швидкі дії */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  Швидкі дії
                </CardTitle>
                <CardDescription>
                  Популярні функції обробки фото
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start h-auto p-4"
                    asChild
                  >
                    <Link to={action.path}>
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${action.color}`} />
                        <div className="text-left flex-1">
                          <div className="font-medium">{action.title}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {action.description}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </Link>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Інформація */}
            <Card>
              <CardHeader>
                <CardTitle>Підтримувані формати</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>JPEG/JPG</span>
                    <span className="text-green-600 dark:text-green-400">✓</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PNG</span>
                    <span className="text-green-600 dark:text-green-400">✓</span>
                  </div>
                  <div className="flex justify-between">
                    <span>WEBP</span>
                    <span className="text-green-600 dark:text-green-400">✓</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GIF</span>
                    <span className="text-green-600 dark:text-green-400">✓</span>
                  </div>
                  <div className="flex justify-between">
                    <span>BMP</span>
                    <span className="text-green-600 dark:text-green-400">✓</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Максимальний розмір:</strong> 15 МБ на файл
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    <strong>Максимальна кількість:</strong> 20 файлів
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Статистика */}
            {selectedFiles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Статистика</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Завантажено файлів:</span>
                      <span className="font-medium">{selectedFiles.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Загальний розмір:</span>
                      <span className="font-medium">
                        {(selectedFiles.reduce((acc, file) => acc + file.size, 0) / (1024 * 1024)).toFixed(2)} МБ
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Середній розмір:</span>
                      <span className="font-medium">
                        {selectedFiles.length > 0 
                          ? ((selectedFiles.reduce((acc, file) => acc + file.size, 0) / selectedFiles.length) / (1024 * 1024)).toFixed(2) 
                          : '0'} МБ
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Дії з завантаженими файлами */}
        {selectedFiles.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Що далі?</CardTitle>
              <CardDescription>
                Оберіть функцію для обробки завантажених фото
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-20 flex-col space-y-2"
                    asChild
                  >
                    <Link to={`${action.path}?files=${selectedFiles.map(f => f.id).join(',')}`}>
                      <div className={`w-4 h-4 rounded-full ${action.color}`} />
                      <span className="text-sm font-medium text-center">
                        {action.title}
                      </span>
                    </Link>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
