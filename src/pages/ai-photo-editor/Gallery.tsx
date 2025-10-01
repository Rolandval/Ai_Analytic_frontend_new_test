import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Download, 
  Eye, 
  Edit, 
  Trash2,
  Calendar,
  FileImage,
  Maximize,
  TrendingUp,
  Palette
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

// Мок-дані для демонстрації
const mockPhotos = [
  {
    id: '1',
    name: 'landscape-mountain.jpg',
    originalName: 'IMG_001.jpg',
    size: 2.4 * 1024 * 1024, // 2.4 MB
    dimensions: { width: 1920, height: 1080 },
    format: 'JPEG',
    uploadDate: '2024-01-15T10:30:00Z',
    processedDate: '2024-01-15T10:32:15Z',
    operations: ['resize', 'enhance'],
    thumbnail: '/api/placeholder/300/200',
    preview: '/api/placeholder/800/600',
    status: 'processed',
    tags: ['пейзаж', 'гори', 'природа']
  },
  {
    id: '2',
    name: 'portrait-woman.png',
    originalName: 'photo_2024.png',
    size: 3.8 * 1024 * 1024, // 3.8 MB
    dimensions: { width: 1080, height: 1350 },
    format: 'PNG',
    uploadDate: '2024-01-14T15:45:00Z',
    processedDate: '2024-01-14T15:47:30Z',
    operations: ['remove-background', 'upscale'],
    thumbnail: '/api/placeholder/300/375',
    preview: '/api/placeholder/800/1000',
    status: 'processed',
    tags: ['портрет', 'люди', 'студія']
  },
  {
    id: '3',
    name: 'product-shoes.webp',
    originalName: 'shoes_catalog.jpg',
    size: 1.2 * 1024 * 1024, // 1.2 MB
    dimensions: { width: 800, height: 800 },
    format: 'WEBP',
    uploadDate: '2024-01-13T09:20:00Z',
    processedDate: '2024-01-13T09:22:45Z',
    operations: ['optimize', 'ai-background'],
    thumbnail: '/api/placeholder/300/300',
    preview: '/api/placeholder/800/800',
    status: 'processed',
    tags: ['товар', 'взуття', 'каталог']
  },
  {
    id: '4',
    name: 'architecture-building.jpg',
    originalName: 'building_001.jpg',
    size: 4.1 * 1024 * 1024, // 4.1 MB
    dimensions: { width: 2048, height: 1536 },
    format: 'JPEG',
    uploadDate: '2024-01-12T14:10:00Z',
    processedDate: null,
    operations: [],
    thumbnail: '/api/placeholder/300/225',
    preview: '/api/placeholder/800/600',
    status: 'processing',
    tags: ['архітектура', 'будівля', 'місто']
  },
  {
    id: '5',
    name: 'food-pizza.jpg',
    originalName: 'pizza_photo.jpg',
    size: 2.8 * 1024 * 1024, // 2.8 MB
    dimensions: { width: 1200, height: 900 },
    format: 'JPEG',
    uploadDate: '2024-01-11T18:30:00Z',
    processedDate: '2024-01-11T18:33:20Z',
    operations: ['enhance', 'ai-text'],
    thumbnail: '/api/placeholder/300/225',
    preview: '/api/placeholder/800/600',
    status: 'processed',
    tags: ['їжа', 'піца', 'ресторан']
  },
  {
    id: '6',
    name: 'nature-forest.jpg',
    originalName: 'forest_walk.jpg',
    size: 3.2 * 1024 * 1024, // 3.2 MB
    dimensions: { width: 1600, height: 1200 },
    format: 'JPEG',
    uploadDate: '2024-01-10T12:15:00Z',
    processedDate: '2024-01-10T12:17:45Z',
    operations: ['resize', 'watermark-removal'],
    thumbnail: '/api/placeholder/300/225',
    preview: '/api/placeholder/800/600',
    status: 'processed',
    tags: ['природа', 'ліс', 'дерева']
  }
];

const operationIcons = {
  'resize': Maximize,
  'upscale': TrendingUp,
  'enhance': Palette,
  'remove-background': Edit,
  'optimize': Palette,
  'ai-background': Palette,
  'ai-text': Edit,
  'watermark-removal': Edit
};

