import { useState, useEffect } from 'react';
import { getBatteryBrands } from '@/services/batteries.api';

export const useBatteryBrands = () => {
  const [brands, setBrands] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchBrands = async () => {
      setIsLoading(true);
      try {
        const data = await getBatteryBrands();
        setBrands((data as any)?.brands ?? (data as any) ?? []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBrands();
  }, []);

  return { brands, isLoading, error };
};
