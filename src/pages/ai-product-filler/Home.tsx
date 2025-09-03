import { Zap, Building2, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import AIProductFillerLayout from './components/AIProductFillerLayout';

export default function AIProductFillerHome() {
  return (
    <AIProductFillerLayout>
    <div className="w-full py-0">
      {/* Заголовок і опис */}
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-primary/10 rounded-full p-4">
          <div className="bg-primary rounded-full p-3">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L4 8V16L12 22L20 16V8L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 22V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M20 8L12 16L4 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 16L12 8L20 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 2V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-bold">Ai - product filler</h1>
          <p className="text-lg text-gray-600 mt-4 max-w-3xl">
            Автоматичне заповнення карток товарів: генерація описів, характеристик, тегів та зображень.
            Прискорює публікацію товарів і забезпечує консистентність контенту.
          </p>
        </div>
      </div>

      {/* Три секції */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
        {/* Швидкий старт */}
        <div className="flex flex-col items-center text-center">
          <div className="bg-purple-100 rounded-full p-4 mb-6">
            <Zap className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Швидкий старт</h2>
          <p className="text-gray-600 mb-4">
            Перейдіть до підрозділу "Генерація" щоб розпочати.
          </p>
          <Link 
            to="/ai-product-filler/generation" 
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            Розпочати
          </Link>
        </div>

        {/* Функціональність */}
        <div className="flex flex-col items-center text-center">
          <div className="bg-blue-100 rounded-full p-4 mb-6">
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Функціональність</h2>
          <p className="text-gray-600">
            Сервіс знаходиться в розробці.
          </p>
        </div>

        {/* Підтримка */}
        <div className="flex flex-col items-center text-center">
          <div className="bg-amber-100 rounded-full p-4 mb-6">
            <HelpCircle className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Підтримка</h2>
          <p className="text-gray-600">
            Зв'яжіться з нами для отримання додаткової інформації.
          </p>
        </div>
      </div>

      {/* Розділювач */}
      <div className="border-t border-gray-200 my-16"></div>
    </div>
    </AIProductFillerLayout>
  );
}
