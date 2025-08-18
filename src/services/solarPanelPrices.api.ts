import axios from 'axios';
import {
  SolarPanelPriceListRequestSchema,
  SolarPanelPriceCreateSchemaRequest,
  SolarPanelPriceUpdateSchemaRequest,
} from '@/types/solarPanels';

const BASE = '/solar_panels/backend';

// === HISTORY PRICES ===
export const listSolarPanelPrices = async (payload: SolarPanelPriceListRequestSchema) => {
  const { data } = await axios.post(`${BASE}/solar_panels_prices/`, payload);
  return data;
};

export const createSolarPanelPrice = async (payload: SolarPanelPriceCreateSchemaRequest) => {
  const { data } = await axios.post(`${BASE}/create_solar_panels_prices/`, payload);
  return data;
};

export const updateSolarPanelPrice = async (id: number, payload: SolarPanelPriceUpdateSchemaRequest) => {
  const { data } = await axios.patch(`${BASE}/solar_panels_prices/${id}`, payload);
  return data;
};

export const deleteSolarPanelPrice = async (id: number) => {
  const { data } = await axios.delete(`${BASE}/solar_panels_prices/${id}`);
  return data;
};

export const getSolarPanelBrands = async (): Promise<string[]> => {
  const { data } = await axios.get(`${BASE}/brands`);
  return data.brands ?? [];
};

// === CURRENT PRICES ===
export const listSolarPanelCurrentPrices = async (payload: SolarPanelPriceListRequestSchema) => {
  const { data } = await axios.post(`${BASE}/solar_panels_prices_current/`, payload);
  return data;
};

export const updateSolarPanelCurrentPrice = async (id: number, payload: SolarPanelPriceUpdateSchemaRequest) => {
  const { data } = await axios.patch(`${BASE}/solar_panels_prices_current/${id}`, payload);
  return data;
};

export const deleteSolarPanelCurrentPrice = async (id: number) => {
  const { data } = await axios.delete(`${BASE}/solar_panels_prices_current/${id}`);
  return data;
};

// === HELPERS ===
export interface SupplierDto {
  id: number;
  name: string;
}

export const getSolarPanelSuppliers = async (): Promise<SupplierDto[]> => {
  const { data } = await axios.get(`${BASE}/all_suppliers`);
  const dict: Record<string, string> = data.suppliers ?? {};
  return Object.entries(dict).map(([id, name]) => ({ id: Number(id), name }));
};
