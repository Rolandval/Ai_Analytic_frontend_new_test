import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './Sidebar';
import { Outlet, useLocation } from 'react-router-dom';
import { useThemeStore } from '@/store/themeStore';
import { ArrowLeft, ChevronLeft, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from './ThemeToggle';
import { TokenStatusPanel } from './TokenStatusPanel';

export const MainLayout = () => {
  const accentColor = useThemeStore((state) => state.accentColor);
  const setAccentColor = useThemeStore((state) => state.setAccentColor);
  // Бічна панель завжди розгорнута за замовчуванням
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const hideGlobalSidebar = location.pathname.startsWith('/ai-product-filler') || location.pathname.startsWith('/profile') || location.pathname.startsWith('/auth') || location.pathname.startsWith('/seo-writer') || location.pathname.startsWith('/ai-content');
  
  // Мобільна перевірка як окрема функція для можливості повторного виклику
  const checkMobile = useCallback(() => {
    const mobile = window.innerWidth < 1024; // lg breakpoint
    setIsMobile(mobile);
    if (mobile) {
      setSidebarOpen(false);
    }
  }, []);
  
  // Перевірка скролінгу для фіксованого хедера
  const handleScroll = useCallback(() => {
    setIsScrolled(window.scrollY > 20);
  }, []);
  
  useEffect(() => {
    // Перевірка при першому завантаженні
    checkMobile();
    
    // Слідкуємо за розміром вікна
    window.addEventListener('resize', checkMobile);
    
    // Слідкуємо за скролінгом для фіксованого хедера
    window.addEventListener('scroll', handleScroll);
    
    // Прибрати слухачі при розмонтуванні
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [checkMobile, handleScroll]);
  
  // Закриваємо мобільну навігацію при зміні маршруту
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  // Нейтральний акцент для профілю та /auth (коли Sidebar прихований)
  useEffect(() => {
    if (location.pathname.startsWith('/profile') || location.pathname.startsWith('/auth')) {
      setAccentColor('221.2 83.2% 53.3%');
    }
  }, [location.pathname, setAccentColor]);

  return (
    <div 
      className="relative min-h-screen w-full bg-hero-light dark:bg-black text-foreground overflow-hidden"
      style={{
        '--primary': accentColor,
        '--primary-foreground': '210 40% 98%',
      } as React.CSSProperties}
    >
      {/* Градієнтний оверлей тільки для світлої теми */}
      <div className="absolute top-0 left-0 -z-10 h-full w-full bg-hero-gradient dark:hidden"></div>
      
      {/* Фіксований хедер для мобільних пристроїв (приховати на сторінках AI Product Filler) */}
      {!hideGlobalSidebar && (
        <header 
          className={`
            lg:hidden fixed top-0 left-0 right-0 z-50 
            py-3 px-4 flex items-center justify-between
            transition-all duration-200
            ${isScrolled ? 'bg-background/80 backdrop-blur-md shadow-sm' : 'bg-transparent'}
          `}
        >
          <Button 
            variant="outline" 
            size="icon" 
            className="h-10 w-10 rounded-full bg-white/80 backdrop-blur-sm dark:bg-neutral-900/80"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </Button>
          
          <div className="flex items-center gap-2">
            <ThemeToggle className="h-8 w-8" />
          </div>
        </header>
      )}
      
      <div className="relative flex h-screen">
        {/* Sidebar з анімацією - відображається тільки в розгорнутому стані або на мобільних */}
        {!hideGlobalSidebar && (sidebarOpen || isMobile) && (
          <aside 
            className={`
              fixed lg:relative z-40 h-screen
              transition-all duration-300 ease-in-out shadow-xl lg:shadow-none
              ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}
          >
            <Sidebar collapsed={false} />
            {/* Панель статусів серверів/БД під сайдбаром */}
             {/* <ServerStatusPanel />   */}
            
            {/* Кнопка згортання для десктопа */}
            <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-6 w-6 rounded-full bg-white dark:bg-neutral-800 shadow-md hover:shadow-lg transition-all"
                onClick={() => setSidebarOpen(false)}
                title="Згорнути панель"
              >
                <ChevronLeft size={12} />
              </Button>
            </div>
          </aside>
        )}
        
        {/* Кнопка розгортання панелі - відображається тільки на десктопі, коли панель згорнута */}
        {!hideGlobalSidebar && !sidebarOpen && !isMobile && (
          <div className="fixed left-6 top-1/2 -translate-y-1/2 z-40">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-10 w-10 rounded-full bg-white/80 backdrop-blur-sm dark:bg-neutral-800/80 shadow-md hover:shadow-lg transition-all"
              onClick={() => setSidebarOpen(true)}
              title="Розгорнути панель"
            >
              <ChevronLeft className="rotate-180" size={18} />
            </Button>
          </div>
        )}
        
        {/* Overlay для мобільних при відкритій бічній панелі */}
        {!hideGlobalSidebar && sidebarOpen && isMobile && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Основний контент із адаптивним відступом */}
        <main 
          className={`
            flex-1 overflow-auto h-screen scrollbar-thin scrollbar-thumb-primary/10 hover:scrollbar-thumb-primary/20 scrollbar-track-transparent
            transition-all duration-300
            ${hideGlobalSidebar ? 'px-0 py-0' : 'p-4 sm:p-6 md:p-8'} bg-background dark:bg-black/95
            ${hideGlobalSidebar ? 'pt-0' : 'pt-16 lg:pt-8'} // Додатковий відступ зверху для мобільних (для кнопки меню)
          `}
        >
          {/* Навігаційний індикатор для мобільних пристроїв */}
          {isMobile && (
            <div className="mb-4 flex items-center text-sm text-muted-foreground">
              <ArrowLeft className="w-4 h-4 mr-1" />
              <span>Проведіть вправо для навігації</span>
            </div>
          )}
          
          <Outlet />
          
          {/* Футер для мобільної версії */}
          {isMobile && (
            <footer className="mt-8 pt-4 border-t border-border text-center text-sm text-muted-foreground">
              <p>AI Аналітик © {new Date().getFullYear()}</p>
              <p className="mt-1">Всі дані оновлюються в реальному часі</p>
            </footer>
          )}
        </main>
      </div>
      
      {/* Панель статусів токенів та системи - доступна на всіх сторінках */}
      <TokenStatusPanel />
    </div>
  );
};
