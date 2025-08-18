import { useState, useEffect } from 'react';
import { getAllBatteries } from '@/services/batteries.api';
import { Battery } from '@/types/battery';

interface UseAllBatteriesReturn {
  batteries: Battery[];
  loading: boolean;
  error: Error | null;
}

export const useAllBatteries = (): UseAllBatteriesReturn => {
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAllBatteries = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getAllBatteries();
        setBatteries(response.data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllBatteries();
  }, []);

  return { batteries, loading, error };
};
