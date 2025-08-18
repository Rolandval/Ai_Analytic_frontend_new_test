import { useState, useEffect } from 'react';
import { getAllSolarPanels } from '@/services/solarPanels.api';
import { SolarPanel } from '@/types/solarPanel';

interface UseAllSolarPanelsReturn {
  solarPanels: SolarPanel[];
  loading: boolean;
  error: Error | null;
}

export const useAllSolarPanels = (): UseAllSolarPanelsReturn => {
  const [solarPanels, setSolarPanels] = useState<SolarPanel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAllSolarPanels = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getAllSolarPanels();
        setSolarPanels(response.data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllSolarPanels();
  }, []);

  return { solarPanels, loading, error };
};
