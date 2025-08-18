import axios from 'axios';
import { BatteryPriceListRequestSchema, BatteryPriceCreateSchemaRequest, BatteryPriceUpdateSchemaRequest } from '@/types/batteries';

// Base URL prefix for batteries service – adjust if gateway/proxy is different
const BASE = '/batteries/backend';

// === HISTORY PRICES ===
export const listBatteryPrices = async (payload: BatteryPriceListRequestSchema) => {
  const { data } = await axios.post(`${BASE}/batteries_prices/`, payload);
  return data;
};

export const createBatteryPrice = async (payload: BatteryPriceCreateSchemaRequest) => {
  const { data } = await axios.post(`${BASE}/create_batteries_prices/`, payload);
  return data;
};

export const updateBatteryPrice = async (id: number, payload: BatteryPriceUpdateSchemaRequest) => {
  const { data } = await axios.patch(`${BASE}/batteries_prices/${id}`, payload);
  return data;
};

export const deleteBatteryPrice = async (id: number) => {
  const { data } = await axios.delete(`${BASE}/batteries_prices/${id}`);
  return data;
};

export const getBatteryBrands = async (): Promise<string[]> => {
  const { data } = await axios.get(`${BASE}/brands`);
  return data.brands ?? [];
};

// === CURRENT PRICES ===
export const listBatteryCurrentPrices = async (payload: BatteryPriceListRequestSchema) => {
  const { data } = await axios.post(`${BASE}/batteries_prices_current/`, payload);
  return data;
};

export const updateBatteryCurrentPrice = async (id: number, payload: BatteryPriceUpdateSchemaRequest) => {
  const { data } = await axios.patch(`${BASE}/batteries_prices_current/${id}`, payload);
  return data;
};

export const deleteBatteryCurrentPrice = async (id: number) => {
  const { data } = await axios.delete(`${BASE}/batteries_prices_current/${id}`);
  return data;
};

// === HELPERS ===
export interface SupplierDto {
  id: number;
  name: string;
}

// === HELPERS ===
export const getBatterySuppliers = async (): Promise<SupplierDto[]> => {
  const { data } = await axios.get(`${BASE}/all_suppliers`);
  // backend now returns { id: name }
  const dict: Record<string, string> = data.suppliers ?? {};
  return Object.entries(dict).map(([id, name]) => ({ id: Number(id), name }));
};
