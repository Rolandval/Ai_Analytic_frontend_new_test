import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useServiceStore } from '@/store/serviceStore';

export const ServicePage = () => {
  const location = useLocation();
  const { getCurrentService, setCurrentServicePath } = useServiceStore();
  
  // Set current path on component mount and update
  useEffect(() => {
    setCurrentServicePath(location.pathname);
  }, [location.pathname, setCurrentServicePath]);
  
  // Get the current service based on the path
  const service = getCurrentService();
  
  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <div className="flex items-center gap-4 mb-8">
        <div 
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ backgroundColor: service.color }}
        >
          <service.icon className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold">{service.name}</h1>
      </div>
      
      <div className="bg-white/5 dark:bg-neutral-800/50 border border-white/10 dark:border-neutral-700 rounded-xl p-8 mb-8">
        <p className="text-xl leading-relaxed">{service.description}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white/5 dark:bg-neutral-800/50 border border-white/10 dark:border-neutral-700 rounded-xl p-6 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
               style={{ backgroundColor: `${service.color}20` }}>
            <svg xmlns="http://www.w3.org/2000/svg" 
                 className="h-6 w-6" 
                 style={{ color: service.color }} 
                 fill="none" 
                 viewBox="0 0 24 24" 
                 stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium mb-2">Швидкий старт</h3>
          <p className="text-muted-foreground">Скоро тут з'явиться інструкція із використання</p>
        </div>
        
        <div className="bg-white/5 dark:bg-neutral-800/50 border border-white/10 dark:border-neutral-700 rounded-xl p-6 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
               style={{ backgroundColor: `${service.color}20` }}>
            <svg xmlns="http://www.w3.org/2000/svg" 
                 className="h-6 w-6" 
                 style={{ color: service.color }} 
                 fill="none" 
                 viewBox="0 0 24 24" 
                 stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-xl font-medium mb-2">Функціональність</h3>
          <p className="text-muted-foreground">Сервіс знаходиться в розробці</p>
        </div>
        
        <div className="bg-white/5 dark:bg-neutral-800/50 border border-white/10 dark:border-neutral-700 rounded-xl p-6 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
               style={{ backgroundColor: `${service.color}20` }}>
            <svg xmlns="http://www.w3.org/2000/svg" 
                 className="h-6 w-6" 
                 style={{ color: service.color }} 
                 fill="none" 
                 viewBox="0 0 24 24" 
                 stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium mb-2">Підтримка</h3>
          <p className="text-muted-foreground">Зв'яжіться з нами для отримання додаткової інформації</p>
        </div>
      </div>
      
      <div className="bg-white/5 dark:bg-neutral-800/50 border border-white/10 dark:border-neutral-700 rounded-xl p-8 mt-8">
        <h2 className="text-2xl font-bold mb-4">Інформація про сервіс</h2>
        <p className="mb-6 text-muted-foreground">
          Цей сервіс знаходиться в процесі розробки. Скоро тут з'явиться повноцінний інтерфейс 
          та функціональність. Дякуємо за ваше терпіння та інтерес до наших AI-рішень.
        </p>
        <p className="text-muted-foreground">
          За додатковими питаннями звертайтеся до команди підтримки.
        </p>
      </div>
    </div>
  );
};
