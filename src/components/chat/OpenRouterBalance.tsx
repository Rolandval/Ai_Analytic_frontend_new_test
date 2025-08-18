import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface BalanceData {
  usage: number;
  balance: number;
  limit: number | null;
  is_free_tier: boolean;
  key_label: string;
}

export const OpenRouterBalance: React.FC = () => {
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        setLoading(true);
        const response = await axios.get<BalanceData>('/chat/openrouter-balance');
        setBalance(response.data);
        setError(null);
      } catch (err) {
        console.error('Помилка отримання балансу OpenRouter:', err);
        setError('Не вдалося отримати баланс');
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
    
    // Оновлюємо баланс кожні 5 хвилин
    const intervalId = setInterval(fetchBalance, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  if (loading) {
    return (
      <div className="text-center text-sm text-muted-foreground opacity-70">
        Завантаження балансу...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-sm text-destructive opacity-70">
        {error}
      </div>
    );
  }

  return (
    <div className="text-center text-sm bg-white/5 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
      <span className="font-medium">OpenRouter: </span>
      <span className="text-cyan-300">${balance?.balance.toFixed(2)}</span>
    </div>
  );
};
