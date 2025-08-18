import api from './api';
import { GoogleTable, GoogleTableListResponse } from '@/types/googleTable';

const BASE_URL = '/solar_panels';

export const getSolarGoogleTables = async (): Promise<GoogleTable[]> => {
  const res = await api.get<GoogleTableListResponse>(`${BASE_URL}/upload/get_google_tables`);
  return res.data.google_tables;
};

export const addSolarGoogleTable = async (data: Omit<GoogleTable, 'id' | 'product_type'>): Promise<void> => {
  await api.post(`${BASE_URL}/upload/add_google_table`, data);
};

export const updateSolarGoogleTable = async (
  id: number,
  data: Omit<GoogleTable, 'id' | 'product_type'>
): Promise<void> => {
  await api.patch(`${BASE_URL}/upload/update_google_table`, data, { params: { id } });
};

export const deleteSolarGoogleTable = async (id: number): Promise<void> => {
  await api.delete(`${BASE_URL}/upload/delete_google_table/${id}`);
};
