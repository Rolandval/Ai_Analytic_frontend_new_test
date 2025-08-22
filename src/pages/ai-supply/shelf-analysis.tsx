import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import { AlertCircle } from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';

const ShelfAnalysisPage: React.FC = () => {
  // Local pagination state
  const [pageResults, setPageResults] = useState(1);
  const [pageHistory, setPageHistory] = useState(1);
  const [pageSize] = useState(10);

  // Placeholder datasets (to be replaced when backend is wired)
  const lowStockItems: Array<Record<string, unknown>> = [];
  const analysisHistory: Array<Record<string, unknown>> = [];

  const totalPagesResults = Math.max(1, Math.ceil(lowStockItems.length / pageSize) || 1);
  const totalPagesHistory = Math.max(1, Math.ceil(analysisHistory.length / pageSize) || 1);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Аналіз дефіциту товарів</h1>
        <Button variant="outline">Експорт</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Завантаження даних</CardTitle>
          <CardDescription>
            Завантажте файл з даними про наявність товарів або виберіть джерело даних
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Select defaultValue="excel">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Джерело даних" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excel">Excel файл</SelectItem>
                <SelectItem value="1c">1С</SelectItem>
                <SelectItem value="api">API</SelectItem>
              </SelectContent>
            </Select>
            <Input type="file" className="flex-1" />
            <Button>Завантажити</Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="results">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="results">Результати аналізу</TabsTrigger>
          <TabsTrigger value="history">Історія аналізу</TabsTrigger>
          <TabsTrigger value="settings">Налаштування</TabsTrigger>
        </TabsList>
        
        <TabsContent value="results" className="space-y-4 mt-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Інформація</AlertTitle>
            <AlertDescription>
              Спочатку завантажте дані для аналізу або виберіть звіт з історії.
            </AlertDescription>
          </Alert>
          
          <Card>
            <CardHeader>
              <CardTitle>Товари з низьким рівнем запасів</CardTitle>
              <CardDescription>
                Список товарів, які потребують поповнення запасів
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Код товару</TableHead>
                    <TableHead>Назва</TableHead>
                    <TableHead>Категорія</TableHead>
                    <TableHead>Поточний запас</TableHead>
                    <TableHead>Мінімальний запас</TableHead>
                    <TableHead>Рекомендована кількість</TableHead>
                    <TableHead>Статус</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Порожня таблиця - дані будуть завантажені після аналізу */}
                </TableBody>
              </Table>
            </CardContent>
            {lowStockItems.length > 0 && (
              <div className="border-t px-6 py-4 flex justify-end">
                <Pagination currentPage={pageResults} totalPages={totalPagesResults} onPageChange={setPageResults} />
              </div>
            )}
          </Card>
        </TabsContent>
        
        <TabsContent value="history" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Історія аналізу</CardTitle>
              <CardDescription>
                Попередні аналізи дефіциту товарів
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата</TableHead>
                    <TableHead>Назва</TableHead>
                    <TableHead>Кількість товарів</TableHead>
                    <TableHead>Критичний дефіцит</TableHead>
                    <TableHead>Низький запас</TableHead>
                    <TableHead>Дії</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Порожня таблиця історії - дані будуть додані після проведення аналізів */}
                </TableBody>
              </Table>
            </CardContent>
            {analysisHistory.length > 0 && (
              <div className="border-t px-6 py-4 flex justify-end">
                <Pagination currentPage={pageHistory} totalPages={totalPagesHistory} onPageChange={setPageHistory} />
              </div>
            )}
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Налаштування аналізу</CardTitle>
              <CardDescription>
                Параметри для аналізу дефіциту товарів
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Критичний поріг запасів (%)</label>
                  <Input type="number" defaultValue="10" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Низький рівень запасів (%)</label>
                  <Input type="number" defaultValue="30" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Враховувати сезонність</label>
                  <Select defaultValue="true">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Так</SelectItem>
                      <SelectItem value="false">Ні</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Включати неактивні товари</label>
                  <Select defaultValue="false">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Так</SelectItem>
                      <SelectItem value="false">Ні</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button>Зберегти налаштування</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ShelfAnalysisPage;
