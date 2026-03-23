import { DirectoryPage, Column, FilterField } from '@/components/directory/DirectoryPage';
import { useSolarPanelBrands } from '@/hooks/useSolarPanelBrands';
import { PanelTypeEnum, CellTypeEnum, PanelColorEnum, FrameColorEnum } from '@/types/solarPanel';
import { useGetSolarPanelsDirectory } from '@/hooks/useGetSolarPanelsDirectory';
import { useCreateSolarPanel } from '@/hooks/useCreateSolarPanel';
import { useUpdateSolarPanel } from '@/hooks/useUpdateSolarPanel';
import { useDeleteSolarPanel } from '@/hooks/useDeleteSolarPanel';
import { SolarPanel, SolarPanelListRequest } from '@/types/solarPanel';

const SolarPanelsDirectory = () => {
  /* columns & filters */
  const columns: Column<SolarPanel>[] = [
    { key: 'full_name', label: 'Назва' },
    { key: 'brand', label: 'Бренд', render: (r) => {
        if (!r.brand) return '—';
        // If backend returns object with name
        if (typeof r.brand === 'object' && 'name' in r.brand) {
          // @ts-ignore – runtime check ensures safety
          return (r.brand as any).name ?? '—';
        }
        // Otherwise assume string
        return r.brand as unknown as string;
      } },
    { key: 'power', label: 'Потужн., Вт' },
    { key: 'panel_type', label: 'Тип панелі' },
    { key: 'cell_type', label: 'Тип елемента' },
    { key: 'thickness', label: 'Товщина, мм' },
    { key: 'panel_color', label: 'Колір панелі' },
    { key: 'frame_color', label: 'Колір рамки' },
  ];

  const { brands } = useSolarPanelBrands();
  const brandOptions = brands.map((b) => ({ label: b, value: b }));

  const filterFields: FilterField[] = [
    { type: 'text', name: 'full_name', label: 'Назва' },
    { type: 'list-multiselect', name: 'brands', label: 'Бренди', options: brandOptions },
    { type: 'range-number', nameMin: 'power_min', nameMax: 'power_max', label: 'Потужність (W)' },
    { type: 'select', name: 'panel_type', label: 'Тип панелі', options: Object.values(PanelTypeEnum).map((v) => ({ label: v, value: v })) },
    { type: 'select', name: 'cell_type', label: 'Тип елемента', options: Object.values(CellTypeEnum).map((v) => ({ label: v, value: v })) },
    { type: 'select', name: 'panel_color', label: 'Колір панелі', options: Object.values(PanelColorEnum).map((v) => ({ label: v, value: v })) },
    { type: 'select', name: 'frame_color', label: 'Колір рамки', options: Object.values(FrameColorEnum).map((v) => ({ label: v, value: v })) },
    { type: 'select', name: 'page_size', label: 'Розмір', options: [10, 20, 50, 100].map((n) => ({ label: String(n), value: String(n) })) },
  ];

  const useList = (params: SolarPanelListRequest) => {
    const q = useGetSolarPanelsDirectory(params);
    const mapped = q.data ? { items: q.data.solar_panels, total: q.data.total } : undefined;
    return { ...q, data: mapped } as const;
  };

  /* -------- hooks for CRUD (must be at component top level) -------- */
  const { mutate: createSolarPanel } = useCreateSolarPanel();
  const { mutate: updateSolarPanel } = useUpdateSolarPanel();
  const { mutate: deleteSolarPanel } = useDeleteSolarPanel();

  return (
    <DirectoryPage<SolarPanel, SolarPanelListRequest>
      title="Довідник – Сонячні панелі"
      columns={columns}
      filterFields={filterFields}
      useList={useList as any}
      useCreate={() => ({ mutate: (d) => createSolarPanel(d as any) })}
      useUpdate={() => ({ mutate: ({ id, data }) => updateSolarPanel({ id, data: data as any }) })}
      useDelete={() => ({ mutate: deleteSolarPanel })}
      initialParams={{ page: 1, page_size: 15 } as SolarPanelListRequest}
      lostPath="/solar-panels/directory/lost"
      formSelectOptions={{
        brand: brandOptions,
        panel_type: Object.values(PanelTypeEnum).map((v) => ({ label: v, value: v })),
        cell_type: Object.values(CellTypeEnum).map((v) => ({ label: v, value: v })),
        panel_color: Object.values(PanelColorEnum).map((v) => ({ label: v, value: v })),
        frame_color: Object.values(FrameColorEnum).map((v) => ({ label: v, value: v })),
      }}
    />
  );
};

export default SolarPanelsDirectory;