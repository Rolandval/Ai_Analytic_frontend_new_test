import { useState } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useThemeStore } from '@/store/themeStore';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle = ({ className }: ThemeToggleProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useThemeStore();

  const themes = [
    { name: 'Світла', value: 'light', icon: Sun },
    { name: 'Темна', value: 'dark', icon: Moon },
    { name: 'Системна', value: 'system', icon: Monitor },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-center p-2 rounded-md text-muted-foreground hover:bg-secondary/80 transition-colors",
          className
        )}
      >
        <Sun className="h-5 w-5 transition-all scale-100 rotate-0 dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-5 w-5 transition-all scale-0 rotate-90 dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Перемкнути тему</span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute bottom-full mb-2 w-36 bg-secondary border border-border rounded-md shadow-lg z-10"
            onMouseLeave={() => setIsOpen(false)}
          >
            <ul>
              {themes.map((t) => (
                <li key={t.value}>
                  <button
                    onClick={() => {
                      setTheme(t.value as 'light' | 'dark' | 'system');
                      setIsOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-muted-foreground hover:bg-secondary/80',
                      theme === t.value && 'text-white'
                    )}
                  >
                    <t.icon className="h-4 w-4" />
                    <span>{t.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
