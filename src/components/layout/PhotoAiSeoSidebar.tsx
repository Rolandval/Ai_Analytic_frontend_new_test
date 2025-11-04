import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  ImageIcon, 
  Settings, 
  Sparkles,
  ChevronRight,
  Home
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<any>;
  description?: string;
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/photo-ai-seo',
    icon: Home,
    description: 'Main workspace'
  },
  {
    title: 'Settings',
    href: '/photo-ai-seo/settings',
    icon: Settings,
    description: 'Configuration'
  }
];

export default function PhotoAiSeoSidebar() {
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <div className="w-72 h-screen bg-gradient-to-b from-cyan-50 via-blue-50 to-sky-50 dark:from-slate-900 dark:via-cyan-950 dark:to-blue-950 border-r border-cyan-200/50 dark:border-cyan-800/30 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-cyan-200/50 dark:border-cyan-800/30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-500 to-sky-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
            <ImageIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-700 via-blue-600 to-sky-700 dark:from-cyan-300 dark:via-blue-300 dark:to-sky-300 bg-clip-text text-transparent">
              Photo-AI-SEO
            </h1>
            <p className="text-sm text-cyan-600 dark:text-cyan-400">Smart Optimization</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          const isHovered = hoveredItem === item.href;

          return (
            <Link
              key={item.href}
              to={item.href}
              onMouseEnter={() => setHoveredItem(item.href)}
              onMouseLeave={() => setHoveredItem(null)}
              className={cn(
                'group relative flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 hover:scale-[1.02]',
                isActive 
                  ? 'bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-sky-500/20 dark:from-cyan-400/20 dark:via-blue-400/20 dark:to-sky-400/20 shadow-lg shadow-cyan-500/10 border border-cyan-300/30 dark:border-cyan-600/30' 
                  : 'hover:bg-gradient-to-r hover:from-cyan-100/50 hover:via-blue-100/50 hover:to-sky-100/50 dark:hover:from-cyan-900/30 dark:hover:via-blue-900/30 dark:hover:to-sky-900/30'
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-cyan-500 to-blue-600 rounded-r-full" />
              )}

              {/* Icon */}
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300',
                isActive 
                  ? 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25' 
                  : 'bg-white/60 dark:bg-slate-800/60 group-hover:bg-gradient-to-br group-hover:from-cyan-400 group-hover:to-blue-500 group-hover:shadow-lg group-hover:shadow-cyan-400/20'
              )}>
                <Icon className={cn(
                  'w-5 h-5 transition-colors duration-300',
                  isActive 
                    ? 'text-white' 
                    : 'text-cyan-600 dark:text-cyan-400 group-hover:text-white'
                )} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className={cn(
                    'font-semibold text-sm transition-colors duration-300',
                    isActive 
                      ? 'text-cyan-700 dark:text-cyan-300' 
                      : 'text-slate-700 dark:text-slate-300 group-hover:text-cyan-700 dark:group-hover:text-cyan-300'
                  )}>
                    {item.title}
                  </h3>
                  <ChevronRight className={cn(
                    'w-4 h-4 transition-all duration-300',
                    isActive || isHovered 
                      ? 'text-cyan-500 dark:text-cyan-400 translate-x-1' 
                      : 'text-slate-400 dark:text-slate-500'
                  )} />
                </div>
                {item.description && (
                  <p className={cn(
                    'text-xs mt-1 transition-colors duration-300',
                    isActive 
                      ? 'text-cyan-600 dark:text-cyan-400' 
                      : 'text-slate-500 dark:text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400'
                  )}>
                    {item.description}
                  </p>
                )}
              </div>

              {/* Hover glow effect */}
              {isHovered && (
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/5 via-blue-500/5 to-sky-500/5 pointer-events-none" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-cyan-200/50 dark:border-cyan-800/30">
        <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-100/50 via-blue-100/50 to-sky-100/50 dark:from-cyan-900/30 dark:via-blue-900/30 dark:to-sky-900/30 border border-cyan-200/30 dark:border-cyan-700/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-cyan-700 dark:text-cyan-300">AI Powered</p>
              <p className="text-xs text-cyan-600 dark:text-cyan-400">Smart optimization</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
