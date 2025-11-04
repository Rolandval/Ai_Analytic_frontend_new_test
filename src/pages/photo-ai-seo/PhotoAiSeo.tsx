import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Upload, Save, X, ImageIcon } from 'lucide-react';
import { Checkbox } from '@/components/ui/Checkbox';
import { toast } from '@/hooks/use-toast';

interface PhotoItem {
  id: string;
  name: string;
  file: File;
  preview: string;
  sizeInMB: number;
  dimensions: { width: number; height: number };
  resizePercent: string;
  format: string;
  altText: string;
  description: string;
  link: string;
}

export default function PhotoAiSeo() {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{ photoId: string; column: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Завантаження фото
  const handleFileUpload = useCallback(async (files: FileList) => {
    if (files.length > 10) {
      toast({
        title: 'Помилка',
        description: 'Можна завантажити максимум 10 фото',
        variant: 'destructive',
      });
      return;
    }

    const newPhotos: PhotoItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      const preview = URL.createObjectURL(file);
      const dimensions = await getImageDimensions(file);
      
      const photoItem: PhotoItem = {
        id: `photo-${Date.now()}-${i}`,
        name: file.name.split('.')[0],
        file,
        preview,
        sizeInMB: Number((file.size / (1024 * 1024)).toFixed(2)),
        dimensions,
        resizePercent: '100',
        format: file.type.split('/')[1],
        altText: '',
        description: '',
        link: '',
      };

      newPhotos.push(photoItem);
    }

    setPhotos(prev => [...prev, ...newPhotos]);
  }, []);

  // Отримання розмірів зображення
  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.src = URL.createObjectURL(file);
    });
  };

  // Редагування комірки
  const startEditing = (photoId: string, column: string, currentValue: any) => {
    setEditingCell({ photoId, column });
    setEditValue(String(currentValue || ''));
  };

  const saveEdit = () => {
    if (!editingCell) return;

    setPhotos(prev => prev.map(photo => {
      if (photo.id === editingCell.photoId) {
        return { ...photo, [editingCell.column]: editValue };
      }
      return photo;
    }));

    setEditingCell(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  // Вибір всіх фото
  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPhotos(new Set(photos.map(p => p.id)));
    } else {
      setSelectedPhotos(new Set());
    }
  };

  // Вибір окремого фото
  const toggleSelectPhoto = (photoId: string, checked: boolean) => {
    const newSelected = new Set(selectedPhotos);
    if (checked) {
      newSelected.add(photoId);
    } else {
      newSelected.delete(photoId);
    }
    setSelectedPhotos(newSelected);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Photo-AI-SEO</h1>
          <p className="text-muted-foreground">Оптимізація фото для SEO</p>
        </div>
        <Button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Завантажити фото (до 10)
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
        />
      </div>

      {/* Таблиця фото */}
      {photos.length > 0 && (
        <div className="bg-card rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedPhotos.size === photos.length && photos.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="w-20">Фото</TableHead>
                  <TableHead>Розмір (px)</TableHead>
                  <TableHead>Розмір (MB)</TableHead>
                  <TableHead>Назва</TableHead>
                  <TableHead>Ресайз (%)</TableHead>
                  <TableHead>Формат</TableHead>
                  <TableHead>Alt тег</TableHead>
                  <TableHead>Опис фото</TableHead>
                  <TableHead>Посилання</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {photos.map((photo) => (
                  <TableRow key={photo.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedPhotos.has(photo.id)}
                        onCheckedChange={(checked) => toggleSelectPhoto(photo.id, !!checked)}
                      />
                    </TableCell>
                    
                    {/* Фото */}
                    <TableCell>
                      <img
                        src={photo.preview}
                        alt={photo.name}
                        className="w-16 h-16 object-cover rounded border"
                      />
                    </TableCell>

                    {/* Розмір в пікселях */}
                    <TableCell>
                      {photo.dimensions.width} × {photo.dimensions.height}
                    </TableCell>

                    {/* Розмір у MB */}
                    <TableCell>
                      {photo.sizeInMB}
                    </TableCell>

                    {/* Назва */}
                    <TableCell
                      className="cursor-pointer hover:bg-muted/20"
                      onClick={() => {
                        if (editingCell?.photoId !== photo.id || editingCell?.column !== 'name') {
                          startEditing(photo.id, 'name', photo.name);
                        }
                      }}
                    >
                      {editingCell?.photoId === photo.id && editingCell?.column === 'name' ? (
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit();
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            autoFocus
                          />
                          <Button size="sm" onClick={saveEdit}>
                            <Save className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit}>
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        photo.name || 'Клікніть для редагування'
                      )}
                    </TableCell>

                    {/* Ресайз % */}
                    <TableCell
                      className="cursor-pointer hover:bg-muted/20"
                      onClick={() => {
                        if (editingCell?.photoId !== photo.id || editingCell?.column !== 'resizePercent') {
                          startEditing(photo.id, 'resizePercent', photo.resizePercent);
                        }
                      }}
                    >
                      {editingCell?.photoId === photo.id && editingCell?.column === 'resizePercent' ? (
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit();
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            autoFocus
                          />
                          <Button size="sm" onClick={saveEdit}>
                            <Save className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit}>
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        `${photo.resizePercent}%`
                      )}
                    </TableCell>

                    {/* Формат */}
                    <TableCell
                      className="cursor-pointer hover:bg-muted/20"
                      onClick={() => {
                        if (editingCell?.photoId !== photo.id || editingCell?.column !== 'format') {
                          startEditing(photo.id, 'format', photo.format);
                        }
                      }}
                    >
                      {editingCell?.photoId === photo.id && editingCell?.column === 'format' ? (
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Select value={editValue} onValueChange={setEditValue}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="jpg">JPG</SelectItem>
                              <SelectItem value="jpeg">JPEG</SelectItem>
                              <SelectItem value="png">PNG</SelectItem>
                              <SelectItem value="webp">WebP</SelectItem>
                              <SelectItem value="avif">AVIF</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button size="sm" onClick={saveEdit}>
                            <Save className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit}>
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        photo.format.toUpperCase()
                      )}
                    </TableCell>

                    {/* Alt тег */}
                    <TableCell
                      className="cursor-pointer hover:bg-muted/20"
                      onClick={() => {
                        if (editingCell?.photoId !== photo.id || editingCell?.column !== 'altText') {
                          startEditing(photo.id, 'altText', photo.altText);
                        }
                      }}
                    >
                      {editingCell?.photoId === photo.id && editingCell?.column === 'altText' ? (
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit();
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            autoFocus
                          />
                          <Button size="sm" onClick={saveEdit}>
                            <Save className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit}>
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        photo.altText || 'Клікніть для редагування'
                      )}
                    </TableCell>

                    {/* Опис фото */}
                    <TableCell
                      className="cursor-pointer hover:bg-muted/20"
                      onClick={() => {
                        if (editingCell?.photoId !== photo.id || editingCell?.column !== 'description') {
                          startEditing(photo.id, 'description', photo.description);
                        }
                      }}
                    >
                      {editingCell?.photoId === photo.id && editingCell?.column === 'description' ? (
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Textarea
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && e.ctrlKey) saveEdit();
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            className="min-h-[60px]"
                            autoFocus
                          />
                          <Button size="sm" onClick={saveEdit}>
                            <Save className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit}>
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="max-w-xs truncate">
                          {photo.description || 'Клікніть для редагування'}
                        </div>
                      )}
                    </TableCell>

                    {/* Посилання */}
                    <TableCell
                      className="cursor-pointer hover:bg-muted/20"
                      onClick={() => {
                        if (editingCell?.photoId !== photo.id || editingCell?.column !== 'link') {
                          startEditing(photo.id, 'link', photo.link);
                        }
                      }}
                    >
                      {editingCell?.photoId === photo.id && editingCell?.column === 'link' ? (
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit();
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            autoFocus
                          />
                          <Button size="sm" onClick={saveEdit}>
                            <Save className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit}>
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="max-w-xs truncate">
                          {photo.link || 'Клікніть для редагування'}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Пустий стан */}
      {photos.length === 0 && (
        <div className="text-center py-12">
          <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Немає завантажених фото</h3>
          <p className="text-muted-foreground mb-4">
            Завантажте до 10 фото для оптимізації
          </p>
          <Button onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2" />
            Завантажити фото
          </Button>
        </div>
      )}
    </div>
  );
}
