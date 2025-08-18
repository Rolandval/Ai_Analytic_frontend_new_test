import api from './api';

interface CityListResponse {
  cities: string[];
}

/**
 * Отримання списку міст для батарей
 * @returns Масив назв міст
 */
export const getBatteryCities = async (): Promise<string[]> => {
  const response = await api.get<CityListResponse>('/batteries/backend/cities');
  return response.data.cities || [];
};

/**
 * Отримання списку міст для інверторів
 * @returns Масив назв міст
 */
export const getInverterCities = async (): Promise<string[]> => {
  const response = await api.get<CityListResponse>('/inverters/backend/cities');
  return response.data.cities || [];
};

/**
 * Отримання списку міст для сонячних панелей
 * @returns Масив назв міст
 */
export const getSolarPanelCities = async (): Promise<string[]> => {
  const response = await api.get<CityListResponse>('/solar_panels/backend/cities');
  return response.data.cities || [];
};
