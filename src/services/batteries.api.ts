import api from './api';
import {
  BatteryPriceListRequest,
  BatteryDirectoryParams,
  BatteryPriceSchema,
  PaginatedBatteriesResponse,
  RegionEnum,
  PolarityEnum,
  ElectrolyteEnum,
  BatteryDirectoryItem,
} from '@/types/battery';
import { PriceHistoryRequest, PriceHistoryResponse } from '@/types/priceHistory';
import {
  ChartDataRequest,
  ChartDataResponse,
  CompetitorAnalyticData,
  SupplierAnalyticData,
} from '@/types/analytics';
import { Supplier } from '@/types/supplier';
import { Task, PaginatedTasksResponse } from '@/types/task';
import { Paginated, BrandList } from '@/types/api';
import { UploadResponse } from '@/types/reports';

const API_BASE_URL = '/batteries/backend';
const ANALYTICS_BASE_URL = '/batteries/analytics';

// == DIRECTORY ENDPOINTS ==
export const getBatteriesDirectory = async (
  params: BatteryDirectoryParams,
  signal?: AbortSignal
): Promise<PaginatedBatteriesResponse> => {
  const response = await api.post(`${API_BASE_URL}/batteries/`, params, { signal });
  return response.data;
};

export const getAllBatteries = async (): Promise<PaginatedBatteriesResponse> => {
  const response = await api.post(`${API_BASE_URL}/batteries/`, {});
  return response.data;
};

export const getBatteryBrands = async (): Promise<BrandList> => {
  const response = await api.get<BrandList>(`${API_BASE_URL}/brands`);
  return response.data;
};

// == CRUD ENDPOINTS ==
export interface BatteryCreatePayload {
  full_name: string;
  volume?: number | null;
  c_amps?: number | null;
  region?: RegionEnum | null;
  polarity?: PolarityEnum | null;
  electrolyte?: ElectrolyteEnum | null;
  brand: string;
}

export type BatteryUpdatePayload = Partial<BatteryCreatePayload>;

export const createBattery = async (data: BatteryCreatePayload): Promise<BatteryDirectoryItem> => {
  const res = await api.post(`${API_BASE_URL}/create_battery/`, data);
  return res.data;
};

export const updateBattery = async (
  id: number,
  data: BatteryUpdatePayload
): Promise<BatteryDirectoryItem> => {
  const res = await api.patch(`${API_BASE_URL}/battery/${id}`, data);
  return res.data;
};

export const deleteBattery = async (id: number): Promise<void> => {
  await api.delete(`${API_BASE_URL}/battery/${id}`);
};

export const getLostBatteries = async (
  page: number = 1,
  page_size: number = 10
): Promise<any> => {
  const res = await api.get(`${API_BASE_URL}/lost_batteries/page=${page}&page_size=${page_size}`);
  return res.data;
};

// == PRICE ENDPOINTS ==
export const getBatteryPrices = async (
  params: BatteryPriceListRequest
): Promise<Paginated<BatteryPriceSchema>> => {
  const response = await api.post(`${API_BASE_URL}/batteries_prices_current/`, params);
  return response.data;
};

export const getBatteryPriceHistory = async (
  params: PriceHistoryRequest
): Promise<PriceHistoryResponse> => {
  const response = await api.post(`${API_BASE_URL}/batteries_prices/`, params);
  return response.data;
};

// == ANALYTICS ENDPOINTS ==
export const getBatteryChartData = async (params: ChartDataRequest): Promise<ChartDataResponse> => {
  const response = await api.post(`${ANALYTICS_BASE_URL}/chart`, params);
  return response.data;
};

export const getBatteryCompetitorsAnalytic = async (): Promise<CompetitorAnalyticData[]> => {
  const response = await api.get(`${ANALYTICS_BASE_URL}/competitors-analytic`);
  return response.data;
};

export const getBatterySuppliersAnalytic = async (): Promise<SupplierAnalyticData[]> => {
  const response = await api.get(`${ANALYTICS_BASE_URL}/suppliers-analytic`);
  return response.data;
};

// == SUPPLIER ENDPOINTS ==
const SUPPLIERS_URL = `${API_BASE_URL}/suppliers`;
// New endpoint returning full supplier detail (array)
const SUPPLIERS_DETAIL_URL = `${API_BASE_URL}/suppliers/detail`;

export const getBatterySuppliers = async ({ page = 1, page_size = 100, search = '' }: { page?: number; page_size?: number; search?: string } = {}) => {
  const res = await api.get(SUPPLIERS_DETAIL_URL);
  const list: Supplier[] = (res.data || []).map((item: any) => ({
    id: item.supplier_id ?? item.id,
    name: item.name,
    status_id: item.status_id ?? null,
    description: item.description ?? null,
    cities: item.cities ?? null,
    emails: item.emails ?? null,
    phone_numbers: item.phone_numbers ?? null,
    // convenience single-value fields for old UI
    email: Array.isArray(item.emails) ? item.emails[0] : undefined,
    phone: Array.isArray(item.phone_numbers) ? item.phone_numbers[0] : undefined,
  }));

  const q = (search || '').toLowerCase().trim();
  const filtered = q ? list.filter(s => (s.name || '').toLowerCase().includes(q)) : list;
  const start = (page - 1) * page_size;
  const paginated = filtered.slice(start, start + page_size);
  return {
    count: filtered.length,
    next: null,
    previous: null,
    results: paginated,
  } as const;
};

