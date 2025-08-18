import axios from 'axios';

// Базові URL для кожного сервісу
const BATTERIES_BASE = '/batteries';
const INVERTERS_BASE = '/inverters';
const SOLAR_PANELS_BASE = '/solar_panels';

// Функція для оновлення даних про батареї
export const refreshBatteriesData = async () => {
  const { data } = await axios.post(`${BATTERIES_BASE}/upload/parse_me`);
  return data;
};

// Функція для оновлення даних про інвертори
export const refreshInvertersData = async () => {
  const { data } = await axios.post(`${INVERTERS_BASE}/upload/parse_me`);
  return data;
};

// Функція для оновлення даних про сонячні панелі
export const refreshSolarPanelsData = async () => {
  const { data } = await axios.post(`${SOLAR_PANELS_BASE}/upload/parse_me`);
  return data;
};
