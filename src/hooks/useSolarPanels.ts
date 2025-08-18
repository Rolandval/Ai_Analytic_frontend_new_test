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

  const fetchSolarPanels = useCallback(async (fetchParams: SolarPanelListRequest) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getSolarPanels(fetchParams);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSolarPanels(params);
  }, [params, fetchSolarPanels]);

  return { data, loading, error, params, setParams };
};
