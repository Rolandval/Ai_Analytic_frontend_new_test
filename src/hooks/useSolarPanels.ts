import { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';
import { getSolarPanels } from '@/services/solarPanels.api';
import { SolarPanelListRequest, PaginatedSolarPanelsResponse } from '@/types/solarPanel';

interface UseSolarPanelsReturn {
  data: PaginatedSolarPanelsResponse | null;
  loading: boolean;
  error: Error | null;
  params: SolarPanelListRequest;
  setParams: Dispatch<SetStateAction<SolarPanelListRequest>>;
}

export const useSolarPanels = (initialParams: SolarPanelListRequest): UseSolarPanelsReturn => {
  const [data, setData] = useState<PaginatedSolarPanelsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [params, setParams] = useState<SolarPanelListRequest>(initialParams);

  const fetchSolarPanels = useCallback(async (fetchParams: SolarPanelListRequest, signal: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getSolarPanels(fetchParams, signal);
      setData(result);
    } catch (err) {
      if ((err as Error).name !== 'CanceledError' && (err as Error).name !== 'AbortError') {
        setError(err as Error);
      }
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchSolarPanels(params, controller.signal);
    return () => controller.abort();
  }, [params, fetchSolarPanels]);

  return { data, loading, error, params, setParams };
};
