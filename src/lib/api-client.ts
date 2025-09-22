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
  // Отримуємо токен з Zustand persist store
  const authStore = localStorage.getItem('auth-storage');
  if (authStore) {
    try {
      const parsed = JSON.parse(authStore);
      const token = parsed?.state?.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('Помилка при парсингу токена з localStorage:', error);
    }
  }
  return config;
});

// Додаємо перехоплювач відповідей для обробки помилок
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Якщо отримали 401, очищуємо токен та перенаправляємо на логін
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-storage');
      // Можна додати перенаправлення на сторінку логіну
      if (window.location.pathname !== '/auth') {
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  }
);
