import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Search, Filter, Plus } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  code: string;
  price: number;
  recommendedPrice: number;
  quantity: number;
  status: 'Вкл.' | 'Выкл.';
  image?: string;
}

const mockProducts: Product[] = [
  {
    id: 12197,
    name: 'Сетевой инвертор Kstar, модель KSG-1-SM, 1 кВт, 1 MPPT и MPPT от 200 В до 400 В',
    code: '12197',
    price: 0.00,
    recommendedPrice: 0.00,
    quantity: 17,
    status: 'Вкл.'
  },
  {
    id: 12300,
    name: 'Сетевой инвертор Kstar, модель KSG-10-SM+WiFi, 10 кВт, 2 MPPT и MPPT от 400 В до 800 В',
    code: '12300',
    price: 0.00,
    recommendedPrice: 0.00,
    quantity: 14,
    status: 'Вкл.'
  },
  {
    id: 12301,
    name: 'Сетевой инвертор Kstar, модель KSG-12-SM+WiFi, 12 кВт, 2 MPPT и MPPT от 400 В до 800 В',
    code: '12301',
    price: 0.00,
    recommendedPrice: 0.00,
    quantity: 33,
    status: 'Вкл.'
  },
  {
    id: 12302,
    name: 'Сетевой инвертор Kstar, модель KSG-15-SM+WiFi, 15 кВт, 2 MPPT и MPPT от 400 В до 800 В',
    code: '12302',
    price: 0.00,
    recommendedPrice: 0.00,
    quantity: 27,
    status: 'Вкл.'
  },
  {
    id: 12303,
    name: 'Сетевой инвертор Kstar, модель KSG-17-SM+WiFi, 17 кВт, 2 MPPT и MPPT от 400 В до 800 В',
    code: '12303',
    price: 0.00,
    recommendedPrice: 0.00,
    quantity: 25,
    status: 'Вкл.'
  },
  {
    id: 12304,
    name: 'Сетевой инвертор Kstar, модель KSG-20-SM +WiFi, 20 кВт, 2 MPPT и MPPT от 400 В до 800 В',
    code: '12304',
    price: 0.00,
    recommendedPrice: 0.00,
    quantity: 30,
    status: 'Вкл.'
  }
];

export default function AIProductFillerGeneration() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [subcategory, setSubcategory] = useState('Все');
  const [creationDate, setCreationDate] = useState('Все');

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.code.includes(searchQuery);
    return matchesSearch;
  });

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Button variant="default" className="bg-blue-600 text-white hover:bg-blue-700">
              Массовая генерация продуктов ChatGPT
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Button variant="outline" size="sm" className={selectedCategory === 'Все' ? 'bg-blue-100' : ''}>
            Все
          </Button>
          <Button variant="outline" size="sm">
            СонПан
          </Button>
          <Button variant="outline" size="sm">
            Deye
          </Button>
          <Button variant="outline" size="sm">
            Несохраненный поиск
          </Button>
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Поиск по всем товарам"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="w-4 h-4 bg-yellow-400 rounded"></div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Цена (грн)</span>
            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                <SelectItem value="0-1000">0-1000</SelectItem>
                <SelectItem value="1000-5000">1000-5000</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Категория</span>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Все">Все</SelectItem>
                <SelectItem value="Инверторы">Инверторы</SelectItem>
                <SelectItem value="Панели">Панели</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Статус</span>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                <SelectItem value="Вкл.">Включен</SelectItem>
                <SelectItem value="Выкл.">Выключен</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Подкатегории</span>
            <Select value={subcategory} onValueChange={setSubcategory}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Все">Все</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Дата создания</span>
            <Select value={creationDate} onValueChange={setCreationDate}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Все">Все</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Сортировать по</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">По умолчанию</SelectItem>
                <SelectItem value="name">По названию</SelectItem>
                <SelectItem value="price">По цене</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" size="sm" className="border-gray-300">
            <Filter className="w-4 h-4 mr-1" />
            Поиск в
          </Button>

          <Button variant="outline" size="sm" className="border-gray-300">
            Добавить фильтр +
          </Button>

          <Button variant="outline" size="sm" className="border-gray-300">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-12 text-gray-700 font-medium">ID</TableHead>
              <TableHead className="w-16 text-gray-700 font-medium"></TableHead>
              <TableHead className="min-w-[400px] text-gray-700 font-medium">Название / КОД</TableHead>
              <TableHead className="text-center w-32 text-gray-700 font-medium">Цена (грн)</TableHead>
              <TableHead className="text-center w-32 text-gray-700 font-medium">Рекомендуемая цена (грн)</TableHead>
              <TableHead className="text-center w-24 text-gray-700 font-medium">Кол-во</TableHead>
              <TableHead className="text-center w-24 text-gray-700 font-medium">Статус</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => (
              <TableRow key={product.id} className="hover:bg-gray-50 border-b border-gray-100">
                <TableCell className="py-3">
                  <input type="checkbox" className="rounded border-gray-300" />
                </TableCell>
                <TableCell className="py-3">
                  <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                    <div className="w-6 h-6 bg-gray-400 rounded"></div>
                  </div>
                </TableCell>
                <TableCell className="py-3">
                  <div>
                    <div className="font-medium text-sm text-gray-800">{product.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{product.code}</div>
                  </div>
                </TableCell>
                <TableCell className="text-center py-3 text-gray-700">
                  {product.price.toFixed(2)}
                </TableCell>
                <TableCell className="text-center py-3 text-gray-700">
                  {product.recommendedPrice.toFixed(2)}
                </TableCell>
                <TableCell className="text-center py-3 text-gray-700">
                  {product.quantity}
                </TableCell>
                <TableCell className="text-center py-3">
                  <Badge 
                    variant={product.status === 'Вкл.' ? 'default' : 'secondary'}
                    className={product.status === 'Вкл.' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                  >
                    {product.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
