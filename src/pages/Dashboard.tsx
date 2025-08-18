import { useState, useEffect } from 'react';
import { BarChart3, FileBarChart, UploadCloud, Battery, Zap, ArrowUpRightSquare, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';

// Приклад структури даних для статистики (в реальному додатку підключіть API)
interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  category: string;
}

export const Dashboard = () => {
  const [animatedStats, setAnimatedStats] = useState<StatCardProps[]>([
    // Акумулятори
    {
      title: "Акумулятори в базі",
      value: "0",
      description: "Загальна кількість унікальних моделей акумуляторів",
      icon: <Battery className="w-6 h-6 text-blue-500" />,
      category: "batteries",
    },
    // Інвертори
    {
      title: "Інвертори в базі",
      value: "0",
      description: "Загальна кількість унікальних моделей інверторів",
      icon: <Zap className="w-6 h-6 text-yellow-500" />,
      category: "inverters",
    },
    // Сонячні панелі
    {
      title: "Сонячні панелі в базі",
      value: "0",
      description: "Загальна кількість унікальних моделей сонячних панелей",
      icon: <BarChart3 className="w-6 h-6 text-green-500" />,
      category: "solar_panels",
    }
  ]);

  // Анімуємо лічильники після завантаження сторінки
  useEffect(() => {
    // Приклад фінальних значень (в реальному додатку вони б отримувались з API)
    const finalValues = {
      batteries: 450,
      inverters: 280,
      solar_panels: 320
    };
    
    // Функція для анімації лічильників
    const animateStats = () => {
      setAnimatedStats(prev => 
        prev.map(stat => {
          const current = parseInt(stat.value);
          const final = finalValues[stat.category as keyof typeof finalValues];
          const increment = Math.ceil((final - current) / 20);
          
          return {
            ...stat,
            value: Math.min(current + increment, final).toString()
          };
        })
      );
    };
    
    // Запускаємо анімацію через 300 мс після завантаження
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        animateStats();
        
        // Перевіряємо, чи всі лічильники досягли фінальних значень
        const allDone = animatedStats.every(stat => 
          parseInt(stat.value) >= finalValues[stat.category as keyof typeof finalValues]
        );
        
        if (allDone) clearInterval(interval);
      }, 50);
      
      return () => clearInterval(interval);
    }, 300);
    
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="flex flex-col px-4 py-6 md:px-8 md:py-10 min-h-[calc(100vh-4rem)]">
      {/* Hero section */}
      <section className="relative flex flex-col lg:flex-row items-start gap-8 mb-12 overflow-hidden">
        {/* Main text */}
        <div className="max-w-3xl z-10">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
            AI&nbsp;Аналітик
          </h1>
          <p className="text-lg sm:text-xl max-w-3xl text-muted-foreground leading-relaxed mb-8">
            Платформа для швидкого моніторингу цін, глибокої аналітики конкурентів та
            керування даними по акумуляторах, сонячних панелях й інверторах.
            Імпортуйте прайси, формуйте звіти, будуйте графіки — усе в одному
            інтерфейсі, підсиленому штучним інтелектом.
          </p>

          {/* CTA Button */}
          <Dialog>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 mt-4">
                Розпочати аналіз <ArrowRight className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Почніть роботу з аналітичними інструментами</DialogTitle>
                <DialogDescription>
                  Виберіть потрібний розділ для початку роботи з аналітикою даних.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                <Button variant="outline" className="h-auto p-4 flex flex-col items-start gap-2 text-left" onClick={() => window.location.href = '/batteries/prices/current'}>
                  <Battery className="w-6 h-6 text-blue-500" />
                  <span className="text-base font-medium">Акумулятори</span>
                  <span className="text-sm text-muted-foreground">Аналіз цін, моделей та характеристик</span>
                </Button>
                
                <Button variant="outline" className="h-auto p-4 flex flex-col items-start gap-2 text-left" onClick={() => window.location.href = '/inverters/prices/current'}>
                  <Zap className="w-6 h-6 text-yellow-500" />
                  <span className="text-base font-medium">Інвертори</span>
                  <span className="text-sm text-muted-foreground">Порівняння та моніторинг цін</span>
                </Button>
                
                <Button variant="outline" className="h-auto p-4 flex flex-col items-start gap-2 text-left" onClick={() => window.location.href = '/solar-panels/prices/current'}>
                  <BarChart3 className="w-6 h-6 text-green-500" />
                  <span className="text-base font-medium">Сонячні панелі</span>
                  <span className="text-sm text-muted-foreground">Аналіз моделей та цінових трендів</span>
                </Button>
                
                <Button variant="outline" className="h-auto p-4 flex flex-col items-start gap-2 text-left" onClick={() => window.location.href = '/suppliers'}>
                  <ArrowUpRightSquare className="w-6 h-6 text-primary" />
                  <span className="text-base font-medium">Постачальники</span>
                  <span className="text-sm text-muted-foreground">Керування та аналіз постачальників</span>
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          {/* Feature list */}
          <ul className="mt-8 space-y-4 max-w-xl">
            <li className="flex items-start gap-3 bg-primary/5 p-3 rounded-lg transform transition-transform hover:translate-x-2">
              <BarChart3 className="w-6 h-6 shrink-0 text-primary" />
              <span>Онлайн-моніторинг цін конкурентів у реальному часі</span>
            </li>
            <li className="flex items-start gap-3 bg-primary/5 p-3 rounded-lg transform transition-transform hover:translate-x-2">
              <FileBarChart className="w-6 h-6 shrink-0 text-primary" />
              <span>Глибокі аналітичні звіти та адаптивні графіки</span>
            </li>
            <li className="flex items-start gap-3 bg-primary/5 p-3 rounded-lg transform transition-transform hover:translate-x-2">
              <UploadCloud className="w-6 h-6 shrink-0 text-primary" />
              <span>Імпорт прайсів та даних з Excel або Google Sheets одним кліком</span>
            </li>
          </ul>
        </div>
      </section>
      
      {/* Statistics cards */}
      <h2 className="text-2xl font-bold mb-4">Статистика бази даних</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {animatedStats.map((stat, index) => (
          <Card key={index} className="p-6 flex flex-col h-full transform transition-all hover:scale-[1.02] hover:shadow-md">
            <div className="flex items-center gap-3 mb-2">
              {stat.icon}
              <h3 className="font-medium text-lg">{stat.title}</h3>
            </div>
            <div className="text-3xl font-bold my-2">{stat.value}</div>
            <p className="text-muted-foreground text-sm mt-auto">{stat.description}</p>
          </Card>
        ))}
      </div>

      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -right-1/4 -top-1/4 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle_farthest-side,hsla(var(--primary)/0.08),rgba(255,255,255,0))]" />
      <div className="pointer-events-none absolute left-0 bottom-0 w-full h-1/3 bg-gradient-to-t from-background/50 to-transparent z-0" />
    </div>
  );
};
