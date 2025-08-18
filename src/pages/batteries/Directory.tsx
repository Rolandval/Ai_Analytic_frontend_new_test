import { DirectoryPage, Column, FilterField } from '@/components/directory/DirectoryPage';
import { useGetBatteriesDirectory } from '@/hooks/useGetBatteriesDirectory';
import { useCreateBattery } from '@/hooks/useCreateBattery';
import { useUpdateBattery } from '@/hooks/useUpdateBattery';
import { useDeleteBattery } from '@/hooks/useDeleteBattery';
import { BatteryDirectoryItem, BatteryDirectoryParams, RegionEnum, PolarityEnum, ElectrolyteEnum } from '@/types/battery';
import { useBatteryBrands } from '@/hooks/useBatteryBrands';

const BatteriesDirectory = () => {
  /* ---------- column & filter config ---------- */
  const columns: Column<BatteryDirectoryItem>[] = [
    { key: 'full_name', label: 'Назва' },
    { key: 'brand', label: 'Бренд' },
    { key: 'volume', label: 'Обʼєм' },
    { key: 'c_amps', label: 'Пуск А' },
    { key: 'region', label: 'Регіон' },
    { key: 'polarity', label: 'Полярність' },
    { key: 'electrolyte', label: 'Електроліт' },
  ];

    const { brands } = useBatteryBrands();
  const brandOptions = brands.map((b) => ({ label: b, value: b }));

  const filterFields: FilterField[] = [
    { type: 'text', name: 'full_name', label: 'Назва' },
    { type: 'list-multiselect', name: 'brands', label: 'Бренди', options: brandOptions },
    { type: 'range-number', nameMin: 'volume_min', nameMax: 'volume_max', label: 'Обʼєм' },
    { type: 'range-number', nameMin: 'c_amps_min', nameMax: 'c_amps_max', label: 'Пуск А' },
    { type: 'select', name: 'region', label: 'Регіон', options: Object.values(RegionEnum).map((v)=>({label:v,value:v})) },
    { type: 'select', name: 'polarity', label: 'Полярність', options: Object.values(PolarityEnum).map((v)=>({label:v,value:v})) },
    { type: 'multiselect', name: 'electrolyte', label: 'Електроліт', options: Object.values(ElectrolyteEnum).map((v)=>({label:v,value:v})) },
    { type: 'select', name: 'page_size', label: 'Розмір', options: [10,20,50,100].map(n=>({label:String(n), value:String(n)})) }
  ];

  /* -------- wrap list hook to fit DirectoryPage shape -------- */
  const useList = (params: BatteryDirectoryParams) => {
    const q = useGetBatteriesDirectory(params);
    const mapped = q.data
      ? { items: q.data.batteries, total: q.data.total }
      : undefined;
    return { ...q, data: mapped } as const;
  };

  return (
    <DirectoryPage<BatteryDirectoryItem, BatteryDirectoryParams>
      title="Довідник – Акумулятори"
      columns={columns}
      filterFields={filterFields}
      useList={useList as any}
      useCreate={() => {
        const { mutate } = useCreateBattery();
        return { mutate: (d) => mutate(d as any) };
      }}
      useUpdate={() => {
        const { mutate } = useUpdateBattery();
        return { mutate: ({ id, data }) => mutate({ id, data: data as any }) };
      }}
      useDelete={() => {
        const { mutate } = useDeleteBattery();
        return { mutate };
      }}
      initialParams={{ page: 1, page_size: 15 } as BatteryDirectoryParams}
      lostPath="/batteries/directory/lost"
    />
  );
};

export default BatteriesDirectory;