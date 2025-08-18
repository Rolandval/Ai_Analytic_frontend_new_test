import {
  TrendingUp,
  Bot,
  LayoutGrid,
  Battery,
  Sun,
  Zap,
  History,
  ShoppingBasket,
  Upload,
  Users,
  ListTodo,
  MessageSquare,
  Settings
} from 'lucide-react';

export type NavItem = {
  title: string;
  href?: string;
  disabled?: boolean;
  external?: boolean;
  icon?: React.FC<React.SVGProps<SVGSVGElement>>;
  label?: string;
  description?: string;
  subItems?: NavItem[];
  basePath?: string;
  color?: string;
};

export const navItems: NavItem[] = [
  {
    title: 'Акумулятори',
    basePath: '/batteries',
    color: 'hsl(142.1 76.2% 36.3%)',
    icon: Battery,
    subItems: [
      { title: 'Довідник', href: '/batteries/directory', icon: LayoutGrid },
      { title: 'Дані, які потребують уточнення', href: '/batteries/directory/lost', icon: ListTodo },
      { title: 'Історія прайсів', href: '/batteries/price-history', icon: History },
      { title: 'Ціни в наявності', href: '/prices/batteries', icon: ShoppingBasket },
      { title: 'Порівняння цін', href: '/prices/batteries/comparison', icon: TrendingUp },
      { title: 'Аналітика', href: '/batteries/analytics', icon: TrendingUp },
      { title: 'Постачальники', href: '/batteries/suppliers', icon: Users },
      { title: 'Збережені таблиці', href: '/batteries/google-tables', icon: LayoutGrid },
      { title: 'Задачі', href: '/batteries/tasks', icon: ListTodo },
    ],
  },
  {
    title: 'Сонячні панелі',
    basePath: '/solar-panels',
    color: 'hsl(47.9 95.8% 53.1%)',
    icon: Sun,
    subItems: [
      { title: 'Довідник', href: '/solar-panels/directory', icon: LayoutGrid },
      { title: 'Дані, які потребують уточнення', href: '/solar-panels/directory/lost', icon: ListTodo },
      { title: 'Історія цін', href: '/solar-panels/price-history', icon: History },
      { title: 'Ціни в наявності', href: '/prices/solar-panels', icon: ShoppingBasket },
      { title: 'Порівняння цін', href: '/prices/solar-panels/comparison', icon: TrendingUp },
      { title: 'Аналітика', href: '/solar-panels/analytics', icon: TrendingUp },
      { title: 'Постачальники', href: '/solar-panels/suppliers', icon: Users },
      { title: 'Збережені таблиці', href: '/solar-panels/google-tables', icon: LayoutGrid },
      { title: 'Задачі', href: '/solar-panels/tasks', icon: ListTodo },
    ],
  },
  {
    title: 'Інвертори',
    basePath: '/inverters',
    color: 'hsl(221.2 83.2% 53.3%)',
    icon: Zap,
    subItems: [
      { title: 'Довідник', href: '/inverters/directory', icon: LayoutGrid },
      { title: 'Дані, які потребують уточнення', href: '/inverters/directory/lost', icon: ListTodo },
      { title: 'Історія цін', href: '/inverters/price-history', icon: History },
      { title: 'Ціни в наявності', href: '/prices/inverters', icon: ShoppingBasket },
      { title: 'Порівняння цін', href: '/prices/inverters/comparison', icon: TrendingUp },
      { title: 'Аналітика', href: '/inverters/analytics', icon: TrendingUp },
      { title: 'Постачальники', href: '/inverters/suppliers', icon: Users },
      { title: 'Збережені таблиці', href: '/inverters/google-tables', icon: LayoutGrid },
      { title: 'Задачі', href: '/inverters/tasks', icon: ListTodo },
    ],
  },
  {
    title: 'Імпорт',
    icon: Upload,
    subItems: [
      {
        title: 'Завантаження звітів',
        href: '/reports/upload',
        icon: Upload,
      },
    ],
  },
  {
    title: 'AI Чат',
    basePath: '/ai-chat',
    color: 'hsl(262.1 83.3% 57.8%)',
    icon: Bot,
    subItems: [
      { title: 'Чат', href: '/ai-chat', icon: MessageSquare },
      { title: 'AI Розширення', href: '/ai-chat/extensions', icon: Settings },
      { title: 'AI моделі', href: '/ai-chat/models', icon: Bot },
    ],
  },
];
