import {
  Camera,
  LayoutGrid,
  Maximize,
  TrendingUp,
  Palette,
  Scissors,
  Move,
  Droplets,
  FileText,
  Edit,
  RefreshCw,
  Plus,
  Type,
  Sparkles,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';

import type { NavItem } from './nav';

export const photoEditorNavItems: NavItem[] = [
  {
    title: 'AI Photo Editor',
    basePath: '/ai-photo-editor',
    color: '#f59e0b',
    icon: Camera,
    subItems: [
      { title: 'Головна', href: '/ai-photo-editor', icon: LayoutGrid },
      { title: 'Завантаження', href: '/ai-photo-editor/upload', icon: Upload },
      { title: 'Галерея', href: '/ai-photo-editor/gallery', icon: ImageIcon },
      { title: 'Ресайз', href: '/ai-photo-editor/resize', icon: Maximize },
      { title: 'Апскейл', href: '/ai-photo-editor/upscale', icon: TrendingUp },
      { title: 'Оптимізація якості', href: '/ai-photo-editor/optimize', icon: Palette },
      { title: 'Видалення фону', href: '/ai-photo-editor/remove-background', icon: Scissors },
      { title: 'Розташування', href: '/ai-photo-editor/reposition', icon: Move },
      { title: 'Видалення водяних знаків', href: '/ai-photo-editor/watermark-removal', icon: Droplets },
      { title: 'Alt підписи', href: '/ai-photo-editor/alt-text', icon: FileText },
      { title: 'Зміна назви файлу', href: '/ai-photo-editor/rename', icon: Edit },
      { title: 'Конвертація', href: '/ai-photo-editor/convert', icon: RefreshCw },
      { title: 'Тематичний фон AI', href: '/ai-photo-editor/ai-background', icon: Plus },
      { title: 'Надписи AI', href: '/ai-photo-editor/ai-text', icon: Type },
      { title: 'Покращення якості', href: '/ai-photo-editor/enhance', icon: Sparkles },
    ],
  },
];
