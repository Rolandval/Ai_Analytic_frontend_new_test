import {
  Facebook,
  LayoutGrid,
  Search,
} from 'lucide-react';

import type { NavItem } from './nav';

export const adsManagerNavItems: NavItem[] = [
  {
    title: 'Соцмережі',
    basePath: '/ai-ads/social',
    color: 'hsl(25, 95%, 50%)', // оранжевий колір для ads-manager
    icon: LayoutGrid,
    subItems: [
      { 
        title: 'Facebook', 
        href: '/ai-ads/social/facebook', 
        icon: Facebook 
      },
      { 
        title: 'Google Ad', 
        href: '/ai-ads/social/google', 
        icon: Search 
      },
    ],
  },
];
