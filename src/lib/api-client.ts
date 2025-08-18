import axios from 'axios';

// Створюємо екземпляр axios з базовими налаштуваннями
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://185.233.44.234:8002',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Додаємо перехоплювач запитів для встановлення токена авторизації
apiClient.interceptors.request.use((config) => {
  // Отримуємо токен з localStorage, якщо він там є
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Додаємо перехоплювач відповідей для обробки помилок
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Можна додати логіку обробки помилок (логування, перенаправлення тощо)
    return Promise.reject(error);
  }
);
