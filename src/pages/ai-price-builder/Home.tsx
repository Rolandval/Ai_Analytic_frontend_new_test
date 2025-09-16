import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function PriceBuilderHome() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">AI Price Builder</h1>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Що це?</CardTitle>
          <CardDescription>
            Сервіс для формування прайс-листів з поточних цін по містах. Підтримує категорії (акумулятори, панелі, інвертори), націнку та експорт у CSV. 
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-6 space-y-1">
            <li>Забирає дані з розділів «Ціни в наявності»</li>
            <li>Розподіляє позиції по містах постачальників</li>
            <li>Рахує ціну з націнкою</li>
            <li>Експортує в CSV для подальшого імпорту в Google Таблиці</li>
          </ul>
          <div className="mt-4">
            <Link to="/ai-price-builder/generate">
              <Button>Перейти до генератора</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
