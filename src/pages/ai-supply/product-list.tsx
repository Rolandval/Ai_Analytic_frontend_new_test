import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import { Plus, Upload, Download, Trash2, Edit } from 'lucide-react';

const ProductListPage: React.FC = () => {
  const [productList, setProductList] = useState<any[]>([]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Ручний список товарів</h1>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Експорт
          </Button>
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Імпорт
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Додавання товарів</CardTitle>
          <CardDescription>
            Додайте товари вручну або імпортуйте з файлу
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Додати товар вручну</h3>
                <div className="space-y-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Додати новий товар
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Додати новий товар</DialogTitle>
                        <DialogDescription>
                          Введіть дані про товар, який потрібно додати до списку
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Код товару</label>
                          <Input placeholder="Введіть код товару" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Назва товару</label>
                          <Input placeholder="Введіть назву товару" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Категорія</label>
                          <Input placeholder="Введіть категорію" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Кількість</label>
                          <Input type="number" placeholder="Введіть необхідну кількість" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Опис (необов'язково)</label>
                          <Textarea placeholder="Введіть опис товару" />
                        </div>
                        <div className="flex justify-end">
                          <Button>Додати товар</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-2">Масове додавання</h3>
                <div className="space-y-2">
                  <Textarea placeholder="Введіть список товарів у форматі: код, назва, категорія, кількість (кожен товар з нового рядка)" rows={4} />
                  <Button>Додати список</Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Список товарів для аналізу</CardTitle>
          <CardDescription>
            Перелік товарів, для яких буде проведений аналіз постачальників
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Input className="max-w-sm" placeholder="Пошук за кодом або назвою" />
              <Button>Аналізувати постачальників</Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Код товару</TableHead>
                  <TableHead>Назва</TableHead>
                  <TableHead>Категорія</TableHead>
                  <TableHead>Кількість</TableHead>
                  <TableHead>Дії</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productList.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.code}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>{product.quantity}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {productList.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                Немає доданих товарів
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductListPage;
