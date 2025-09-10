import { useState } from 'react';
import { Pagination } from '@/components/ui/Pagination';
import { useGetBatterySuppliers } from '@/hooks/useGetBatterySuppliers';
import { useAddBatterySupplier } from '@/hooks/useAddBatterySupplier';
import { useUpdateBatterySupplier } from '@/hooks/useUpdateBatterySupplier';
import { useDeleteBatterySupplier } from '@/hooks/useDeleteBatterySupplier';
import { Supplier } from '@/types/supplier';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogClose,
} from '@/components/ui/Dialog';

const BatterySuppliersPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(100);
  const [search, setSearch] = useState('');

  const { data: paginatedData, isLoading } = useGetBatterySuppliers(currentPage, pageSize, search);
  const addSupplier = useAddBatterySupplier();
  const updateSupplier = useUpdateBatterySupplier();
  const deleteSupplier = useDeleteBatterySupplier();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState<Partial<Supplier> | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  const suppliers = paginatedData?.results || [];
  const totalPages = Math.ceil((paginatedData?.count || 0) / pageSize);

  // NOTE: Sorting and filtering are disabled.
  // To re-enable them, the backend API needs to support sorting and filtering parameters.

  const handleSave = () => {
    if (currentSupplier) {
      if ('id' in currentSupplier) {
        updateSupplier.mutate(currentSupplier as Supplier);
      } else {
        addSupplier.mutate(currentSupplier as Omit<Supplier, 'id'>);
      }
      setIsDialogOpen(false);
      setCurrentSupplier(null);
    }
  };

  const openDialog = (supplier: Partial<Supplier> | null = null) => {
    if (supplier) {
      // Handle both array and string formats for compatibility
      const formattedSupplier = {
        ...supplier,
        cities: Array.isArray(supplier.cities) 
          ? supplier.cities 
          : typeof supplier.cities === 'string' 
            ? supplier.cities.split(',').map((item: string) => item.trim()).filter(Boolean) 
            : [],
        emails: Array.isArray(supplier.emails) 
          ? supplier.emails 
          : typeof supplier.emails === 'string' 
            ? supplier.emails.split(',').map((item: string) => item.trim()).filter(Boolean) 
            : [],
        phone_numbers: Array.isArray(supplier.phone_numbers) 
          ? supplier.phone_numbers 
          : typeof supplier.phone_numbers === 'string' 
            ? supplier.phone_numbers.split(',').map((item: string) => item.trim()).filter(Boolean) 
            : []
      };
      setCurrentSupplier(formattedSupplier);
    } else {
      setCurrentSupplier({ 
        name: '', 
        description: '',
        cities: [],
        emails: [],
        phone_numbers: []
      });
    }
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-3xl font-bold">Управління постачальниками акумуляторів</h1>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Пошук за назвою…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-[260px]"
            />
            <Button
              variant="default"
              className="bg-gray-900 text-white hover:bg-gray-800 border-transparent shadow-sm"
              onClick={() => openDialog()}
            >
              Додати постачальника
            </Button>
          </div>
        </div>
        
      </div>

      {/* NOTE: Filtering is disabled until supported by the backend API. */}

      {isLoading && currentPage === 1 ? (
        <p>Завантаження...</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Назва</TableHead>
                <TableHead>Опис</TableHead>
                <TableHead>Міста</TableHead>
                <TableHead>Контактна інформація</TableHead>
                <TableHead>Телефони</TableHead>
                <TableHead>Дії</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell>{supplier.name}</TableCell>
                  <TableCell>{supplier.description ?? '-'}</TableCell>
                  <TableCell>{Array.isArray(supplier.cities) ? supplier.cities.join(', ') : supplier.cities}</TableCell>
                  <TableCell>{Array.isArray(supplier.emails) ? supplier.emails.join(', ') : supplier.emails}</TableCell>
                  <TableCell>{Array.isArray(supplier.phone_numbers) ? supplier.phone_numbers.join(', ') : supplier.phone_numbers}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openDialog(supplier)}>
                        Редагувати
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => {
                          setSupplierToDelete(supplier);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        Видалити
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="text-sm text-muted-foreground">
                Показано {suppliers.length > 0 ? (pageSize * (currentPage - 1) + 1) : 0} - {Math.min(pageSize * currentPage, paginatedData?.count || 0)} з {paginatedData?.count || 0}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">Показати:</span>
                <select
                  className="h-8 border rounded-md px-2 text-sm"
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                >
                  <option value={10}>10</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
            <div className="w-full sm:w-auto">
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
            </div>
          </div>
        </>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentSupplier?.id ? 'Редагувати' : 'Додати'} постачальника</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Назва</Label>
              <Input
                id="name"
                placeholder="Назва постачальника"
                value={currentSupplier?.name || ''}
                onChange={(e) => setCurrentSupplier({ ...currentSupplier, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Опис</Label>
              <Input
                id="description"
                placeholder="Опис постачальника"
                value={currentSupplier?.description || ''}
                onChange={(e) => setCurrentSupplier({ ...currentSupplier, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cities">Міста (через кому)</Label>
              <Input
                id="cities"
                placeholder="Київ, Львів, Одеса"
                value={Array.isArray(currentSupplier?.cities) ? currentSupplier?.cities.join(', ') : ''}
                onChange={(e) => setCurrentSupplier({ 
                  ...currentSupplier, 
                  cities: e.target.value.split(',').map(city => city.trim()).filter(city => city)
                })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="emails">Контактна інформація </Label>
              <Input
                id="emails"
                placeholder="email1@example.com, email2@example.com"
                value={Array.isArray(currentSupplier?.emails) ? currentSupplier?.emails.join(', ') : ''}
                onChange={(e) => setCurrentSupplier({ 
                  ...currentSupplier, 
                  emails: e.target.value.split(',').map(email => email.trim()).filter(email => email) 
                })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone_numbers">Телефони (через кому)</Label>
              <Input
                id="phone_numbers"
                placeholder="+380123456789, +380987654321"
                value={Array.isArray(currentSupplier?.phone_numbers) ? currentSupplier?.phone_numbers.join(', ') : ''}
                onChange={(e) => setCurrentSupplier({ 
                  ...currentSupplier, 
                  phone_numbers: e.target.value.split(',').map(phone => phone.trim()).filter(phone => phone) 
                })}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={addSupplier.isPending || updateSupplier.isPending}>Скасувати</Button>
            </DialogClose>
            <Button onClick={handleSave} disabled={addSupplier.isPending || updateSupplier.isPending}>{addSupplier.isPending || updateSupplier.isPending ? 'Збереження...' : 'Зберегти'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Підтвердження видалення</DialogTitle>
          </DialogHeader>
          
          <div className="py-3">
            <div className="text-red-500 font-semibold">
              Увага! Це видалить всі ціни цього постачальника!
            </div>
            <div className="mt-2">
              Ви впевнені, що хочете видалити постачальника "{supplierToDelete?.name}"?
            </div>
            <div className="mt-1">
              Ця дія не може бути скасована.
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button 
                variant="outline" 
                disabled={deleteSupplier.isPending}
              >
                Скасувати
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              disabled={deleteSupplier.isPending}
              onClick={() => {
                if (supplierToDelete) {
                  deleteSupplier.mutate(supplierToDelete.id);
                }
                setIsDeleteDialogOpen(false);
                setSupplierToDelete(null);
              }}
            >
              {deleteSupplier.isPending ? 'Видалення...' : 'Видалити'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BatterySuppliersPage;

