import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { generateCsv } from '@/api/analytics';
import { CSVDataItem, ProductType } from '@/types/forecasting';
import { BarChart, LineChart, PieChart } from '@/components/charts';

const AnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ProductType>('batteries');
  const [data, setData] = useState<CSVDataItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Отримуємо дані за останній місяць для активної вкладки
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const today = new Date();
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        
        const result = await generateCsv({
          product_type: activeTab,
          add_weather: true,
          add_days: true,
          from_date: oneMonthAgo.toISOString().split('T')[0],
          to_date: today.toISOString().split('T')[0]
        });
        
        setData(result);
      } catch (err) {
        console.error('Помилка при завантаженні даних:', err);
        setError('Не вдалося завантажити дані для аналітики');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [activeTab]);

  // Підготовка даних для графіків
  const prepareChartData = () => {
    if (!data || data.length === 0) return null;
    
    // Групуємо дані по днях
    const dailyData = data.reduce((acc, item) => {
      const date = item.TheDate ? String(item.TheDate).substring(0, 10) : 'unknown';
      
      if (!acc[date]) {
        acc[date] = {
          date,
          count: 0,
          totalPrice: 0,
          avgTemperature: 0,
          temperatureCount: 0,
        };
      }
      
      acc[date].count += 1;
      
      // Якщо є ціна, додаємо до загальної суми
      if (item.Price) {
        acc[date].totalPrice += Number(item.Price);
      }
      
      // Якщо є температура, додаємо для розрахунку середньої
      if (item.temperature) {
        acc[date].avgTemperature += Number(item.temperature);
        acc[date].temperatureCount += 1;
      }
      
      return acc;
    }, {} as Record<string, any>);
    
    // Перетворюємо об'єкт у масив і сортуємо по даті
    const sortedData = Object.values(dailyData)
      .map(day => ({
        ...day,
        avgTemperature: day.temperatureCount > 0 ? day.avgTemperature / day.temperatureCount : null,
        avgPrice: day.count > 0 ? day.totalPrice / day.count : 0
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return sortedData;
  };

  // Дані для графіків
  const chartData = prepareChartData();
  
  // Дані для лінійного графіка (кількість та ціна по днях)
  const lineChartData = chartData ? {
    labels: chartData.map(item => {
        const date = new Date(item.date);
        return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      }),
    datasets: [
      {
        label: 'Кількість',
        data: chartData.map(item => item.count),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
      {
        label: 'Середня ціна',
        data: chartData.map(item => item.avgPrice.toFixed(2)),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        yAxisID: 'y1',
      },
    ],
  } : null;
  
  // Дані для графіка залежності температури та кількості
  const scatterChartData = chartData ? {
    datasets: [
      {
        label: 'Температура vs Кількість',
        data: chartData
          .filter(item => item.avgTemperature !== null)
          .map(item => ({
            x: item.avgTemperature,
            y: item.count,
            date: item.date
          })),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
    ],
  } : null;
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Аналітика продуктів</h1>
      
      <Tabs defaultValue={activeTab} onValueChange={(value) => setActiveTab(value as ProductType)}>
        <TabsList className="mb-6">
          <TabsTrigger value="batteries">Акумулятори</TabsTrigger>
          <TabsTrigger value="solar_panels">Сонячні панелі</TabsTrigger>
          <TabsTrigger value="inverters">Інвертори</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab}>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-lg">Завантаження даних...</p>
            </div>
          ) : error ? (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Помилка</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{error}</p>
              </CardContent>
            </Card>
          ) : data.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Немає даних</CardTitle>
                <CardDescription>
                  Немає доступних даних для аналітики за вибраний період
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Графік кількість та ціна по днях */}
              <Card>
                <CardHeader>
                  <CardTitle>Динаміка кількості та цін</CardTitle>
                  <CardDescription>За останній місяць</CardDescription>
                </CardHeader>
                <CardContent>
                  {lineChartData && (
                    <LineChart 
                      data={lineChartData} 
                      options={{
                        responsive: true,
                        interaction: {
                          mode: 'index',
                          intersect: false,
                        },
                        scales: {
                          y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: {
                              display: true,
                              text: 'Кількість'
                            }
                          },
                          y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            title: {
                              display: true,
                              text: 'Ціна'
                            },
                            grid: {
                              drawOnChartArea: false,
                            },
                          },
                        },
                      }}
                    />
                  )}
                </CardContent>
              </Card>
              
              {/* Графік залежності температури та кількості */}
              <Card>
                <CardHeader>
                  <CardTitle>Вплив температури на продажі</CardTitle>
                  <CardDescription>Залежність кількості від температури</CardDescription>
                </CardHeader>
                <CardContent>
                  {scatterChartData && (
                    <div className="h-[300px]">
                      <LineChart 
                        data={scatterChartData}
                        options={{
                          responsive: true,
                          scales: {
                            x: {
                              title: {
                                display: true,
                                text: 'Температура (°C)'
                              }
                            },
                            y: {
                              title: {
                                display: true,
                                text: 'Кількість'
                              }
                            }
                          },
                          plugins: {
                            tooltip: {
                              callbacks: {
                                label: function(context) {
                                  const point = context.raw as { x: number, y: number, date: string };
                                  const date = new Date(point.date);
                                  const formattedDate = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
                                  return `Дата: ${formattedDate}, Температура: ${point.x}°C, Кількість: ${point.y}`;
                                }
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Статистика за період */}
              <Card>
                <CardHeader>
                  <CardTitle>Загальна статистика</CardTitle>
                  <CardDescription>За останній місяць</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-secondary rounded-lg p-4">
                      <div className="text-sm text-muted-foreground">Загальна кількість</div>
                      <div className="text-2xl font-bold mt-1">
                        {chartData ? chartData.reduce((sum, item) => sum + item.count, 0) : 0}
                      </div>
                    </div>
                    <div className="bg-secondary rounded-lg p-4">
                      <div className="text-sm text-muted-foreground">Середня ціна</div>
                      <div className="text-2xl font-bold mt-1">
                        {chartData && chartData.length > 0
                          ? (chartData.reduce((sum, item) => sum + (item.avgPrice || 0), 0) / chartData.length).toFixed(2)
                          : 0}
                      </div>
                    </div>
                    <div className="bg-secondary rounded-lg p-4">
                      <div className="text-sm text-muted-foreground">Кількість днів</div>
                      <div className="text-2xl font-bold mt-1">
                        {chartData ? chartData.length : 0}
                      </div>
                    </div>
                    <div className="bg-secondary rounded-lg p-4">
                      <div className="text-sm text-muted-foreground">Середня температура</div>
                      <div className="text-2xl font-bold mt-1">
                        {chartData && chartData.filter(item => item.avgTemperature !== null).length > 0
                          ? (chartData.reduce((sum, item) => sum + (item.avgTemperature || 0), 0) / 
                             chartData.filter(item => item.avgTemperature !== null).length).toFixed(1) + '°C'
                          : 'Н/Д'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Останні дані */}
              <Card>
                <CardHeader>
                  <CardTitle>Останні записи</CardTitle>
                  <CardDescription>Останні 5 записів з бази даних</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          <th className="text-left pb-2">Дата</th>
                          <th className="text-left pb-2">Назва</th>
                          <th className="text-right pb-2">Ціна</th>
                          <th className="text-right pb-2">Погода</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.slice(0, 5).map((item, index) => (
                          <tr key={index}>
                            <td className="py-2">
                              {item.TheDate ? new Date(item.TheDate).toLocaleDateString('uk-UA') : 'Н/Д'}
                            </td>
                            <td className="py-2">{item.Name || item.ProductName || 'Н/Д'}</td>
                            <td className="py-2 text-right">{item.Price || 'Н/Д'}</td>
                            <td className="py-2 text-right">
                              {item.temperature ? `${item.temperature}°C` : 'Н/Д'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsPage;
