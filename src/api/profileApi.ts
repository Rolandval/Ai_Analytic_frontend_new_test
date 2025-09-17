import { apiClient } from './client';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  plan: 'free' | 'pro' | 'enterprise';
  joinDate: string;
  settings: {
    notifications: boolean;
    language: string;
    theme: 'light' | 'dark' | 'auto';
  };
}

export interface ServiceSubscription {
  id: string;
  serviceId: string;
  serviceName: string;
  isActive: boolean;
  plan: 'free' | 'pro' | 'enterprise';
  activatedDate?: string;
  expiryDate?: string;
  usage?: {
    current: number;
    limit: number;
    unit: string;
    resetDate: string;
  };
  features: string[];
  billing: {
    amount: number;
    currency: string;
    interval: 'monthly' | 'yearly';
    nextBillingDate?: string;
  };
}

export interface ServicePlan {
  id: string;
  name: 'free' | 'pro' | 'enterprise';
  displayName: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  features: string[];
  limits: {
    [key: string]: number;
  };
}

export interface AvailableService {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  path: string;
  plans: ServicePlan[];
  isPopular?: boolean;
  isNew?: boolean;
}

// API функції для роботи з профілем користувача
export const profileApi = {
  // Отримати профіль користувача
  async getUserProfile(): Promise<UserProfile> {
    const response = await apiClient.get('/profile');
    return response.data;
  },

  // Оновити профіль користувача
  async updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const response = await apiClient.put('/profile', updates);
    return response.data;
  },

  // Отримати всі підписки користувача
  async getUserSubscriptions(): Promise<ServiceSubscription[]> {
    const response = await apiClient.get('/profile/subscriptions');
    return response.data;
  },

  // Отримати конкретну підписку
  async getSubscription(serviceId: string): Promise<ServiceSubscription> {
    const response = await apiClient.get(`/profile/subscriptions/${serviceId}`);
    return response.data;
  },

  // Активувати сервіс
  async activateService(serviceId: string, planId: string = 'free'): Promise<ServiceSubscription> {
    const response = await apiClient.post('/profile/subscriptions', {
      serviceId,
      planId
    });
    return response.data;
  },

  // Деактивувати сервіс
  async deactivateService(serviceId: string): Promise<void> {
    await apiClient.delete(`/profile/subscriptions/${serviceId}`);
  },

  // Змінити тарифний план
  async upgradePlan(serviceId: string, newPlanId: string): Promise<ServiceSubscription> {
    const response = await apiClient.put(`/profile/subscriptions/${serviceId}/plan`, {
      planId: newPlanId
    });
    return response.data;
  },

  // Отримати використання сервісу
  async getServiceUsage(serviceId: string): Promise<ServiceSubscription['usage']> {
    const response = await apiClient.get(`/profile/subscriptions/${serviceId}/usage`);
    return response.data;
  },

  // Отримати всі доступні сервіси
  async getAvailableServices(): Promise<AvailableService[]> {
    const response = await apiClient.get('/services/available');
    return response.data;
  },

  // Отримати тарифні плани для сервісу
  async getServicePlans(serviceId: string): Promise<ServicePlan[]> {
    const response = await apiClient.get(`/services/${serviceId}/plans`);
    return response.data;
  },

  // Отримати статистику використання всіх сервісів
  async getUsageStatistics(): Promise<{
    totalServices: number;
    activeServices: number;
    totalUsage: { [serviceId: string]: number };
    monthlySpend: number;
    currency: string;
  }> {
    const response = await apiClient.get('/profile/statistics');
    return response.data;
  },

  // Налаштування сповіщень
  async updateNotificationSettings(settings: {
    email: boolean;
    push: boolean;
    sms: boolean;
    usageAlerts: boolean;
    billingAlerts: boolean;
    newFeatures: boolean;
  }): Promise<void> {
    await apiClient.put('/profile/notifications', settings);
  },

  // Отримати історію платежів
  async getBillingHistory(): Promise<{
    id: string;
    serviceId: string;
    serviceName: string;
    amount: number;
    currency: string;
    date: string;
    status: 'paid' | 'pending' | 'failed';
    invoiceUrl?: string;
  }[]> {
    const response = await apiClient.get('/profile/billing/history');
    return response.data;
  },

  // Отримати наступні платежі
  async getUpcomingBilling(): Promise<{
    serviceId: string;
    serviceName: string;
    amount: number;
    currency: string;
    dueDate: string;
    planName: string;
  }[]> {
    const response = await apiClient.get('/profile/billing/upcoming');
    return response.data;
  },

  // Скасувати підписку
  async cancelSubscription(serviceId: string, reason?: string): Promise<void> {
    await apiClient.post(`/profile/subscriptions/${serviceId}/cancel`, {
      reason
    });
  },

  // Поновити підписку
  async renewSubscription(serviceId: string): Promise<ServiceSubscription> {
    const response = await apiClient.post(`/profile/subscriptions/${serviceId}/renew`);
    return response.data;
  },

  // Експортувати дані профілю
  async exportProfileData(): Promise<Blob> {
    const response = await apiClient.get('/profile/export', {
      responseType: 'blob'
    });
    return response.data;
  },

  // Видалити акаунт
  async deleteAccount(password: string): Promise<void> {
    await apiClient.delete('/profile', {
      data: { password }
    });
  }
};

// Хуки для React Query
export const profileQueries = {
  profile: () => ({
    queryKey: ['profile'],
    queryFn: profileApi.getUserProfile,
    staleTime: 5 * 60 * 1000, // 5 хвилин
  }),

  subscriptions: () => ({
    queryKey: ['profile', 'subscriptions'],
    queryFn: profileApi.getUserSubscriptions,
    staleTime: 2 * 60 * 1000, // 2 хвилини
  }),

  availableServices: () => ({
    queryKey: ['services', 'available'],
    queryFn: profileApi.getAvailableServices,
    staleTime: 10 * 60 * 1000, // 10 хвилин
  }),

  statistics: () => ({
    queryKey: ['profile', 'statistics'],
    queryFn: profileApi.getUsageStatistics,
    staleTime: 1 * 60 * 1000, // 1 хвилина
  }),

  billingHistory: () => ({
    queryKey: ['profile', 'billing', 'history'],
    queryFn: profileApi.getBillingHistory,
    staleTime: 5 * 60 * 1000, // 5 хвилин
  }),

  upcomingBilling: () => ({
    queryKey: ['profile', 'billing', 'upcoming'],
    queryFn: profileApi.getUpcomingBilling,
    staleTime: 5 * 60 * 1000, // 5 хвилин
  }),
};

// Мутації для React Query
export const profileMutations = {
  updateProfile: {
    mutationFn: profileApi.updateUserProfile,
    onSuccess: () => {
      // Інвалідувати кеш профілю
    }
  },

  activateService: {
    mutationFn: ({ serviceId, planId }: { serviceId: string; planId?: string }) =>
      profileApi.activateService(serviceId, planId),
    onSuccess: () => {
      // Інвалідувати кеш підписок
    }
  },

  deactivateService: {
    mutationFn: profileApi.deactivateService,
    onSuccess: () => {
      // Інвалідувати кеш підписок
    }
  },

  upgradePlan: {
    mutationFn: ({ serviceId, planId }: { serviceId: string; planId: string }) =>
      profileApi.upgradePlan(serviceId, planId),
    onSuccess: () => {
      // Інвалідувати кеш підписок
    }
  }
};
