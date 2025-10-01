import { Link, useNavigate } from 'react-router-dom';
import { 
  Maximize, 
  TrendingUp, 
  Palette, 
  Scissors, 
  Move, 
  Droplets, 
  FileText, 
  Edit, 
  RefreshCw, 
  Plus,
  Sparkles,
  Type,
  ArrowRight,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';

const photoFeatures = [
  {
    icon: Maximize,
    title: 'Ресайз зображень',
    description: 'Змінюйте розмір фото зі збереженням якості та пропорцій',
    color: 'bg-blue-500',
    path: '/ai-photo-editor/resize'
  },
  {
    icon: TrendingUp,
    title: 'Апскейл (збільшення)',
    description: 'Збільшуйте роздільну здатність фото за допомогою AI',
    color: 'bg-green-500',
    path: '/ai-photo-editor/upscale'
  },
  {
    icon: Palette,
    title: 'Оптимізація якості',
    description: 'Покращуйте якість, яскравість та контрастність зображень',
    color: 'bg-purple-500',
    path: '/ai-photo-editor/optimize'
  },
  {
    icon: Scissors,
    title: 'Видалення фону',
    description: 'Автоматично видаляйте фон з фотографій',
    color: 'bg-red-500',
    path: '/ai-photo-editor/remove-background'
  },
  {
    icon: Move,
    title: 'Розташування зображення',
    description: 'Змінюйте композицію та розташування об\'єктів',
    color: 'bg-indigo-500',
    path: '/ai-photo-editor/reposition'
  },
  {
    icon: Droplets,
    title: 'Видалення водяних знаків',
    description: 'Прибирайте водяні знаки та небажані елементи',
    color: 'bg-cyan-500',
    path: '/ai-photo-editor/watermark-removal'
  },
  {
    icon: FileText,
    title: 'Alt підписи',
    description: 'Генеруйте описи зображень для доступності',
    color: 'bg-orange-500',
    path: '/ai-photo-editor/alt-text'
  },
  {
    icon: Edit,
    title: 'Зміна назви файлу',
    description: 'Автоматично генеруйте SEO-оптимізовані назви файлів',
    color: 'bg-pink-500',
    path: '/ai-photo-editor/rename'
  },
  {
    icon: RefreshCw,
    title: 'Зміна формату',
    description: 'Конвертуйте між JPG, PNG, WEBP та іншими форматами',
    color: 'bg-teal-500',
    path: '/ai-photo-editor/convert'
  },
  {
    icon: Plus,
    title: 'Тематичний фон AI',
    description: 'Додавайте красиві фони згенеровані штучним інтелектом',
    color: 'bg-emerald-500',
    path: '/ai-photo-editor/ai-background'
  },
  {
    icon: Type,
    title: 'Надписи AI',
    description: 'Додавайте стильні надписи та акційні банери',
    color: 'bg-yellow-500',
    path: '/ai-photo-editor/ai-text'
  },
  {
    icon: Sparkles,
    title: 'Покращення якості',
    description: 'Комплексне покращення фото за допомогою AI',
    color: 'bg-violet-500',
    path: '/ai-photo-editor/enhance'
  }
];

export default function AIPhotoEditorHome() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="p-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl shadow-lg">
              <ImageIcon className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-4">
            AI Photo Editor
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Професійний редактор фото з штучним інтелектом. Обробляйте зображення швидко та якісно 
            з широким набором AI-інструментів для будь-яких потреб.
          </p>
        </div>

        {/* Service Selector */}
        <div className="mb-8 flex justify-center">
          <div className="w-full max-w-md">
            <Select onValueChange={(value) => navigate(value)}>
              <SelectTrigger aria-label="Оберіть сервіс">
                <SelectValue placeholder="Оберіть сервіс AI Photo Editor..." />
              </SelectTrigger>
              <SelectContent>
                {photoFeatures.map((feature, index) => (
                  <SelectItem key={index} value={feature.path}>
                    {feature.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Quick Start */}
        <Card className="mb-12 border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <Upload className="w-5 h-5" />
              Швидкий старт
            </CardTitle>
            <CardDescription>
              Завантажте фото та почніть обробку одразу
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                <Link to="/ai-photo-editor/upload">
                  <Upload className="w-4 h-4 mr-2" />
                  Завантажити фото
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/ai-photo-editor/gallery">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Переглянути галерею
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-center mb-8 text-gray-800 dark:text-gray-200">
            Функції AI Photo Editor
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {photoFeatures.map((feature, index) => (
              <Card 
                key={index} 
                className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer border-gray-200 dark:border-gray-700"
              >
                <Link to={feature.path}>
                  <CardHeader className="pb-3">
                    <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-lg group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm leading-relaxed">
                      {feature.description}
                    </CardDescription>
                    <div className="flex items-center mt-3 text-amber-600 dark:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-sm font-medium">Спробувати</span>
                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        </div>

        {/* How it works */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Як це працює</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">1. Завантажте</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Перетягніть фото або виберіть файли з комп'ютера
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">2. Оберіть функцію</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Виберіть потрібну обробку з широкого переліку AI-інструментів
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ImageIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">3. Завантажте результат</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Отримайте оброблене фото у високій якості
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <Card className="inline-block bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-2">Готові почати?</h3>
              <p className="mb-4 opacity-90">Завантажте перше фото та спробуйте AI Photo Editor</p>
              <Button asChild variant="secondary" className="bg-white text-amber-600 hover:bg-gray-100">
                <Link to="/ai-photo-editor/upload">
                  <Upload className="w-4 h-4 mr-2" />
                  Почати роботу
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
