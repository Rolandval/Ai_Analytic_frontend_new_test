import { useEffect, useRef, useState } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useThemeStore } from '@/store/themeStore';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';

interface ThemeToggleProps {
  className?: string;
  sidebarOpen?: boolean; // true = розгорнутий, false = згорнутий
}

export const FillerThemeSwitcher = ({ className, sidebarOpen }: ThemeToggleProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useThemeStore();
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(null);
  const [overMenu, setOverMenu] = useState(false);
  const [overButton, setOverButton] = useState(false);
  const collapseTimerRef = useRef<number | null>(null);

  const updateAnchor = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const viewportH = window.innerHeight;
    const menuH = menuRef.current?.offsetHeight ?? 160; // приблизна висота меню
    const preferBelow = viewportH - r.bottom >= menuH + 12; // є місце знизу
    const top = preferBelow ? r.bottom + 8 : Math.max(8, r.top - menuH - 8);
    setAnchor({ top, left: r.left + r.width / 2 });
  };

  useEffect(() => {
    if (!isOpen) return;
    updateAnchor();

    const handleScroll = () => updateAnchor();
    const handleResize = () => updateAnchor();
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target) || btnRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKey);
    };
  }, [isOpen]);

  // Переобчислювати позицію при зміні стану сайдбару або коли меню відкрите
  useEffect(() => {
    if (isOpen) updateAnchor();
  }, [sidebarOpen, isOpen]);

  // Слідкувати за зміною розміру/позиції кнопки через ResizeObserver (коли меню відкрите)
  useEffect(() => {
    if (!isOpen || !btnRef.current || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => updateAnchor());
    ro.observe(btnRef.current);
    return () => ro.disconnect();
  }, [isOpen]);

  // Закривати меню з невеликою затримкою, коли сайдбар згортається,
  // але ТІЛЬКИ якщо курсор не над кнопкою і не над меню (щоб дати змогу навестися на меню)
  useEffect(() => {
    if (collapseTimerRef.current) {
      window.clearTimeout(collapseTimerRef.current);
      collapseTimerRef.current = null;
    }
    if (sidebarOpen === false && isOpen) {
      collapseTimerRef.current = window.setTimeout(() => {
        if (!overMenu && !overButton) {
          setIsOpen(false);
        }
      }, 500); // збільшена пауза, щоб встигнути навестися на меню
    }
    return () => {
      if (collapseTimerRef.current) {
        window.clearTimeout(collapseTimerRef.current);
        collapseTimerRef.current = null;
      }
    };
  }, [sidebarOpen, isOpen, overMenu, overButton]);

  const themes = [
    { name: 'Світла', value: 'light', icon: Sun },
    { name: 'Темна', value: 'dark', icon: Moon },
    { name: 'Системна', value: 'system', icon: Monitor },
  ];

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onMouseDown={(e) => {
          // Відкривати раніше (до click), щоб не втратити фокус при зміні ширини сайдбару
          e.preventDefault();
          setOverButton(true);
          setIsOpen((v) => !v);
          requestAnimationFrame(updateAnchor);
        }}
        onClick={() => {
          // Нічого не робимо тут, відкриття/закриття обробляє onMouseDown
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOverButton(true);
            setIsOpen((v) => !v);
            requestAnimationFrame(updateAnchor);
          }
        }}
        onMouseEnter={() => setOverButton(true)}
        onMouseLeave={() => setOverButton(false)}
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
        {isOpen && anchor && createPortal(
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-36 bg-secondary border border-border rounded-md shadow-lg z-[9999]"
            style={{ position: 'fixed', top: anchor.top, left: anchor.left, transform: 'translate(-50%, 0)' }}
            onMouseEnter={() => setOverMenu(true)}
            onMouseLeave={() => setOverMenu(false)}
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
          </motion.div>,
          document.body
        )}
      </AnimatePresence>
    </div>
  );
};
