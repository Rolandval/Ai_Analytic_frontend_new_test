import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, FileImage, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface PhotoFile {
  id: string;
  file: File;
  preview: string;
  name: string;
  size: number;
  type: string;
}

interface PhotoUploadProps {
  onFilesSelected?: (files: PhotoFile[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // в байтах
  acceptedTypes?: string[];
  className?: string;
}

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function PhotoUpload({
  onFilesSelected,
  maxFiles = 10,
  maxFileSize = MAX_FILE_SIZE,
  acceptedTypes = ACCEPTED_IMAGE_TYPES,
  className
}: PhotoUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<PhotoFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `Непідтримуваний тип файлу: ${file.type}`;
    }
    if (file.size > maxFileSize) {
      return `Файл занадто великий: ${formatFileSize(file.size)}. Максимум: ${formatFileSize(maxFileSize)}`;
    }
    return null;
  };

  const processFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newFiles: PhotoFile[] = [];
    let hasErrors = false;

    if (selectedFiles.length + fileArray.length > maxFiles) {
      setError(`Можна завантажити максимум ${maxFiles} файлів`);
      return;
    }

    fileArray.forEach((file) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        hasErrors = true;
        return;
      }

      const photoFile: PhotoFile = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        preview: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
        type: file.type
      };

      newFiles.push(photoFile);
    });

    if (!hasErrors && newFiles.length > 0) {
      setError(null);
      const updatedFiles = [...selectedFiles, ...newFiles];
      setSelectedFiles(updatedFiles);
      onFilesSelected?.(updatedFiles);
    }
  }, [selectedFiles, maxFiles, maxFileSize, acceptedTypes, onFilesSelected]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  }, [processFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
    // Очищуємо input для можливості повторного вибору того ж файлу
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [processFiles]);

  const removeFile = useCallback((fileId: string) => {
    const updatedFiles = selectedFiles.filter(f => f.id !== fileId);
    setSelectedFiles(updatedFiles);
    onFilesSelected?.(updatedFiles);
    
    // Звільняємо пам'ять від preview URL
    const fileToRemove = selectedFiles.find(f => f.id === fileId);
    if (fileToRemove) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
  }, [selectedFiles, onFilesSelected]);

  const clearAll = useCallback(() => {
    // Звільняємо пам'ять від всіх preview URL
    selectedFiles.forEach(file => {
      URL.revokeObjectURL(file.preview);
    });
    setSelectedFiles([]);
    setError(null);
    onFilesSelected?.([]);
  }, [selectedFiles, onFilesSelected]);

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Drag & Drop зона */}
      <Card 
        className={cn(
          "border-2 border-dashed transition-all duration-200 cursor-pointer",
          isDragOver 
            ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20" 
            : "border-gray-300 dark:border-gray-600 hover:border-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-900/10"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className={cn(
              "p-4 rounded-full transition-colors",
              isDragOver 
                ? "bg-amber-500 text-white" 
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
            )}>
              <Upload className="w-8 h-8" />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {isDragOver ? 'Відпустіть файли тут' : 'Перетягніть фото сюди'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                або натисніть, щоб вибрати файли
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Підтримуються: JPG, PNG, WEBP, GIF, BMP
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Максимум {maxFiles} файлів, до {formatFileSize(maxFileSize)} кожен
              </p>
            </div>

            <Button 
              type="button" 
              variant="outline" 
              className="mt-4"
              onClick={(e) => {
                e.stopPropagation();
                openFileDialog();
              }}
            >
              <FileImage className="w-4 h-4 mr-2" />
              Вибрати файли
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Прихований input для файлів */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Помилки */}
      {error && (
        <Card className="mt-4 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-700 dark:text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Список завантажених файлів */}
      {selectedFiles.length > 0 && (
        <Card className="mt-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Завантажені фото ({selectedFiles.length})
              </h4>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearAll}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <X className="w-4 h-4 mr-1" />
                Очистити все
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {selectedFiles.map((photoFile) => (
                <div key={photoFile.id} className="relative group">
                  <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                    <img
                      src={photoFile.preview}
                      alt={photoFile.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Overlay з інформацією */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                    <Button
                      size="sm"
                      variant="destructive"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeFile(photoFile.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Інформація про файл */}
                  <div className="mt-2 text-center">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {photoFile.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(photoFile.size)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
