import {
  BarChart3,
  ClipboardList,
  Search,
  ShoppingCart,
  Send,
} from 'lucide-react';

import type { NavItem } from './nav';

export const supplyManagerNavItems: NavItem[] = [
  {
    title: 'Аналіз дефіциту',
    basePath: '/ai-supply/shelf-analysis',
    color: 'hsl(110, 80%, 40%)', // зелений колір для supply manager
    icon: BarChart3,
    subItems: [
      { 
        title: 'Аналіз чого немає на полицях', 
        href: '/ai-supply/shelf-analysis', 
        icon: BarChart3 
      },
    ],
  },
  {
    title: 'Список товарів',
    basePath: '/ai-supply/product-list',
    icon: ClipboardList,
    subItems: [
      { 
        title: 'Вручну наданий список товарів', 
        href: '/ai-supply/product-list', 
        icon: ClipboardList 
      },
    ],
  },
  {
    title: 'Аналіз постачальників',
    basePath: '/ai-supply/supplier-analysis',
    icon: Search,
    subItems: [
      { 
        title: 'Аналіз постачальників і аналогів', 
        href: '/ai-supply/supplier-analysis', 
        icon: Search 
      },
    ],
  },
  {
    title: 'Формування замовлень',
    basePath: '/ai-supply/orders',
    icon: ShoppingCart,
    subItems: [
      { 
        title: 'Формування списків замовлень', 
        href: '/ai-supply/orders', 
        icon: ShoppingCart 
      },
    ],
  },
  {
    title: 'Відправка замовлень',
    basePath: '/ai-supply/send-orders',
    icon: Send,
    subItems: [
      { 
        title: 'Відправка замовлень постачальникам', 
        href: '/ai-supply/send-orders', 
        icon: Send 
      },
    ],
  },
];
