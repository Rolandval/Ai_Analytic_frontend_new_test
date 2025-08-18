import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/Card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/Select';
// Switch компонент відсутній в проекті, використаємо звичайний input type="checkbox"
import { Label } from '@/components/ui/Label';
import { DatePicker } from '@/components/ui/date-picker';
import { useToast } from '@/hooks/use-toast';
import { generateCsv, getSqlQueries } from '@/api/analytics';
import { CSVDataItem, ProductType, SQLQuery } from '@/types/forecasting';
import { Download, RefreshCw } from 'lucide-react';
// Використовуємо hr замість Separator
// Видаляємо невикористані імпорти
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/Table";

const CSVDatasetPage: React.FC = () => {
  // Стан для форми запиту
  const [productType, setProductType] = useState<ProductType>('batteries');
  const [addWeather, setAddWeather] = useState<boolean>(false);
  const [addDays, setAddDays] = useState<boolean>(false);
  const [fromDate, setFromDate] = useState<Date>(new Date());
  const [toDate, setToDate] = useState<Date>(new Date());
  
  // Стан для даних
  const [queries, setQueries] = useState<SQLQuery[]>([]);
  const [csvData, setCsvData] = useState<CSVDataItem[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingQueries, setLoadingQueries] = useState<boolean>(false);
  
  const { toast } = useToast();
  
  // Завантаження SQL запитів при зміні типу продукту
  useEffect(() => {
    const loadQueries = async () => {
      try {
        setLoadingQueries(true);
        const data = await getSqlQueries(productType);
        setQueries(data);
      } catch (error) {
        console.error('Помилка при завантаженні SQL запитів:', error);
        toast({
          title: 'Помилка',
          description: 'Не вдалося завантажити SQL запити',
          variant: 'destructive',
        });
      } finally {
        setLoadingQueries(false);
      }
    };
    
    loadQueries();
  }, [productType]);
  
  // Обробка відправки форми і генерації CSV
  const handleGenerateCSV = async () => {
    try {
      setLoading(true);
      setCsvData([]);
      
      // Форматуємо дати для API
      const requestData = {
        product_type: productType,
        add_weather: addWeather,
        add_days: addDays,
        from_date: fromDate.toISOString().split('T')[0],
        to_date: toDate.toISOString().split('T')[0]
      };
      
      const data = await generateCsv(requestData);
      
      if (data && data.length > 0) {
        setCsvData(data);
        
        // Витягуємо заголовки для таблиці з першого об'єкта
        const firstItem = data[0];
        if (firstItem) {
          setHeaders(Object.keys(firstItem));
        }
        
        toast({
          title: 'Успішно',
          description: `Отримано ${data.length} рядків даних`,
        });
      } else {
        toast({
          title: 'Інформація',
          description: 'Немає даних для відображення за вказаний період',
        });
      }
    } catch (error) {
      console.error('Помилка при генерації CSV:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося згенерувати CSV дані',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Функція для експорту даних у CSV файл
  const exportToCSV = () => {
    if (!csvData || csvData.length === 0) {
      toast({
        title: 'Помилка',
        description: 'Немає даних для експорту',
        variant: 'destructive',
      });
      return;
    }
    
    // Створюємо рядки для CSV
    const headerRow = headers.join(',');
    const dataRows = csvData.map(item => 
      headers.map(header => {
        const value = item[header];
        // Обробка різних типів даних
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`; // Екранування ком у значеннях
        }
        return value;
      }).join(',')
    );
    
    const csvContent = [headerRow, ...dataRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}`;
    link.setAttribute('download', `data_${productType}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const productTypeLabels: Record<ProductType, string> = {
    batteries: 'Акумулятори',
    solar_panels: 'Сонячні панелі',
    inverters: 'Інвертори'
  };
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Отримання CSV датасету</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* Форма параметрів */}
        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle>Параметри запиту</CardTitle>
            <CardDescription>Налаштуйте параметри для отримання даних</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Тип продукту</Label>
                <Select value={productType} onValueChange={(value) => setProductType(value as ProductType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Виберіть тип продукту" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="batteries">Акумулятори</SelectItem>
                    <SelectItem value="solar_panels">Сонячні панелі</SelectItem>
                    <SelectItem value="inverters">Інвертори</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Дата початку</Label>
                  <DatePicker date={fromDate} setDate={setFromDate} />
                </div>
                <div className="space-y-2">
                  <Label>Дата кінця</Label>
                  <DatePicker date={toDate} setDate={setToDate} />
                </div>
              </div>
              
              <hr className="my-4" />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="add-weather">Додати дані про погоду</Label>
                  <p className="text-sm text-muted-foreground">
                    Температура, опади, погодні умови
                  </p>
                </div>
                <input 
                  id="add-weather"
                  type="checkbox"
                  checked={addWeather}
                  onChange={() => setAddWeather(!addWeather)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="add-days">Додати дні тижня</Label>
                  <p className="text-sm text-muted-foreground">
                    Назви днів тижня (понеділок, вівторок...)
                  </p>
                </div>
                <input 
                  id="add-days"
                  type="checkbox"
                  checked={addDays}
                  onChange={() => setAddDays(!addDays)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => {
              setFromDate(new Date());
              setToDate(new Date());
              setAddWeather(false);
              setAddDays(false);
            }}>
              Скинути
            </Button>
            <Button onClick={handleGenerateCSV} disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Завантаження...
                </>
              ) : (
                'Отримати дані'
              )}
            </Button>
          </CardFooter>
        </Card>
        
        {/* Існуючі SQL запити */}
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle>Доступні SQL запити для {productTypeLabels[productType]}</CardTitle>
            <CardDescription>
              SQL запити, які використовуються для отримання даних
            </CardDescription>
          </CardHeader>
          <CardContent className="max-h-[400px] overflow-auto">
            {loadingQueries ? (
              <div className="text-center py-4">Завантаження SQL запитів...</div>
            ) : queries.length > 0 ? (
              <div className="space-y-4">
                {queries.map((query) => (
                  <div key={query.id} className="border p-3 rounded-md">
                    <h4 className="font-medium">{query.name}</h4>
                    <pre className="bg-secondary p-2 rounded-md mt-2 text-xs whitespace-pre-wrap overflow-x-auto">
                      {query.query}
                    </pre>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                Немає доступних SQL запитів для цього типу продукту.
                <br />
                <Button variant="link" onClick={() => window.location.href = '/ai-forecast/sql-queries'}>
                  Створити новий SQL запит
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Результати та експорт */}
      {csvData.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Результат запиту</CardTitle>
              <CardDescription>
                Отримано {csvData.length} рядків даних
              </CardDescription>
            </div>
            <Button onClick={exportToCSV}>
              <Download className="mr-2 h-4 w-4" />
              Експортувати CSV
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {headers.map((header) => (
                      <TableHead key={header}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvData.slice(0, 10).map((row, index) => (
                    <TableRow key={index}>
                      {headers.map((header) => (
                        <TableCell key={`${index}-${header}`}>
                          {row[header] !== null && row[header] !== undefined
                            ? String(row[header])
                            : ''}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {csvData.length > 10 && (
              <div className="text-center mt-4 text-muted-foreground">
                Показано 10 з {csvData.length} рядків. Експортуйте CSV для перегляду всіх даних.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CSVDatasetPage;
