import { PriceHistoryPage } from '@/components/PriceHistoryPage';
import { useInverterPricesCrud } from '@/hooks/useInverterPricesCrud';
import { InverterPriceSchema } from '@/types/inverters';
import { InverterFilters } from '@/components/filters/InverterFilters';
import { CreateInverterPriceForm } from '@/components/forms/CreateInverterPriceForm';

const columns = [
  { key: 'full_name', header: 'Назва' },
  { key: 'brand', header: 'Бренд' },
  { key: 'power', header: 'Потужність, Вт' },
  { key: 'inverter_type', header: 'Тип' },
  { key: 'generation', header: 'Покоління' },
  { key: 'string_count', header: 'Стрінгів' },
  { key: 'firmware', header: 'Firmware' },
  { key: 'supplier_status', header: 'Тип постачальника' },
  { key: 'supplier', header: 'Постачальник' },
  { key: 'price', header: 'Ціна', render: (r: InverterPriceSchema) => `${r.price.toFixed(2)} $` },
  { key: 'date', header: 'Дата', render: (r: InverterPriceSchema) => new Date(r.date).toLocaleDateString() },
];

function InvertersPriceHistory() {
  const hook = useInverterPricesCrud();
  return (
    <PriceHistoryPage
      title="Історія прайсів: Інвертори"
      currencySymbol="$"
      columns={columns}
      hook={hook as any}
      filterComponent={<InverterFilters current={hook.filters} setFilters={hook.setFilters} brands={hook.brands} suppliers={hook.suppliers} />}
      createFormComponent={<CreateInverterPriceForm currencySymbol="$" brands={hook.brands} suppliers={hook.suppliers} onSubmit={hook.createPrice} />}
    />
  );
}

export { InvertersPriceHistory };

export default InvertersPriceHistory;
