import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/Dialog';
import { Send, Mail, Download, FileText, Eye, Clock, AlertCircle } from 'lucide-react';

const SendOrdersPage: React.FC = () => {
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  
  const toggleOrder = (id: number) => {
    if (selectedOrders.includes(id)) {
      setSelectedOrders(selectedOrders.filter(orderId => orderId !== id));
    } else {
      setSelectedOrders([...selectedOrders, id]);
    }
  };

  const toggleAllOrders = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map(order => order.id));
    }
  };

  // Визначаємо інтерфейс для замовлення
  interface Order {
    id: number;
    number: string;
    supplier: string;
    date: string;
    items: number;
    total: number;
    status: 'ready' | 'sent' | 'confirmed';
    contactMethod: 'email' | 'phone';
  }

  // Ініціалізуємо порожній масив замовлень
  const orders: Order[] = [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Відправка замовлень</h1>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Експорт
          </Button>
          <Button>
            <Send className="h-4 w-4 mr-2" />
            Відправити вибрані
          </Button>
        </div>
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">Готові до відправки</TabsTrigger>
          <TabsTrigger value="sent">Відправлені</TabsTrigger>
          <TabsTrigger value="confirmed">Підтверджені</TabsTrigger>
          <TabsTrigger value="all">Всі замовлення</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Замовлення готові до відправки</span>
                <Badge variant="outline">
                  {orders.filter(order => order.status === 'ready').length} замовлень
                </Badge>
              </CardTitle>
              <CardDescription>
                Список замовлень, які сформовані та готові для відправки постачальникам
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={
                          selectedOrders.length === 
                          orders.filter(order => order.status === 'ready').length && 
                          orders.filter(order => order.status === 'ready').length > 0
                        } 
                        onCheckedChange={toggleAllOrders} 
                      />
                    </TableHead>
                    <TableHead>Номер</TableHead>
                    <TableHead>Постачальник</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead>К-сть товарів</TableHead>
                    <TableHead>Сума</TableHead>
                    <TableHead>Спосіб зв'язку</TableHead>
                    <TableHead className="text-right">Дії</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders
                    .filter(order => order.status === 'ready')
                    .map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedOrders.includes(order.id)} 
                          onCheckedChange={() => toggleOrder(order.id)} 
                        />
                      </TableCell>
                      <TableCell>{order.number}</TableCell>
                      <TableCell>{order.supplier}</TableCell>
                      <TableCell>{order.date}</TableCell>
                      <TableCell>{order.items}</TableCell>
                      <TableCell>{order.total} грн</TableCell>
                      <TableCell>
                        {order.contactMethod === 'email' ? (
                          <Badge variant="outline" className="bg-blue-50">
                            <Mail className="h-3 w-3 mr-1" /> Email
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-50">
                            <Phone className="h-3 w-3 mr-1" /> Телефон
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[625px]">
                              <DialogHeader>
                                <DialogTitle>Перегляд замовлення {order.number}</DialogTitle>
                                <DialogDescription>
                                  Деталі замовлення для {order.supplier}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="py-4">
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                  <div>
                                    <p className="text-sm font-medium mb-1">Постачальник:</p>
                                    <p>{order.supplier}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium mb-1">Дата створення:</p>
                                    <p>{order.date}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium mb-1">Кількість товарів:</p>
                                    <p>{order.items}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium mb-1">Загальна сума:</p>
                                    <p className="font-bold">{order.total} грн</p>
                                  </div>
                                </div>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Код</TableHead>
                                      <TableHead>Товар</TableHead>
                                      <TableHead>Кількість</TableHead>
                                      <TableHead>Ціна</TableHead>
                                      <TableHead>Сума</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    <TableRow>
                                      <TableCell>001234</TableCell>
                                      <TableCell>Приклад товару 1</TableCell>
                                      <TableCell>10</TableCell>
                                      <TableCell>100 грн</TableCell>
                                      <TableCell>1000 грн</TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell>001235</TableCell>
                                      <TableCell>Приклад товару 2</TableCell>
                                      <TableCell>5</TableCell>
                                      <TableCell>250 грн</TableCell>
                                      <TableCell>1250 грн</TableCell>
                                    </TableRow>
                                  </TableBody>
                                </Table>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" className="mr-2">
                                  <FileText className="h-4 w-4 mr-2" />
                                  Експорт
                                </Button>
                                <Button>
                                  <Send className="h-4 w-4 mr-2" />
                                  Відправити замовлення
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Send className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Відправка замовлення {order.number}</DialogTitle>
                                <DialogDescription>
                                  Вкажіть деталі для відправки замовлення постачальнику
                                </DialogDescription>
                              </DialogHeader>
                              <div className="py-4 space-y-4">
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Метод відправки</label>
                                  <Select defaultValue={order.contactMethod}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="email">Електронна пошта</SelectItem>
                                      <SelectItem value="phone">Телефон</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                {order.contactMethod === 'email' && (
                                  <>
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium">Адреса електронної пошти</label>
                                      <Input placeholder="email@example.com" defaultValue="supplier@example.com" />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium">Тема листа</label>
                                      <Input placeholder="Тема листа" defaultValue={`Замовлення ${order.number} від ${order.date}`} />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium">Текст повідомлення</label>
                                      <Textarea 
                                        placeholder="Текст повідомлення" 
                                        rows={5}
                                        defaultValue={`Шановний постачальник,\n\nНадсилаємо замовлення №${order.number} від ${order.date}.\nЗагальна сума замовлення: ${order.total} грн.\n\nЗ повагою,\nВаша компанія`}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="flex items-center space-x-2">
                                        <Checkbox id="attach-file" defaultChecked />
                                        <span className="text-sm font-medium">Додати файл з деталями замовлення</span>
                                      </label>
                                    </div>
                                  </>
                                )}
                              </div>
                              <DialogFooter>
                                <Button variant="outline" className="mr-2">Скасувати</Button>
                                <Button>Відправити</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {orders.filter(order => order.status === 'ready').length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  Немає замовлень готових до відправки
                </div>
              )}
            </CardContent>
            {orders.filter(order => order.status === 'ready').length > 0 && (
              <CardFooter className="flex justify-between border-t px-6 py-4">
                <div className="text-sm text-muted-foreground">
                  Вибрано замовлень: <strong>{selectedOrders.length}</strong> з {orders.filter(order => order.status === 'ready').length}
                </div>
                <Button>
                  <Send className="h-4 w-4 mr-2" />
                  Відправити вибрані
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
        
        <TabsContent value="sent" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Відправлені замовлення</CardTitle>
              <CardDescription>
                Список замовлень, які були відправлені постачальникам
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Номер</TableHead>
                    <TableHead>Постачальник</TableHead>
                    <TableHead>Дата відправки</TableHead>
                    <TableHead>К-сть товарів</TableHead>
                    <TableHead>Сума</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead className="text-right">Дії</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders
                    .filter(order => order.status === 'sent')
                    .map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.number}</TableCell>
                      <TableCell>{order.supplier}</TableCell>
                      <TableCell>{order.date}</TableCell>
                      <TableCell>{order.items}</TableCell>
                      <TableCell>{order.total} грн</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-blue-50 text-blue-600">
                          <Clock className="h-3 w-3 mr-1" /> 
                          Очікує підтвердження
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {orders.filter(order => order.status === 'sent').length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  Немає відправлених замовлень
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="confirmed" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Підтверджені замовлення</CardTitle>
              <CardDescription>
                Список замовлень, які були підтверджені постачальниками
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Номер</TableHead>
                    <TableHead>Постачальник</TableHead>
                    <TableHead>Дата підтвердження</TableHead>
                    <TableHead>К-сть товарів</TableHead>
                    <TableHead>Сума</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead className="text-right">Дії</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders
                    .filter(order => order.status === 'confirmed')
                    .map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.number}</TableCell>
                      <TableCell>{order.supplier}</TableCell>
                      <TableCell>{order.date}</TableCell>
                      <TableCell>{order.items}</TableCell>
                      <TableCell>{order.total} грн</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-green-50 text-green-600">
                          <Check className="h-3 w-3 mr-1" /> 
                          Підтверджено
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {orders.filter(order => order.status === 'confirmed').length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  Немає підтверджених замовлень
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Всі замовлення</CardTitle>
              <CardDescription>
                Повний список всіх замовлень
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Номер</TableHead>
                    <TableHead>Постачальник</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead>К-сть товарів</TableHead>
                    <TableHead>Сума</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead className="text-right">Дії</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.number}</TableCell>
                      <TableCell>{order.supplier}</TableCell>
                      <TableCell>{order.date}</TableCell>
                      <TableCell>{order.items}</TableCell>
                      <TableCell>{order.total} грн</TableCell>
                      <TableCell>
                        {order.status === 'ready' && (
                          <Badge variant="outline">
                            <AlertCircle className="h-3 w-3 mr-1" /> 
                            Готове до відправки
                          </Badge>
                        )}
                        {order.status === 'sent' && (
                          <Badge variant="secondary" className="bg-blue-50 text-blue-600">
                            <Clock className="h-3 w-3 mr-1" /> 
                            Очікує підтвердження
                          </Badge>
                        )}
                        {order.status === 'confirmed' && (
                          <Badge variant="secondary" className="bg-green-50 text-green-600">
                            <Check className="h-3 w-3 mr-1" /> 
                            Підтверджено
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Додаємо компонент, який відсутній у імпортах
const Phone = (props) => {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
};

// Додаємо компонент, який відсутній у імпортах
const Check = (props) => {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
};

export default SendOrdersPage;
