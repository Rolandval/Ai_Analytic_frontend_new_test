import { useState } from 'react';
import { Pagination } from '@/components/ui/Pagination';
import { useGetInverterTasks } from '@/hooks/useGetInverterTasks';
import { useAddInverterTask } from '@/hooks/useAddInverterTask';
import { useUpdateInverterTask } from '@/hooks/useUpdateInverterTask';
import { useDeleteInverterTask } from '@/hooks/useDeleteInverterTask';
import { UploadTask, UploadTasksIntervalEnum, TaskTypeEnum } from '@/types/task';
import { useTaskWebSocket } from '@/hooks/useTaskWebSocket';
import LightningButton from '@/components/ui/LightningButton';
import TaskProgressBar from '@/components/ui/TaskProgressBar';
import { activateTask, disableTask, runTaskNow } from '@/services/tasks.api';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogClose,
} from '@/components/ui/Dialog';

const InverterTasksPage = () => {
  const [runningId, setRunningId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
  // WebSocket hook for lightning button functionality
  const {
    isRunning: isWebSocketRunning,
    progress,
    currentTables,
    completedTables,
    totalTables,
    totalUpdatedPrices,
    supplierPrices,
    errors,
    isComplete,
    startTask: startWebSocketTask,
  } = useTaskWebSocket();

  const { data: paginatedData, isLoading } = useGetInverterTasks(currentPage, ITEMS_PER_PAGE);
  const addTask = useAddInverterTask();
  const updateTask = useUpdateInverterTask();
  const deleteTask = useDeleteInverterTask();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Partial<UploadTask> | null>(null);

  const tasks = paginatedData?.results || [];
  const totalPages = Math.ceil((paginatedData?.count || 0) / ITEMS_PER_PAGE);

  const handleSave = () => {
    if (currentTask) {
      const taskToSave = { ...currentTask } as UploadTask;
      if (taskToSave.id) {
        updateTask.mutate({ ...taskToSave, is_active: taskToSave.is_active ?? true });
      } else {
        addTask.mutate(taskToSave as Omit<UploadTask, 'id' | 'is_active' | 'last_run'>);
      }
      setIsDialogOpen(false);
      setCurrentTask(null);
    }
  };

  const openDialog = (task: Partial<UploadTask> | null = null) => {
    setCurrentTask(
      task
        ? { ...task }
        : {
            name: '',
            interval: UploadTasksIntervalEnum.DAILY,
            task_type: TaskTypeEnum.COMPETITORS,
            start_time: '00:00',
            is_active: true,
          },
    );
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Управління завданнями для інверторів</h1>
        <Button onClick={() => openDialog()}>Додати завдання</Button>
      </div>

      {isLoading && currentPage === 1 ? (
        <p>Завантаження...</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Назва</TableHead>
                <TableHead>Інтервал</TableHead>
                <TableHead>Час</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Активна</TableHead>
                <TableHead>Дії</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task: UploadTask) => (
                <TableRow key={task.id}>
                  <TableCell>{task.name}</TableCell>
                  <TableCell>{task.interval}</TableCell>
                  <TableCell>{new Date(task.start_time).toLocaleString('uk-UA')}</TableCell>
                  <TableCell>{task.task_type}</TableCell>
                  <TableCell>{task.is_active ? 'Так' : 'Ні'}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          const fn = task.is_active ? disableTask : activateTask;
                          fn(task.id).finally(() => {
                            queryClient.invalidateQueries({ queryKey: ['inverter-tasks'] });
                          });
                        }}
                      >
                        {task.is_active ? 'Деактивувати' : 'Активувати'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={runningId === task.id}
                        onClick={() => {
                          setRunningId(task.id);
                          runTaskNow(task.id).then(() => {
                            queryClient.invalidateQueries({ queryKey: ['inverter-tasks'] });
                            setRunningId(null);
                          });
                        }}
                      >
                        {runningId === task.id ? <Loader2 className="animate-spin w-4 h-4" /> : 'Запустити'}
                      </Button>
                      {task.task_type === TaskTypeEnum.SUPPLIERS && (
                        <LightningButton
                          task={task}
                          onStart={startWebSocketTask}
                          isRunning={isWebSocketRunning}
                          disabled={runningId === task.id || !task.is_active}
                        />
                      )}
                      <Button variant="outline" size="sm" onClick={() => openDialog(task)}>
                        Редагувати
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => deleteTask.mutate(task.id)}>
                        Видалити
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              className="mt-4"
            />
          )}
        </>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentTask?.id ? 'Редагувати' : 'Додати'} завдання</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Назва"
              value={currentTask?.name || ''}
              onChange={(e) => setCurrentTask({ ...currentTask, name: e.target.value })}
            />
            <Input
              type="time"
              placeholder="Час запуску"
              value={currentTask?.start_time || ''}
              onChange={(e) => setCurrentTask({ ...currentTask, start_time: e.target.value })}
            />
            <Select
              value={currentTask?.interval || UploadTasksIntervalEnum.DAILY}
              onValueChange={(value: string) => setCurrentTask({ ...currentTask, interval: value as UploadTasksIntervalEnum })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Інтервал" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(UploadTasksIntervalEnum).map((val) => (
                  <SelectItem key={val} value={val}>
                    {val}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={currentTask?.task_type || TaskTypeEnum.COMPETITORS}
              onValueChange={(value: string) => setCurrentTask({ ...currentTask, task_type: value as TaskTypeEnum })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Тип" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(TaskTypeEnum).map((val) => (
                  <SelectItem key={val} value={val}>
                    {val}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center">
              <Button
                variant={currentTask?.is_active ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setCurrentTask({ ...currentTask, is_active: !currentTask?.is_active })}
              >
                {currentTask?.is_active ? 'Активна' : 'Неактивна'}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Скасувати</Button>
            </DialogClose>
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleSave}>Зберегти</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Progress Bar for WebSocket Task Execution */}
      <TaskProgressBar
        isVisible={isWebSocketRunning || isComplete}
        progress={progress}
        currentTables={currentTables}
        completedTables={completedTables}
        totalTables={totalTables}
        totalUpdatedPrices={totalUpdatedPrices}
        supplierPrices={supplierPrices}
        errors={errors}
        isComplete={isComplete}
      />
    </div>
  );
};

export default InverterTasksPage;
