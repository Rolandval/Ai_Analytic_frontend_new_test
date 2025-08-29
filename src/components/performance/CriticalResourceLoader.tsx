import { Suspense, lazy, useEffect, useState } from 'react';
import { LoadingFallback } from '@/components/ui/LoadingFallback';

// Критичні компоненти завантажуються одразу
const CriticalComponents = {
  Header: lazy(() => import('@/components/layout/Header')),
  Navigation: lazy(() => import('@/components/layout/Navigation')),
  Dashboard: lazy(() => import('@/pages/Dashboard'))
};

// Некритичні компоненти завантажуються з затримкою
const NonCriticalComponents = {
  Charts: lazy(() => 
    new Promise(resolve => {
      setTimeout(() => {
        resolve(import('@/components/charts'));
      }, 100); // Затримка 100ms після FCP
    })
  ),
  Suppliers: lazy(() => 
    new Promise(resolve => {
      setTimeout(() => {
        resolve(import('@/pages/inverters/Suppliers'));
      }, 200);
    })
  ),
  PriceComparison: lazy(() => 
    new Promise(resolve => {
      setTimeout(() => {
        resolve(import('@/pages/prices/inverters/PriceComparison'));
      }, 300);
    })
  )
};

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
    // Preload критичних шрифтів
    const preloadFont = (href: string) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      link.href = href;
      document.head.appendChild(link);
    };

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
