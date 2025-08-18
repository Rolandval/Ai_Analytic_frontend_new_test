import { useEffect, useState } from 'react';

export interface UsdRateResponse {
  rate: number;
  currency_code: string;
  date: string;
  error?: string;
}

export const useUsdRate = () => {
  const [rate, setRate] = useState<UsdRateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRate = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/inverters/backend/usd_rate_today');
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setRate(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка при отриманні курсу долара');
      console.error('Failed to fetch USD rate:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRate();
  }, []);

  return { rate, loading, error, fetchRate };
};
