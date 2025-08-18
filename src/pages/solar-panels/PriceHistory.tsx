import { PriceHistoryPage } from '@/components/PriceHistoryPage';
import { useSolarPanelPricesCrud } from '@/hooks/useSolarPanelPricesCrud';
import { SolarPanelPriceSchema } from '@/types/solarPanels';
import { SolarPanelFilters } from '@/components/filters/SolarPanelFilters';
import { CreateSolarPanelPriceForm } from '@/components/forms/CreateSolarPanelPriceForm';

const columns = [
  { key: 'full_name', header: 'Назва' },
  { key: 'brand', header: 'Бренд' },
  { key: 'power', header: 'Потужність, Вт' },
  { key: 'thickness', header: 'Товщина, мм', render: (r: SolarPanelPriceSchema) => r.thickness ?? '—' },
  { key: 'panel_type', header: 'Тип панелі' },
  { key: 'cell_type', header: 'Тип елементу' },
  { key: 'panel_color', header: 'Колір панелі', render: (r: SolarPanelPriceSchema) => r.panel_color ?? '—' },
  { key: 'frame_color', header: 'Колір рами', render: (r: SolarPanelPriceSchema) => r.frame_color ?? '—' },
  { key: 'supplier', header: 'Постачальник' },
  { key: 'supplier_status', header: 'Тип постачальника' },
  { key: 'price_per_w', header: 'Ціна за Вт', render: (r: SolarPanelPriceSchema) => `${r.price_per_w.toFixed(3)} $/W` },
  { key: 'price', header: 'Ціна', render: (r: SolarPanelPriceSchema) => `${r.price.toFixed(2)} $` },
  { key: 'date', header: 'Дата', render: (r: SolarPanelPriceSchema) => new Date(r.date).toLocaleDateString() },
];

function SolarPanelsPriceHistory() {
  const hook = useSolarPanelPricesCrud();
  return (
    <PriceHistoryPage
      title="Історія прайсів: Сонячні панелі"
      currencySymbol="$"
      columns={columns}
      hook={hook as any}
      filterComponent={<SolarPanelFilters current={hook.filters} setFilters={hook.setFilters} brands={hook.brands} suppliers={hook.suppliers} />}
      createFormComponent={<CreateSolarPanelPriceForm currencySymbol="$" brands={hook.brands} suppliers={hook.suppliers} onSubmit={hook.createPrice} />}
    />
  );
}

export { SolarPanelsPriceHistory };

export default SolarPanelsPriceHistory;
