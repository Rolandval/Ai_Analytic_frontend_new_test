import { useState, useMemo } from 'react';
import { Pagination } from '@/components/ui/Pagination';
import { useGetInverterTasks } from '@/hooks/useGetInverterTasks';
import { useCreateInverterTask } from '@/hooks/useCreateInverterTask';
import { useRunInverterTask } from '@/hooks/useRunInverterTask';
import { Task, TaskStatus } from '@/types/task';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogClose,
} from '@/components/ui/Dialog';
import { Badge } from '@/components/ui/Badge.tsx';

const TaskAutomationPage = () => {
  const { data: tasks, isLoading } = useGetInverterTasks();
  const createTask = useCreateInverterTask();
  const runTask = useRunInverterTask();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({ name: '', description: '' });
    const [filter, setFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [sortConfig, setSortConfig] = useState<{ key: keyof Task; direction: 'ascending' | 'descending' } | null>({ key: 'created_at', direction: 'descending' });

    const processedTasks = useMemo(() => {
    let items = [...(tasks || [])];
    // Sorting logic
    if (sortConfig !== null) {
      items.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    // Filtering logic
    if (filter) {
      items = items.filter(
        (task) =>
          task.name.toLowerCase().includes(filter.toLowerCase()) ||
          task.description.toLowerCase().includes(filter.toLowerCase()),
      );
    }
    return items;
  }, [tasks, sortConfig, filter]);

  const totalPages = Math.ceil(processedTasks.length / ITEMS_PER_PAGE);

  const paginatedTasks = useMemo(() => {
    return processedTasks.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE,
    );
  }, [processedTasks, currentPage]);

  const requestSort = (key: keyof Task) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: keyof Task) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
  };

  const handleCreateTask = () => {
    createTask.mutate(newTask, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setNewTask({ name: '', description: '' });
      },
    });
  };

  const getStatusVariant = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return 'success';
      case TaskStatus.IN_PROGRESS:
        return 'secondary';
      case TaskStatus.FAILED:
        return 'destructive';
      case TaskStatus.PENDING:
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Автоматизація завдань для інверторів</h1>
        <Button onClick={() => setIsDialogOpen(true)}>Створити завдання</Button>
      </div>

      <Input
        placeholder="Фільтрувати за назвою або описом..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="max-w-sm"
      />

      {isLoading ? (
        <p>Завантаження...</p>
      ) : (
        <>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => requestSort('name')} className="cursor-pointer">Назва{getSortIndicator('name')}</TableHead>
              <TableHead>Опис</TableHead>
              <TableHead onClick={() => requestSort('status')} className="cursor-pointer">Статус{getSortIndicator('status')}</TableHead>
              <TableHead onClick={() => requestSort('created_at')} className="cursor-pointer">Створено{getSortIndicator('created_at')}</TableHead>
              <TableHead onClick={() => requestSort('updated_at')} className="cursor-pointer">Оновлено{getSortIndicator('updated_at')}</TableHead>
              <TableHead>Дії</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTasks.map((task: Task) => (
              <TableRow key={task.id}>
                <TableCell>{task.name}</TableCell>
                <TableCell>{task.description}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(task.status)}>{task.status}</Badge>
                </TableCell>
                <TableCell>{new Date(task.created_at).toLocaleString()}</TableCell>
                <TableCell>{new Date(task.updated_at).toLocaleString()}</TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => runTask.mutate(task.id)}
                    disabled={task.status === TaskStatus.IN_PROGRESS}
                  >
                    Запустити
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          className="mt-4"
        />
        </>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Створити нове завдання</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Назва завдання"
              value={newTask.name}
              onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
            />
            <Input
              placeholder="Опис завдання"
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Скасувати</Button>
            </DialogClose>
            <Button onClick={handleCreateTask}>Створити</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskAutomationPage;
