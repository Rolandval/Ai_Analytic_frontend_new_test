import api from './api';

export const getBatteryWeatherForecastSales = async (): Promise<string> => {
  const response = await api.get('/batteries/analytics/weather-forecast-sales');
  return response.data;
};

export const getBatteryCompetitorsAnalytic = async (comment?: string): Promise<string> => {
  const response = await api.get('/batteries/analytics/competitors-analytic', {
    params: comment ? { comment } : undefined,
  });
  return response.data;
};

export const getBatterySuppliersAnalytic = async (comment?: string): Promise<string> => {
  const response = await api.get('/batteries/analytics/suppliers-analytic', {
    params: comment ? { comment } : undefined,
  });
  return response.data;
};
