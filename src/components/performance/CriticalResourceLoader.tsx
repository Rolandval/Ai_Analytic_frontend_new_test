import { Suspense, useEffect, useState } from 'react';
import { LoadingFallback } from '@/components/ui/LoadingFallback';

interface CriticalResourceLoaderProps {
  children: React.ReactNode;
  priority: 'critical' | 'high' | 'normal' | 'low';
  fallback?: React.ReactNode;
  delay?: number;
}

export const CriticalResourceLoader = ({
  children,
  priority,
  fallback,
  delay = 0
}: CriticalResourceLoaderProps) => {
  const [shouldLoad, setShouldLoad] = useState(priority === 'critical');

  useEffect(() => {
    if (priority === 'critical') return;

    const timeouts = {
      high: 50,
      normal: 100,
      low: 200
    };

    const timeout = setTimeout(() => {
      setShouldLoad(true);
    }, timeouts[priority] + delay);

    return () => clearTimeout(timeout);
  }, [priority, delay]);

  if (!shouldLoad) {
    return fallback || <LoadingFallback />;
  }

  return (
    <Suspense fallback={fallback || <LoadingFallback />}>
      {children}
    </Suspense>
  );
};

// Хук для відстеження FCP
export const useFCPOptimization = () => {
  const [fcpTime, setFcpTime] = useState<number | null>(null);
  const [isOptimized, setIsOptimized] = useState(false);

  useEffect(() => {
    // Відстежуємо FCP через Performance Observer
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
        
        if (fcpEntry) {
          setFcpTime(fcpEntry.startTime);
          setIsOptimized(fcpEntry.startTime < 1500); // Цільовий FCP < 1.5s
          observer.disconnect();
        }
      });

      observer.observe({ entryTypes: ['paint'] });

      return () => observer.disconnect();
    }

    // Fallback для браузерів без Performance Observer
    const timeout = setTimeout(() => {
      const navigationStart = performance.timing?.navigationStart;
      const loadEventEnd = performance.timing?.loadEventEnd;
      
      if (navigationStart && loadEventEnd) {
        const loadTime = loadEventEnd - navigationStart;
        setFcpTime(loadTime);
        setIsOptimized(loadTime < 2000);
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, []);

  return { fcpTime, isOptimized };
};

// Компонент для preload критичних ресурсів
export const ResourcePreloader = () => {
  useEffect(() => {
    // Preload критичних API endpoints
    const preloadAPI = (url: string) => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
    };

    // Preload найбільш використовуваних ресурсів
    if (window.requestIdleCallback) {
      window.requestIdleCallback(() => {
        preloadAPI('/api/inverter-brands');
        preloadAPI('/api/inverter-suppliers');
      });
    }
  }, []);

  return null;
};
