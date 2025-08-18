import { useQuery } from '@tanstack/react-query';
import { getSolarPanelSuppliers } from '@/services/solarPanels.api';

export const useGetSolarPanelSuppliers = (page: number, pageSize: number) => {
  return useQuery({
    queryKey: ['solar-panel-suppliers', page, pageSize],
    queryFn: () => getSolarPanelSuppliers({ page, page_size: pageSize }),
  });
};