const operationLabels = {
  'resize': 'Ресайз',
  'upscale': 'Апскейл',
  'enhance': 'Покращення',
  'remove-background': 'Видалення фону',
  'optimize': 'Оптимізація',
  'ai-background': 'AI фон',
  'ai-text': 'AI текст',
  'watermark-removal': 'Видалення водяних знаків'
};

export default function PhotoGallery() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredPhotos = mockPhotos.filter(photo =>
    photo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    photo.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotos(prev =>
      prev.includes(photoId)
        ? prev.filter(id => id !== photoId)
        : [...prev, photoId]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Button variant="ghost" asChild className="mr-4">
              <Link to="/ai-photo-editor">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Назад
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Галерея фото
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Переглядайте та керуйте обробленими фото
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Фільтри та пошук */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Пошук по назві або тегах..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Фільтри
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Статистика */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {mockPhotos.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Всього фото
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {mockPhotos.filter(p => p.status === 'processed').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Оброблено
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {mockPhotos.filter(p => p.status === 'processing').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                В обробці
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {(mockPhotos.reduce((acc, photo) => acc + photo.size, 0) / (1024 * 1024)).toFixed(1)} МБ
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Загальний розмір
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Галерея */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPhotos.map((photo) => (
              <Card key={photo.id} className="group hover:shadow-lg transition-all duration-200">
                <CardContent className="p-0">
                  {/* Превʼю зображення */}
                  <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-800 rounded-t-lg overflow-hidden">
                    <img
                      src={photo.thumbnail}
                      alt={photo.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    
                    {/* Overlay з діями */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                        <Button size="sm" variant="secondary">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="secondary">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="secondary">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Статус */}
                    <div className="absolute top-2 right-2">
                      <Badge 
                        variant={photo.status === 'processed' ? 'default' : 'secondary'}
                        className={photo.status === 'processed' ? 'bg-green-500' : 'bg-blue-500'}
                      >
                        {photo.status === 'processed' ? 'Готово' : 'Обробка'}
                      </Badge>
                    </div>
                  </div>

                  {/* Інформація */}
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate mb-1">
                      {photo.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      {photo.dimensions.width} × {photo.dimensions.height} • {formatFileSize(photo.size)}
                    </p>

                    {/* Операції */}
                    {photo.operations.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {photo.operations.slice(0, 2).map((operation) => {
                          const Icon = operationIcons[operation as keyof typeof operationIcons];
                          return (
                            <Badge key={operation} variant="outline" className="text-xs">
                              <Icon className="w-3 h-3 mr-1" />
                              {operationLabels[operation as keyof typeof operationLabels]}
                            </Badge>
                          );
                        })}
                        {photo.operations.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{photo.operations.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Дата */}
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(photo.uploadDate)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Список */
          <div className="space-y-4">
            {filteredPhotos.map((photo) => (
              <Card key={photo.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    {/* Мініатюра */}
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={photo.thumbnail}
                        alt={photo.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Інформація */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {photo.name}
                        </h3>
                        <Badge 
                          variant={photo.status === 'processed' ? 'default' : 'secondary'}
                          className={photo.status === 'processed' ? 'bg-green-500' : 'bg-blue-500'}
                        >
                          {photo.status === 'processed' ? 'Готово' : 'Обробка'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-2">
                        <span>{photo.dimensions.width} × {photo.dimensions.height}</span>
                        <span>{formatFileSize(photo.size)}</span>
                        <span>{photo.format}</span>
                        <span>{formatDate(photo.uploadDate)}</span>
                      </div>

                      {/* Операції */}
                      {photo.operations.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {photo.operations.map((operation) => {
                            const Icon = operationIcons[operation as keyof typeof operationIcons];
                            return (
                              <Badge key={operation} variant="outline" className="text-xs">
                                <Icon className="w-3 h-3 mr-1" />
                                {operationLabels[operation as keyof typeof operationLabels]}
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Дії */}
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Пуста галерея */}
        {filteredPhotos.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <FileImage className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {searchQuery ? 'Нічого не знайдено' : 'Галерея порожня'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchQuery 
                  ? 'Спробуйте змінити пошуковий запит'
                  : 'Завантажте перші фото для початку роботи'
                }
              </p>
              {!searchQuery && (
                <Button asChild>
                  <Link to="/ai-photo-editor/upload">
                    Завантажити фото
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
