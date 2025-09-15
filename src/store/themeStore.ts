import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = "dark" | "light" | "system";

interface ThemeState {
  theme: Theme;
  accentColor: string;
  uiLanguage: 'ua' | 'ru' | 'en';
  setTheme: (theme: Theme) => void;
  setAccentColor: (color: string) => void;
  setUiLanguage: (lang: 'ua' | 'ru' | 'en') => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      accentColor: '221.2 83.2% 53.3%', // Default Blue
      uiLanguage: 'ua',
      setTheme: (theme) => set({ theme }),
      setAccentColor: (color) => set({ accentColor: color }),
      setUiLanguage: (lang) => set({ uiLanguage: lang }),
    }),
    {
      name: 'theme-storage',
    }
  )
);
