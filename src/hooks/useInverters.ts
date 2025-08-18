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

  const fetchInverters = useCallback(async (fetchParams: InverterListRequest) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getInverters(fetchParams);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInverters(params);
  }, [params, fetchInverters]);

  return { data, loading, error, params, setParams };
};
