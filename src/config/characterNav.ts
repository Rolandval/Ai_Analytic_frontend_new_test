import { QrCode } from 'lucide-react';
import type { NavItem } from '@/config/nav';

export const characterNavItems: NavItem[] = [
  {
    title: 'QR Code',
    icon: QrCode,
    basePath: '/ai-character/qr-code',
    subItems: [
      {
        title: 'Генерація QR-кодів',
        href: '/ai-character/qr-code/generate',
        icon: QrCode,
      }
    ]
  }
];
