import { useState, useEffect } from 'react';
import { getSolarPanelBrands } from '@/services/solarPanels.api';

export const useSolarPanelBrands = () => {
  const [brands, setBrands] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchBrands = async () => {
      setIsLoading(true);
      try {
        const data = await getSolarPanelBrands();
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