import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Конфігурація сервісів з їх favicon та налаштуваннями
const serviceConfigs = {
  '/ai-product-filler': {
    favicon: '/favicon-filler.svg',
    title: 'AI Product Filler',
    themeColor: '#10b981'
  },
  '/ai-analytics': {
    favicon: '/favicon-analytics.svg',
    title: 'AI Аналітик',
    themeColor: '#8b5cf6'
  },
  '/ai-supply': {
    favicon: '/favicon-supply.svg',
    title: 'AI Supply Manager',
    themeColor: '#22c55e'
  },
  '/ai-forecast': {
    favicon: '/favicon-forecast.svg',
    title: 'AI Прогноз',
    themeColor: '#f59e0b'
  },
  '/ai-business-agent': {
    favicon: '/favicon-business-agent.svg',
    title: 'AI Business Agent',
    themeColor: '#3b82f6'
  },
  '/ai-content': {
    favicon: '/favicon-content.svg',
    title: 'AI Контент',
    themeColor: '#a855f7'
  },
  '/ads-manager': {
    favicon: '/favicon-ads.svg',
    title: 'AI Ads Manager',
    themeColor: '#ec4899'
  },
  '/ai-seo': {
    favicon: '/favicon-seo.svg',
    title: 'AI SEO',
    themeColor: '#14b8a6'
  },
  '/ai-accountant': {
    favicon: '/favicon-accountant.svg',
    title: 'AI Бухгалтер Assist',
    themeColor: '#1e40af'
  },
  '/ai-email': {
    favicon: '/favicon-email.svg',
    title: 'AI Email Маркетинг',
    themeColor: '#06b6d4'
  },
  '/ai-character': {
    favicon: '/favicon-character.svg',
    title: 'AI Character',
    themeColor: '#9333ea'
  },
  '/ai-seller': {
    favicon: '/favicon-seller.svg',
    title: 'AI Продавець',
    themeColor: '#ea580c'
  },
  '/ai-video': {
    favicon: '/favicon-video.svg',
    title: 'AI Video Editor',
    themeColor: '#0891b2'
  },
  '/ai-price-builder': {
    favicon: '/favicon-price-builder.svg',
    title: 'AI Price Builder',
    themeColor: '#0d9488'
  }
};

export const useFavicon = () => {
  const location = useLocation();

  useEffect(() => {
    // Знаходимо конфігурацію для поточного маршруту
    const currentService = Object.keys(serviceConfigs).find(path => 
      location.pathname.startsWith(path)
    );
    
    // Знаходимо існуючий favicon link
    let faviconLink = document.querySelector('link[rel="icon"][type="image/svg+xml"]') as HTMLLinkElement;
    
    if (!faviconLink) {
      // Створюємо новий favicon link якщо його немає
      faviconLink = document.createElement('link');
      faviconLink.rel = 'icon';
      faviconLink.type = 'image/svg+xml';
      document.head.appendChild(faviconLink);
    }

    // Встановлюємо відповідний favicon та налаштування
    if (currentService && serviceConfigs[currentService as keyof typeof serviceConfigs]) {
      const config = serviceConfigs[currentService as keyof typeof serviceConfigs];
      faviconLink.href = config.favicon;
      document.title = config.title;
      
      // Змінюємо theme-color
      const themeColorMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
      if (themeColorMeta) {
        themeColorMeta.content = config.themeColor;
      }
    } else {
      // Повертаємо оригінальні налаштування для основної частини
      faviconLink.href = '/favicon.svg';
      document.title = 'AI Аналітика';
      
      const themeColorMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
      if (themeColorMeta) {
        themeColorMeta.content = '#2563eb';
      }
    }
  }, [location.pathname]);
};
