import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/hooks/use-toast';
import { getSqlQueries, createSqlQuery, updateSqlQuery, deleteSqlQuery } from '@/api/analytics';
import { SQLQuery, ProductType, SQLQueryCreateRequest } from '@/types/forecasting';
import { Pencil, Trash2, PlusCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';

const SQLQueriesPage: React.FC = () => {
  const { toast } = useToast();
  const [queries, setQueries] = useState<SQLQuery[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [currentQuery, setCurrentQuery] = useState<SQLQuery | null>(null);
  const [formData, setFormData] = useState<SQLQueryCreateRequest>({
    name: '',
    query: '',
    product_type: 'batteries'
  });
  const [filter, setFilter] = useState<ProductType | 'all'>('all');

  // Завантаження списку запитів
  const loadQueries = async (productType?: ProductType | 'all') => {
    try {
      setLoading(true);
      const data = await getSqlQueries(productType !== 'all' ? productType as ProductType : undefined);
      setQueries(data);
    } catch (error) {
      console.error('Помилка при завантаженні запитів:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося завантажити список SQL запитів',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueries(filter !== 'all' ? filter : undefined);
  }, [filter]);

  // Обробник зміни фільтру
  const handleFilterChange = (value: string) => {
    setFilter(value as ProductType | 'all');
  };

  // Обробники форми
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, product_type: value as ProductType }));
  };

  // Функції для модальних вікон
  const openCreateModal = () => {
    setFormData({
      name: '',
      query: '',
      product_type: 'batteries'
    });
    setIsCreateModalOpen(true);
  };

  const openEditModal = (query: SQLQuery) => {
    setCurrentQuery(query);
    setFormData({
      name: query.name,
      query: query.query,
      product_type: query.product_type
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (query: SQLQuery) => {
    setCurrentQuery(query);
    setIsDeleteModalOpen(true);
  };

  // Операції CRUD
  const handleCreate = async () => {
    try {
      await createSqlQuery(formData);
      setIsCreateModalOpen(false);
      toast({
        title: 'Успішно',
        description: 'SQL запит створено',
      });
      loadQueries(filter !== 'all' ? filter : undefined);
    } catch (error) {
      console.error('Помилка при створенні запиту:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося створити SQL запит',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async () => {
    if (!currentQuery) return;

    try {
      await updateSqlQuery(currentQuery.id, formData);
      setIsEditModalOpen(false);
      toast({
        title: 'Успішно',
        description: 'SQL запит оновлено',
      });
      loadQueries(filter !== 'all' ? filter : undefined);
    } catch (error) {
      console.error('Помилка при оновленні запиту:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося оновити SQL запит',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!currentQuery) return;

    try {
      await deleteSqlQuery(currentQuery.id);
      setIsDeleteModalOpen(false);
      toast({
        title: 'Успішно',
        description: 'SQL запит видалено',
      });
      loadQueries(filter !== 'all' ? filter : undefined);
    } catch (error) {
      console.error('Помилка при видаленні запиту:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося видалити SQL запит',
        variant: 'destructive',
      });
    }
  };

  const productTypeLabels: Record<ProductType, string> = {
    batteries: 'Акумулятори',
    solar_panels: 'Сонячні панелі',
    inverters: 'Інвертори'
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">SQL запити для аналітики</h1>
        <Button onClick={openCreateModal}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Додати запит
        </Button>
      </div>

      <Card className="mb-6 p-4">
        <div className="flex items-center">
          <span className="mr-2">Фільтр за типом продукту:</span>
          <Select value={filter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Вибрати тип" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всі</SelectItem>
              <SelectItem value="batteries">Акумулятори</SelectItem>
              <SelectItem value="solar_panels">Сонячні панелі</SelectItem>
              <SelectItem value="inverters">Інвертори</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {loading ? (
        <div className="text-center">Завантаження...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Назва</TableHead>
              <TableHead>Тип продукту</TableHead>
              <TableHead>SQL запит</TableHead>
              <TableHead>Дії</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {queries.length > 0 ? (
              queries.map((query) => (
                <TableRow key={query.id}>
                  <TableCell>{query.id}</TableCell>
                  <TableCell>{query.name}</TableCell>
                  <TableCell>{productTypeLabels[query.product_type]}</TableCell>
                  <TableCell>
                    <div className="max-h-[100px] overflow-auto">
                      <code className="text-xs whitespace-pre-wrap">{query.query}</code>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="icon" onClick={() => openEditModal(query)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => openDeleteModal(query)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Немає SQL запитів
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      {/* Модальне вікно для створення */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Створення SQL запиту</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right">Назва:</label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right">Тип продукту:</label>
              <Select value={formData.product_type} onValueChange={handleSelectChange}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Вибрати тип" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="batteries">Акумулятори</SelectItem>
                  <SelectItem value="solar_panels">Сонячні панелі</SelectItem>
                  <SelectItem value="inverters">Інвертори</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <label className="text-right">SQL запит:</label>
              <Textarea
                name="query"
                value={formData.query}
                onChange={handleInputChange}
                className="col-span-3 min-h-[200px] font-mono"
                placeholder="SELECT * FROM ..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Скасувати
            </Button>
            <Button type="button" onClick={handleCreate}>
              Створити
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Модальне вікно для редагування */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Редагування SQL запиту</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right">Назва:</label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right">Тип продукту:</label>
              <Select value={formData.product_type} onValueChange={handleSelectChange}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Вибрати тип" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="batteries">Акумулятори</SelectItem>
                  <SelectItem value="solar_panels">Сонячні панелі</SelectItem>
                  <SelectItem value="inverters">Інвертори</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <label className="text-right">SQL запит:</label>
              <Textarea
                name="query"
                value={formData.query}
                onChange={handleInputChange}
                className="col-span-3 min-h-[200px] font-mono"
                placeholder="SELECT * FROM ..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Скасувати
            </Button>
            <Button type="button" onClick={handleUpdate}>
              Оновити
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Модальне вікно для видалення */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Видалення SQL запиту</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Ви дійсно хочете видалити SQL запит "{currentQuery?.name}"?</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Скасувати
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete}>
              Видалити
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SQLQueriesPage;
