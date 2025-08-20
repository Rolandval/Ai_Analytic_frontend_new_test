import { PriceHistoryPage } from '@/components/PriceHistoryPage';
import { useSolarPanelCurrentPricesCrud } from '@/hooks/useSolarPanelCurrentPricesCrud';
import { SolarPanelFilters, SolarPanelTopSearch } from '@/components/filters/SolarPanelFilters';
import { useState, useEffect } from 'react';
import { CreateSolarPanelPriceForm } from '@/components/forms/CreateSolarPanelPriceForm';
import { TableColumn } from '@/components/PriceHistoryPage';
import { SolarPanelPriceSchema } from '@/types/solarPanels';
import { ContactIconButton } from '@/components/ui/ContactIconButton';

const createColumns = (usdRate: number, markup: number = 15): TableColumn<SolarPanelPriceSchema>[] => [
  { key: 'full_name', header: 'Назва', sortable: true },
  { key: 'brand', header: 'Бренд', sortable: true },
  { 
    key: 'power', 
    header: 'Вт', 
    sortable: true,
    render: (row) => (
      <span className="text-sm">
        {row.power}
      </span>
    )
  },
  { key: 'panel_type', header: 'Тип', sortable: true },
  { key: 'cell_type', header: 'Комірка', sortable: true },
  { key: 'panel_color', header: 'Колір панелі', sortable: true },
  { key: 'frame_color', header: 'Колір рами', sortable: true },
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
    key: 'suppliers_cities',
    header: 'Міста',
    sortable: false,
    render: (row) => {
      if (!row.suppliers_cities || row.suppliers_cities.length === 0) {
        return <span className="text-gray-500">Невідомо</span>;
      }
      return (
        <div className="flex flex-wrap gap-1">
          {row.suppliers_cities.map((city: string, index: number) => (
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
    header: '$',
    sortable: true,
    sortKey: 'price_sort',
    render: (row) => (
      <span className="font-medium text-green-500">
        {row.price}
      </span>
    )
  },
  { 
    key: 'price_markup_usd',
    header: '$ з нац.',
    render: (row) => (
      <span className="font-medium text-green-800">
        {(row.price * (1 + markup/100)).toFixed(2)}
      </span>
    )
  },
  {
    key: 'price_uah',
    header: '₴',
    sortable: true,
    render: (row) => {
      const uahPrice = row.price * usdRate;
      return (
        <span className="font-medium text-blue-500">
          {uahPrice.toLocaleString('uk-UA', { maximumFractionDigits: 0 })}
        </span>
      );
    }
  },
  {
    key: 'price_markup_uah',
    header: '₴ з нац.',
    sortable: true,
    render: (row) => {
      const uahPriceWithMarkup = row.price * usdRate * (1 + markup/100);
      return (
        <span className="font-medium text-blue-800">
          {uahPriceWithMarkup.toLocaleString('uk-UA', { maximumFractionDigits: 0 })}
        </span>
      );
    }
  },
  { 
    key: 'price_per_w', 
    header: '$/Вт',
    sortable: true,
    sortKey: 'price_per_watt_sort',
    render: (row) => {
      const pricePerW = row.power ? row.price / row.power : 0;
      return (
        <span className="font-medium text-green-500">
          {pricePerW.toFixed(3)}
        </span>
      );
    }
  },
  {
    key: 'price_per_w_markup',
    header: '$/Вт з нац.',
    sortable: true,
    render: (row) => {
      const pricePerWWithMarkup = row.power ? (row.price * (1 + markup/100)) / row.power : 0;
      return (
        <span className="font-medium text-green-800">
          {pricePerWWithMarkup.toFixed(3)}
        </span>
      );
    }
  },
  {
    key: 'price_per_w_uah',
    header: '₴/Вт',
    sortable: true,
    render: (row) => {
      const uahPricePerW = row.power ? (row.price * usdRate) / row.power : 0;
      return (
        <span className="font-medium text-blue-500">
          {uahPricePerW.toLocaleString('uk-UA', { maximumFractionDigits: 3 })}
        </span>
      );
    }
  },
  {
    key: 'price_per_w_markup_uah',
    header: '₴/Вт з нац.',
    sortable: true,
    render: (row) => {
      const uahPricePerWWithMarkup = row.power ? (row.price * usdRate * (1 + markup/100)) / row.power : 0;
      return (
        <span className="font-medium text-blue-800">
          {uahPricePerWWithMarkup.toLocaleString('uk-UA', { maximumFractionDigits: 3 })}
        </span>
      );
    }
  },
  {
    key: 'date',
    header: 'Дата',
    sortable: true,
    render: (r) => new Date(r.date).toLocaleDateString(),
  },
  {
    key: 'contact',
    header: 'Контакт',
    render: (row) => (
      <ContactIconButton 
        contactInfo={row.supplier_contact || null}
        className="ml-2"
      />
    )
  },
];

export default function SolarPanelCurrentPricesPage() {
  const hook = useSolarPanelCurrentPricesCrud();
  const [usdRate, setUsdRate] = useState<number>(40); // Значення за замовчуванням
  const [markup, setMarkup] = useState<number>(15); // Значення націнки за замовчуванням

  // Оновлення курсу долара та націнки при зміні фільтрів
  useEffect(() => {
    if (hook.filters.usd_rate) {
      setUsdRate(hook.filters.usd_rate);
    }
    if (hook.filters.markup !== undefined) {
      setMarkup(hook.filters.markup);
    }
  }, [hook.filters.usd_rate, hook.filters.markup]);

  const resetFilters = () => {
    const resetFilters = {
      page: 1,
      page_size: 10,
      markup: 15,
    };
    hook.setFilters(resetFilters);
    setMarkup(15);
  };

  return (
    <PriceHistoryPage
      title="Актуальні ціни – Сонячні панелі"
      currencySymbol="₴"
      columns={createColumns(hook.filters.usd_rate || usdRate, hook.filters.markup || markup)}
      hook={hook as any}
      chartConfig={{
        getChart: hook.getChart,
        suppliers: (hook as any).supplierOptions ?? [],
      }}
      topSearchComponent={
        <SolarPanelTopSearch
          current={hook.filters}
          setFilters={(filters) => {
            hook.setFilters(filters);
            if (filters.usd_rate) {
              setUsdRate(filters.usd_rate);
            }
            if (filters.markup !== undefined) {
              setMarkup(filters.markup);
            }
          }}
          onReset={resetFilters}
        />
      }
      filterComponent={
        <SolarPanelFilters 
          current={hook.filters} 
          setFilters={(filters) => {
            hook.setFilters(filters);
            if (filters.usd_rate) {
              setUsdRate(filters.usd_rate);
            }
            if (filters.markup !== undefined) {
              setMarkup(filters.markup);
            }
          }} 
          brands={hook.brands} 
          suppliers={hook.suppliers} 
        />
      }
      createFormComponent={<CreateSolarPanelPriceForm currencySymbol="₴" brands={hook.brands} suppliers={hook.suppliers} onSubmit={hook.createPrice} />}
    />
  );
}
