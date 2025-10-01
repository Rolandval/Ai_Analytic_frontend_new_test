import { create } from 'zustand';
import { aiServices, currentService, type AIService } from '@/config/services';

interface ServiceState {
  currentServicePath: string;
  setCurrentServicePath: (path: string) => void;
  getCurrentService: () => AIService | typeof currentService;
  isCharacterService: () => boolean;
  isForecastService: () => boolean;
  isContentService: () => boolean;
  isAccountantService: () => boolean;
  isAdsService: () => boolean;
  isSupplyManagerService: () => boolean;
  isProductFillerService: () => boolean;
  isPriceBuilderService: () => boolean;
  isBusinessAgentService: () => boolean;
  isPhotoEditorService: () => boolean;
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
           path.startsWith('/inverters');
  },

  isAccountantService: () => {
    const path = get().currentServicePath;
    return path === '/ai-accountant' || path.startsWith('/ai-accountant/');
  },

  isContentService: () => {
    const path = get().currentServicePath;
    return path === '/ai-content' || path.startsWith('/ai-content/');
  },


  isCharacterService: () => {
    const path = get().currentServicePath;
    return path === '/ai-character' || path.startsWith('/ai-character/');
  },

  isForecastService: () => {
    const path = get().currentServicePath;
    return path === '/ai-forecast' || path.startsWith('/ai-forecast/');
  },

  isAdsService: () => {
    const path = get().currentServicePath;
    return path === '/ai-ads' || path.startsWith('/ai-ads/');
  },

  isSupplyManagerService: () => {
    const path = get().currentServicePath;
    return path === '/ai-supply' || path.startsWith('/ai-supply/');
  },

  isProductFillerService: () => {
    const path = get().currentServicePath;
    return path === '/ai-product-filler' || path.startsWith('/ai-product-filler/');
  },

  isPriceBuilderService: () => {
    const path = get().currentServicePath;
    return path?.startsWith('/ai-price-builder') || false;
  },

  isBusinessAgentService: () => {
    const path = get().currentServicePath;
    return path?.startsWith('/ai-business-agent') || false;
  },

  isPhotoEditorService: () => {
    const path = get().currentServicePath;
    return path === '/ai-photo-editor' || path.startsWith('/ai-photo-editor/');
  },
}));

export const isPriceBuilderService = () => {
  const path = useServiceStore.getState().currentServicePath;
  return path?.startsWith('/ai-price-builder') || false;
};

export const isBusinessAgentService = () => {
  const path = useServiceStore.getState().currentServicePath;
  return path?.startsWith('/ai-business-agent') || false;
};
