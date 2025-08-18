import api from './api';
import { GoogleTable, GoogleTableListResponse } from '@/types/googleTable';

const BASE_URL = '/batteries';

export const getBatteryGoogleTables = async (): Promise<GoogleTable[]> => {
  const res = await api.get<GoogleTableListResponse>(`${BASE_URL}/upload/get_google_tables`);
  return res.data.google_tables;
};

export const addBatteryGoogleTable = async (data: Omit<GoogleTable, 'id' | 'product_type'>): Promise<void> => {
  await api.post(`${BASE_URL}/upload/add_google_table`, data);
};

export const updateBatteryGoogleTable = async (
  id: number,
  data: Omit<GoogleTable, 'id' | 'product_type'>
): Promise<void> => {
  await api.patch(`${BASE_URL}/upload/update_google_table`, data, { params: { id } });
};

export const deleteBatteryGoogleTable = async (id: number): Promise<void> => {
  await api.delete(`${BASE_URL}/upload/delete_google_table/${id}`);
};

// Новий ендпоінт для ручного імпорту
export const runBatteryGoogleTableImport = async (id: number): Promise<any> => {
  const res = await api.get(`${BASE_URL}/upload/google_table_run/${id}`);
  return res.data;
};
