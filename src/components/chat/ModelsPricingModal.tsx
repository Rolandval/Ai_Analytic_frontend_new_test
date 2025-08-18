import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { ArrowDown, ArrowUp, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModelPricing {
  id: number;
  name: string;
  icon: string;
  input_tokens_price: number | null;
  output_tokens_price: number | null;
}

interface ModelsPricingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ModelsPricingModal: React.FC<ModelsPricingModalProps> = ({ open, onOpenChange }) => {
  const [models, setModels] = useState<ModelPricing[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchModels = async () => {
    setLoading(true);
    try {
      console.log('Fetching models from /chat/chat-models...');
      const response = await fetch('/chat/chat-models');
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Models data received:', data);
        setModels(data);
      } else {
        console.error('Failed to fetch models, status:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchModels();
    }
  }, [open]);

  const formatPrice = (price: number | null) => {
    if (price === null || price === undefined) return 'N/A';
    return `$${price.toFixed(3)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] bg-gray-900 border border-white/10 shadow-2xl">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-2xl text-center font-medium flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-400" />
            Ціни на AI моделі
            <Sparkles className="w-6 h-6 text-purple-400" />
          </DialogTitle>
          <p className="text-sm text-gray-400 text-center mt-2">
            Вартість за 1 мільйон токенів у доларах США
          </p>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[60vh] pr-2">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {models.map((model) => (
                <div
                  key={model.id}
                  className={cn(
                    "p-4 rounded-lg border transition-all duration-200",
                    "bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-500/30",
                    "backdrop-blur-sm"
                  )}
                >
                  <div className="flex items-center justify-between">
                    {/* Model Info */}
                    <div className="flex items-center space-x-3">
                      {model.icon && (
                        <img 
                          src={model.icon} 
                          alt={model.name} 
                          className="w-8 h-8 rounded-full bg-white/10 p-1" 
                        />
                      )}
                      <div>
                        <h3 className="font-medium text-white">{model.name}</h3>
                      </div>
                    </div>

                    {/* Pricing Info */}
                    <div className="flex items-center space-x-6">
                      {/* Input Tokens */}
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-1 mb-1">
                          <ArrowDown className="w-4 h-4 text-green-400" />
                          <span className="text-xs text-gray-400 uppercase tracking-wide">Вхідні</span>
                        </div>
                        <div className={cn(
                          "px-3 py-1 rounded-full text-sm font-medium",
                          model.input_tokens_price !== null 
                            ? "bg-green-500/20 text-green-300" 
                            : "bg-gray-500/20 text-gray-400"
                        )}>
                          {formatPrice(model.input_tokens_price)}
                        </div>
                      </div>

                      {/* Output Tokens */}
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-1 mb-1">
                          <ArrowUp className="w-4 h-4 text-blue-400" />
                          <span className="text-xs text-gray-400 uppercase tracking-wide">Вихідні</span>
                        </div>
                        <div className={cn(
                          "px-3 py-1 rounded-full text-sm font-medium",
                          model.output_tokens_price !== null 
                            ? "bg-blue-500/20 text-blue-300" 
                            : "bg-gray-500/20 text-gray-400"
                        )}>
                          {formatPrice(model.output_tokens_price)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-center pt-4 border-t border-white/10">
          <Button 
            variant="outline" 
            className="border-white/10 hover:bg-white/5 text-gray-300"
            onClick={() => onOpenChange(false)}
          >
            Закрити
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
