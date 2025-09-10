import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { aiServices, currentService } from '@/config/services';
import { useServiceStore } from '@/store/serviceStore';
import { cn } from '@/lib/utils';

export const ServiceDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const { setCurrentServicePath } = useServiceStore();

  // Close dropdown when clicking outside (consider the portal menu as inside)
  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedInsideButton = !!buttonRef.current && buttonRef.current.contains(target);
      const clickedInsideMenu = !!menuRef.current && menuRef.current.contains(target);
      const clickedInsideWrapper = !!dropdownRef.current && dropdownRef.current.contains(target);
      if (clickedInsideButton || clickedInsideMenu || clickedInsideWrapper) return;
      setIsOpen(false);
    };

    document.addEventListener('click', handleDocumentClick, true);
    return () => {
      document.removeEventListener('click', handleDocumentClick, true);
    };
  }, []);

  // Recompute menu position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({ top: rect.bottom + 8, left: rect.left });
      // diagnostics
      // eslint-disable-next-line no-console
      console.debug('[ServiceDropdown] open at', rect);
    }
  }, [isOpen]);

  // Reposition/close on scroll or resize
  useEffect(() => {
    const onResize = () => {
      if (!isOpen) return;
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setPosition({ top: rect.bottom + 8, left: rect.left });
      }
    };
    const onScroll = () => {
      if (!isOpen) return;
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setPosition({ top: rect.bottom + 8, left: rect.left });
      }
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [isOpen]);

  const menu = (
    <AnimatePresence>
      {isOpen && position && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          style={{ position: 'fixed', top: position.top, left: position.left, zIndex: 1000, width: 288 }}
          className="rounded-lg bg-white dark:bg-neutral-800 shadow-lg border border-white/10 dark:border-neutral-700 overflow-hidden"
        >
          <div className="p-2">
            {/* Current service at the top */}
            <div className="p-2 border-b border-white/10 dark:border-neutral-700">
              <Link
                to={currentService.path}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary/80 transition-colors"
                onClick={() => {
                  setIsOpen(false);
                  setCurrentServicePath(currentService.path);
                }}
              >
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: currentService.color }}
                >
                  <currentService.icon className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium">{currentService.name}</span>
              </Link>
            </div>
            {/* Other services */}
            <div className="max-h-[65vh] overflow-y-auto py-2">
              {aiServices.length === 0 && (
                <div className="text-sm text-muted-foreground px-3 py-2">Немає сервісів</div>
              )}
              {aiServices.map((service) => (
                <Link
                  key={service.path}
                  to={service.path}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary/80 transition-colors"
                  onClick={() => {
                    setIsOpen(false);
                    setCurrentServicePath(service.path);
                  }}
                >
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: service.color }}
                  >
                    <service.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-medium">{service.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 focus:outline-none"
        aria-label="Open services menu"
        title="Перейти до іншого сервісу"
      >
        <ChevronDown
          className={cn(
            'w-4 h-4 text-muted-foreground transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      {createPortal(menu, document.body)}
    </div>
  );
};
