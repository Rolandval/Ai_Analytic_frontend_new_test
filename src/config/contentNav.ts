import {
  FileText,
  LayoutGrid,
} from 'lucide-react';

import type { NavItem } from './nav';

export const contentNavItems: NavItem[] = [
  {
    title: 'Генерація контенту',
    basePath: '/ai-content/generation',
    color: 'hsl(274, 87%, 43%)',
    icon: LayoutGrid,
    subItems: [
      { 
        title: 'Генерація поста для сайту', 
        href: '/ai-content/generation/post', 
        icon: FileText 
      },
    ],
  },
];
