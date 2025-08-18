import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  getInverterCompetitorsAnalytic,
  getInverterSuppliersAnalytic,
} from '@/services/inverterAnalytics.api';

const InverterAnalyticsPage: React.FC = () => {
  const [competitorComment, setCompetitorComment] = useState('');
  const [supplierComment, setSupplierComment] = useState('');
  const [output, setOutput] = useState('');

  const competitorsMut = useMutation({
    mutationFn: () => getInverterCompetitorsAnalytic(competitorComment || undefined),
    onSuccess: (data) => setOutput(String(data)),
  });
  const suppliersMut = useMutation({
    mutationFn: () => getInverterSuppliersAnalytic(supplierComment || undefined),
    onSuccess: (data) => setOutput(String(data)),
  });

  const pending = competitorsMut.isPending || suppliersMut.isPending;

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-3xl font-bold">Аналітика інверторів</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Конкуренти */}
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

        {/* Постачальники */}
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

export default InverterAnalyticsPage;

