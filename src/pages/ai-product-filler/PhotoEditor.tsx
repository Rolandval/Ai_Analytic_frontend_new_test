import React, { useState, useCallback } from 'react';
import { 
  Upload, X, Download, Wand2, Maximize2, Sparkles, 
  Eraser, Move, FileText, FileImage, Palette, 
  Type, Crop
} from 'lucide-react';
import AIProductFillerLayout from './components/AIProductFillerLayout';
import { Card } from '@/components/ui/Card';

interface UploadedImage {
  id: string;
  file: File;
  url: string;
  name: string;
  size: number;
}

interface ProcessingTask {
  id: string;
  imageId: string;
  feature: string;
  status: 'processing' | 'completed' | 'error';
  progress: number;
  resultUrl?: string;
}

type FeatureType = 
  | 'resize' 
  | 'upscale' 
  | 'optimize' 
  | 'remove-bg' 
  | 'reposition' 
  | 'remove-watermark' 
  | 'alt-text' 
  | 'rename' 
  | 'convert-format' 
  | 'add-bg' 
  | 'add-text' 
  | 'enhance';

interface Feature {
  id: FeatureType;
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}

function PhotoEditorContent() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [tasks, setTasks] = useState<ProcessingTask[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<FeatureType | null>(null);
  const [toolSettings, setToolSettings] = useState<any>({});

  const features: Feature[] = [
    {
      id: 'resize',
      icon: Crop,
      title: 'Ресайз',
      description: 'Зміна розміру зображення',
      color: 'bg-blue-500'
    },
    {
      id: 'upscale',
      icon: Maximize2,
      title: 'Апскейл',
      description: 'Збільшення роздільної здатності',
      color: 'bg-purple-500'
    },
    {
      id: 'optimize',
      icon: Sparkles,
      title: 'Оптимізація',
      description: 'Стиснення без втрати якості',
      color: 'bg-green-500'
    },
    {
      id: 'remove-bg',
      icon: Eraser,
      title: 'Видалення фону',
      description: 'Автоматичне видалення фону',
      color: 'bg-red-500'
    },
    {
      id: 'reposition',
      icon: Move,
      title: 'Розташування',
      description: 'Зміна композиції зображення',
      color: 'bg-yellow-500'
    },
    {
      id: 'remove-watermark',
      icon: Eraser,
      title: 'Видалення водяних знаків',
      description: 'Прибирання водяних знаків',
      color: 'bg-orange-500'
    },
    {
      id: 'alt-text',
      icon: FileText,
      title: 'ALT підпис',
      description: 'Генерація опису для доступності',
      color: 'bg-indigo-500'
    },
    {
      id: 'rename',
      icon: FileText,
      title: 'Зміна назви',
      description: 'Автоматичне перейменування файлів',
      color: 'bg-pink-500'
    },
    {
      id: 'convert-format',
      icon: FileImage,
      title: 'Зміна формату',
      description: 'Конвертація між форматами',
      color: 'bg-teal-500'
    },
    {
      id: 'add-bg',
      icon: Palette,
      title: 'Тематичний фон AI',
      description: 'Додавання AI-згенерованого фону',
      color: 'bg-cyan-500'
    },
    {
      id: 'add-text',
      icon: Type,
      title: 'Надписи AI',
      description: 'Додавання текстових елементів (акції)',
      color: 'bg-lime-500'
    },
    {
      id: 'enhance',
      icon: Wand2,
      title: 'Покращення якості',
      description: 'AI покращення деталей',
      color: 'bg-violet-500'
    }
  ];

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    processFiles(files);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
  }, []);

  const processFiles = (files: File[]) => {
    files.forEach(file => {
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      const url = URL.createObjectURL(file);
      
      const newImage: UploadedImage = {
        id,
        file,
        url,
        name: file.name,
        size: file.size
      };
      
      setImages(prev => [...prev, newImage]);
      
      // Автоматично вибираємо перше завантажене зображення
      if (images.length === 0) {
        setSelectedImage(id);
      }
    });
  };

  const removeImage = (id: string) => {
    setImages(prev => {
      const imageToRemove = prev.find(img => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.url);
      }
      return prev.filter(img => img.id !== id);
    });
    
    // Видаляємо всі задачі для цього зображення
    setTasks(prev => prev.filter(task => task.imageId !== id));
    
    // Якщо видалене зображення було вибране, вибираємо інше
    if (selectedImage === id) {
      const remainingImages = images.filter(img => img.id !== id);
      setSelectedImage(remainingImages.length > 0 ? remainingImages[0].id : null);
    }
  };

  const openToolSettings = (featureId: FeatureType) => {
    if (!selectedImage) {
      alert('Будь ласка, виберіть зображення');
      return;
    }
    setSelectedTool(featureId);
    // Встановлюємо дефолтні налаштування для інструменту
    const defaults: any = {
      resize: { width: 800, height: 600, maintainRatio: true },
      upscale: { scale: 2, model: 'standard' },
      optimize: { quality: 80, format: 'same' },
      'remove-bg': { accuracy: 'high' },
      reposition: { position: 'center' },
      'remove-watermark': { mode: 'auto' },
      'alt-text': { language: 'ua', detailed: true },
      rename: { pattern: 'product_{n}', startFrom: 1 },
      'convert-format': { format: 'webp', quality: 90 },
      'add-bg': { theme: 'neutral', color: '#ffffff' },
      'add-text': { text: 'АКЦІЯ', position: 'top-right', color: '#ff0000' },
      enhance: { strength: 50, denoise: true }
    };
    setToolSettings(defaults[featureId] || {});
  };

  const applyFeature = () => {
    if (!selectedImage || !selectedTool) return;

    const taskId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const feature = features.find(f => f.id === selectedTool);
    
    const newTask: ProcessingTask = {
      id: taskId,
      imageId: selectedImage,
      feature: feature?.title || selectedTool,
      status: 'processing',
      progress: 0
    };
    
    setTasks(prev => [...prev, newTask]);
    
    // Симуляція обробки
    simulateProcessing(taskId);
  };

  const simulateProcessing = (taskId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, progress: Math.min(progress, 100) }
          : task
      ));
      
      if (progress >= 100) {
        clearInterval(interval);
        
        // Мок результат
        const mockResult = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzRmNDZlNSIvPgogIDx0ZXh0IHg9IjIwMCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+0J7QsdGA0L7QsdC70LXQvdC+INCU0IY8L3RleHQ+Cjwvc3ZnPgo=";
        
        setTasks(prev => prev.map(task => 
          task.id === taskId 
            ? { 
                ...task, 
                status: 'completed', 
                progress: 100,
                resultUrl: mockResult 
              }
            : task
        ));
        setSelectedTool(null);
      }
    }, 200);
  };

  const downloadResult = (task: ProcessingTask) => {
    if (!task.resultUrl) return;
    
    const link = document.createElement('a');
    link.href = task.resultUrl;
    link.download = `processed_${task.feature}_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const removeTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const selectedImageData = images.find(img => img.id === selectedImage);
  const imageTasks = tasks.filter(task => task.imageId === selectedImage);

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Робота з фото
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Потужні AI інструменти для обробки зображень товарів
          </p>
        </div>

        {/* Зона завантаження */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors mb-8 ${
            dragOver
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Завантажте зображення
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Перетягніть файли сюди або виберіть вручну
          </p>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer transition-colors"
          >
            <Upload className="h-4 w-4 mr-2" />
            Вибрати файли
          </label>
        </div>

        {/* Основний контент */}
        {images.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Ліва панель - список зображень */}
            <div className="lg:col-span-1">
              <Card className="p-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Завантажені зображення ({images.length})
                </h2>
                <div className="space-y-2">
                  {images.map((image) => (
                    <div
                      key={image.id}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        selectedImage === image.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                      onClick={() => setSelectedImage(image.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={image.url}
                          alt={image.name}
                          className="h-12 w-12 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {image.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {(image.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(image.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Центральна панель - інструменти */}
            <div className="lg:col-span-2">
              {/* Превʼю вибраного зображення */}
              {selectedImageData && (
                <Card className="p-4 mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Поточне зображення
                  </h2>
                  <div className="flex justify-center">
                    <img
                      src={selectedImageData.url}
                      alt={selectedImageData.name}
                      className="max-h-64 rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                  </div>
                </Card>
              )}

              {/* Інструменти обробки - горизонтальна лінія */}
              <Card className="p-4 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  AI Інструменти
                </h2>
                <div className="overflow-x-auto pb-2">
                  <div className="flex gap-3 min-w-max">
                    {features.map((feature) => {
                      const Icon = feature.icon;
                      const isSelected = selectedTool === feature.id;
                      return (
                        <button
                          key={feature.id}
                          onClick={() => openToolSettings(feature.id)}
                          disabled={!selectedImage}
                          className={`flex-shrink-0 p-3 rounded-lg border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed group ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                          <p className="text-xs font-medium text-gray-900 dark:text-white text-center whitespace-nowrap">
                            {feature.title}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Card>

              {/* Панель налаштувань інструменту */}
              {selectedTool && (
                <Card className="p-4 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Налаштування: {features.find(f => f.id === selectedTool)?.title}
                    </h2>
                    <button
                      onClick={() => setSelectedTool(null)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  
                  {/* Налаштування для Ресайз */}
                  {selectedTool === 'resize' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Ширина (px)
                          </label>
                          <input
                            type="number"
                            value={toolSettings.width || 800}
                            onChange={(e) => setToolSettings({...toolSettings, width: parseInt(e.target.value)})}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Висота (px)
                          </label>
                          <input
                            type="number"
                            value={toolSettings.height || 600}
                            onChange={(e) => setToolSettings({...toolSettings, height: parseInt(e.target.value)})}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="maintainRatio"
                          checked={toolSettings.maintainRatio || false}
                          onChange={(e) => setToolSettings({...toolSettings, maintainRatio: e.target.checked})}
                          className="mr-2"
                        />
                        <label htmlFor="maintainRatio" className="text-sm text-gray-700 dark:text-gray-300">
                          Зберігати пропорції
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600" onClick={() => setToolSettings({...toolSettings, width: 1920, height: 1080})}>
                          1920×1080
                        </button>
                        <button className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600" onClick={() => setToolSettings({...toolSettings, width: 1280, height: 720})}>
                          1280×720
                        </button>
                        <button className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600" onClick={() => setToolSettings({...toolSettings, width: 800, height: 600})}>
                          800×600
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Налаштування для Апскейл */}
                  {selectedTool === 'upscale' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Масштаб
                        </label>
                        <select
                          value={toolSettings.scale || 2}
                          onChange={(e) => setToolSettings({...toolSettings, scale: parseInt(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                          <option value="2">2x</option>
                          <option value="4">4x</option>
                          <option value="8">8x</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          AI Модель
                        </label>
                        <select
                          value={toolSettings.model || 'standard'}
                          onChange={(e) => setToolSettings({...toolSettings, model: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                          <option value="standard">Стандартна</option>
                          <option value="photo">Фото</option>
                          <option value="art">Арт</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Налаштування для Оптимізації */}
                  {selectedTool === 'optimize' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Якість: {toolSettings.quality || 80}%
                        </label>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={toolSettings.quality || 80}
                          onChange={(e) => setToolSettings({...toolSettings, quality: parseInt(e.target.value)})}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Формат
                        </label>
                        <select
                          value={toolSettings.format || 'same'}
                          onChange={(e) => setToolSettings({...toolSettings, format: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                          <option value="same">Той самий</option>
                          <option value="webp">WebP</option>
                          <option value="jpeg">JPEG</option>
                          <option value="png">PNG</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Універсальні налаштування для інших інструментів */}
                  {!['resize', 'upscale', 'optimize'].includes(selectedTool) && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Налаштування для цього інструменту будуть додані найближчим часом.
                    </div>
                  )}

                  <button
                    onClick={applyFeature}
                    className="mt-4 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
                  >
                    Застосувати
                  </button>
                </Card>
              )}

              {/* Черга обробки */}
              {imageTasks.length > 0 && (
                <Card className="p-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Обробка ({imageTasks.length})
                  </h2>
                  <div className="space-y-3">
                    {imageTasks.map((task) => (
                      <div key={task.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Wand2 className={`h-4 w-4 ${task.status === 'processing' ? 'animate-spin text-blue-500' : 'text-green-500'}`} />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {task.feature}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {task.status === 'completed' && task.resultUrl && (
                              <button
                                onClick={() => downloadResult(task)}
                                className="p-1 text-gray-500 hover:text-green-600 transition-colors"
                                title="Завантажити"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => removeTask(task.id)}
                              className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                              title="Видалити"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        
                        {task.status === 'processing' && (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                Обробка...
                              </span>
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {Math.round(task.progress)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                              <div
                                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${task.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                        
                        {task.status === 'completed' && (
                          <div className="flex items-center space-x-2">
                            <div className="h-2 w-2 bg-green-500 rounded-full" />
                            <span className="text-xs text-green-600 dark:text-green-400">
                              Готово
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Інформаційна секція */}
        {images.length === 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
              Доступні інструменти
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mb-3`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PhotoEditor() {
  return (
    <AIProductFillerLayout>
      <PhotoEditorContent />
    </AIProductFillerLayout>
  );
}
