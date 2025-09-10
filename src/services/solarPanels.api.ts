import api from './api';
import {
  PaginatedSolarPanelsResponse,
  SolarPanelListRequest,
  SolarPanel,
  SolarPanelPriceListRequest,
  PaginatedSolarPanelPricesResponse,
} from '@/types/solarPanel';
import { PriceHistoryRequest, PriceHistoryResponse } from '@/types/priceHistory';
import {
  ChartDataRequest,
  ChartDataResponse,
  CompetitorAnalyticData,
  SupplierAnalyticData,
} from '@/types/analytics';
import { Supplier } from '@/types/supplier';
import { Task, PaginatedTasksResponse } from '@/types/task';
import { UploadResponse } from '@/types/reports';

const BASE_URL = '/solar_panels/backend';
const ANALYTICS_BASE_URL = '/solar_panels/analytics';

export const getSolarPanels = async (params: SolarPanelListRequest): Promise<PaginatedSolarPanelsResponse> => {
  const response = await api.post(`${BASE_URL}/solar_panels/`, params);
  return response.data;
};

export const getSolarPanelPriceHistory = async (params: PriceHistoryRequest): Promise<PriceHistoryResponse> => {
  const response = await api.post(`${BASE_URL}/solar_panels_prices/`, params);
  return response.data;
};

export const getAllSolarPanels = async (): Promise<PaginatedSolarPanelsResponse> => {
  const response = await api.post(`${BASE_URL}/solar_panels/`, { page: 1, page_size: 1000 });
  return response.data;
};

export const getSolarPanelBrands = async (): Promise<string[]> => {
  const response = await api.get(`${BASE_URL}/brands`);
  return response.data.brands;
};

export const getSolarPanelPrices = async (
  params: SolarPanelPriceListRequest
): Promise<PaginatedSolarPanelPricesResponse> => {
  const response = await api.post(`${BASE_URL}/solar_panels_prices_current/`, params);
  return response.data;
};

export const getSolarPanelChartData = async (params: ChartDataRequest): Promise<ChartDataResponse> => {
  const response = await api.post(`${ANALYTICS_BASE_URL}/chart`, params);
  return response.data;
};

export const getSolarPanelCompetitorsAnalytic = async (): Promise<CompetitorAnalyticData[]> => {
  const response = await api.get(`${ANALYTICS_BASE_URL}/competitors-analytic`);
  return response.data;
};

export const getSolarPanelSuppliersAnalytic = async (): Promise<SupplierAnalyticData[]> => {
  const response = await api.get(`${ANALYTICS_BASE_URL}/suppliers-analytic`);
  return response.data;
};

// == CRUD ENDPOINTS ==
export interface SolarPanelCreatePayload {
  full_name: string;
  power?: number | null;
  panel_type?: string | null;
  cell_type?: string | null;
  thickness?: number | null;
  panel_color?: string | null;
  frame_color?: string | null;
  brand: string;
}

export type SolarPanelUpdatePayload = Partial<SolarPanelCreatePayload>;

export const createSolarPanel = async (data: SolarPanelCreatePayload): Promise<SolarPanel> => {
  const res = await api.post(`${BASE_URL}/create_solar_panel/`, data);
  return res.data;
};

export const updateSolarPanel = async (
  id: number,
  data: SolarPanelUpdatePayload,
): Promise<SolarPanel> => {
  const res = await api.patch(`${BASE_URL}/solar_panel/${id}`, data);
  return res.data;
};

export const deleteSolarPanel = async (id: number): Promise<void> => {
  await api.delete(`${BASE_URL}/solar_panel/${id}`);
};

export const getLostSolarPanels = async (
  page: number = 1,
  page_size: number = 10,
): Promise<any> => {
  const res = await api.get(`/solar-panels/lost?page=${page}&page_size=${page_size}`);
  return res.data;
};

// == REPORT UPLOAD ENDPOINTS ==
const UPLOAD_URL = '/solar_panels/upload';

interface UploadParams {
  supplier_name: string;
  comment?: string;
}

