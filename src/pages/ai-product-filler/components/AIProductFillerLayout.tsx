import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Wand2, Layers, Settings, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

const navItems = [
  { to: '/ai-product-filler', label: 'Загальне', icon: Home },
  { to: '/ai-product-filler/generation', label: 'Генерація', icon: Wand2 },
  { to: '/ai-product-filler/templates', label: 'Шаблони', icon: Layers },
  { to: '/ai-product-filler/settings', label: 'Налаштування', icon: Settings },
];

export default function AIProductFillerLayout({ children }: Props) {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  return (
    <div className="min-h-screen bg-[#FAFDFF] dark:bg-neutral-950">
      <div className="w-full px-0 py-0">
        <div className={`grid gap-4 ${sidebarOpen ? 'lg:grid-cols-[220px_1fr]' : 'lg:grid-cols-1'}`}>
          {/* Sidebar */}
          {sidebarOpen && (
          <aside id="ai-pf-sidebar" className="relative dark:bg-neutral-900/70 ring-1 ring-black/5 backdrop-blur">
            {/* Side arrow toggle (collapse) */}
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              title="Сховати сайдбар"
              aria-label="Сховати сайдбар"
              className="absolute top-52 right-0 translate-x-1/2 z-20 h-9 w-9 rounded-full bg-white/90 dark:bg-neutral-900/80 shadow ring-1 ring-black/5 hover:bg-white dark:hover:bg-neutral-800 transition flex items-center justify-center text-neutral-600 hover:text-neutral-900 dark:text-neutral-300"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="px-4 py-3 border-b">
              <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">AI Product Filler</span>
            </div>
            <nav className=" ">
              <ul className="space-y-1">
                {navItems.map(({ to, label, icon: Icon }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={to === '/ai-product-filler'}
                      className={({ isActive }) =>
                        [
                          'flex items-center gap-3   px-3 py-2 text-sm transition-colors',
                          isActive
                            ? 'bg-emerald-200/70 text-emerald-900'
                            : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800/70',
                        ].join(' ')
                      }
                    >
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
          )}

          {/* Main content */}
          <main className="min-w-0 relative">
            {!sidebarOpen && (
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                title="Показати сайдбар"
                aria-label="Показати сайдбар"
                className="absolute top-52 left-2 z-20 h-9 w-9 rounded-full bg-white/90 dark:bg-neutral-900/80 shadow ring-1 ring-black/5 hover:bg-white dark:hover:bg-neutral-800 transition flex items-center justify-center text-neutral-600 hover:text-neutral-900 dark:text-neutral-300"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
