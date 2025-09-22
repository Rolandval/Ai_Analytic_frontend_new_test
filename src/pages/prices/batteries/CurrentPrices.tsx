import { PriceHistoryPage } from '@/components/PriceHistoryPage';
import { useBatteryCurrentPricesCrud } from '@/hooks/useBatteryCurrentPricesCrud';
import { BatteryFilters, BatteryTopSearch } from '@/components/filters/BatteryFilters';
import { CreateBatteryPriceForm } from '@/components/forms/CreateBatteryPriceForm';
import { TableColumn } from '@/components/PriceHistoryPage';
import { BatteryPriceSchema } from '@/types/batteries';
import { useEffect, useState } from 'react';
import { ContactIconButton } from '@/components/ui/ContactIconButton';
import { refreshBatteriesData } from '@/services/dataRefresh.api';

const createColumns = (markup: number = 15): TableColumn<BatteryPriceSchema>[] => [
  { key: 'full_name', header: 'Назва', sortable: true },
  { key: 'brand', header: 'Бренд', sortable: true },
  { key: 'volume', header: 'Ah', sortable: true },
  { key: 'c_amps', header: 'Пуск A', sortable: true },
  { key: 'region', header: 'Тип Корпусу', sortable: true },
  { key: 'polarity', header: 'Полярність', sortable: true },
  { key: 'electrolyte', header: 'Електроліт', sortable: true },
  { 
    key: 'supplier', 
    header: 'Постачальник',
    sortable: true,
    render: (row) => {
      if (row.supplier_url) {
        return (
          <a 
            href={row.supplier_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            {row.supplier}
          </a>
        );
      }
      return row.supplier;
    } 
  },
  {
    key: 'supplier_cities',
    header: 'Міста',
    sortable: false,
    render: (row) => {
      if (!row.supplier_cities || row.supplier_cities.length === 0) {
        return <span className="text-gray-500">Невідомо</span>;
      }
      return (
        <div className="flex flex-wrap gap-1">
          {row.supplier_cities.map((city: string, index: number) => (
            <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
              {city}
            </span>
          ))}
        </div>
      );
    }
  },
  { key: 'supplier_status', header: 'Статус', sortable: true },
  { 
    key: 'price', 
    header: '₴',
    sortable: true,
    sortKey: 'price_sort',
    render: (row) => (
      <span className="font-medium text-blue-500">
        {row.price}
      </span>
    )
  },
  { 
    key: 'price_markup', 
    header: '₴ з нац.',
    render: (row) => (
      <span className="font-medium text-blue-800">
        {(row.price * (1 + markup/100)).toLocaleString('uk-UA', { maximumFractionDigits: 0 })}
      </span>
    )
  },
  {
    key: 'date',
    header: 'Дата',
    sortable: true,
    render: (r) => new Date(r.date).toLocaleDateString(),
  },
  { 
    key: 'price_per_watt',
    header: '$/Вт',
    sortable: true,
    sortKey: 'price_per_watt_sort',
    render: (row) => (
      <span className="font-medium text-green-500">
        {row.volume && row.price ? (row.price / row.volume).toFixed(2) : '-'}
      </span>
    )
  },
  { 
    key: 'contact',
    header: 'Контакт',
    render: (row) => (
      <ContactIconButton 
        contactInfo={row.supplier_url || null}
        className="ml-2"
      />
    )
  },
];

export default function BatteryCurrentPricesPage() {
  const hook = useBatteryCurrentPricesCrud();
  const [markup, setMarkup] = useState<number>(15); // Значення націнки за замовчуванням

  // Оновлення націнки при зміні фільтрів
  useEffect(() => {
    if (hook.filters.markup !== undefined) {
      setMarkup(hook.filters.markup);
    }
  }, [hook.filters.markup]);

  const resetFilters = () => {
    const resetFilters = {
      page: 1,
      markup: 15,
    };
    hook.setFilters(resetFilters);
    setMarkup(15);
  };

  return (
    <PriceHistoryPage
      title="Актуальні ціни – Акумулятори"
      currencySymbol="₴"
      columns={createColumns(hook.filters.markup || markup)}
      hook={hook as any}
      compact
      onRefresh={async () => {
        await refreshBatteriesData();
      }}
      chartConfig={{
        getChart: hook.getChart,
        suppliers: (hook as any).supplierOptions ?? [],
      }}
      topSearchComponent={
        <BatteryTopSearch
          current={hook.filters}
          setFilters={(filters) => {
            hook.setFilters(filters);
            if (filters.markup !== undefined) {
              setMarkup(filters.markup);
            }
          }}
          onReset={resetFilters}
        />
      }
      filterComponent={
        <BatteryFilters 
          current={hook.filters} 
          setFilters={(filters) => {
            hook.setFilters(filters);
            if (filters.markup !== undefined) {
              setMarkup(filters.markup);
            }
          }} 
          brands={hook.brands} 
          suppliers={hook.suppliers} 
        />
      }
      createFormComponent={<CreateBatteryPriceForm currencySymbol="₴" brands={hook.brands} suppliers={hook.suppliers} onSubmit={hook.createPrice} />}
    />
  );
}
