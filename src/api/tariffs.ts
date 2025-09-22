import { apiClient } from '@/lib/api-client';

// Типи для тарифів
export interface Tariff {
  id?: number;
  name: string;
  description: string;
  price_per_month: number;
  price_per_year: number;
  created_at?: string;
}

export interface TariffCreateRequest {
  name: string;
  description: string;
  price_per_month: number;
  price_per_year: number;
}

export interface SubscribeRequest {
  tariff_id: number;
  period: 'month' | 'year';
}

export interface SubscribeResponse {
  message: string;
  tariff_id: number;
  period: string;
}

export interface UserSubscription {
  tariff_id: number;
  name: string;
  period: 'month' | 'year';
  expires_at: string;
}

export interface CancelSubscriptionResponse {
  message: string;
  canceled_at: string;
}

// Нові типи згідно з бекенд-відповіддю для /users/tariffs/me
export interface MySubscriptionEntry {
  id: number;
  tariff_id: number;
  created_at: string; // ISO
  end_date: string;   // ISO
}

export interface MySubscriptionResponse {
  active: MySubscriptionEntry[];
  all: MySubscriptionEntry[];
}

// API функції для тарифів
export const tariffsApi = {
  // Отримати список всіх тарифів
  getTariffs: async (): Promise<Tariff[]> => {
    const response = await apiClient.get('/users/tariffs');
    return response.data;
  },

  // Отримати конкретний тариф за ID
  getTariff: async (tariffId: number): Promise<Tariff> => {
    const response = await apiClient.get(`/users/tariffs/${tariffId}`);
    return response.data;
  },

  // Створити новий тариф (тільки для адміністраторів)
  createTariff: async (data: TariffCreateRequest): Promise<Tariff> => {
    const response = await apiClient.post('/users/tariffs', data);
    return response.data;
  },

  // Оновити тариф (тільки для адміністраторів)
  updateTariff: async (tariffId: number, data: Partial<TariffCreateRequest>): Promise<Tariff> => {
    const response = await apiClient.patch(`/users/tariffs/${tariffId}`, data);
    return response.data;
  },

  // Видалити тариф (тільки для адміністраторів)
  deleteTariff: async (tariffId: number): Promise<void> => {
    await apiClient.delete(`/users/tariffs/${tariffId}`);
  },

  // Підписатися на тариф
  subscribe: async (data: SubscribeRequest): Promise<SubscribeResponse> => {
    const response = await apiClient.post('/users/tariffs/subscribe', data);
    return response.data;
  },

  // Отримати поточну підписку користувача
  getMySubscription: async (): Promise<MySubscriptionResponse | null> => {
    try {
      const response = await apiClient.get('/users/tariffs/me');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // Скасувати підписку
  cancelSubscription: async (): Promise<CancelSubscriptionResponse> => {
    const response = await apiClient.post('/users/tariffs/cancel');
    return response.data;
  },
};

