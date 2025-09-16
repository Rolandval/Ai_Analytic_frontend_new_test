import {
  Settings,
  LayoutGrid,
} from 'lucide-react';

import type { NavItem } from './nav';

export const productFillerNavItems: NavItem[] = [
  {
    title: 'Генерація контенту',
    basePath: '/ai-product-filler',
    color: 'hsl(210, 80%, 50%)',
    icon: LayoutGrid,
    subItems: [
      {
        title: 'Генерація',
        href: '/ai-product-filler/generation',
      },
      {
        title: 'Шаблони',
        href: '/ai-product-filler/templates',
      },
      {
        title: 'Перекладач',
        href: '/ai-product-filler/translator',
      },
      {
        title: 'Аналіз',
        href: '/ai-product-filler/analysis',
      },
      {
        title: 'Характеристики',
        href: '/ai-product-filler/characteristics',
      },
    ],
  },
  {
    title: 'Налаштування',
    basePath: '/ai-product-filler/settings',
    color: 'hsl(210, 80%, 50%)',
    icon: Settings,
    subItems: [
      {
        title: 'Налаштування',
        href: '/ai-product-filler/settings',
      },
    ],
  },
];
