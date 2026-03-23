import { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';
import { getInverters } from '@/services/inverters.api';
import { InverterListRequest, PaginatedInvertersResponse } from '@/types/inverter';

interface UseInvertersReturn {
  data: PaginatedInvertersResponse | null;
  loading: boolean;
  error: Error | null;
  params: InverterListRequest;
  setParams: Dispatch<SetStateAction<InverterListRequest>>;
}

export const useInverters = (initialParams: InverterListRequest): UseInvertersReturn => {
  const [data, setData] = useState<PaginatedInvertersResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [params, setParams] = useState<InverterListRequest>(initialParams);

  const fetchInverters = useCallback(async (fetchParams: InverterListRequest, signal: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getInverters(fetchParams, signal);
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
    fetchInverters(params, controller.signal);
    return () => controller.abort();
  }, [params, fetchInverters]);

  return { data, loading, error, params, setParams };
};
