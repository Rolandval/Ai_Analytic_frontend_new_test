import { FileSpreadsheet } from 'lucide-react';
import type { NavItem } from './nav';

export const priceBuilderNavItems: NavItem[] = [
  {
    title: 'Формування прайсів',
    basePath: '/ai-price-builder',
    color: 'hsl(200, 90%, 45%)',
    icon: FileSpreadsheet,
    subItems: [
      {
        title: 'Головна',
        href: '/ai-price-builder',
      },
      {
        title: 'Генератор прайсу',
        href: '/ai-price-builder/generate',
      },
    ],
  },
];
