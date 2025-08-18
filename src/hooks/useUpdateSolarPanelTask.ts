import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTask } from '@/services/tasks.api';
import { UploadTask } from '@/types/task';

export const useUpdateSolarPanelTask = () => {
  const queryClient = useQueryClient();

  return useMutation<UploadTask, Error, UploadTask>({
    mutationFn: (task) => updateTask(task.id, { name: task.name, interval: task.interval, is_active: task.is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solar-panel-tasks'] });
    },
  });
};
