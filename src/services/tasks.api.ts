import api from './api';
import {
  UploadTask,
  PaginatedUploadTasksResponse,
  ProductTypeEnum,
  TaskTypeEnum,
  UploadTasksIntervalEnum,
} from '@/types/task';

// Base URL for unified tasks backend
const TASKS_BASE_URL = '/tasks';

// Helper to build query params with product_type
const withProduct = (product_type: ProductTypeEnum) => ({ product_type });

export const getTasks = async (
  product_type: ProductTypeEnum,
  params?: { page?: number; page_size?: number },
): Promise<PaginatedUploadTasksResponse> => {
  const res = await api.get(`${TASKS_BASE_URL}/get_tasks`, {
    params: { ...withProduct(product_type) },
  });
  const payload = res.data;
  const list: UploadTask[] = Array.isArray(payload) ? payload : payload?.tasks ?? [];
  const page = params?.page ?? 1;
  const page_size = params?.page_size ?? list.length;
  const start = (page - 1) * page_size;
  const results = list.slice(start, start + page_size);
  return { count: list.length, next: null, previous: null, results } as PaginatedUploadTasksResponse;
};

export const createTask = async (
  product_type: ProductTypeEnum,
  data: { name: string; interval: UploadTasksIntervalEnum; task_type: TaskTypeEnum },
): Promise<{ task_id: number; detail: string }> => {
  const payload = { ...data, product_type };
  const res = await api.post(`${TASKS_BASE_URL}/add_task`, payload);
  return res.data;
};

export const updateTask = async (
  id: number,
  data: { name: string; interval: UploadTasksIntervalEnum; is_active: boolean },
): Promise<UploadTask> => {
  const res = await api.patch(`${TASKS_BASE_URL}/update_task`, data, { params: { id } });
  return res.data;
};

export const deleteTask = async (id: number): Promise<void> => {
  await api.delete(`${TASKS_BASE_URL}/delete_task/${id}`);
};

export const activateTask = async (id: number): Promise<void> => {
  await api.post(`${TASKS_BASE_URL}/activate_task/${id}`);
};

export const disableTask = async (id: number): Promise<void> => {
  await api.post(`${TASKS_BASE_URL}/disable_task/${id}`);
};

export const runTaskNow = async (
  id: number,
): Promise<{ updated_prices?: number; detail?: string }> => {
  const res = await api.post(`${TASKS_BASE_URL}/run_task/${id}`);
  return res.data;
};
