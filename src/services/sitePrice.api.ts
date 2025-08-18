import axios from 'axios';

// Базові URL для кожного сервісу
const SOLAR_PANELS_BASE = '/solar_panels';
const INVERTERS_BASE = '/inverters';
const BATTERIES_BASE = '/batteries';

// Тип для запиту оновлення ціни
export interface UpdateSitePriceRequest {
  site_id: number;
  price?: number;
  promo_price?: number;
  availability?: string;
}

// Функція для оновлення ціни на сайті для сонячних панелей
export const updateSolarPanelSitePrice = async (params: UpdateSitePriceRequest): Promise<string> => {
  const { data } = await axios.post(`${SOLAR_PANELS_BASE}/upload/update_site_price`, params);
  return data;
};

// Функція для оновлення ціни на сайті для інверторів
export const updateInverterSitePrice = async (params: UpdateSitePriceRequest): Promise<string> => {
  const { data } = await axios.post(`${INVERTERS_BASE}/upload/update_site_price`, params);
  return data;
};

// Функція для оновлення ціни на сайті для акумуляторів
export const updateBatterySitePrice = async (params: UpdateSitePriceRequest): Promise<string> => {
  const { data } = await axios.post(`${BATTERIES_BASE}/upload/update_site_price`, params);
  return data;
};
