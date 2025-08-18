import { PriceHistoryPage } from '@/components/PriceHistoryPage';
import { useBatteryPricesCrud } from '@/hooks/useBatteryPricesCrud';
import { BatteryPriceSchema } from '@/types/batteries';
import { BatteryFilters } from '@/components/filters/BatteryFilters';
import { CreateBatteryPriceForm } from '@/components/forms/CreateBatteryPriceForm';

const columns = [
  { key: 'full_name', header: 'Назва' },
  { key: 'brand', header: 'Бренд' },
  { key: 'volume', header: 'Обʼєм' },
  { key: 'c_amps', header: 'Сила струму' },
  { key: 'region', header: 'Регіон' },
  { key: 'polarity', header: 'Полярність' },
  { key: 'electrolyte', header: 'Електроліт' },
  { key: 'supplier', header: 'Постачальник' },
  { key: 'supplier_status', header: 'Тип постачальника' },
  { key: 'price', header: 'Ціна', render: (r: BatteryPriceSchema) => `${r.price.toFixed(2)} ₴` },
  { key: 'date', header: 'Дата', render: (r: BatteryPriceSchema) => new Date(r.date).toLocaleDateString() },
];

function BatteriesPriceHistory() {
  const hook = useBatteryPricesCrud();
  return (
    <PriceHistoryPage
      title="Історія прайсів: Акумулятори"
      currencySymbol="₴"
      columns={columns}
      hook={hook as any}
      filterComponent={<BatteryFilters current={hook.filters} setFilters={hook.setFilters} brands={hook.brands} suppliers={hook.suppliers} />}
      createFormComponent={<CreateBatteryPriceForm currencySymbol="₴" brands={hook.brands} suppliers={hook.suppliers} onSubmit={hook.createPrice} />}
    />
  );
}

export { BatteriesPriceHistory };

export default BatteriesPriceHistory;
