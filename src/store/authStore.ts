import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as authApi from '@/api/auth';

interface AuthState {
  token: string | null;
  user: any | null;
  loading: boolean;
  error: string | null;
  login: (payload: authApi.Credentials) => Promise<void>;
  register: (payload: authApi.Credentials) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      loading: false,
      error: null,
      login: async (payload) => {
        set({ loading: true, error: null });
        try {
          const res = await authApi.login(payload);
          const token = (res.token || (res as any).access || (res as any).access_token || (res as any).accessToken || (res as any).jwt || '') as string;
          const user = res.user ?? null;
          if (!token) throw new Error('Невірний email або пароль');
          set({ token, user, loading: false });
        } catch (e: any) {
          set({ error: e?.message || 'Помилка входу', loading: false });
          throw e;
        }
      },
      register: async (payload) => {
        set({ loading: true, error: null });
        try {
          const res = await authApi.register(payload);
          let token = (res.token || (res as any).access || (res as any).access_token || (res as any).accessToken || (res as any).jwt || '') as string;
          let user = res.user ?? null;

          // Деякі бекенди не повертають токен на /users/register. Спробуємо авто-вхід тими ж даними.
          if (!token) {
            try {
              const loginRes = await authApi.login(payload);
              token = (loginRes.token || (loginRes as any).access || (loginRes as any).access_token || (loginRes as any).accessToken || (loginRes as any).jwt || '') as string;
              user = loginRes.user ?? user;
            } catch (_) {
              // Ігноруємо тут, покажемо помилку нижче якщо токен так і не з'явився
            }
          }

          if (!token) throw new Error('Реєстрація успішна, але вхід не виконано. Будь ласка, увійдіть.');
          set({ token, user, loading: false });
        } catch (e: any) {
          set({ error: e?.message || 'Помилка реєстрації', loading: false });
          throw e;
        }
      },
      logout: () => set({ token: null, user: null }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);
