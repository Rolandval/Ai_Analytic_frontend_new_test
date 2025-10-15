import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AIProductFillerLayout from './components/AIProductFillerLayout';

export default function WatermarkRemoval() {
  const navigate = useNavigate();

  useEffect(() => {
    // Редірект на нову сторінку PhotoEditor
    navigate('/ai-product-filler/photo-editor', { replace: true });
  }, [navigate]);

  return (
    <AIProductFillerLayout>
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Перенаправлення на Робота з фото...</p>
      </div>
    </AIProductFillerLayout>
  );
} 
  originalImage, 
  processedImage, 
  originalLabel, 
  processedLabel 
}: ImageComparisonSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, [isDragging]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  

  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current || isDragging) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, [isDragging]);
  

  // Додаємо глобальні обробники подій
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-64 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 cursor-ew-resize"
      onClick={handleContainerClick}
    >
      {/* Оригінальне зображення (фон) */}
      <img
        src={originalImage}
        alt="Original"
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />
      
      {/* Оброблене зображення (з обрізкою) */}
      <div 
        className="absolute inset-0 overflow-hidden transition-none"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img
          src={processedImage}
          alt="Processed"
          className="w-full h-full object-cover"
          draggable={false}
        />
      </div>
      
      {/* Вертикальна лінія розділення */}
      <div 
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg transition-none"
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
      >
        {/* Кружечок-хендл для перетягування */}
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center cursor-ew-resize hover:scale-110 transition-transform touch-none"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
        </div>
      </div>
      
      {/* Підписи */}
      <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs pointer-events-none">
        {originalLabel}
      </div>
      <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs pointer-events-none">
        {processedLabel}
      </div>
      
      {/* Індикатор позиції */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-2 py-1 rounded text-xs pointer-events-none">
        {Math.round(sliderPosition)}%
      </div>
    </div>
  );
}

function WatermarkRemovalContent() {
  const { t } = usePFI18n();
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [showComparison, setShowComparison] = useState<string | null>(null);

  // Мок-дані для демонстрації
  const mockProcessedUrl = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzRmNDZlNSIvPgogIDx0ZXh0IHg9IjIwMCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+0J7QsdGA0L7QsdC70LXQvdC+INCU0IY8L3RleHQ+CiAgPHRleHQgeD0iMjAwIiB5PSIxODAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2NjYyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPtCR0LXQtyDQstC+0LTRj9C90L7Qs9C+INC30L3QsNC60YM8L3RleHQ+Cjwvc3ZnPgo=";

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
      const originalUrl = URL.createObjectURL(file);
      
      const newImage: ProcessedImage = {
        id,
        originalFile: file,
        originalUrl,
        processedUrl: '',
        status: 'processing',
        progress: 0
      };
      
      setImages(prev => [...prev, newImage]);
      
      // Симуляція обробки AI
      simulateProcessing(id);
    });
  };

  const simulateProcessing = (id: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      
      setImages(prev => prev.map(img => 
        img.id === id 
          ? { ...img, progress: Math.min(progress, 100) }
          : img
      ));
      
      if (progress >= 100) {
        clearInterval(interval);
        setImages(prev => prev.map(img => 
          img.id === id 
            ? { 
                ...img, 
                status: 'completed', 
                progress: 100,
                processedUrl: mockProcessedUrl 
              }
            : img
        ));
      }
    }, 200);
  };

  const removeImage = (id: string) => {
    setImages(prev => {
      const imageToRemove = prev.find(img => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.originalUrl);
      }
      return prev.filter(img => img.id !== id);
    });
  };

  const downloadImage = (image: ProcessedImage) => {
    // В реальному додатку тут буде завантаження обробленого зображення
    const link = document.createElement('a');
    link.href = image.processedUrl;
    link.download = `processed_${image.originalFile.name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleComparison = (id: string) => {
    setShowComparison(showComparison === id ? null : id);
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('watermark.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('watermark.subtitle')}
          </p>
        </div>

        {/* Зона завантаження */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
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
            {t('watermark.upload_title')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {t('watermark.upload_desc')}
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
            {t('watermark.select_files')}
          </label>
        </div>

        {/* Список зображень */}
        {images.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('watermark.processing_queue')} ({images.length})
            </h2>
            
            <div className="space-y-4">
              {images.map((image) => (
                <div key={image.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <img
                          src={image.originalUrl}
                          alt={image.originalFile.name}
                          className="h-16 w-16 object-cover rounded-lg"
                        />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          {image.originalFile.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {(image.originalFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {image.status === 'completed' && (
                        <>
                          <button
                            onClick={() => toggleComparison(image.id)}
                            className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                            title={showComparison === image.id ? t('watermark.hide_comparison') : t('watermark.show_comparison')}
                          >
                            {showComparison === image.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => downloadImage(image)}
                            className="p-2 text-gray-500 hover:text-green-600 transition-colors"
                            title={t('watermark.download')}
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => removeImage(image.id)}
                        className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                        title={t('watermark.remove')}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Прогрес бар */}
                  {image.status === 'processing' && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {t('watermark.processing')}...
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {Math.round(image.progress)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${image.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Статус */}
                  <div className="flex items-center space-x-2 mb-4">
                    {image.status === 'processing' && (
                      <>
                        <Wand2 className="h-4 w-4 text-blue-500 animate-spin" />
                        <span className="text-sm text-blue-600 dark:text-blue-400">
                          {t('watermark.ai_processing')}
                        </span>
                      </>
                    )}
                    {image.status === 'completed' && (
                      <>
                        <div className="h-4 w-4 bg-green-500 rounded-full" />
                        <span className="text-sm text-green-600 dark:text-green-400">
                          {t('watermark.completed')}
                        </span>
                      </>
                    )}
                    {image.status === 'error' && (
                      <>
                        <div className="h-4 w-4 bg-red-500 rounded-full" />
                        <span className="text-sm text-red-600 dark:text-red-400">
                          {t('watermark.error')}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Порівняння зображень */}
                  {image.status === 'completed' && showComparison === image.id && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                        {t('watermark.comparison')}
                      </h4>
                      
                      {/* Інтерактивний слайдер порівняння */}
                      <div className="mb-4">
                        <ImageComparisonSlider
                          originalImage={image.originalUrl}
                          processedImage={image.processedUrl}
                          originalLabel={t('watermark.original')}
                          processedLabel={t('watermark.processed')}
                        />
                        
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                          {t('watermark.slider_hint')}
                        </p>
                      </div>
                      
                      {/* Додаткове порівняння side-by-side */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            {t('watermark.original')}
                          </p>
                          <img
                            src={image.originalUrl}
                            alt="Original"
                            className="w-full h-32 object-cover rounded-lg border"
                          />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            {t('watermark.processed')}
                          </p>
                          <img
                            src={image.processedUrl}
                            alt="Processed"
                            className="w-full h-32 object-cover rounded-lg border"
                          />
                        </div>
                      </div>
                      
                      {/* Повідомлення про майбутнє покращення */}
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          💡 {t('watermark.future_improvement')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Інформаційна секція */}
        <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {t('watermark.how_it_works')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Upload className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                {t('watermark.step1_title')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('watermark.step1_desc')}
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Wand2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                {t('watermark.step2_title')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('watermark.step2_desc')}
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Download className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                {t('watermark.step3_title')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('watermark.step3_desc')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WatermarkRemoval() {
  return (
    <AIProductFillerLayout>
      <WatermarkRemovalContent />
    </AIProductFillerLayout>
  );
}
