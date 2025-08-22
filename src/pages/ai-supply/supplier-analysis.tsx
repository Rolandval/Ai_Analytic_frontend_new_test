import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/Checkbox';
import { Label } from '@/components/ui/Label';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { InfoIcon, RefreshCw } from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';

const SupplierAnalysisPage: React.FC = () => {
  const [analysisMode, setAnalysisMode] = useState<'auto' | 'manual'>('auto');
  const [isLoading, setIsLoading] = useState(false);
  const [pageResults, setPageResults] = useState(1);
  const [pageComparison, setPageComparison] = useState(1);
  const [pageAlternatives, setPageAlternatives] = useState(1);
  const [pageSize] = useState(10);
  
  // Demo data and pagination calculations (replace with fetched data when available)
  const resultsRows = [
    {
      product: 'Приклад товару 1', code: '001234', supplier: 'Постачальник A', price: '100 грн',
      availability: 'В наявності', leadTime: '1-2 дні', saving: '20%'
    },
    {
      product: 'Приклад товару 2', code: '001235', supplier: 'Постачальник B', price: '250 грн',
      availability: 'Під замовлення', leadTime: '3-5 днів', saving: '15%'
    }
  ];
  const totalPagesResults = Math.max(1, Math.ceil(resultsRows.length / pageSize) || 1);
  const paginatedResults = resultsRows.slice((pageResults - 1) * pageSize, pageResults * pageSize);
  
  // Empty placeholders for other tabs; wire real data later
  const comparisonRows: Array<{
    product: string; code: string; a?: string; b?: string; c?: string; diff?: string;
  }> = [];
  const totalPagesComparison = Math.max(1, Math.ceil(comparisonRows.length / pageSize) || 1);
  const paginatedComparison = comparisonRows.slice((pageComparison - 1) * pageSize, pageComparison * pageSize);
  
  const alternativeRows: Array<{
    original: string; code: string; alt: string; supplier: string; price: string; similarity: string; saving: string;
  }> = [];
  const totalPagesAlternatives = Math.max(1, Math.ceil(alternativeRows.length / pageSize) || 1);
  const paginatedAlternatives = alternativeRows.slice((pageAlternatives - 1) * pageSize, pageAlternatives * pageSize);
  
  const handleStartAnalysis = () => {
    setIsLoading(true);
    // Імітація процесу аналізу
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Аналіз постачальників</h1>
        <Button variant="outline">Експорт</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Режим аналізу</CardTitle>
          <CardDescription>
            Виберіть між автоматичним та ручним режимом аналізу постачальників
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="auto-mode" 
                    checked={analysisMode === 'auto'} 
                    onCheckedChange={() => setAnalysisMode('auto')} 
                  />
                  <Label htmlFor="auto-mode">Автоматичний режим</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="manual-mode" 
                    checked={analysisMode === 'manual'} 
                    onCheckedChange={() => setAnalysisMode('manual')} 
                  />
                  <Label htmlFor="manual-mode">Ручний режим</Label>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {analysisMode === 'auto' 
                  ? 'Система автоматично знайде найкращі пропозиції від постачальників' 
                  : 'Ви самостійно обираєте постачальників для аналізу'}
              </p>
            </div>
            
            {analysisMode === 'auto' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Select defaultValue="lowest_price">
                      <SelectTrigger>
                        <SelectValue placeholder="Критерій аналізу" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lowest_price">Найнижча ціна</SelectItem>
                        <SelectItem value="reliability">Надійність постачальника</SelectItem>
                        <SelectItem value="delivery_speed">Швидкість доставки</SelectItem>
                        <SelectItem value="balanced">Збалансований підхід</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Select defaultValue="all">
                      <SelectTrigger>
                        <SelectValue placeholder="Постачальники" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Всі постачальники</SelectItem>
                        <SelectItem value="trusted">Перевірені постачальники</SelectItem>
                        <SelectItem value="new">Нові постачальники</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleStartAnalysis} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Аналізую...
                    </>
                  ) : (
                    'Почати автоматичний аналіз'
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Виберіть постачальника" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="supplier1">Постачальник 1</SelectItem>
                      <SelectItem value="supplier2">Постачальник 2</SelectItem>
                      <SelectItem value="supplier3">Постачальник 3</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleStartAnalysis} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Аналізую...
                      </>
                    ) : (
                      'Додати до аналізу'
                    )}
                  </Button>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">Обрані постачальники</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      Постачальник 1
                      <button className="text-xs ml-1">&times;</button>
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      Постачальник 2
                      <button className="text-xs ml-1">&times;</button>
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="results">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="results">Результати аналізу</TabsTrigger>
          <TabsTrigger value="comparison">Порівняння цін</TabsTrigger>
          <TabsTrigger value="alternatives">Аналоги</TabsTrigger>
        </TabsList>
        
        <TabsContent value="results" className="space-y-4 mt-4">
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              Почніть аналіз, щоб побачити результати порівняння постачальників
            </AlertDescription>
          </Alert>
          
          <Card>
            <CardHeader>
              <CardTitle>Оптимальні пропозиції постачальників</CardTitle>
              <CardDescription>
                Список найкращих пропозицій для кожного товару
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Товар</TableHead>
                    <TableHead>Код</TableHead>
                    <TableHead>Кращий постачальник</TableHead>
                    <TableHead>Ціна</TableHead>
                    <TableHead>Наявність</TableHead>
                    <TableHead>Термін доставки</TableHead>
                    <TableHead>Економія</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedResults.map((r, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{r.product}</TableCell>
                      <TableCell>{r.code}</TableCell>
                      <TableCell>{r.supplier}</TableCell>
                      <TableCell>{r.price}</TableCell>
                      <TableCell>
                        {r.availability === 'В наявності' ? (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">{r.availability}</span>
                        ) : (
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">{r.availability}</span>
                        )}
                      </TableCell>
                      <TableCell>{r.leadTime}</TableCell>
                      <TableCell className="text-green-600">{r.saving}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end pt-3">
                <Pagination currentPage={pageResults} totalPages={totalPagesResults} onPageChange={setPageResults} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="comparison" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Детальне порівняння цін</CardTitle>
              <CardDescription>
                Ціни на товари від різних постачальників
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Товар</TableHead>
                    <TableHead>Код</TableHead>
                    <TableHead>Постачальник A</TableHead>
                    <TableHead>Постачальник B</TableHead>
                    <TableHead>Постачальник C</TableHead>
                    <TableHead>Різниця</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedComparison.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                        Немає даних для відображення
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
              <div className="flex justify-end pt-3">
                <Pagination currentPage={pageComparison} totalPages={totalPagesComparison} onPageChange={setPageComparison} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="alternatives" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Аналоги товарів</CardTitle>
              <CardDescription>
                Альтернативні товари від різних постачальників
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Оригінальний товар</TableHead>
                    <TableHead>Код</TableHead>
                    <TableHead>Аналог</TableHead>
                    <TableHead>Постачальник</TableHead>
                    <TableHead>Ціна</TableHead>
                    <TableHead>Схожість</TableHead>
                    <TableHead>Економія</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAlternatives.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                        Немає даних для відображення
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
              <div className="flex justify-end pt-3">
                <Pagination currentPage={pageAlternatives} totalPages={totalPagesAlternatives} onPageChange={setPageAlternatives} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SupplierAnalysisPage;
