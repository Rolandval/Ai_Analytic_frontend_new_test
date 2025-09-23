import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Wand2, Layers, Settings, Languages, BarChart2, List, LogOut } from 'lucide-react';
import { FillerThemeSwitcher } from './FillerThemeSwitcher';
import { ServiceDropdown } from '@/components/layout/ServiceDropdown';
import { PFI18nProvider, usePFI18n } from '../i18n';
import { useAuthStore } from '@/store/authStore';
import { TokenStatusPanel } from '@/components/layout/TokenStatusPanel';

interface Props {
  children: React.ReactNode;
}

function InnerLayout({ children }: Props) {
  const { t } = usePFI18n();
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const navItems = [
    { to: '/ai-product-filler', label: t('nav.general'), icon: Home },
    { to: '/ai-product-filler/generation', label: t('nav.generation'), icon: Wand2 },
    { to: '/ai-product-filler/analysis', label: t('nav.analysis'), icon: BarChart2 },
    { to: '/ai-product-filler/characteristics', label: t('nav.characteristics'), icon: List },
    { to: '/ai-product-filler/templates', label: t('nav.templates'), icon: Layers },
    { to: '/ai-product-filler/translator', label: t('nav.translator'), icon: Languages },
    { to: '/auth', label: t('nav.logout'), icon: LogOut, onClick: () => { try { logout(); } finally { navigate('/auth', { replace: true }); } } },
    { to: '/ai-product-filler/settings', label: t('nav.settings'), icon: Settings },
  ];
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
            className={`group relative overflow-hidden dark:bg-neutral-900/70 ring-1 ring-black/5 dark:ring-white/10 backdrop-blur transition-[width] ${hovered ? 'duration-300 ease-out' : 'duration-150 ease-in'} ${hovered ? 'w-[220px] open' : 'w-10'} hover:w-[220px]`}
          >
            {/* Header */}
            <div className="h-12 flex items-center border-b px-2 min-w-0">
              <div className="h-6 w-6 rounded-sm bg-[#F5F5DC] ring-1 ring-black/5 flex items-center justify-center mr-2 shrink-0">
              <div className="rounded-2xl p-2 bg-primary/15">
              <div className=" ">
                <svg className="w-2 h-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L4 8V16L12 22L20 16V8L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 22V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M20 8L12 16L4 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 16L12 8L20 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 2V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>              </div>
              {/* Animated title (like before) */}
              <span
                className={[
                  'text-sm font-semibold text-neutral-700 dark:text-neutral-200',
                  'opacity-0 group-[.open]:opacity-100 group-hover:opacity-100',
                  hovered ? 'duration-300' : 'duration-150',
                  'transition-opacity',
                  'whitespace-nowrap overflow-hidden',
                  'max-w-0 group-[.open]:max-w-[160px] group-hover:max-w-[160px] transition-[max-width]',
                  'pointer-events-none group-[.open]:pointer-events-auto group-hover:pointer-events-auto',
                ].join('  ')}
              >
                AI Product Filler
              </span>
              {/* Services dropdown placed outside overflow-hidden to avoid clipping */}
              <div className="ml-1">
                <ServiceDropdown />
              </div>
            </div>

            {/* Nav unified rows */}
            <div className='flex h-screen flex-col justify-between'>
            <nav>
              <ul className="py-1">
                {navItems.map(({ to, label, icon: Icon, onClick }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={to === '/ai-product-filler'}
                      onClick={onClick as any}
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
                          // Не перехоплюємо події у згорнутому стані
                          'pointer-events-none group-[.open]:pointer-events-auto group-hover:pointer-events-auto',
                        ].join(' ')}
                      >
                        {label}
                      </span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
             
            </div>

          </aside>
          {/* Main content */}
          <main className="min-w-0 relative bg-[#FAFDFF] dark:bg-neutral-900">
        
            {children}
          </main>
        </div>
      </div>
      {/* Floating theme switcher (bottom-left) */}
      <div className="fixed left-1 bottom-1 z-[9999]">
        <FillerThemeSwitcher
          mode="toggle"
          className="h-8 w-8 rounded-full border bg-white/90 dark:bg-neutral-900/80 shadow-md ring-1 ring-black/5 dark:ring-white/10 text-neutral-700 dark:text-neutral-200 cursor-pointer"
        />
      </div>
      
      {/* Панель статусів токенів та системи - доступна на всіх сторінках AI Product Filler */}
      <TokenStatusPanel />
    </div>
  );
}

export default function AIProductFillerLayout({ children }: Props) {
  return (
    <PFI18nProvider>
      <InnerLayout>{children}</InnerLayout>
    </PFI18nProvider>
  );
}
