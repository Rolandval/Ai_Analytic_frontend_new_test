import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { navItems } from '@/config/nav';
import { accountantNavItems } from '@/config/accountantNav';
import { contentNavItems } from '@/config/contentNav';
import { productFillerNavItems } from '@/config/productFillerNav';
import { adsManagerNavItems } from '@/config/adsManagerNav';
import { characterNavItems } from '@/config/characterNav';
import { forecastingNavItems } from '@/config/forecastingNav';
import { priceBuilderNavItems } from '@/config/priceBuilderNav';
import { supplyManagerNavItems } from '@/config/supplyManagerNav';
import { businessAgentNavItems } from '@/config/businessAgentNav';
import { useThemeStore } from '@/store/themeStore';
import { useServiceStore } from '@/store/serviceStore';
import { cn } from '@/lib/utils';
import { ChevronDown, User } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { ServiceDropdown } from './ServiceDropdown';

interface SidebarProps {
  collapsed?: boolean;
}

export const Sidebar = ({ collapsed = false }: SidebarProps) => {
  // Функція для перевірки чи пункт меню має виділятись
  const isHighlightedItem = (title: string) => {
    return title === 'Ціни в наявності';
  };
  
  const location = useLocation();
  const [openItem, setOpenItem] = useState('');
  // Використовуємо props для стану згорнення
  const setAccentColor = useThemeStore((state) => state.setAccentColor);
  const { setCurrentServicePath, getCurrentService, isAccountantService, isContentService, isCharacterService, isSupplyManagerService, isProductFillerService, isPriceBuilderService, isBusinessAgentService } = useServiceStore();
  const isBusinessAgent = isBusinessAgentService();
  const isProfile = location.pathname.startsWith('/profile');

  useEffect(() => {
    // Update current service path
    setCurrentServicePath(location.pathname);
    // Profile area: standalone, neutral accent, no service groups
    if (location.pathname.startsWith('/profile')) {
      setOpenItem('');
      setAccentColor('221.2 83.2% 53.3%'); // neutral blue
      return;
    }
    
    // If we're in the analytics service, handle nav items as usual
    if (location.pathname === '/' || location.pathname.startsWith('/batteries') || 
        location.pathname.startsWith('/solar-panels') || location.pathname.startsWith('/inverters') || 
        location.pathname.startsWith('/prices') || location.pathname.startsWith('/reports') || 
        location.pathname.startsWith('/ai-chat')) {
      
      const currentNavItem = navItems.find(
        (item) => item.basePath && location.pathname.startsWith(item.basePath)
      );
      if (currentNavItem) {
        setOpenItem(currentNavItem.title);
        if (currentNavItem.color) {
          setAccentColor(currentNavItem.color);
        }
      } else {
        // Default for dashboard or other pages
        setOpenItem('');
        setAccentColor('221.2 83.2% 53.3%'); // Default to blue
      }
    } else {
      // For other AI services, apply their specific color
      const service = getCurrentService();
      setAccentColor(service.color);
      // Auto-open Product Filler group based on current sub-route
      if (isProductFillerService()) {
        const match = productFillerNavItems.find((group) =>
          (group.subItems || []).some((sub) => !!sub.href && location.pathname.startsWith(sub.href))
        );
        setOpenItem(match ? match.title : '');
      } else if (isPriceBuilderService()) {
        const match = priceBuilderNavItems.find((group) =>
          (group.subItems || []).some((sub) => !!sub.href && location.pathname.startsWith(sub.href))
        );
        setOpenItem(match ? match.title : '');
      } else if (isBusinessAgentService()) {
        const match = businessAgentNavItems.find((group) =>
          (group.subItems || []).some((sub) => !!sub.href && location.pathname.startsWith(sub.href))
        );
        setOpenItem(match ? match.title : '');
      } else {
        setOpenItem('');
      }
    }
  }, [location.pathname, setAccentColor, setCurrentServicePath, getCurrentService]);

  const toggleItem = (title: string) => {
    setOpenItem(openItem === title ? '' : title);
  };

  return (
    <aside className={cn(
      collapsed ? 'w-20 p-3' : 'w-64 p-6',
      'flex-shrink-0 bg-white/5 dark:bg-neutral-900 border border-white/10 dark:border-neutral-800 shadow-lg rounded-[1.5rem] flex flex-col transition-all'
    )}>
      <div className="flex items-center gap-2 px-2">
        <div className="flex items-center gap-2">
          <Link to={isProfile ? '/profile' : getCurrentService().path}>
            <div 
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white transition-colors",
                isProfile && 'bg-black'
              )}
              style={!isProfile ? { backgroundColor: getCurrentService().color } : undefined}
            >
              {isProfile ? <User className="w-4 h-4" /> : 'AI'}
            </div>
          </Link>
          {/* Випадаюче меню сервісів поруч з логотипом приховуємо у профілі */}
          {!isProfile && <ServiceDropdown />}
          {!collapsed && (
            <Link to={isProfile ? '/profile' : getCurrentService().path}>
              <h1 className="text-xl font-bold text-foreground">{isProfile ? 'Профіль' : getCurrentService().name.replace('Ai - ', '')}</h1>
            </Link>
          )}
        </div>
        {/* Кнопка згортання прибрана, оскільки цим керує MainLayout */}
      </div>

      {!isProfile && (
      <nav className={cn(collapsed ? 'mt-6' : 'mt-10', 'flex-1')}>
        <ul>
          {isCharacterService() && characterNavItems.map((item) => (
            <li key={item.title} className="mb-2">
              <Link
                to={(item.subItems && item.subItems.length > 0 ? '#' : item.basePath) || '#'}
                onClick={(e) => {
                  if (item.subItems && item.subItems.length > 0) {
                    e.preventDefault();
                    toggleItem(item.title);
                  }
                }}
                className={cn(
                  'w-full flex items-center justify-between p-2 rounded-md text-muted-foreground hover:bg-secondary/80 hover:text-black transition-colors',
                  item.basePath &&
                    location.pathname.startsWith(item.basePath) &&
                    'text-foreground bg-primary/20'
                )}
              >
                <div className="flex items-center gap-3">
                  {item.icon && <item.icon className="w-5 h-5 stroke-[1.3]" />}
                  {!collapsed && <span>{item.title}</span>}
                </div>
                {!collapsed && item.subItems && item.subItems.length > 0 && (
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 transition-transform',
                      openItem === item.title && 'rotate-180'
                    )}
                  />
                )}
              </Link>
              {!collapsed && (
              <AnimatePresence>
                {openItem === item.title && item.subItems && item.subItems.length > 0 && (
                  <motion.ul
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-1 ml-4 border-l border-border"
                  >
                    {item.subItems.map((subItem) => (
                      <li key={subItem.href}>
                        <Link
                          to={subItem.href || '#'}
                          className={cn(
                            'flex items-center gap-3 py-2 px-4 rounded-md text-muted-foreground hover:text-black hover:bg-secondary/80 transition-colors text-sm w-full',
                            location.pathname === subItem.href && 'text-foreground bg-primary/10',
                            isHighlightedItem(subItem.title) && 'font-bold text-foreground bg-gradient-to-r from-primary/20 to-transparent border-l-4 border-primary shadow-sm'
                          )}
                        >
                          {subItem.icon && <subItem.icon className={cn(
                            "w-4 h-4 flex-shrink-0 stroke-[1.3]",
                            isHighlightedItem(subItem.title) && 'text-primary'
                          )} />}
                          <span className="flex-1">{subItem.title}</span>
                        </Link>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
              )}
            </li>
          ))}

          {isPriceBuilderService() && priceBuilderNavItems.map((item) => (
            <li key={item.title} className="mb-2">
              <Link
                to={(item.subItems && item.subItems.length > 0 ? '#' : item.basePath) || '#'}
                onClick={(e) => {
                  if (item.subItems && item.subItems.length > 0) {
                    e.preventDefault();
                    toggleItem(item.title);
                  }
                }}
                className={cn(
                  'w-full flex items-center justify-between p-2 rounded-md text-muted-foreground hover:bg-secondary/80 hover:text-black transition-colors',
                  item.basePath &&
                    location.pathname.startsWith(item.basePath) &&
                    'text-foreground bg-primary/20'
                )}
              >
                <div className="flex items-center gap-3">
                  {item.icon && <item.icon className="w-5 h-5 stroke-[1.3]" />}
                  {!collapsed && <span>{item.title}</span>}
                </div>
                {!collapsed && item.subItems && item.subItems.length > 0 && (
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 transition-transform',
                      openItem === item.title && 'rotate-180'
                    )}
                  />
                )}
              </Link>
              {!collapsed && (
              <AnimatePresence>
                {openItem === item.title && item.subItems && item.subItems.length > 0 && (
                  <motion.ul
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-1 ml-4 border-l border-border"
                  >
                    {item.subItems.map((subItem) => (
                      <li key={subItem.href}>
                        <Link
                          to={subItem.href || '#'}
                          className={cn(
                            'flex items-center gap-3 py-2 px-4 rounded-md text-muted-foreground hover:text-black hover:bg-secondary/80 transition-colors text-sm w-full',
                            location.pathname === subItem.href && 'text-foreground bg-primary/10'
                          )}
                        >
                          {subItem.icon && <subItem.icon className="w-4 h-4 flex-shrink-0 stroke-[1.3]" />}
                          <span className="flex-1">{subItem.title}</span>
                        </Link>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
              )}
            </li>
          ))}

          {isProductFillerService() && productFillerNavItems.map((item) => (
            <li key={item.title} className="mb-2">
              <Link
                to={(item.subItems && item.subItems.length > 0 ? '#' : item.basePath) || '#'}
                onClick={(e) => {
                  if (item.subItems && item.subItems.length > 0) {
                    e.preventDefault();
                    toggleItem(item.title);
                  }
                }}
                className={cn(
                  'w-full flex items-center justify-between p-2 rounded-md text-muted-foreground hover:bg-secondary/80 hover:text-black transition-colors',
                  item.basePath &&
                    location.pathname.startsWith(item.basePath) &&
                    'text-foreground bg-primary/20'
                )}
              >
                <div className="flex items-center gap-3">
                  {item.icon && <item.icon className="w-5 h-5 stroke-[1.3]" />}
                  {!collapsed && <span>{item.title}</span>}
                </div>
                {!collapsed && item.subItems && item.subItems.length > 0 && (
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 transition-transform',
                      openItem === item.title && 'rotate-180'
                    )}
                  />
                )}
              </Link>
              {!collapsed && (
              <AnimatePresence>
                {openItem === item.title && item.subItems && item.subItems.length > 0 && (
                  <motion.ul
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-1 ml-4 border-l border-border"
                  >
                    {item.subItems.map((subItem) => (
                      <li key={subItem.href}>
                        <Link
                          to={subItem.href || '#'}
                          className={cn(
                            'flex items-center gap-3 py-2 px-4 rounded-md text-muted-foreground hover:text-black hover:bg-secondary/80 transition-colors text-sm w-full',
                            location.pathname === subItem.href && 'text-foreground bg-primary/10'
                          )}
                        >
                          {subItem.icon && <subItem.icon className="w-4 h-4 flex-shrink-0 stroke-[1.3]" />}
                          <span className="flex-1">{subItem.title}</span>
                        </Link>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
              )}
            </li>
          ))}

          {isBusinessAgent && businessAgentNavItems.map((item) => (
            <li key={item.title} className="mb-2">
              <Link
                to={(item.subItems && item.subItems.length > 0 ? '#' : item.basePath) || '#'}
                onClick={(e) => {
                  if (item.subItems && item.subItems.length > 0) {
                    e.preventDefault();
                    toggleItem(item.title);
                  }
                }}
                className={cn(
                  'w-full flex items-center justify-between p-2 rounded-md text-muted-foreground hover:bg-secondary/80 hover:text-black transition-colors',
                  item.basePath &&
                    location.pathname.startsWith(item.basePath) &&
                    'text-foreground bg-primary/20'
                )}
              >
                <div className="flex items-center gap-3">
                  {item.icon && <item.icon className="w-5 h-5 stroke-[1.3]" />}
                  {!collapsed && <span>{item.title}</span>}
                </div>
                {!collapsed && item.subItems && item.subItems.length > 0 && (
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 transition-transform',
                      openItem === item.title && 'rotate-180'
                    )}
                  />
                )}
              </Link>
              {!collapsed && (
              <AnimatePresence>
                {openItem === item.title && item.subItems && item.subItems.length > 0 && (
                  <motion.ul
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-1 ml-4 border-l border-border"
                  >
                    {item.subItems.map((subItem) => (
                      <li key={subItem.href}>
                        <Link
                          to={subItem.href || '#'}
                          className={cn(
                            'flex items-center gap-3 py-2 px-4 rounded-md text-muted-foreground hover:text-black hover:bg-secondary/80 transition-colors text-sm w-full',
                            location.pathname === subItem.href && 'text-foreground bg-primary/10'
                          )}
                        >
                          {subItem.icon && <subItem.icon className="w-4 h-4 flex-shrink-0 stroke-[1.3]" />}
                          <span className="flex-1">{subItem.title}</span>
                        </Link>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
              )}
            </li>
          ))}

          

          {(location.pathname === '/' || location.pathname.startsWith('/batteries') || 
            location.pathname.startsWith('/solar-panels') || location.pathname.startsWith('/inverters') || 
            location.pathname.startsWith('/prices') || location.pathname.startsWith('/reports') || 
            location.pathname.startsWith('/ai-chat')) && navItems.map((item) => (
            <li key={item.title} className="mb-2">
              <Link
                to={(item.subItems && item.subItems.length > 0 ? '#' : item.basePath) || '#'}
                onClick={(e) => {
                  if (item.subItems && item.subItems.length > 0) {
                    e.preventDefault();
                    toggleItem(item.title);
                  }
                }}
                className={cn(
                  'w-full flex items-center justify-between p-2 rounded-md text-muted-foreground hover:bg-secondary/80 hover:text-black transition-colors',
                  item.basePath &&
                    location.pathname.startsWith(item.basePath) &&
                    'text-foreground bg-primary/20'
                )}
              >
                <div className="flex items-center gap-3">
                  {item.icon && <item.icon className="w-5 h-5 stroke-[1.3]" />}
                  {!collapsed && <span>{item.title}</span>}
                </div>
                {!collapsed && item.subItems && item.subItems.length > 0 && (
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 transition-transform',
                      openItem === item.title && 'rotate-180'
                    )}
                  />
                )}
              </Link>
              {!collapsed && (
              <AnimatePresence>
                {openItem === item.title && item.subItems && item.subItems.length > 0 && (
                  <motion.ul
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-1 ml-4 border-l border-border"
                  >
                    {item.subItems.map((subItem) => (
                      <li key={subItem.href}>
                        <Link
                          to={subItem.href || '#'}
                          className={cn(
                            'flex items-center gap-3 py-2 px-4 rounded-md text-muted-foreground hover:text-black hover:bg-secondary/80 transition-colors text-sm w-full',
                            location.pathname === subItem.href && 'text-foreground bg-primary/10',
                            isHighlightedItem(subItem.title) && 'font-bold text-foreground bg-gradient-to-r from-primary/20 to-transparent border-l-4 border-primary shadow-sm'
                          )}
                        >
                          {subItem.icon && <subItem.icon className={cn(
                            "w-4 h-4 flex-shrink-0 stroke-[1.3]",
                            isHighlightedItem(subItem.title) && 'text-primary'
                          )} />}
                          <span className="flex-1">{subItem.title}</span>
                        </Link>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
              )}
            </li>
          ))}

          {isContentService() && contentNavItems.map((item) => (
            <li key={item.title} className="mb-2">
              <Link
                to={(item.subItems && item.subItems.length > 0 ? '#' : item.basePath) || '#'}
                onClick={(e) => {
                  if (item.subItems && item.subItems.length > 0) {
                    e.preventDefault();
                    toggleItem(item.title);
                  }
                }}
                className={cn(
                  'w-full flex items-center justify-between p-2 rounded-md text-muted-foreground hover:bg-secondary/80 hover:text-black transition-colors',
                  item.basePath &&
                    location.pathname.startsWith(item.basePath) &&
                    'text-foreground bg-primary/20'
                )}
              >
                <div className="flex items-center gap-3">
                  {item.icon && <item.icon className="w-5 h-5 stroke-[1.3]" />}
                  {!collapsed && <span>{item.title}</span>}
                </div>
                {!collapsed && item.subItems && item.subItems.length > 0 && (
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 transition-transform',
                      openItem === item.title && 'rotate-180'
                    )}
                  />
                )}
              </Link>
              {!collapsed && (
              <AnimatePresence>
                {openItem === item.title && item.subItems && item.subItems.length > 0 && (
                  <motion.ul
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-1 ml-4 border-l border-border"
                  >
                    {item.subItems.map((subItem) => (
                      <li key={subItem.href}>
                        <Link
                          to={subItem.href || '#'}
                          className={cn(
                            'flex items-center gap-3 py-2 px-4 rounded-md text-muted-foreground hover:text-black hover:bg-secondary/80 transition-colors text-sm w-full',
                            location.pathname === subItem.href && 'text-foreground bg-primary/10',
                            isHighlightedItem(subItem.title) && 'font-bold text-foreground bg-gradient-to-r from-primary/20 to-transparent border-l-4 border-primary shadow-sm'
                          )}
                        >
                          {subItem.icon && <subItem.icon className={cn(
                            "w-4 h-4 flex-shrink-0 stroke-[1.3]",
                            isHighlightedItem(subItem.title) && 'text-primary'
                          )} />}
                          <span className="flex-1">{subItem.title}</span>
                        </Link>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
              )}
            </li>
          ))}

          {isAccountantService() && accountantNavItems.map((item) => (
            <li key={item.title} className="mb-2">
              <Link
                to={(item.subItems && item.subItems.length > 0 ? '#' : item.basePath) || '#'}
                onClick={(e) => {
                  if (item.subItems && item.subItems.length > 0) {
                    e.preventDefault();
                    toggleItem(item.title);
                  }
                }}
                className={cn(
                  'w-full flex items-center justify-between p-2 rounded-md text-muted-foreground hover:bg-secondary/80 hover:text-black transition-colors',
                  item.basePath &&
                    location.pathname.startsWith(item.basePath) &&
                    'text-foreground bg-primary/20'
                )}
              >
                <div className="flex items-center gap-3">
                  {item.icon && <item.icon className="w-5 h-5 stroke-[1.3]" />}
                  {!collapsed && <span>{item.title}</span>}
                </div>
                {!collapsed && item.subItems && item.subItems.length > 0 && (
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 transition-transform',
                      openItem === item.title && 'rotate-180'
                    )}
                  />
                )}
              </Link>
              {!collapsed && (
              <AnimatePresence>
                {openItem === item.title && item.subItems && item.subItems.length > 0 && (
                  <motion.ul
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-1 ml-4 border-l border-border"
                  >
                    {item.subItems.map((subItem) => (
                      <li key={subItem.href}>
                        <Link
                          to={subItem.href || '#'}
                          className={cn(
                            'flex items-center gap-3 py-2 px-4 rounded-md text-muted-foreground hover:text-black hover:bg-secondary/80 transition-colors text-sm w-full',
                            location.pathname === subItem.href && 'text-foreground bg-primary/10',
                            isHighlightedItem(subItem.title) && 'font-bold text-foreground bg-gradient-to-r from-primary/20 to-transparent border-l-4 border-primary shadow-sm'
                          )}
                        >
                          {subItem.icon && <subItem.icon className={cn(
                            "w-4 h-4 flex-shrink-0 stroke-[1.3]",
                            isHighlightedItem(subItem.title) && 'text-primary'
                          )} />}
                          <span className="flex-1">{subItem.title}</span>
                        </Link>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
              )}
            </li>
          ))}

          {(location.pathname.startsWith('/ai-forecast')) && forecastingNavItems.map((item) => (
            <li key={item.title} className="mb-2">
              <Link
                to={(item.subItems && item.subItems.length > 0 ? '#' : item.basePath) || '#'}
                onClick={(e) => {
                  if (item.subItems && item.subItems.length > 0) {
                    e.preventDefault();
                    toggleItem(item.title);
                  }
                }}
                className={cn(
                  'w-full flex items-center justify-between p-2 rounded-md text-muted-foreground hover:bg-secondary/80 hover:text-black transition-colors',
                  item.basePath &&
                    location.pathname.startsWith(item.basePath) &&
                    'text-foreground bg-primary/20'
                )}
              >
                <div className="flex items-center gap-3">
                  {item.icon && <item.icon className="w-5 h-5 stroke-[1.3]" />}
                  {!collapsed && <span>{item.title}</span>}
                </div>
                {!collapsed && item.subItems && item.subItems.length > 0 && (
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 transition-transform',
                      openItem === item.title && 'rotate-180'
                    )}
                  />
                )}
              </Link>
              {!collapsed && (
              <AnimatePresence>
                {openItem === item.title && item.subItems && item.subItems.length > 0 && (
                  <motion.ul
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-1 ml-4 border-l border-border"
                  >
                    {item.subItems.map((subItem) => (
                      <li key={subItem.href}>
                        <Link
                          to={subItem.href || '#'}
                          className={cn(
                            'flex items-center gap-3 py-2 px-4 rounded-md text-muted-foreground hover:text-black hover:bg-secondary/80 transition-colors text-sm w-full',
                            location.pathname === subItem.href && 'text-foreground bg-primary/10',
                            isHighlightedItem(subItem.title) && 'font-bold text-foreground bg-gradient-to-r from-primary/20 to-transparent border-l-4 border-primary shadow-sm'
                          )}
                        >
                          {subItem.icon && <subItem.icon className={cn(
                            "w-4 h-4 flex-shrink-0 stroke-[1.3]",
                            isHighlightedItem(subItem.title) && 'text-primary'
                          )} />}
                          <span className="flex-1">{subItem.title}</span>
                        </Link>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
              )}
            </li>
          ))}

          {(location.pathname.startsWith('/ai-ads')) && adsManagerNavItems.map((item) => (
            <li key={item.title} className="mb-2">
              <Link
                to={(item.subItems && item.subItems.length > 0 ? '#' : item.basePath) || '#'}
                onClick={(e) => {
                  if (item.subItems && item.subItems.length > 0) {
                    e.preventDefault();
                    toggleItem(item.title);
                  }
                }}
                className={cn(
                  'w-full flex items-center justify-between p-2 rounded-md text-muted-foreground hover:bg-secondary/80 hover:text-black transition-colors',
                  item.basePath &&
                    location.pathname.startsWith(item.basePath) &&
                    'text-foreground bg-primary/20'
                )}
              >
                <div className="flex items-center gap-3">
                  {item.icon && <item.icon className="w-5 h-5 stroke-[1.3]" />}
                  {!collapsed && <span>{item.title}</span>}
                </div>
                {!collapsed && item.subItems && item.subItems.length > 0 && (
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 transition-transform',
                      openItem === item.title && 'rotate-180'
                    )}
                  />
                )}
              </Link>
              {!collapsed && (
              <AnimatePresence>
                {openItem === item.title && item.subItems && item.subItems.length > 0 && (
                  <motion.ul
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-1 ml-4 border-l border-border"
                  >
                    {item.subItems.map((subItem) => (
                      <li key={subItem.href}>
                        <Link
                          to={subItem.href || '#'}
                          className={cn(
                            'flex items-center gap-3 py-2 px-4 rounded-md text-muted-foreground hover:text-black hover:bg-secondary/80 transition-colors text-sm w-full',
                            location.pathname === subItem.href && 'text-foreground bg-primary/10',
                            isHighlightedItem(subItem.title) && 'font-bold text-foreground bg-gradient-to-r from-primary/20 to-transparent border-l-4 border-primary shadow-sm'
                          )}
                        >
                          {subItem.icon && <subItem.icon className={cn(
                            "w-4 h-4 flex-shrink-0 stroke-[1.3]",
                            isHighlightedItem(subItem.title) && 'text-primary'
                          )} />}
                          <span className="flex-1">{subItem.title}</span>
                        </Link>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
              )}
            </li>
          ))}
          
          {/* Supply Manager Navigation Items */}
          {isSupplyManagerService() && supplyManagerNavItems.map((item) => (
            <li key={item.title} className="mb-2">
              <Link
                to={(item.subItems && item.subItems.length > 0 ? '#' : item.basePath) || '#'}
                onClick={(e) => {
                  if (item.subItems && item.subItems.length > 0) {
                    e.preventDefault();
                    toggleItem(item.title);
                  }
                }}
                className={cn(
                  'w-full flex items-center justify-between p-2 rounded-md text-muted-foreground hover:bg-secondary/80 hover:text-black transition-colors',
                  item.basePath &&
                    location.pathname.startsWith(item.basePath) &&
                    'text-foreground bg-primary/20'
                )}
              >
                <div className="flex items-center gap-3">
                  {item.icon && <item.icon className="w-5 h-5 stroke-[1.3]" />}
                  {!collapsed && <span>{item.title}</span>}
                </div>
                {!collapsed && item.subItems && item.subItems.length > 0 && (
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 transition-transform',
                      openItem === item.title && 'rotate-180'
                    )}
                  />
                )}
              </Link>
              {!collapsed && (
              <AnimatePresence>
                {openItem === item.title && item.subItems && item.subItems.length > 0 && (
                  <motion.ul
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-1 ml-4 border-l border-border"
                  >
                    {item.subItems.map((subItem) => (
                      <li key={subItem.href}>
                        <Link
                          to={subItem.href || '#'}
                          className={cn(
                            'flex items-center gap-3 py-2 px-4 rounded-md text-muted-foreground hover:text-black hover:bg-secondary/80 transition-colors text-sm w-full',
                            location.pathname === subItem.href && 'text-foreground bg-primary/10'
                          )}
                        >
                          {subItem.icon && <subItem.icon className="w-4 h-4 flex-shrink-0 stroke-[1.3]" />}
                          <span className="flex-1">{subItem.title}</span>
                        </Link>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
              )}
            </li>
          ))}
        </ul>
      </nav>
      )}
      {!collapsed && (
        <div className="mt-auto">
          <ThemeToggle />
        </div>
      )}
    </aside>
  );
};
