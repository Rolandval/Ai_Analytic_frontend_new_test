import {
  FileSpreadsheet,
  Database,
  BarChart3,
  LineChart
} from 'lucide-react';
import { NavItem } from './nav';

export const forecastingNavItems: NavItem[] = [
  {
    title: 'Прогнозування',
    icon: LineChart,
    subItems: [
      {
        title: 'Отримання CSV даних',
        href: '/ai-forecast/csv-dataset',
        icon: FileSpreadsheet,
      },
      {
        title: 'SQL запити',
        href: '/ai-forecast/sql-queries',
        icon: Database, 
      },
      {
        title: 'Аналітика',
        href: '/ai-forecast/analytics',
        icon: BarChart3,
      },
    ],
  },
];
