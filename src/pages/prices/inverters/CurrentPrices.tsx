import { PriceHistoryPage } from '@/components/PriceHistoryPage';
import { useInverterCurrentPricesCrud } from '@/hooks/useInverterCurrentPricesCrud';
import { InverterFilters, InverterTopSearch } from '@/components/filters/InverterFilters';
import { CreateInverterPriceForm } from '@/components/forms/CreateInverterPriceForm';
import { TableColumn } from '@/components/PriceHistoryPage';
import { InverterPriceSchema } from '@/types/inverters';
import { useState, useEffect } from 'react';
import { ContactIconButton } from '@/components/ui/ContactIconButton';

const createColumns = (usdRate: number, markup: number = 15): TableColumn<InverterPriceSchema>[] => [
  { key: 'full_name', header: 'Назва', sortable: true },
  { key: 'brand', header: 'Бренд', sortable: true },
  { 
    key: 'power', 
    header: 'кВт', 
    sortable: true,
    render: (row) => (
      <span className="text-sm">
        {row.power != null ? (row.power / 1000).toFixed(1) : '-'}
      </span>
    )
  },
  { key: 'inverter_type', header: 'Тип', sortable: true },
  { key: 'generation', header: 'Покоління', sortable: true },
  { key: 'string_count', header: 'Стрінги', sortable: true },
  { key: 'firmware', header: 'FW', sortable: true },
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
    key: 'date',
    header: 'Дата',
    sortable: true,
    render: (r) => new Date(r.date).toLocaleDateString(),
  },
  // Price per watt column removed as per user request
  {
    key: 'contact',
    header: 'Контакт',
    render: (row) => (
      <ContactIconButton 
        contactInfo={row.supplier_contacts || null}
        className="ml-2"
      />
    )
  },
];

export default function InverterCurrentPricesPage() {
  const hook = useInverterCurrentPricesCrud();
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
      usd_rate: 40,
      markup: 15,
    };
    hook.setFilters(resetFilters);
    setUsdRate(40);
    setMarkup(15);
  };

  return (
    <div className="relative">
      <PriceHistoryPage
        title="Актуальні ціни – Інвертори"
        currencySymbol="₴"
        columns={createColumns(hook.filters.usd_rate || usdRate, hook.filters.markup || markup)}
        hook={hook as any}
        chartConfig={{
          getChart: hook.getChart,
          suppliers: (hook as any).supplierOptions ?? [],
        }}
        topSearchComponent={
          <InverterTopSearch 
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
          <InverterFilters 
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
        createFormComponent={<CreateInverterPriceForm currencySymbol="$" brands={hook.brands} suppliers={hook.suppliers} onSubmit={hook.createPrice} />}
      />
      
      {/* Курс долара і націнка внизу справа */}
      
       
    </div>
  );
}
