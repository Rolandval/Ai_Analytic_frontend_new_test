import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/Dialog';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { UpdateSitePriceRequest } from '@/services/sitePrice.api';

interface PriceUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UpdateSitePriceRequest) => Promise<void>;
  currentPrice: number | null;
  currentPromoPrice?: number | null;
  currentAvailability?: string | null;
  productName: string;
  siteId: number;
}

export function PriceUpdateModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  currentPrice, 
  currentPromoPrice, 
  currentAvailability,
  productName,
  siteId
}: PriceUpdateModalProps) {
  const [price, setPrice] = useState<string>(currentPrice ? currentPrice.toString() : '');
  const [promoPrice, setPromoPrice] = useState<string>(currentPromoPrice ? currentPromoPrice.toString() : '');
  const [availability, setAvailability] = useState<string>(currentAvailability || '');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Оновлюємо стан при зміні вхідних даних або коли модальне вікно відкривається
  useEffect(() => {
    if (isOpen) {
      setPrice(currentPrice ? currentPrice.toString() : '');
      setPromoPrice(currentPromoPrice ? currentPromoPrice.toString() : '');
      setAvailability(currentAvailability || '');
    }
  }, [isOpen, currentPrice, currentPromoPrice, currentAvailability]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Перевірка чи відправляємо хоча б одне поле
    if (!price && !promoPrice && !availability) {
      toast({
        title: 'Помилка',
        description: 'Введіть хоча б одне значення для оновлення',
        variant: 'destructive',
      });
      return;
    }
    
    // Перевірка коректності введених цін
    if (price && isNaN(parseFloat(price))) {
      toast({
        title: 'Помилка',
        description: 'Будь ласка, введіть коректну ціну',
        variant: 'destructive',
      });
      return;
    }
    
    if (promoPrice && isNaN(parseFloat(promoPrice))) {
      toast({
        title: 'Помилка',
        description: 'Будь ласка, введіть коректну акційну ціну',
        variant: 'destructive',
      });
      return;
    }
    
    // Створення об’єкта даних для запиту
    const updateData: UpdateSitePriceRequest = {
      site_id: siteId,
      ...(price ? { price: parseFloat(price) } : {}),
      ...(promoPrice ? { promo_price: parseFloat(promoPrice) } : {}),
      ...(availability ? { availability } : {})
    };
    
    setIsLoading(true);
    try {
      await onSubmit(updateData);
      toast({
        title: 'Успіх',
        description: 'Дані успішно оновлено',
        variant: 'default',
      });
      onClose();
    } catch (error) {
      toast({
        title: 'Помилка',
        description: 'Не вдалося оновити дані',
        variant: 'destructive',
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={isLoading ? undefined : onClose}>
      <DialogContent className="w-[95vw] max-w-[425px] p-4 sm:p-6 rounded-lg">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-lg sm:text-xl font-semibold text-center sm:text-left">
            Оновити ціну на сайті
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-center sm:text-left">
            Введіть нову ціну для <span className="font-medium">{productName}</span>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-2 sm:mt-3">
          <div className="grid gap-3 sm:gap-4 py-2 sm:py-4">
            {/* Ціна */}
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
              <Label 
                htmlFor="price" 
                className="text-left sm:text-right text-sm sm:text-base font-medium">
                Основна ціна
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="sm:col-span-3 h-9 sm:h-10 text-base px-3 py-1 focus:ring-2 focus:ring-purple-500"
                placeholder="Введіть основну ціну"
                autoFocus
              />
            </div>
            
            {/* Акційна ціна */}
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
              <Label 
                htmlFor="promoPrice" 
                className="text-left sm:text-right text-sm sm:text-base font-medium">
                Акційна ціна
              </Label>
              <Input
                id="promoPrice"
                type="number"
                step="0.01"
                value={promoPrice}
                onChange={(e) => setPromoPrice(e.target.value)}
                className="sm:col-span-3 h-9 sm:h-10 text-base px-3 py-1 focus:ring-2 focus:ring-purple-500"
                placeholder="Введіть акційну ціну (необов'язково)"
              />
            </div>
            
            {/* Кількість на складі */}
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
              <Label 
                htmlFor="availability" 
                className="text-left sm:text-right text-sm sm:text-base font-medium">
                Кількість
              </Label>
              <Input
                id="availability"
                type="text"
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                className="sm:col-span-3 h-9 sm:h-10 text-base px-3 py-1 focus:ring-2 focus:ring-purple-500"
                placeholder="Кількість на складі (необов'язково)"
              />
            </div>
          </div>
          <DialogFooter className="mt-2 sm:mt-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              disabled={isLoading}
              className="w-full sm:w-auto px-4 py-2 h-9 sm:h-10 text-sm transition-all"
            >
              Скасувати
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className={cn(
                "w-full sm:w-auto px-4 py-2 h-9 sm:h-10 text-sm transition-all",
                "bg-purple-600 hover:bg-purple-700 text-white"
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Оновлення...
                </>
              ) : (
                'Оновити ціну'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
