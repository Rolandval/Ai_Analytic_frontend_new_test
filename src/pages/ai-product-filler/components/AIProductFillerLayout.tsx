import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Wand2, Layers, Settings } from 'lucide-react';

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
  const [hovered, setHovered] = React.useState(false);
  return (
    <div className="min-h-screen bg-[#FAFDFF] dark:bg-neutral-950">
      <div className="w-full px-0 py-0">
        <div className={`grid gap-4 lg:grid-cols-[auto_1fr]`}>
          {/* Sidebar: unified row (icon + label) with hover-expand */}
          <aside
            id="ai-pf-sidebar"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className={`group relative overflow-hidden dark:bg-neutral-900/70 ring-1 ring-black/5 backdrop-blur transition-[width] ${hovered ? 'duration-300 ease-out' : 'duration-150 ease-in'} ${hovered ? 'w-[220px] open' : 'w-10'} hover:w-[220px]`}
          >
            {/* Header */}
            <div className="h-12 flex items-center border-b px-3 min-w-0">
              <div className="h-6 w-6 rounded-sm bg-[#F5F5DC] ring-1 ring-black/5 flex items-center justify-center mr-2 shrink-0">
                <div className="h-3.5 w-3.5 rounded-sm bg-emerald-500/80" aria-hidden />
              </div>
              {/* Title: avoid wrap and width jump using max-width animation */}
              <span
                className={[
                  'text-sm font-semibold text-neutral-700 dark:text-neutral-200',
                  'opacity-0 group-[.open]:opacity-100 group-hover:opacity-100',
                  hovered ? 'duration-300' : 'duration-150',
                  'transition-opacity',
                  'whitespace-nowrap overflow-hidden',
                  'max-w-0 group-[.open]:max-w-[160px] group-hover:max-w-[160px] transition-[max-width]',
                ].join(' ')}
              >
                AI Product Filler
              </span>
            </div>

            {/* Nav unified rows */}
            <nav>
              <ul className="py-1">
                {navItems.map(({ to, label, icon: Icon }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={to === '/ai-product-filler'}
                      className={({ isActive }) =>
                        [
                          'flex items-center h-10 px-3 text-sm transition-colors',
                          isActive
                            ? 'bg-emerald-200/70 text-emerald-900'
                            : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800/70',
                        ].join(' ')
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {/* Label: prevent wrap and flicker with max-width animation */}
                      <span
                        className={[
                          'ml-3 whitespace-nowrap overflow-hidden',
                          'opacity-0 group-[.open]:opacity-100 group-hover:opacity-100',
                          hovered ? 'duration-300' : 'duration-150',
                          'transition-opacity',
                          'max-w-0 group-[.open]:max-w-[160px] group-hover:max-w-[160px] transition-[max-width]',
                        ].join(' ')}
                      >
                        {label}
                      </span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Main content */}
          <main className="min-w-0 relative">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
