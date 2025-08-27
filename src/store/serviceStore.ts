import { create } from 'zustand';
import { aiServices, currentService, type AIService } from '@/config/services';

interface ServiceState {
  currentServicePath: string;
  setCurrentServicePath: (path: string) => void;
  getCurrentService: () => AIService;
  isAnalyticsService: () => boolean;
  isAccountantService: () => boolean;
  isContentService: () => boolean;
  isAdsManagerService: () => boolean;
  isCharacterService: () => boolean;
  isForecastingService: () => boolean;
  isSupplyManagerService: () => boolean;
  isProductFillerService: () => boolean;
}

export const useServiceStore = create<ServiceState>((set, get) => ({
  currentServicePath: '/',
  
  setCurrentServicePath: (path: string) => set({ currentServicePath: path }),
  
  getCurrentService: () => {
    const path = get().currentServicePath;
    
    if (path === '/') {
      return currentService;
    }
    
    return (
      aiServices.find(service => path.startsWith(service.path + '/') || path === service.path) || currentService
    );
  },
  
  isAnalyticsService: () => {
    const path = get().currentServicePath;
    return path === '/' || 
           path.startsWith('/batteries') || 
           path.startsWith('/solar-panels') || 
           path.startsWith('/inverters') || 
           path.startsWith('/prices') || 
           path.startsWith('/reports') || 
           path.startsWith('/ai-chat');
  },

  isAccountantService: () => {
    const path = get().currentServicePath;
    return path === '/ai-accountant' || path.startsWith('/ai-accountant/');
  },

  isContentService: () => {
    const path = get().currentServicePath;
    return path === '/ai-content' || path.startsWith('/ai-content/');
  },

  isAdsManagerService: () => {
    const path = get().currentServicePath;
    return path === '/ai-ads' || path.startsWith('/ai-ads/');
  },

  isCharacterService: () => {
    const path = get().currentServicePath;
    return path === '/ai-character' || path.startsWith('/ai-character/');
  },

  isForecastingService: () => {
    const path = get().currentServicePath;
    return path === '/ai-forecast' || path.startsWith('/ai-forecast/');
  },

  isSupplyManagerService: () => {
    const path = get().currentServicePath;
    return path === '/ai-supply' || path.startsWith('/ai-supply/');
  },

  isProductFillerService: () => {
    const path = get().currentServicePath;
    return path === '/ai-product-filler' || path.startsWith('/ai-product-filler/');
  }
}));
