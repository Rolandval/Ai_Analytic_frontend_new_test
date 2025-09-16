import { 
  LayoutDashboard, 
  MessageSquare, 
  FileBarChart, 
  BarChart3,
  MessageCircle,
} from 'lucide-react';

export const businessAgentNavItems = [
  {
    title: 'Огляд',
    icon: LayoutDashboard,
    basePath: '/ai-business-agent',
    subItems: [
      {
        title: 'Дашборд',
        href: '/ai-business-agent',
        icon: BarChart3,
      },
    ],
  },
  {
    title: 'Взаємодія',
    icon: MessageSquare,
    basePath: '/ai-business-agent/chat',
    subItems: [
      {
        title: 'Чат з агентом',
        href: '/ai-business-agent/chat',
        icon: MessageCircle,
      },
    ],
  },
  {
    title: 'Аналітика',
    icon: FileBarChart,
    basePath: '/ai-business-agent/reports',
    subItems: [
      {
        title: 'Звіти',
        href: '/ai-business-agent/reports',
        icon: FileBarChart,
      },
    ],
  },
];
