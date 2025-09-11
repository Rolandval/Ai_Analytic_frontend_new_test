import analyticsApi from './analyticsApi';

// ==================== BATTERIES ====================
export interface BatteryChartPayload {
  battery_id: number;
  include_suppliers: number[];
}

export const getBatteryPriceChart = async (payload: BatteryChartPayload): Promise<string> => {
  // Endpoint must match backend batteries analytics route
  const { data } = await analyticsApi.post(`/batteries/analytics/chart`, payload);
  // backend may wrap base64 string in { chart: '...' }
  return typeof data === 'string' ? data : data.chart ?? '';
};

// ==================== INVERTERS ====================
export interface InverterChartPayload {
  inverter_id: number;
  include_suppliers: number[];
}

export const getInverterPriceChart = async (payload: InverterChartPayload): Promise<string> => {
  const { data } = await analyticsApi.post(`/inverters/analytics/chart`, payload);
  return typeof data === 'string' ? data : data.chart ?? '';
};

// ==================== SOLAR PANELS ====================
export interface SolarPanelChartPayload {
  solar_panel_id: number;
  include_suppliers: number[];
}

export const getSolarPanelPriceChart = async (payload: SolarPanelChartPayload): Promise<string> => {
  const { data } = await analyticsApi.post(`/solar_panels/analytics/chart`, payload);
  return typeof data === 'string' ? data : data.chart ?? '';
};