export const addBatterySupplier = async (supplier: Omit<Supplier, 'id'>): Promise<Supplier> => {
  const response = await api.post(SUPPLIERS_URL, supplier);
  return response.data;
};

export const updateBatterySupplier = async (supplier: Supplier): Promise<Supplier> => {
  // 1. Спочатку оновлюємо основні дані постачальника (name, status_id)
  // У схемі акумуляторів фактично є тільки таблиця деталей, немає окремого ендпоінта для оновлення основних даних
  
  try {
    // Оновлюємо деталі постачальника
    // Конвертуємо масиви в рядки для бекенду
    const supplierDetail = {
      description: supplier.description || null,
      cities: Array.isArray(supplier.cities) ? supplier.cities.join(', ') : (supplier.cities || null),
      emails: Array.isArray(supplier.emails) ? supplier.emails.join(', ') : (supplier.emails || null),
      phone_numbers: Array.isArray(supplier.phone_numbers) ? supplier.phone_numbers.join(', ') : (supplier.phone_numbers || null)
    };

    console.log('Updating battery supplier detail:', supplier.id, 'with data:', supplierDetail);
    
    const response = await api.post(`${API_BASE_URL}/supplier/${supplier.id}/detail`, supplierDetail);
    console.log('Battery supplier detail update response:', response.data);
    
    // Конвертуємо рядки назад у масиви для фронтенду
    const updatedSupplier = {
      ...supplier,
      description: response.data.description || null,
      cities: typeof response.data.cities === 'string' ? 
        response.data.cities.split(',').map((city: string) => city.trim()).filter(Boolean) : 
        response.data.cities || [],
      emails: typeof response.data.emails === 'string' ? 
        response.data.emails.split(',').map((email: string) => email.trim()).filter(Boolean) : 
        response.data.emails || [],
      phone_numbers: typeof response.data.phone_numbers === 'string' ? 
        response.data.phone_numbers.split(',').map((phone: string) => phone.trim()).filter(Boolean) : 
        response.data.phone_numbers || []
    };
    
    console.log('Processed updated supplier:', updatedSupplier);
    return updatedSupplier;
  } catch (error) {
    console.error('Error updating battery supplier:', error);
    throw error;
  }
};

export const deleteBatterySupplier = async (supplierId: number): Promise<void> => {
  // Використовуємо новий ендпоінт для видалення постачальника
  await api.delete(`${API_BASE_URL}/supplier/${supplierId}`);
};

// --- SIMPLE SUPPLIER LIST (array) FOR UPLOAD WIZARD ---
export const listBatterySuppliers = async (): Promise<Supplier[]> => {
  const res = await api.get<Supplier[]>(SUPPLIERS_URL);
  return res.data;
};

// == TASK ENDPOINTS ==
const TASKS_URL = `${API_BASE_URL}/tasks`;

export const getBatteryTasks = async (params: {
  page: number;
  page_size: number;
}): Promise<PaginatedTasksResponse> => {
  const response = await api.get(TASKS_URL, { params });
  return response.data;
};

export const createBatteryTask = async (
  task: Omit<Task, 'id' | 'status' | 'created_at' | 'updated_at'>
): Promise<Task> => {
  const response = await api.post(TASKS_URL, task);
  return response.data;
};

export const runBatteryTask = async (taskId: number): Promise<void> => {
  await api.post(`${TASKS_URL}/${taskId}/run`);
};

export const updateBatteryTask = async (
  task: Omit<Task, 'created_at' | 'updated_at'>
): Promise<Task> => {
  const response = await api.put(`${TASKS_URL}/${task.id}`, task);
  return response.data;
};

export const deleteBatteryTask = async (taskId: number): Promise<void> => {
  await api.delete(`${TASKS_URL}/${taskId}`);
};

// == REPORT UPLOAD ENDPOINTS ==
const UPLOAD_URL = '/batteries/upload';

interface UploadParams {
  supplier_name: string;
  comment?: string;
}

export const uploadBatteryFileReport = async ({
  file,
  supplier_name,
  comment,
}: UploadParams & { file: File }): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('doc_file', file);

  const params: any = { supplier_name };
  if (comment) params.comment = comment;

  const response = await api.post(`${UPLOAD_URL}/upload_reports`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    params,
  });

  return response.data;
};


export const uploadBatterySheetReport = async ({
  docs_link,
  supplier_name,
  comment,
}: UploadParams & { docs_link: string }): Promise<UploadResponse> => {
    const params: any = { docs_link: docs_link, supplier_name: supplier_name };
  params.doc_file = null;
  if (comment) params.comment = comment;
  const response = await api.post(`${UPLOAD_URL}/upload_reports`, null, { params });
  return response.data;
};

export const uploadBatteryTextReport = async ({
  text,
  supplier_name,
  comment,
}: UploadParams & { text: string }): Promise<UploadResponse> => {
  const params: any = { text, supplier_name };
  if (comment) params.comment = comment;
  const response = await api.post(`${UPLOAD_URL}/ai_upload/upload_reports_text`, null, { params });
  return response.data;
};


