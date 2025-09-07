import axios from 'axios';

const api = axios.create({
  // Використовуємо змінну оточення, але якщо вона не встановлена, застосовуємо стандартний URL бекенду
  baseURL: 'http://185.233.44.234:8002',  //http://185.233.44.234:8002
  headers: {
    'Content-Type': 'application/json',
  },
});
                                                                                                                          
export default api;
