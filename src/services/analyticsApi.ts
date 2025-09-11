import axios from 'axios';

// Окремий axios-клієнт для сервісу аналітики.
// DEV: використовуємо Vite proxy (baseURL = '').
// PROD: якщо задано VITE_ANALYTICS_URL — використовуємо його, інакше формуємо
// URL з поточного протоколу/хоста та портом 8003.
const baseURL = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_ANALYTICS_URL as string | undefined) || `${window.location.protocol}//${window.location.hostname}:8003`;

const analyticsApi = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default analyticsApi;
