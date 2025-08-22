import api from './api';
import {
  SolarPanelPriceListRequestSchema,
  SolarPanelPriceCreateSchemaRequest,
  SolarPanelPriceUpdateSchemaRequest,
} from '@/types/solarPanels';

const BASE = '/solar_panels/backend';

// === HISTORY PRICES ===
export const listSolarPanelPrices = async (payload: SolarPanelPriceListRequestSchema) => {
  const { data } = await api.post(`${BASE}/solar_panels_prices/`, payload);
  return data;
};

export const createSolarPanelPrice = async (payload: SolarPanelPriceCreateSchemaRequest) => {
  const { data } = await api.post(`${BASE}/create_solar_panels_prices/`, payload);
  return data;
};

export const updateSolarPanelPrice = async (id: number, payload: SolarPanelPriceUpdateSchemaRequest) => {
  const { data } = await api.patch(`${BASE}/solar_panels_prices/${id}`, payload);
  return data;
};

export const deleteSolarPanelPrice = async (id: number) => {
  const { data } = await api.delete(`${BASE}/solar_panels_prices/${id}`);
  return data;
};

export const getSolarPanelBrands = async (): Promise<string[]> => {
  const { data } = await api.get(`${BASE}/brands`);
  return data.brands ?? [];
};

// === CURRENT PRICES ===
export const listSolarPanelCurrentPrices = async (payload: SolarPanelPriceListRequestSchema) => {
  const { data } = await api.post(`${BASE}/solar_panels_prices_current/`, payload);
  return data;
};

export const updateSolarPanelCurrentPrice = async (id: number, payload: SolarPanelPriceUpdateSchemaRequest) => {
  const { data } = await api.patch(`${BASE}/solar_panels_prices_current/${id}`, payload);
  return data;
};

export const deleteSolarPanelCurrentPrice = async (id: number) => {
  const { data } = await api.delete(`${BASE}/solar_panels_prices_current/${id}`);
  return data;
};

// === HELPERS ===
export interface SupplierDto {
  id: number;
  name: string;
}

export const getSolarPanelSuppliers = async (): Promise<SupplierDto[]> => {
  const { data } = await api.get(`${BASE}/all_suppliers`);
  const dict: Record<string, string> = data.suppliers ?? {};
  return Object.entries(dict).map(([id, name]) => ({ id: Number(id), name }));
};
