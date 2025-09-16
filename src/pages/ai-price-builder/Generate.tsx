import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Loader2, Download } from 'lucide-react';
import { listBatteryCurrentPrices } from '@/services/batteryPrices.api';
import { listInverterCurrentPrices } from '@/services/inverterPrices.api';
import { listSolarPanelCurrentPrices } from '@/services/solarPanelPrices.api';

// Тип категорій
type Category = 'batteries' | 'solar_panels' | 'inverters';

interface PreviewRow {
  category: string;
  city: string;
  supplier: string;
  name: string;
  brand: string | null;
  price: number;
  priceWithMarkup: number;
  date: string;
}

export default function PriceBuilderGenerate() {
  const [category, setCategory] = useState<Category>('batteries');
  const [markup, setMarkup] = useState<number>(15);
  const [sheetUrl, setSheetUrl] = useState<string>('');
  const [citiesFilter, setCitiesFilter] = useState<string>(''); // через кому
  const [suppliersFilter, setSuppliersFilter] = useState<string>(''); // через кому
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<PreviewRow[]>([]);

  const parsedCities = useMemo(() => citiesFilter.split(',').map(s => s.trim()).filter(Boolean), [citiesFilter]);
  const parsedSuppliers = useMemo(() => suppliersFilter.split(',').map(s => s.trim()).filter(Boolean), [suppliersFilter]);

  const fetchAllPages = async <T,>(fetchPage: (page: number, page_size: number) => Promise<any>, pickList: (resp: any) => T[], getTotal: (resp: any) => number) => {
    const out: T[] = [];
    let page = 1;
    const page_size = 1000;
    let total = Infinity;
    while (out.length < total) {
      const resp = await fetchPage(page, page_size);
      const list = pickList(resp) || [];
      if (total === Infinity) {
        total = getTotal(resp) || list.length;
      }
      if (!list.length) break;
      out.push(...list);
      if (list.length < page_size) break;
      page += 1;
    }
    return out;
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setRows([]);

      // Побудувати базовий payload фільтрів
      const baseFilters: any = {
        page: 1,
        page_size: 1000,
        supplier_status: ['SUPPLIER'],
        markup,
      };
      if (parsedCities.length) baseFilters.cities = parsedCities;
      if (parsedSuppliers.length) baseFilters.suppliers = parsedSuppliers;

      let items: any[] = [];
      if (category === 'batteries') {
        const list = await fetchAllPages(
          (p, ps) => listBatteryCurrentPrices({ ...baseFilters, page: p, page_size: ps }),
          (resp) => (resp?.battery_prices ?? []),
          (resp) => (resp?.total ?? 0)
        );
        items = list;
      } else if (category === 'inverters') {
        const list = await fetchAllPages(
          (p, ps) => listInverterCurrentPrices({ ...baseFilters, page: p, page_size: ps }),
          (resp) => (resp?.prices ?? []),
          (resp) => (resp?.total ?? 0)
        );
        items = list;
      } else if (category === 'solar_panels') {
        const list = await fetchAllPages(
          (p, ps) => listSolarPanelCurrentPrices({ ...baseFilters, page: p, page_size: ps }),
          (resp) => (resp?.prices ?? []),
          (resp) => (resp?.total ?? 0)
        );
        items = list;
      }

      const mapped: PreviewRow[] = [];
      for (const it of items) {
        const name: string = it.full_name ?? it.name ?? '';
        const brand: string | null = it.brand ?? null;
        const price: number = Number(it.price ?? 0) || 0;
        const date: string = it.date ?? '';
        // різні назви поля з містами
        const cities: string[] = (it.supplier_cities ?? it.suppliers_cities ?? []) || [];
        const supplier: string = it.supplier ?? '';
        const useCities = cities.length ? cities : ['Невідомо'];
        useCities.forEach((city: string) => {
          mapped.push({
            category: category === 'batteries' ? 'Акумулятори' : category === 'solar_panels' ? 'Сонячні панелі' : 'Інвертори',
            city,
            supplier,
            name,
            brand,
            price,
            priceWithMarkup: Math.round(price * (1 + (markup || 0)/100)),
            date,
          });
        });
      }

      // Сортуємо за містом, потім назвою
      mapped.sort((a, b) => a.city.localeCompare(b.city, 'uk') || a.name.localeCompare(b.name, 'uk'));
      setRows(mapped);
    } catch (e) {
      console.error('PriceBuilder: failed to build list', e);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Категорія', 'Місто', 'Постачальник', 'Назва', 'Бренд', 'Ціна', 'Ціна з націнкою', 'Дата', 'GoogleSheet'];
    let csv = headers.join(',') + '\n';
    rows.forEach(r => {
      const row = [
        r.category,
        r.city,
        r.supplier,
        r.name,
        r.brand ?? '',
        String(r.price ?? ''),
        String(r.priceWithMarkup ?? ''),
        r.date ?? '',
        sheetUrl ?? '',
      ].map((v) => '"' + String(v).replace(/"/g, '""') + '"');
      csv += row.join(',') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const today = new Date().toISOString().slice(0,10);
    a.href = url;
    a.download = `price_builder_${category}_${today}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Генератор прайсу</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Параметри</CardTitle>
          <CardDescription>
            Оберіть категорію, націнку та (за потреби) фільтри. На основі розділу «Ціни в наявності» буде сформовано прайс по містах.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Категорія</label>
              <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                <SelectTrigger>
                  <SelectValue placeholder="Оберіть категорію" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="batteries">Акумулятори</SelectItem>
                  <SelectItem value="solar_panels">Сонячні панелі</SelectItem>
                  <SelectItem value="inverters">Інвертори</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Націнка, %</label>
              <Input type="number" value={markup} onChange={(e) => setMarkup(Number(e.target.value) || 0)} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Посилання на Google Таблицю (необов'язково)</label>
              <Input placeholder="https://docs.google.com/spreadsheets/d/..." value={sheetUrl} onChange={(e) => setSheetUrl(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Міста (через кому, необов'язково)</label>
              <Input placeholder="Київ, Львів, Одеса" value={citiesFilter} onChange={(e) => setCitiesFilter(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Постачальники (через кому, необов'язково)</label>
              <Input placeholder="Supplier A, Supplier B" value={suppliersFilter} onChange={(e) => setSuppliersFilter(e.target.value)} />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={handleGenerate} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Згенерувати список
            </Button>
            <Button variant="outline" onClick={exportCSV} disabled={!rows.length}>
              <Download className="mr-2 h-4 w-4" /> Експорт CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Попередній перегляд ({rows.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Категорія</TableHead>
                  <TableHead>Місто</TableHead>
                  <TableHead>Постачальник</TableHead>
                  <TableHead>Назва</TableHead>
                  <TableHead>Бренд</TableHead>
                  <TableHead>Ціна</TableHead>
                  <TableHead>Ціна з націнкою</TableHead>
                  <TableHead>Дата</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{r.category}</TableCell>
                    <TableCell>{r.city}</TableCell>
                    <TableCell>{r.supplier}</TableCell>
                    <TableCell>{r.name}</TableCell>
                    <TableCell>{r.brand ?? '-'}</TableCell>
                    <TableCell>{r.price}</TableCell>
                    <TableCell>{r.priceWithMarkup}</TableCell>
                    <TableCell>{r.date ? new Date(r.date).toLocaleDateString('uk-UA') : '-'}</TableCell>
                  </TableRow>
                ))}
                {!rows.length && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-6">Немає даних — згенеруйте список</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
