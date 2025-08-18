import { NavItem } from '@/config/nav/types';

export const contentNav: NavItem[] = [
  {
    title: 'Генерація контенту',
    path: '/ai-content/generation',
    children: [
      {
        title: 'Генерація поста для сайту',
        path: '/ai-content/generation/post'
      }
    ]
  }
];
