import { useQuery } from '@tanstack/react-query';
import { getSolarPanelSuppliers } from '@/services/solarPanels.api';

export const useGetSolarPanelSuppliers = (page: number, pageSize: number = 100, search: string = '') => {
  return useQuery({
    queryKey: ['solar-panel-suppliers', page, pageSize, search],
    queryFn: () => getSolarPanelSuppliers({ page, page_size: pageSize, search }),
  });
};
