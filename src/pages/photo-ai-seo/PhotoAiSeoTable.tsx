import { useRef, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Upload, Eye, X, Download } from 'lucide-react';
import { resizePhoto, cropPhoto, convertPhoto, setAltTag } from '@/api/photoApi';

// Модель рядка з 4 чекбокс-діями
interface PhotoRowItem {
  id: string;
  photo: string;     // прев'ю фото
  resize: string;    // Змінити розмір фото
  crop: string;      // Обрізати фото
  convert: string;   // Конвертувати фото
  altTag: string;    // Встановити тег Alt
  processedImage?: string; // Оброблене фото для порівняння
}

const columns = [
  { key: 'photo',   title: 'Фото',                width: '90px' },
  { key: 'resize',  title: 'Змінити розмір фото', width: '220px', editable: true },
  { key: 'crop',    title: 'Обрізати фото',       width: '180px', editable: true },
  { key: 'convert', title: 'Конвертувати фото',   width: '200px', editable: true },
  { key: 'altTag',  title: 'Встановити тег Alt',  width: '220px', editable: true },
  { key: 'result',  title: 'Результат',           width: '120px' },
] as const;

type ColKey = typeof columns[number]['key'];

export default function PhotoAiSeoTable() {
  // Початково без фото
  const [rows, setRows] = useState<PhotoRowItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Модальне вікно для порівняння
  const [comparisonModal, setComparisonModal] = useState<{
    isOpen: boolean;
    original: string;
    processed: string;
  } | null>(null);
  
  // Слайдер для порівняння
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  // Параметри над таблицею
  const [params, setParams] = useState({
    crop_percent: '',
    top_pct: '',
    bottom_pct: '',
    left_pct: '',
    right_pct: '',
    resize_percent: '',
    format: 'webp',
    alt: { src: '', alt: '' },
  });

  // API функції
  const processPhoto = async (photoUrl: string, action: string, params: any) => {
    console.log(`🔄 Processing photo: ${action}`, { photoUrl, params });
    
    try {
      // Конвертуємо URL в File об'єкт
      const response = await fetch(photoUrl);
      const blob = await response.blob();
      const file = new File([blob], 'photo.jpg', { type: blob.type });
      
      let result;
      
      switch (action) {
        case 'resize':
          result = await resizePhoto({
            photo: file,
            resize_percent: params.resize_percent
          });
          break;
          
        case 'crop':
          result = await cropPhoto({
            photo: file,
            crop_percent: params.crop_percent,
            top_pct: params.top_pct,
            bottom_pct: params.bottom_pct,
            left_pct: params.left_pct,
            right_pct: params.right_pct
          });
          break;
          
        case 'convert':
          result = await convertPhoto({
            photo: file,
            format: params.format
          });
          break;
          
        case 'alt':
          result = await setAltTag(params.alt);
          break;
          
        default:
          throw new Error(`Unknown action: ${action}`);
      }
      
      console.log(`✅ ${action} completed successfully for photo`);
      console.log('📦 Full result object:', result);
      console.log('🖼️ processed_image field:', result?.processed_image ? 'EXISTS' : 'MISSING');
      if (result?.processed_image) {
        console.log('📏 Image data length:', result.processed_image.length);
        console.log('🔍 First 100 chars:', result.processed_image.substring(0, 100));
      }
      return result;
      
    } catch (error) {
      console.error(`❌ Error processing ${action}:`, error);
      throw error;
    }
  };

  const applyParamsToSelected = async () => {
    const selectedPhotos = rows.filter(
      r => r.resize === 'completed' || r.crop === 'completed' || r.convert === 'completed' || r.altTag === 'completed'
    );

    if (selectedPhotos.length === 0) {
      console.log('⚠️ Немає фото з обраними діями');
      return;
    }

    console.log(`🚀 Починаємо обробку ${selectedPhotos.length} фото`);

    for (const photo of selectedPhotos) {
      try {
        let lastProcessedImage: string | undefined;

        if (photo.resize === 'completed' && params.resize_percent) {
          console.log(`🔄 Processing resize for photo ${photo.id}`);
          const result = await processPhoto(photo.photo, 'resize', { resize_percent: params.resize_percent });
          if (result?.processed_image) {
            lastProcessedImage = result.processed_image;
          }
        }

        if (photo.crop === 'completed' && (params.crop_percent || params.top_pct || params.bottom_pct || params.left_pct || params.right_pct)) {
          console.log(`🔄 Processing crop for photo ${photo.id}`);
          const result = await processPhoto(photo.photo, 'crop', {
            crop_percent: params.crop_percent,
            top_pct: params.top_pct,
            bottom_pct: params.bottom_pct,
            left_pct: params.left_pct,
            right_pct: params.right_pct,
          });
          if (result?.processed_image) {
            lastProcessedImage = result.processed_image;
          }
        }

        if (photo.convert === 'completed' && params.format) {
          console.log(`🔄 Processing convert for photo ${photo.id}`);
          const result = await processPhoto(photo.photo, 'convert', { format: params.format });
          if (result?.processed_image) {
            lastProcessedImage = result.processed_image;
          }
        }

        if (photo.altTag === 'completed' && (params.alt.alt || params.alt.src)) {
          console.log(`🔄 Processing alt tag for photo ${photo.id}`);
          const result = await processPhoto(photo.photo, 'alt', { alt: params.alt });
          if (result?.processed_image) {
            lastProcessedImage = result.processed_image;
          }
        }

        if (lastProcessedImage) {
          console.log(`✅ Photo ${photo.id} processed successfully`);
          console.log(`📸 Saving processedImage for ${photo.id}:`, lastProcessedImage.substring(0, 50) + '...');
          setRows(prev => {
            const updated = prev.map(r => {
              if (r.id === photo.id) {
                console.log(`💾 Updating row ${r.id} with processedImage`);
                return { ...r, processedImage: lastProcessedImage };
              }
              return r;
            });
            return updated;
          });
        } else {
          console.warn(`⚠️ No processed image for photo ${photo.id}`);
        }
      } catch (error) {
        console.error(`❌ Failed to process photo ${photo.id}:`, error);
      }
    }

    console.log('🎉 Обробка завершена');
  };

  const openFileDialog = () => {
    // Не відкривати, якщо вже 10 фото
    if (rows.length >= 10) {
      // можна додати toast тут, якщо потрібно
      return;
    }
    // Використовуємо setTimeout для сумісності з деякими бразуерами/компонентами
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 0);
  };

  const handleAddPhotos = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const next: PhotoRowItem[] = [];
    const freeSlots = Math.max(0, 10 - rows.length);
    Array.from(files)
      .slice(0, freeSlots)
      .forEach((file, idx) => {
      if (!file.type.startsWith('image/')) return;
      const url = URL.createObjectURL(file);
      next.push({
        id: `row-${Date.now()}-${idx}`,
        photo: url,
        resize: '',
        crop: '',
        convert: '',
        altTag: '',
      });
    });
    if (next.length > 0) setRows(prev => [...prev, ...next]);
    // reset input so selecting the same file again triggers onChange
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Підрахунок фото з обраними діями
  const selectedCount = rows.filter(
    r => r.resize === 'completed' || r.crop === 'completed' || r.convert === 'completed' || r.altTag === 'completed'
  ).length;

  return (
    <div className="min-h-screen">
      {/* Floating Header */}
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-cyan-50/80 dark:bg-cyan-950/80 border-b border-cyan-200/50 dark:border-cyan-800/30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-500 to-sky-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-700 via-blue-600 to-sky-700 dark:from-cyan-300 dark:via-blue-300 dark:to-sky-300 bg-clip-text text-transparent">
                  Photo-AI-SEO
                </h1>
                <p className="text-sm text-cyan-600 dark:text-cyan-400">Smart photo optimization workspace</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 text-xs font-medium">
                {selectedCount} обрано
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Parameters Panel */}
        <div className="mb-4 bg-white/70 dark:bg-cyan-950/70 backdrop-blur-xl rounded-xl border border-cyan-200/50 dark:border-cyan-800/30 shadow-sm p-4">
          {/* Resize Section */}
          <div className="mb-3">
            <h3 className="text-xs font-semibold text-cyan-700 dark:text-cyan-300 mb-2 flex items-center gap-2">
              <span className="w-1 h-4 bg-cyan-500 rounded"></span>
              Змінити розмір
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder="Resize %" value={params.resize_percent} onChange={(e)=>setParams(p=>({...p, resize_percent: e.target.value}))} className="h-9 text-sm" />
            </div>
          </div>

          {/* Crop Section */}
          <div className="mb-3">
            <h3 className="text-xs font-semibold text-cyan-700 dark:text-cyan-300 mb-2 flex items-center gap-2">
              <span className="w-1 h-4 bg-blue-500 rounded"></span>
              Обрізати
            </h3>
            <div className="grid grid-cols-5 gap-2">
              <Input type="number" placeholder="Crop %" value={params.crop_percent} onChange={(e)=>setParams(p=>({...p, crop_percent: e.target.value}))} className="h-9 text-sm" />
              <Input type="number" placeholder="Top" value={params.top_pct} onChange={(e)=>setParams(p=>({...p, top_pct: e.target.value}))} className="h-9 text-sm" />
              <Input type="number" placeholder="Bottom" value={params.bottom_pct} onChange={(e)=>setParams(p=>({...p, bottom_pct: e.target.value}))} className="h-9 text-sm" />
              <Input type="number" placeholder="Left" value={params.left_pct} onChange={(e)=>setParams(p=>({...p, left_pct: e.target.value}))} className="h-9 text-sm" />
              <Input type="number" placeholder="Right" value={params.right_pct} onChange={(e)=>setParams(p=>({...p, right_pct: e.target.value}))} className="h-9 text-sm" />
            </div>
          </div>

          {/* Convert & Alt Tag Section */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <h3 className="text-xs font-semibold text-cyan-700 dark:text-cyan-300 mb-2 flex items-center gap-2">
                <span className="w-1 h-4 bg-purple-500 rounded"></span>
                Конвертувати
              </h3>
              <select className="w-full h-9 rounded-md border border-cyan-200 dark:border-cyan-800 bg-white/80 dark:bg-cyan-900/80 px-3 text-sm" value={params.format} onChange={(e)=>setParams(p=>({...p, format: e.target.value}))}>
                <option value="webp">webp</option>
                <option value="jpg">jpg</option>
                <option value="jpeg">jpeg</option>
                <option value="png">png</option>
                <option value="avif">avif</option>
              </select>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-cyan-700 dark:text-cyan-300 mb-2 flex items-center gap-2">
                <span className="w-1 h-4 bg-green-500 rounded"></span>
                Alt Tag
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="src" value={params.alt.src} onChange={(e)=>setParams(p=>({...p, alt: {...p.alt, src: e.target.value}}))} className="h-9 text-sm" />
                <Input placeholder="alt" value={params.alt.alt} onChange={(e)=>setParams(p=>({...p, alt: {...p.alt, alt: e.target.value}}))} className="h-9 text-sm" />
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-3 pt-2 border-t border-cyan-200/50 dark:border-cyan-800/30">
            <Button onClick={applyParamsToSelected} className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-sm px-4 py-2">
              Застосувати до вибраних
            </Button>
            <span className="text-xs text-cyan-600 dark:text-cyan-400">Поставте галочки в стовпцях дій</span>
          </div>
        </div>
        {/* Modern Glass Card */}
        <div className="bg-white/70 dark:bg-cyan-950/70 backdrop-blur-xl rounded-3xl border border-cyan-200/50 dark:border-cyan-800/30 shadow-xl shadow-cyan-500/5 dark:shadow-cyan-900/20 overflow-hidden">
          {rows.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-3xl">📷</div>
              <p className="text-cyan-700 dark:text-cyan-300 text-sm">Поки що немає фото</p>
              <Button
                onClick={openFileDialog}
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
              >
                <Upload className="w-4 h-4 mr-2" /> Додати фото
              </Button>
              {/* file input moved to shared control below */}
            </div>
          ) : (
          <>
          
          {/* Table with fixed layout - no horizontal scroll */}
          <div className="w-full">
            <table className="w-full table-fixed">
              <thead className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900 dark:to-blue-900 border-b border-cyan-200/50 dark:border-cyan-800/30">
                <tr>
                  {/* Column Headers */}
                  {columns.map((col) => (
                    <th 
                      key={col.key} 
                      className="px-3 py-4 text-center"
                      style={{ width: col.width }}
                    >
                      <div className="flex items-center justify-center gap-2 min-w-0">
                        <span className="text-xs font-semibold text-cyan-700 dark:text-cyan-300 truncate">
                          {col.title}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="group border-b border-cyan-100 dark:border-cyan-800 hover:bg-gradient-to-r hover:from-cyan-50/50 hover:to-blue-50/30 dark:hover:from-cyan-950/20 dark:hover:to-blue-950/10 transition-all duration-200"
                  >
                    {/* Data Cells */}
                    {columns.map((col) => {
                      const val = row[col.key as keyof PhotoRowItem];

                      return (
                        <td
                          key={col.key}
                          className="px-3 py-3 group-hover:bg-white/50 dark:group-hover:bg-cyan-800/50 transition-colors overflow-hidden"
                          style={{ width: col.width }}
                        >
                          {col.key === 'photo' ? (
                            // Фото колонка
                            <div className="w-16 h-12 rounded-lg overflow-hidden bg-cyan-100 dark:bg-cyan-800 flex items-center justify-center">
                              <img
                                src={String(val)}
                                alt="Photo"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNDgiIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCA2NCA0OCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNTYgNEg4YTQgNCAwIDAwLTQgNHYzMmE0IDQgMCAwMDQgNGg0OGE0IDQgMCAwMDQtNFY4YTQgNCAwIDAwLTQtNHpNOCA0MGEyIDIgMCAwMS0yLTJWOGEyIDIgMCAwMTItMmg0OGEyIDIgMCAwMTIgMnYzMGEyIDIgMCAwMS0yIDJIOHoiIGZpbGw9IiNjZGQ5ZTUiLz48cGF0aCBkPSJNMjQgMTZhNCA0IDAgMTEtOCAwIDQgNCAwIDAxOCAweiIgZmlsbD0iI2NkZDllNSIvPjxwYXRoIGQ9Im00IDM0IDEyLTEyIDggOCA4LTggMTIgMTJ2NGE0IDQgMCAwMS00IDRIOGE0IDQgMCAwMS00LTR2LTR6IiBmaWxsPSIjY2RkOWU1Ii8+PC9zdmc+';
                                }}
                              />
                            </div>
                          ) : col.key === 'result' ? (
                            // Кнопки показати результат та скачати
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                onClick={() => {
                                  console.log('🖼️ Row processedImage:', row.processedImage);
                                  if (row.processedImage) {
                                    setSliderPosition(50); // Скидаємо позицію слайдера
                                    setComparisonModal({
                                      isOpen: true,
                                      original: row.photo,
                                      processed: row.processedImage
                                    });
                                  } else {
                                    console.warn('⚠️ No processed image available for this photo');
                                  }
                                }}
                                disabled={!row.processedImage}
                                className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Показати порівняння"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() => {
                                  if (row.processedImage) {
                                    const link = document.createElement('a');
                                    link.href = row.processedImage;
                                    link.download = `processed-${row.id}.jpg`;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                  }
                                }}
                                disabled={!row.processedImage}
                                className="rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Скачати оброблене фото"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            // Всі інші колонки - тільки галочки
                            <div className="flex items-center justify-center">
                                <Checkbox
                                    checked={val === 'completed'}
                                    onCheckedChange={(checked) => {
                                        // Просто ставимо/знімаємо галочку без обробки
                                        setRows((prev) =>
                                            prev.map((r) =>
                                                r.id === row.id ? { ...r, [col.key]: checked ? 'completed' : '' } : r
                                            )
                                        );
                                    }}
                                    className="w-5 h-5 rounded-lg border-2 border-cyan-300 dark:border-cyan-600
    data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-cyan-500
    data-[state=checked]:to-blue-600 data-[state=checked]:border-cyan-500
    shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 transition-all
    duration-200 hover:scale-105"
                                />

                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
          )}
        </div>

        {/* Comparison Modal with Slider */}
        {comparisonModal?.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setComparisonModal(null)}>
            <div className="relative bg-white dark:bg-cyan-950 rounded-3xl shadow-2xl max-w-4xl w-full mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-200 dark:border-cyan-800">
                <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-700 to-blue-600 dark:from-cyan-300 dark:to-blue-300 bg-clip-text text-transparent">
                  Порівняння результатів обробки
                </h2>
                <Button
                  onClick={() => setComparisonModal(null)}
                  className="rounded-full w-8 h-8 p-0 bg-cyan-100 hover:bg-cyan-200 dark:bg-cyan-900 dark:hover:bg-cyan-800"
                >
                  <X className="w-4 h-4 text-cyan-700 dark:text-cyan-300" />
                </Button>
              </div>

              {/* Content with Slider */}
              <div className="p-6">
                <div 
                  className="relative w-full aspect-video rounded-xl overflow-hidden select-none"
                  onMouseMove={(e) => {
                    if (isDragging) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                      const percent = (x / rect.width) * 100;
                      setSliderPosition(percent);
                    }
                  }}
                  onMouseDown={() => setIsDragging(true)}
                  onMouseUp={() => setIsDragging(false)}
                  onMouseLeave={() => setIsDragging(false)}
                >
                  {/* Processed Image (Background) */}
                  <img
                    src={comparisonModal.processed}
                    alt="Processed"
                    className="absolute inset-0 w-full h-full object-contain"
                    draggable={false}
                  />
                  
                  {/* Original Image (Clipped) */}
                  <div 
                    className="absolute inset-0 overflow-hidden"
                    style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                  >
                    <img
                      src={comparisonModal.original}
                      alt="Original"
                      className="absolute inset-0 w-full h-full object-contain"
                      draggable={false}
                    />
                  </div>
                  
                  {/* Slider Line */}
                  <div 
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
                    style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
                  >
                    {/* Slider Handle */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center border-4 border-cyan-500">
                      <div className="flex gap-1">
                        <div className="w-0.5 h-4 bg-cyan-500"></div>
                        <div className="w-0.5 h-4 bg-cyan-500"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Labels */}
                  <div className="absolute top-4 left-4 bg-cyan-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    До
                  </div>
                  <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    Після
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-cyan-200 dark:border-cyan-800 bg-cyan-50/50 dark:bg-cyan-900/30">
                <Button
                  onClick={() => setComparisonModal(null)}
                  className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                >
                  Закрити
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="mt-6 flex justify-center">
          <Button
            onClick={openFileDialog}
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
          >
            <Upload className="w-4 h-4 mr-2" /> Додати фото
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleAddPhotos(e.target.files)}
        />
      </div>
    </div>
  );
}
