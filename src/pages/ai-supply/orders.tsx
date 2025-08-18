import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/Checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import { ShoppingCart, Filter, ArrowUpDown, Save, Check } from 'lucide-react';

const OrdersPage: React.FC = () => {
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  
  const toggleRow = (id: number) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter(rowId => rowId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  const toggleAllRows = () => {
    if (selectedRows.length === orderItems.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(orderItems.map(item => item.id));
    }
  };

  // Визначаємо інтерфейс для товару замовлення
  interface OrderItem {
    id: number;
    code: string;
    name: string;
    supplier: string;
    price: number;
    quantity: number;
    total: number;
    status: string;
  }

  // Ініціалізуємо порожній масив товарів
  const orderItems: OrderItem[] = [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Формування замовлень</h1>
        <div className="flex space-x-2">
          <Button variant="outline">Імпорт списку</Button>
          <Button variant="outline">Експорт замовлень</Button>
          <Button>Створити замовлення</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Фільтри та сортування</CardTitle>
          <CardDescription>
            Налаштуйте відображення товарів для замовлення
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue placeholder="Постачальник" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі постачальники</SelectItem>
                  <SelectItem value="supplierA">Постачальник A</SelectItem>
                  <SelectItem value="supplierB">Постачальник B</SelectItem>
                  <SelectItem value="supplierC">Постачальник C</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select defaultValue="price">
                <SelectTrigger>
                  <SelectValue placeholder="Сортування" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price">За ціною</SelectItem>
                  <SelectItem value="quantity">За кількістю</SelectItem>
                  <SelectItem value="name">За назвою</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Input placeholder="Пошук за назвою або кодом" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Товари для замовлення</span>
            <Badge variant="outline">Всього: {orderItems.length} товарів</Badge>
          </CardTitle>
          <CardDescription>
            Виберіть товари для формування замовлення
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-4">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Фільтр
            </Button>
            <Button variant="outline" size="sm">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Сортування
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox 
                    checked={selectedRows.length === orderItems.length && orderItems.length > 0} 
                    onCheckedChange={toggleAllRows} 
                  />
                </TableHead>
                <TableHead>Код</TableHead>
                <TableHead>Товар</TableHead>
                <TableHead>Постачальник</TableHead>
                <TableHead>Ціна</TableHead>
                <TableHead>Кількість</TableHead>
                <TableHead>Сума</TableHead>
                <TableHead>Статус</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedRows.includes(item.id)} 
                      onCheckedChange={() => toggleRow(item.id)} 
                    />
                  </TableCell>
                  <TableCell>{item.code}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.supplier}</TableCell>
                  <TableCell>{item.price} грн</TableCell>
                  <TableCell>
                    <Input 
                      type="number" 
                      value={item.quantity} 
                      className="w-20 h-8" 
                      min={1}
                      onChange={() => {}} 
                    />
                  </TableCell>
                  <TableCell>{item.total} грн</TableCell>
                  <TableCell>
                    <Badge variant={item.status === 'pending' ? 'outline' : 'default'}>
                      {item.status === 'pending' ? 'Очікує' : 'Замовлено'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex justify-between border-t px-6 py-4">
          <div className="text-sm text-muted-foreground">
            Вибрано товарів: <strong>{selectedRows.length}</strong> з {orderItems.length}
          </div>
          <div className="font-semibold">
            Загальна сума: 0 грн
          </div>
        </CardFooter>
      </Card>

      <Dialog>
        <DialogTrigger asChild>
          <Button className="w-full">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Сформувати замовлення
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Формування замовлення</DialogTitle>
            <DialogDescription>
              Перевірте деталі та підтвердіть створення замовлення
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Назва замовлення</label>
              <Input placeholder="Введіть назву замовлення" defaultValue={`Замовлення від ${new Date().toLocaleDateString()}`} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Постачальник</label>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue placeholder="Виберіть постачальника" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі постачальники</SelectItem>
                  <SelectItem value="supplierA">Постачальник A</SelectItem>
                  <SelectItem value="supplierB">Постачальник B</SelectItem>
                  <SelectItem value="supplierC">Постачальник C</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                * Якщо вибрано "Всі постачальники", будуть створені окремі замовлення для кожного постачальника
              </p>
            </div>
            <div className="space-y-1 pt-2">
              <div className="flex justify-between text-sm">
                <span>Кількість товарів:</span>
                <span>{selectedRows.length > 0 ? selectedRows.length : orderItems.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Загальна сума:</span>
                <span className="font-medium">0 грн</span>
              </div>
            </div>
            <div className="pt-4 flex justify-end space-x-2">
              <Button variant="outline">
                <Save className="mr-2 h-4 w-4" />
                Зберегти як шаблон
              </Button>
              <Button>
                <Check className="mr-2 h-4 w-4" />
                Створити замовлення
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersPage;
