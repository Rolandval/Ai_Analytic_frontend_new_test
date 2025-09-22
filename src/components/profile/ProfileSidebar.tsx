import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { profileNavItems } from '@/config/profileNav';
import { cn } from '@/lib/utils';
import { LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface ProfileSidebarProps {
  className?: string;
}

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ className }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const isActive = (href: string, basePath?: string) => {
    const base = basePath || href;
    return location.pathname === href || location.pathname.startsWith(base);
  };

  return (
    <aside className={cn('w-full lg:w-[260px] bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl p-3 sticky top-4 h-max', className)}>
      <nav className="space-y-1">
        {profileNavItems.map((item) => (
          <div key={item.href}>
            <NavLink
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-secondary/70 transition-colors',
                isActive(item.href, item.basePath) && 'bg-secondary/70 font-medium'
              )}
              title={item.description}
            >
              <item.icon className="w-4 h-4" />
              <span className="truncate">{item.title}</span>
            </NavLink>
            {item.subItems && item.subItems.length > 0 && (
              <div className="ml-8 mt-1 space-y-1">
                {item.subItems.map((sub) => (
                  <NavLink
                    key={sub.href}
                    to={sub.href}
                    className={cn(
                      'flex items-center gap-2 rounded-md px-2 py-1 text-xs hover:bg-secondary/70 transition-colors',
                      isActive(sub.href, sub.basePath) && 'bg-secondary/70 font-medium'
                    )}
                    title={sub.description}
                  >
                    <sub.icon className="w-3.5 h-3.5" />
                    <span className="truncate">{sub.title}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="mt-3 pt-3 border-t border-white/20">
        <button
          className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-red-50 text-red-600 border border-red-100"
          onClick={() => {
            try { logout(); } finally { navigate('/auth', { replace: true }); }
          }}
        >
          <LogOut className="w-4 h-4" />
          <span className="truncate">Вийти</span>
        </button>
      </div>
    </aside>
  );
};

export default ProfileSidebar;
