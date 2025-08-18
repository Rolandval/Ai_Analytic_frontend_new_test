import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { aiServices, currentService } from '@/config/services';
import { useServiceStore } from '@/store/serviceStore';
import { cn } from '@/lib/utils';

export const ServiceDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { setCurrentServicePath } = useServiceStore();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 focus:outline-none"
        aria-label="Open services menu"
      >
        <ChevronDown
          className={cn(
            'w-4 h-4 text-muted-foreground transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 mt-2 w-64 rounded-lg bg-white dark:bg-neutral-800 shadow-lg border border-white/10 dark:border-neutral-700 z-50 overflow-hidden"
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
    </div>
  );
};
