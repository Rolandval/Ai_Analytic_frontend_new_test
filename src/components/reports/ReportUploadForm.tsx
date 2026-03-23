import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { listBatterySuppliers, uploadBatteryFileReport, uploadBatterySheetReport, uploadBatteryTextReport } from '@/services/batteries.api';
import { listInverterSuppliers, uploadInverterFileReport, uploadInverterSheetReport, uploadInverterTextReport } from '@/services/inverters.api';
import { listSolarPanelSuppliers, uploadSolarPanelFileReport, uploadSolarPanelSheetReport, uploadSolarPanelTextReport } from '@/services/solarPanels.api';

import { CreatableCombobox } from '@/components/ui/CreatableCombobox';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { UploadResponse } from '@/types/reports';

interface ReportUploadFormProps {
  productType: 'batteries' | 'inverters' | 'solar-panels';
}

const supplierFetchers = {
  batteries: listBatterySuppliers,
  inverters: listInverterSuppliers,
  'solar-panels': listSolarPanelSuppliers,
};

const uploadFileFetchers = {
    batteries: uploadBatteryFileReport,
    inverters: uploadInverterFileReport,
    'solar-panels': uploadSolarPanelFileReport,
};

const uploadSheetFetchers = {
    batteries: uploadBatterySheetReport,
    inverters: uploadInverterSheetReport,
    'solar-panels': uploadSolarPanelSheetReport,
};

const uploadTextFetchers = {
    batteries: uploadBatteryTextReport,
    inverters: uploadInverterTextReport,
    'solar-panels': uploadSolarPanelTextReport,
};

export const ReportUploadForm: React.FC<ReportUploadFormProps> = ({ productType }) => {
  const [supplier, setSupplier] = useState('');
  const [comment, setComment] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [sheetLink, setSheetLink] = useState('');
  const [rawText, setRawText] = useState('');
  const [uploadResult, setUploadResult] = useState<UploadResponse & { error?: string } | null>(null);

  const queryClient = useQueryClient();

  const supplierQuery = useQuery({
    queryKey: ['suppliers', productType],
    queryFn: () => supplierFetchers[productType](),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const supplierOptions = useMemo(() => {
    if (!supplierQuery.data) return [];
    let list: any[] = [];
    if (Array.isArray(supplierQuery.data)) {
      list = supplierQuery.data as any[];
    } else if (typeof supplierQuery.data === 'object' && 'suppliers' in supplierQuery.data) {
      list = Object.values((supplierQuery.data as any).suppliers);
    }
    return list.map((s) => {
        const label = typeof s === 'string' ? s : (s.name || s.supplier || s.supplier_name || '');
        return { label, value: label };
      }).filter((o) => o.label);
  }, [supplierQuery.data]);

  useEffect(() => {
    setSupplier('');
    setComment('');
    setFile(null);
    setSheetLink('');
    setRawText('');
    setUploadResult(null);
  }, [productType]);

  const handleUploadSuccess = (data: any) => {
    const normalized: UploadResponse = {
      new_count: data.new_count ?? data.new_panels ?? data.new_inverters ?? 0,
      updated_count: data.updated_count ?? data.update_prices ?? data.updated_inverters ?? 0,
    };
    setUploadResult(normalized);
    queryClient.invalidateQueries({ queryKey: [productType] });
  };

  const handleUploadError = (error: Error) => {
    setUploadResult({ new_count: 0, updated_count: 0, error: error.message || 'Сталася помилка' });
  };

  const fileMutation = useMutation({ mutationFn: uploadFileFetchers[productType], onSuccess: handleUploadSuccess, onError: handleUploadError });
  const sheetMutation = useMutation({ mutationFn: uploadSheetFetchers[productType], onSuccess: handleUploadSuccess, onError: handleUploadError });
  const textMutation = useMutation({ mutationFn: uploadTextFetchers[productType], onSuccess: handleUploadSuccess, onError: handleUploadError });

  const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

  const handleFileSubmit = () => {
    if (!file || !supplier) return;
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadResult({ new_count: 0, updated_count: 0, error: 'Файл перевищує максимальний розмір 10MB' });
      return;
    }
    fileMutation.mutate({ file, supplier_name: supplier, comment });
  };

  const handleSheetSubmit = () => {
    if (!sheetLink || !supplier) return;
    sheetMutation.mutate({ docs_link: sheetLink, supplier_name: supplier, comment });
  };

  const handleTextSubmit = () => {
    if (!rawText || !supplier) return;
    textMutation.mutate({ text: rawText, supplier_name: supplier, comment });
  };

  const isSubmitting = fileMutation.isPending || sheetMutation.isPending || textMutation.isPending;

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="supplier">Постачальник</Label>
        <CreatableCombobox
              options={supplierOptions}
              value={supplier}
              onChange={setSupplier}
              placeholder="Оберіть або введіть постачальника"
              searchPlaceholder="Пошук або створення..."
              emptyMessage="Постачальника не знайдено."
              disabled={isSubmitting || supplierQuery.isLoading}
            />
      </div>

      <div>
        <Label htmlFor="comment">Коментар</Label>
        <Textarea
          id="comment"
          placeholder="Додайте коментар до завантаження"
          value={comment}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium mb-4">Методи завантаження</h3>
        <Tabs defaultValue="file" className="w-full">
          <TabsList>
            <TabsTrigger value="file">Файл</TabsTrigger>
            <TabsTrigger value="sheet">Google Sheets</TabsTrigger>
            <TabsTrigger value="text">Текст</TabsTrigger>
          </TabsList>
          <TabsContent value="file" className="mt-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="file-upload">Оберіть файл (.xlsx, .xls, .csv)</Label>
                <Input id="file-upload" type="file" accept=".xlsx,.xls,.csv" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] ?? null)} disabled={isSubmitting} />
              </div>
              <Button onClick={handleFileSubmit} disabled={!file || !supplier || isSubmitting}>Завантажити файл</Button>
            </div>
          </TabsContent>
          <TabsContent value="sheet" className="mt-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="sheet-link">Посилання на Google Sheets</Label>
                <Input id="sheet-link" type="text" placeholder="https://docs.google.com/spreadsheets/d/..." value={sheetLink} onChange={(e) => setSheetLink(e.target.value)} disabled={isSubmitting}/>
              </div>
              <Button onClick={handleSheetSubmit} disabled={!sheetLink || !supplier || isSubmitting}>Завантажити з Google Sheets</Button>
            </div>
          </TabsContent>
          <TabsContent value="text" className="mt-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="raw-text">Вставте текст</Label>
                <Textarea id="raw-text" placeholder="Вставте скопійований текст звіту сюди..." value={rawText} onChange={(e) => setRawText(e.target.value)} rows={10} disabled={isSubmitting}/>
              </div>
              <Button onClick={handleTextSubmit} disabled={!rawText || !supplier || isSubmitting}>Завантажити текст</Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {isSubmitting && <p>Завантаження...</p>}

      {uploadResult && (
        <div className={`mt-4 p-4 rounded-md ${uploadResult.error ? 'bg-red-100 dark:bg-red-900' : 'bg-green-100 dark:bg-green-900'}`}>
          <h4 className="font-semibold">Результат завантаження:</h4>
          {uploadResult.error ? (
            <p className="text-red-700 dark:text-red-300">Помилка: {uploadResult.error}</p>
          ) : (
            <div className="text-green-700 dark:text-green-300">
              <p>Нових позицій: {uploadResult.new_count}</p>
              <p>Оновлених позицій: {uploadResult.updated_count}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
