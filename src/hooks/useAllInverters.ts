import { useState, useEffect } from 'react';
import { getAllInverters } from '@/services/inverters.api';
import { Inverter } from '@/types/inverter';

interface UseAllInvertersReturn {
  inverters: Inverter[];
  loading: boolean;
  error: Error | null;
}

export const useAllInverters = (): UseAllInvertersReturn => {
  const [inverters, setInverters] = useState<Inverter[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAllInverters = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getAllInverters();
        setInverters(response.data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllInverters();
  }, []);

  return { inverters, loading, error };
};
