import { DirectoryPage, Column, FilterField } from '@/components/directory/DirectoryPage';
import { useInverterBrands } from '@/hooks/useInverterBrands';
import { useGetInvertersDirectory } from '@/hooks/useGetInvertersDirectory';
import { useCreateInverter } from '@/hooks/useCreateInverter';
import { useUpdateInverter } from '@/hooks/useUpdateInverter';
import { useDeleteInverter } from '@/hooks/useDeleteInverter';
import { Inverter, InverterListRequest } from '@/types/inverter';

const InvertersDirectory = () => {
  /* columns & filters */
  const columns: Column<Inverter>[] = [
    { key: 'full_name', label: 'Назва' },
    { key: 'brand', label: 'Бренд', render: (r) => (r.brand ? (typeof r.brand === 'string' ? r.brand : (r.brand as any).name) : '—') },
    { key: 'power', label: 'Потужність, Вт' },
    { key: 'inverter_type', label: 'Тип' },
    { key: 'generation', label: 'Покоління' },
    { key: 'string_count', label: 'Стрінги' },
    { key: 'firmware', label: 'ПЗ' },
  ];

  const { brands } = useInverterBrands();
  const brandOptions = brands.map((b)=>({label:b,value:b}));

  const filterFields: FilterField[] = [
    { type: 'text', name: 'full_name', label: 'Назва' },
    { type: 'range-number', nameMin: 'power_min', nameMax: 'power_max', label: 'Потужність (W)' },
    { type: 'list-multiselect', name: 'brands', label: 'Бренди', options: brandOptions },
    { type: 'text', name: 'region', label: 'Регіон' },
    { type: 'select', name: 'page_size', label: 'Розмір', options: [10,20,50,100].map(n=>({label:String(n), value:String(n)})) }
  ];

  const useList = (params: InverterListRequest) => {
    const q = useGetInvertersDirectory(params);
    const mapped = q.data ? { items: q.data.inverters, total: q.data.total } : undefined;
    return { ...q, data: mapped } as const;
  };

  const formSelectOptions: Record<string, {label:string; value:string}[]> = {
    brand: brandOptions,
    inverter_type: [
      { label: 'grid-tie', value: 'grid-tie' },
      { label: 'hybrid', value: 'hybrid' },
    ],
  };

  return (
    <DirectoryPage<Inverter, InverterListRequest>
      title="Довідник – Інвертори"
      columns={columns}
      filterFields={filterFields}
      useList={useList as any}
      useCreate={() => {
        const { mutate } = useCreateInverter();
        return { mutate: (d) => mutate(d as any) };
      }}
      useUpdate={() => {
        const { mutate } = useUpdateInverter();
        return { mutate: ({ id, data }) => mutate({ id, data: data as any }) };
      }}
      useDelete={() => {
        const { mutate } = useDeleteInverter();
        return { mutate };
      }}
      initialParams={{ page: 1, page_size: 15 } as InverterListRequest}
      lostPath="/inverters/directory/lost"
      formSelectOptions={formSelectOptions}
    />
  );
};

export default InvertersDirectory;