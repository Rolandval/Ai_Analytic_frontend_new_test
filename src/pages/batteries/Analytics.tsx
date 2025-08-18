import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  getBatteryWeatherForecastSales,
  getBatteryCompetitorsAnalytic,
  getBatterySuppliersAnalytic,
} from '@/services/batteryAnalytics.api';

const BatteryAnalyticsPage: React.FC = () => {
  const [competitorComment, setCompetitorComment] = useState('');
  const [supplierComment, setSupplierComment] = useState('');
  const [output, setOutput] = useState('');

  const formatForecast = (arr: any[]): string => {
    if (!Array.isArray(arr)) return JSON.stringify(arr, null, 2);
    const byDate: Record<string, typeof arr> = {};
    arr.forEach((item) => {
      if (!byDate[item.date]) byDate[item.date] = [];
      byDate[item.date].push(item);
    });
    const lines: string[] = [];
    Object.keys(byDate)
      .sort()
      .forEach((date) => {
        const prettyDate = new Date(date).toLocaleDateString('uk-UA');
        lines.push(`Дата – ${prettyDate}`);
        byDate[date].forEach((it: any) => {
          lines.push(`${it.name} – ${(it.forecast_quantity * 100).toFixed(1)}%`);
        });
        lines.push(''); // blank line
      });
    return lines.join('\n');
  };

  const weatherMut = useMutation({
    mutationFn: getBatteryWeatherForecastSales,
    onSuccess: (data: unknown) => setOutput(formatForecast(data as any[])),
  });

  const competitorsMut = useMutation({
    mutationFn: () => getBatteryCompetitorsAnalytic(competitorComment || undefined),
    onSuccess: (data) => setOutput(String(data)),
  });

  const suppliersMut = useMutation({
    mutationFn: () => getBatterySuppliersAnalytic(supplierComment || undefined),
    onSuccess: (data) => setOutput(String(data)),
  });

  const pending = weatherMut.isPending || competitorsMut.isPending || suppliersMut.isPending;

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-3xl font-bold">Аналітика акумуляторів</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Weather forecast */}
        <Card>
          <CardHeader>
            <CardTitle>Прогнозування за погодою на тиждень</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => weatherMut.mutate()} disabled={weatherMut.isPending}>
              Отримати прогноз
            </Button>
          </CardContent>
        </Card>

        {/* Competitors */}
        <Card>
          <CardHeader>
            <CardTitle>Аналітика цін конкурентів</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Коментар (необов'язково)"
              value={competitorComment}
              onChange={(e) => setCompetitorComment(e.target.value)}
            />
            <Button onClick={() => competitorsMut.mutate()} disabled={competitorsMut.isPending}>
              Запустити
            </Button>
          </CardContent>
        </Card>

        {/* Suppliers */}
        <Card>
          <CardHeader>
            <CardTitle>Аналітика постачальників</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Коментар (необов'язково)"
              value={supplierComment}
              onChange={(e) => setSupplierComment(e.target.value)}
            />
            <Button onClick={() => suppliersMut.mutate()} disabled={suppliersMut.isPending}>
              Запустити
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Результат</CardTitle>
        </CardHeader>
        <CardContent>
          {pending ? <p>Обробка запиту…</p> : <pre className="whitespace-pre-wrap text-sm">{output}</pre>}
        </CardContent>
      </Card>
    </div>
  );
};
  
export default BatteryAnalyticsPage;
