import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import { Badge } from '@/components/ui/Badge';
import { useTariffs, useCreateTariff, useUpdateTariff, useDeleteTariff } from '@/hooks/useTariffs';
import { Plus, Settings, Calendar, DollarSign, Edit, Trash2 } from 'lucide-react';
import type { TariffCreateRequest } from '@/api/tariffs';

const AdminTariffManagement: React.FC = () => {
  const { data: tariffs, isLoading } = useTariffs();
  const createTariffMutation = useCreateTariff();
  const updateTariffMutation = useUpdateTariff();
  const deleteTariffMutation = useDeleteTariff();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTariff, setEditingTariff] = useState<number | null>(null);
  const [formData, setFormData] = useState<TariffCreateRequest>({
    name: '',
    description: '',
    price_per_month: 0,
    price_per_year: 0,
  });

  const handleCreateTariff = () => {
    createTariffMutation.mutate(formData, {
      onSuccess: () => {
        setShowCreateDialog(false);
        setFormData({
          name: '',
          description: '',
          price_per_month: 0,
          price_per_year: 0,
        });
      }
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: 'UAH',
    }).format(price);
  };

  const getDiscountPercent = (monthlyPrice: number, yearlyPrice: number) => {
    if (monthlyPrice === 0) return 0;
    const yearlyMonthly = yearlyPrice / 12;
    const discount = ((monthlyPrice - yearlyMonthly) / monthlyPrice) * 100;
    return Math.round(discount);
  };

  if (isLoading) {
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

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-red-500" />
          <h3 className="text-lg font-semibold">Управління тарифами</h3>
          <Badge variant="destructive" className="text-xs">АДМІН</Badge>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Створити тариф
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Створення нового тарифу</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Назва тарифу</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Наприклад: Premium"
                />
              </div>

              <div>
                <Label htmlFor="description">Опис</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Опис можливостей тарифу..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price_month">Ціна за місяць (грн)</Label>
                  <Input
                    id="price_month"
                    type="number"
                    value={formData.price_per_month}
                    onChange={(e) => setFormData(prev => ({ ...prev, price_per_month: Number(e.target.value) }))}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="price_year">Ціна за рік (грн)</Label>
                  <Input
                    id="price_year"
                    type="number"
                    value={formData.price_per_year}
                    onChange={(e) => setFormData(prev => ({ ...prev, price_per_year: Number(e.target.value) }))}
                    placeholder="0"
                  />
                </div>
              </div>

              {formData.price_per_month > 0 && formData.price_per_year > 0 && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700">
                    Знижка при річній оплаті: {getDiscountPercent(formData.price_per_month, formData.price_per_year)}%
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateDialog(false)}
                  className="flex-1"
                >
                  Скасувати
                </Button>
                <Button 
                  onClick={handleCreateTariff}
                  disabled={createTariffMutation.isPending || !formData.name || !formData.description}
                  className="flex-1"
                >
                  {createTariffMutation.isPending ? 'Створюємо...' : 'Створити'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {tariffs && tariffs.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tariffs.map((tariff) => {
              const discount = getDiscountPercent(tariff.price_per_month, tariff.price_per_year);

              return (
                <Card key={tariff.id} className="p-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold">{tariff.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          ID: {tariff.id}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{tariff.description}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Місячно:</span>
                        <span className="font-medium">{formatPrice(tariff.price_per_month)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">Річно:</span>
                        <span className="font-medium">{formatPrice(tariff.price_per_year)}</span>
                        {discount > 0 && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                            -{discount}%
                          </Badge>
                        )}
                      </div>
                    </div>

                    {tariff.created_at && (
                      <div className="text-xs text-muted-foreground pt-2 border-t">
                        Створено: {new Date(tariff.created_at).toLocaleDateString('uk-UA')}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Settings className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-muted-foreground">Тарифи ще не створені</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default AdminTariffManagement;
