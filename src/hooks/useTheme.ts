import { useThemeStore } from "@/store/themeStore";

export const useTheme = () => {
  const { theme, accentColor, setTheme, setAccentColor } = useThemeStore();
  
  const isDarkMode = theme === 'dark' || 
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return {
    theme,
    accentColor,
    isDarkMode,
    setTheme,
    setAccentColor,
  };
};
