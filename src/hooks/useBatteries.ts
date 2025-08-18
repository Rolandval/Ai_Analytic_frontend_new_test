import { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';
import { getBatteries } from '@/services/batteries.api';
import { BatteryListRequest, PaginatedBatteriesResponse } from '@/types/battery';

interface UseBatteriesReturn {
  data: PaginatedBatteriesResponse | null;
  loading: boolean;
  error: Error | null;
  params: BatteryListRequest;
  setParams: Dispatch<SetStateAction<BatteryListRequest>>;
  refetch: (params: BatteryListRequest) => void;
}

export const useBatteries = (initialParams: BatteryListRequest): UseBatteriesReturn => {
  const [data, setData] = useState<PaginatedBatteriesResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [params, setParams] = useState<BatteryListRequest>(initialParams);

  const fetchBatteries = useCallback(async (fetchParams: BatteryListRequest) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getBatteries(fetchParams);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBatteries(params);
  }, [params, fetchBatteries]);

  const refetch = (newParams: BatteryListRequest) => {
    setParams(newParams);
  };

  return { data, loading, error, params, setParams, refetch };
};