export const uploadSolarPanelFileReport = async ({
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

export const uploadSolarPanelSheetReport = async ({
  docs_link,
  supplier_name,
  comment,
}: UploadParams & { docs_link: string }): Promise<UploadResponse> => {
    const params: any = { docs_link, supplier_name };
  params.doc_file = null;
  if (comment) params.comment = comment;
  const response = await api.post(`${UPLOAD_URL}/upload_reports`, null, { params });
  return response.data;
};

export const uploadSolarPanelTextReport = async ({
  text,
  supplier_name,
  comment,
}: UploadParams & { text: string }): Promise<UploadResponse> => {
  const params: any = { text, supplier_name };
  if (comment) params.comment = comment;
  const response = await api.post(`${UPLOAD_URL}/ai_upload/upload_reports_text`, null, { params });
  return response.data;
};

const SUPPLIERS_URL = `${BASE_URL}/suppliers`;
// New full-detail endpoint
const SUPPLIERS_DETAIL_URL = `${BASE_URL}/suppliers/detail`;

export const getSolarPanelSuppliers = async ({ page, page_size = 100, search = '' }: { page: number; page_size?: number; search?: string }) => {
  const res = await api.get(SUPPLIERS_DETAIL_URL);
  const list: Supplier[] = (res.data || []).map((item: any) => ({
    id: item.supplier_id ?? item.id,
    name: item.name,
    status_id: item.status_id ?? null,
    description: item.description ?? null,
    cities: item.cities ?? null,
    emails: item.emails ?? null,
    phone_numbers: item.phone_numbers ?? null,
    email: Array.isArray(item.emails) ? item.emails[0] : undefined,
    phone: Array.isArray(item.phone_numbers) ? item.phone_numbers[0] : undefined,
  }));
  const q = (search || '').toLowerCase().trim();
  const filtered = q ? list.filter(s => (s.name || '').toLowerCase().includes(q)) : list;
  const start = (page - 1) * page_size;
  const paginated = filtered.slice(start, start + page_size);
  return { count: filtered.length, next: null, previous: null, results: paginated } as const;
};


export const addSolarPanelSupplier = async (supplier: Omit<Supplier, 'id'>): Promise<Supplier> => {
  const response = await api.post(SUPPLIERS_URL, supplier);
  return response.data;
};

export const updateSolarPanelSupplier = async (supplier: Supplier): Promise<Supplier> => {
  // Конвертуємо масиви в рядки для бекенду
  const supplierDetail = {
    description: supplier.description || null,
    cities: Array.isArray(supplier.cities) ? supplier.cities.join(', ') : (supplier.cities || null),
    emails: Array.isArray(supplier.emails) ? supplier.emails.join(', ') : (supplier.emails || null),
    phone_numbers: Array.isArray(supplier.phone_numbers) ? supplier.phone_numbers.join(', ') : (supplier.phone_numbers || null)
  };

  const response = await api.post(`${BASE_URL}/supplier/${supplier.id}/detail`, supplierDetail);
  return { ...supplier, ...response.data };
};

export const deleteSolarPanelSupplier = async (supplierId: number): Promise<void> => {
  // Використовуємо новий ендпоінт для видалення постачальника
  await api.delete(`${BASE_URL}/supplier/${supplierId}`);
};

// --- SIMPLE SUPPLIER LIST (array) FOR UPLOAD WIZARD ---
export const listSolarPanelSuppliers = async (): Promise<Supplier[]> => {
  const res = await api.get<Supplier[]>(SUPPLIERS_URL);
  return res.data;
};

const TASKS_URL = `${BASE_URL}/tasks`;

export const getSolarPanelTasks = async (params: { page: number; page_size: number }): Promise<PaginatedTasksResponse> => {
  const response = await api.get(TASKS_URL, { params });
  return response.data;
};

export const createSolarPanelTask = async (task: Omit<Task, 'id' | 'status' | 'created_at' | 'updated_at'>): Promise<Task> => {
  const response = await api.post(TASKS_URL, task);
  return response.data;
};

export const runSolarPanelTask = async (taskId: number): Promise<void> => {
  await api.post(`${TASKS_URL}/${taskId}/run`);
};

export const updateSolarPanelTask = async (task: Omit<Task, 'created_at' | 'updated_at'>): Promise<Task> => {
  const response = await api.put(`${TASKS_URL}/${task.id}`, task);
  return response.data;
};

export const deleteSolarPanelTask = async (taskId: number): Promise<void> => {
  await api.delete(`${TASKS_URL}/${taskId}`);
};



