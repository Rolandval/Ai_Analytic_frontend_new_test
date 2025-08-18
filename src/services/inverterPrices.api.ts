import axios from 'axios';
import {
  InverterPriceListRequestSchema,
  InverterPriceCreateSchemaRequest,
  InverterPriceUpdateSchemaRequest,
} from '@/types/inverters';

const BASE = '/inverters/backend';

export const listInverterPrices = async (payload: InverterPriceListRequestSchema) => {
  const { data } = await axios.post(`${BASE}/inverters_prices/list`, payload);
  return data;
};

export const createInverterPrice = async (payload: InverterPriceCreateSchemaRequest) => {
  const { data } = await axios.post(`${BASE}/create_inverters_prices/`, payload);
  return data;
};

export const updateInverterPrice = async (id: number, payload: InverterPriceUpdateSchemaRequest) => {
  const { data } = await axios.patch(`${BASE}/inverters_prices/${id}`, payload);
  return data;
};

export const deleteInverterPrice = async (id: number) => {
  const { data } = await axios.delete(`${BASE}/inverters_prices/${id}`);
  return data;
};

// === CURRENT PRICES ===
export const listInverterCurrentPrices = async (
  params: InverterPriceListRequestSchema
): Promise<any> => {
  const response = await axios.post(`${BASE}/inverters_prices_current/list`, params);
  return response.data;
};

export const updateInverterCurrentPrice = async (id: number, payload: InverterPriceUpdateSchemaRequest) => {
  const response = await axios.patch(`${BASE}/inverters_prices_current/${id}`, payload);
  return response.data;
};

export const deleteInverterCurrentPrice = async (id: number) => {
  await axios.delete(`${BASE}/inverters_prices_current/${id}`);
};

export const getInverterBrands = async (): Promise<string[]> => {
  const { data } = await axios.get(`${BASE}/brands`);
  return data.brands ?? [];
};

export interface SupplierDto {
  id: number;
  name: string;
}

export const getInverterSuppliers = async (): Promise<SupplierDto[]> => {
  const { data } = await axios.get(`${BASE}/all_suppliers`);
  const dict: Record<string, string> = data.suppliers ?? {};
  return Object.entries(dict).map(([id, name]) => ({ id: Number(id), name }));
};
