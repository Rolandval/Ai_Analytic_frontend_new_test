import { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';
import { getBatteriesDirectory } from '@/services/batteries.api';
import { BatteryDirectoryParams, PaginatedBatteriesResponse } from '@/types/battery';

interface UseBatteriesReturn {
  data: PaginatedBatteriesResponse | null;
  loading: boolean;
  error: Error | null;
  params: BatteryDirectoryParams;
  setParams: Dispatch<SetStateAction<BatteryDirectoryParams>>;
  refetch: (params: BatteryDirectoryParams) => void;
}

export const useBatteries = (initialParams: BatteryDirectoryParams): UseBatteriesReturn => {
  const [data, setData] = useState<PaginatedBatteriesResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [params, setParams] = useState<BatteryDirectoryParams>(initialParams);

  const fetchBatteries = useCallback(async (fetchParams: BatteryDirectoryParams, signal: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getBatteriesDirectory(fetchParams, signal);
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
    fetchBatteries(params, controller.signal);
    return () => controller.abort();
  }, [params, fetchBatteries]);

  const refetch = (newParams: BatteryDirectoryParams) => {
    setParams(newParams);
  };

  return { data, loading, error, params, setParams, refetch };
};
