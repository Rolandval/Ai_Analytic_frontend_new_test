import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup';
import { Label } from '@/components/ui/Label';
import { Separator } from '@/components/ui/Separator';
import { useTariffs, useMySubscription, useSubscribe, useCancelSubscription } from '@/hooks/useTariffs';
import { formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { uk } from 'date-fns/locale';
import { CreditCard, Calendar, CheckCircle, XCircle, Crown, Zap } from 'lucide-react';
import type { Tariff } from '@/api/tariffs';

const SubscriptionManagement: React.FC = () => {
  const { data: tariffs, isLoading: tariffsLoading } = useTariffs();
  const { data: subscription, isLoading: subscriptionLoading } = useMySubscription();
  const subscribeMutation = useSubscribe();
  const cancelMutation = useCancelSubscription();

  const [selectedTariff, setSelectedTariff] = useState<Tariff | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'year'>('month');
  const [pricingPeriod, setPricingPeriod] = useState<'month' | 'year'>('month');
  const [showSubscribeDialog, setShowSubscribeDialog] = useState(false);

  const handleSubscribe = () => {
    if (!selectedTariff) return;

    subscribeMutation.mutate({
      tariff_id: selectedTariff.id!,
      period: selectedPeriod,
    }, {
      onSuccess: () => {
        setShowSubscribeDialog(false);
        setSelectedTariff(null);
      }
    });
  };

  const calcProgress = (created_at?: string, end_date?: string) => {
    const start = toDate(created_at ?? '');
    const end = toDate(end_date ?? '');
    const now = new Date();
    if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      return { pct: 0, daysLeft: 0, totalDays: 0 };
    }
    const totalMs = end.getTime() - start.getTime();
    const elapsedMs = Math.min(Math.max(now.getTime() - start.getTime(), 0), totalMs);
    const pct = Math.round((elapsedMs / totalMs) * 100);
    const daysLeft = Math.max(Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)), 0);
    const totalDays = Math.round(totalMs / (1000 * 60 * 60 * 24));
    return { pct, daysLeft, totalDays };
  };

  const handleCancelSubscription = () => {
    if (window.confirm('Ви впевнені, що хочете скасувати підписку?')) {
      cancelMutation.mutate();
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: 'UAH',
    }).format(price);
  };

  const getDiscountPercent = (monthlyPrice: number, yearlyPrice: number) => {
    const yearlyMonthly = yearlyPrice / 12;
    const discount = ((monthlyPrice - yearlyMonthly) / monthlyPrice) * 100;
    return Math.round(discount);
  };

  // Безпечне парсіння дати закінчення підписки
  const toDate = (input: unknown): Date | null => {
    if (!input) return null;
    if (input instanceof Date) return isNaN(input.getTime()) ? null : input;
    if (typeof input === 'number') {
      const ms = input < 1_000_000_000_000 ? input * 1000 : input; // якщо секунди -> у мс
      const d = new Date(ms);
      return isNaN(d.getTime()) ? null : d;
    }
    if (typeof input === 'string') {
      const trimmed = input.trim();
      if (!trimmed) return null;
      const asNum = Number(trimmed);
      if (!Number.isNaN(asNum)) {
        const ms = asNum < 1_000_000_000_000 ? asNum * 1000 : asNum;
        const d = new Date(ms);
        return isNaN(d.getTime()) ? null : d;
      }
      let d = parseISO(trimmed);
      if (!isValid(d)) {
        d = new Date(trimmed);
      }
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  };

  const getExpiryRelative = (expiresAt: unknown): string => {
    const date = toDate(expiresAt);
    if (!date) return 'невідомо';
    return formatDistanceToNow(date, { addSuffix: true, locale: uk });
  };

  if (tariffsLoading || subscriptionLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </Card>
    );
  }

  // Підготовка даних підписок під новий формат API
  const activeSubs = subscription?.active ?? [];
  const hasActive = activeSubs.length > 0;
  const latestActive = hasActive
    ? activeSubs.reduce((acc, cur) => {
        const accDate = toDate(acc.end_date)?.getTime() ?? 0;
        const curDate = toDate(cur.end_date)?.getTime() ?? 0;
        return curDate > accDate ? cur : acc;
      })
    : null;

  const currentTariff = latestActive && tariffs
    ? tariffs.find(t => t.id === latestActive.tariff_id) || null
    : null;

  const inferPeriodLabel = (created_at?: string, end_date?: string): string => {
    const start = toDate(created_at ?? '');
    const end = toDate(end_date ?? '');
    if (!start || !end) return 'невідомо';
    const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays >= 360) return 'Річна';
    if (diffDays >= 27 && diffDays <= 35) return 'Місячна';
    return `${diffDays} днів`;
  };

  return (
    <div className="space-y-6">
      {/* Поточні підписки */}
      <Card className="p-6 bg-gradient-to-br from-white to-blue-50 border-white/40 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-yellow-100 text-yellow-600">
            <Crown className="h-5 w-5" />
          </div>
          <h3 className="text-xl font-semibold tracking-tight">Поточні підписки</h3>
        </div>
        {hasActive ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-lg">{currentTariff?.name ?? `Тариф #${latestActive?.tariff_id}`}</h4>
                {latestActive && (
                  <p className="text-sm text-muted-foreground">
                    Період: {inferPeriodLabel(latestActive.created_at, latestActive.end_date)}
                  </p>
                )}
              </div>
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Активна
              </Badge>
            </div>

            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  Закінчується {getExpiryRelative(latestActive?.end_date)}
                </span>
              </div>
              {/* Прогрес дії підписки */}
              {latestActive && (
                (() => {
                  const p = calcProgress(latestActive.created_at, latestActive.end_date);
                  return (
                    <div className="mt-1">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-500">Залишилось {p.daysLeft} дн.</span>
                        <span className="text-slate-500">{p.pct}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                          style={{ width: `${p.pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })()
              )}
            </div>

            <Separator />

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCancelSubscription}
                disabled={cancelMutation.isPending}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4 mr-2" />
                {cancelMutation.isPending ? 'Скасовуємо...' : 'Скасувати підписку'}
              </Button>
            </div>

            {/* Повний список активних підписок */}
            <div className="mt-6">
              <h4 className="font-medium mb-2">Активні підписки ({activeSubs.length})</h4>
              <div className="space-y-2">
                {activeSubs.map((s) => (
                  <div key={s.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-md border border-slate-200 p-3 bg-slate-50">
                    <div className="text-sm">
                      <div className="font-medium">Тариф #{s.tariff_id}</div>
                      <div className="text-muted-foreground">
                        Створено: {toDate(s.created_at)?.toLocaleString() || 'невідомо'}
                      </div>
                    </div>
                    <div className="text-sm mt-2 sm:mt-0 sm:text-right text-muted-foreground">
                      Закінчується: {toDate(s.end_date)?.toLocaleString() || 'невідомо'}
                      <span className="ml-2">({getExpiryRelative(s.end_date)})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-muted-foreground mb-4">
              <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>У вас немає активної підписки</p>
            </div>
          </div>
        )}
      </Card>

      {/* Доступні тарифи */}
      <Card className="p-6 bg-white/90 backdrop-blur-sm border-white/40 shadow-lg">
        <div className="flex items-center gap-2 mb-6">
          <Zap className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold">Доступні тарифи</h3>
        </div>

        {/* Перемикач періоду оплати */}
        <div className="mb-6">
          <Label className="text-sm text-slate-600">Період оплати</Label>
          <RadioGroup
            value={pricingPeriod}
            onValueChange={(v: 'month' | 'year') => setPricingPeriod(v)}
            className="mt-2 inline-flex rounded-lg border border-slate-200 overflow-hidden bg-white"
          >
            <div className={`px-4 py-2 cursor-pointer ${pricingPeriod === 'month' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'}`}>
              <RadioGroupItem value="month" id="pricing-month" className="hidden" />
              <Label htmlFor="pricing-month" className="cursor-pointer">Місячно</Label>
            </div>
            <div className={`px-4 py-2 cursor-pointer ${pricingPeriod === 'year' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'}`}>
              <RadioGroupItem value="year" id="pricing-year" className="hidden" />
              <Label htmlFor="pricing-year" className="cursor-pointer">Річно</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tariffs?.map((tariff) => {
            const isCurrentTariff = activeSubs.some(s => s.tariff_id === tariff.id);
            const discount = getDiscountPercent(tariff.price_per_month, tariff.price_per_year);
            const price = pricingPeriod === 'month' ? tariff.price_per_month : tariff.price_per_year;

            return (
              <Card key={tariff.id} className={`p-5 relative transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 ${isCurrentTariff ? 'ring-2 ring-blue-500' : 'border-slate-200'}`}>
                {isCurrentTariff && (
                  <Badge className="absolute -top-2 left-4 bg-blue-500">
                    Поточний тариф
                  </Badge>
                )}

                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-lg tracking-tight">{tariff.name}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{tariff.description}</p>
                  </div>

                  {/* Ціна */}
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between">
                      <div className="text-3xl font-bold tracking-tight">{formatPrice(price)}</div>
                      <div className="text-sm text-slate-500">/ {pricingPeriod === 'month' ? 'міс' : 'рік'}</div>
                    </div>
                    {pricingPeriod === 'year' && discount > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Економія vs місячно</span>
                        <Badge variant="secondary" className="ml-2 text-xs bg-green-100 text-green-800">
                          -{discount}%
                        </Badge>
                      </div>
                    )}
                  </div>

                  {!isCurrentTariff && (
                    <Dialog open={showSubscribeDialog && selectedTariff?.id === tariff.id} onOpenChange={setShowSubscribeDialog}>
                      <DialogTrigger asChild>
                        <Button 
                          className="w-full" 
                          onClick={() => { setSelectedTariff(tariff); setSelectedPeriod(pricingPeriod); }}
                        >
                          Обрати тариф
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Оформлення підписки</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">Обраний тариф: {selectedTariff?.name}</h4>
                            <p className="text-sm text-muted-foreground">{selectedTariff?.description}</p>
                          </div>

                          <div>
                            <Label className="text-base font-medium">Період підписки:</Label>
                            <RadioGroup value={selectedPeriod} onValueChange={(value: 'month' | 'year') => setSelectedPeriod(value)} className="mt-2">
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="month" id="month" />
                                <Label htmlFor="month" className="flex-1 cursor-pointer">
                                  <div className="flex justify-between">
                                    <span>Місячна підписка</span>
                                    <span className="font-medium">{formatPrice(selectedTariff?.price_per_month || 0)}/міс</span>
                                  </div>
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="year" id="year" />
                                <Label htmlFor="year" className="flex-1 cursor-pointer">
                                  <div className="flex justify-between">
                                    <span>Річна підписка</span>
                                    <div className="text-right">
                                      <span className="font-medium">{formatPrice(selectedTariff?.price_per_year || 0)}/рік</span>
                                      {selectedTariff && getDiscountPercent(selectedTariff.price_per_month, selectedTariff.price_per_year) > 0 && (
                                        <Badge variant="secondary" className="ml-2 text-xs bg-green-100 text-green-800">
                                          -{getDiscountPercent(selectedTariff.price_per_month, selectedTariff.price_per_year)}%
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </Label>
                              </div>
                            </RadioGroup>
                          </div>

                          <div className="flex gap-2 pt-4">
                            <Button 
                              variant="outline" 
                              onClick={() => setShowSubscribeDialog(false)}
                              className="flex-1"
                            >
                              Скасувати
                            </Button>
                            <Button 
                              onClick={handleSubscribe}
                              disabled={subscribeMutation.isPending}
                              className="flex-1"
                            >
                              {subscribeMutation.isPending ? 'Оформлюємо...' : 'Підтвердити'}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

export default SubscriptionManagement;
