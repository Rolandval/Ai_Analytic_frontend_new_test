import {
  FileText,
  LayoutGrid,
  FilePlus,
  FileCheck
} from 'lucide-react';

import { NavItem } from './nav';

export const accountantNavItems: NavItem[] = [
  {
    title: 'Розпізнавання документів',
    basePath: '/ai-accountant/documents',
    color: 'hsl(214, 59%, 26%)',
    icon: FileText,
    subItems: [
      { 
        title: 'Розпізнавання накладних', 
        href: '/ai-accountant/documents/invoices', 
        icon: FileCheck 
      },
    ],
  },
];
