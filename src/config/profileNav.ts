import { 
  User, 
  Settings, 
  CreditCard, 
  Shield, 
  Bell, 
  Package,
  BarChart3,
  FileText,
  Download,
  Trash2
} from 'lucide-react';

export interface ProfileNavItem {
  title: string;
  href: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  description: string;
  basePath?: string;
  subItems?: ProfileNavItem[];
}

export const profileNavItems: ProfileNavItem[] = [
  {
    title: 'Огляд',
    href: '/profile',
    icon: User,
    description: 'Загальна інформація про профіль та статистика',
    basePath: '/profile'
  },
  {
    title: 'Мої сервіси',
    href: '/profile/services',
    icon: Package,
    description: 'Управління підключеними AI сервісами',
    basePath: '/profile/services'
  },
  {
    title: 'Підписки та тарифи',
    href: '/profile/subscriptions',
    icon: CreditCard,
    description: 'Управління підписками та тарифними планами',
    basePath: '/profile/subscriptions',
    subItems: [
      {
        title: 'Активні підписки',
        href: '/profile/subscriptions/active',
        icon: Package,
        description: 'Переглянути активні підписки'
      },
      {
        title: 'Історія платежів',
        href: '/profile/subscriptions/billing',
        icon: FileText,
        description: 'Історія та майбутні платежі'
      },
      {
        title: 'Змінити план',
        href: '/profile/subscriptions/plans',
        icon: CreditCard,
        description: 'Порівняти та змінити тарифні плани'
      }
    ]
  },
  {
    title: 'Аналітика використання',
    href: '/profile/analytics',
    icon: BarChart3,
    description: 'Статистика використання сервісів',
    basePath: '/profile/analytics'
  },
  {
    title: 'Налаштування',
    href: '/profile/settings',
    icon: Settings,
    description: 'Персональні налаштування акаунту',
    basePath: '/profile/settings',
    subItems: [
      {
        title: 'Особиста інформація',
        href: '/profile/settings/personal',
        icon: User,
        description: 'Редагувати особисту інформацію'
      },
      {
        title: 'Безпека',
        href: '/profile/settings/security',
        icon: Shield,
        description: 'Пароль та двофакторна автентифікація'
      },
      {
        title: 'Сповіщення',
        href: '/profile/settings/notifications',
        icon: Bell,
        description: 'Налаштування сповіщень'
      }
    ]
  },
  {
    title: 'Експорт даних',
    href: '/profile/export',
    icon: Download,
    description: 'Завантажити копію ваших даних',
    basePath: '/profile/export'
  },
  {
    title: 'Видалити акаунт',
    href: '/profile/delete',
    icon: Trash2,
    description: 'Назавжди видалити акаунт',
    basePath: '/profile/delete'
  }
];
