import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../utils/LanguageContext';
import type { AuthSession, AppRole } from '../types';

interface SidebarProps {
  session: AuthSession;
  onLogout: () => Promise<void>;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  navItems: Array<{
    path: string;
    icon?: string;
    label?: string;
    roles: AppRole[];
  }>;
}

const hasRole = (session: AuthSession, allowedRoles: AppRole[]) => allowedRoles.some((role) => session.roles.includes(role));

const Sidebar: React.FC<SidebarProps> = ({ 
  session, 
  onLogout, 
  mobileMenuOpen, 
  setMobileMenuOpen, 
  isCollapsed = false,
  onToggleCollapse,
  navItems 
}) => {
  const { t } = useLanguage();
  const [loggingOut, setLoggingOut] = useState(false);
  const visibleNavItems = navItems.filter((item) => hasRole(session, item.roles));
  const primaryRole = session.roles[0] ?? 'Manager';

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await onLogout();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity lg:hidden" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      <aside className={`
        ${mobileMenuOpen ? 'fixed inset-y-0 left-0 z-50' : 'hidden lg:flex'} 
        ${isCollapsed ? 'w-20' : 'w-64'} 
        flex-col border-r border-gray-200 bg-surface-light dark:border-gray-700 dark:bg-surface-dark transition-all duration-300 ease-in-out relative
      `}>
        {/* Collapse Toggle (Desktop only) */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex absolute -right-3 top-20 z-50 h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 shadow-sm hover:text-primary dark:border-gray-700 dark:bg-gray-800 transition-transform active:scale-95"
        >
          <span className={`material-symbols-outlined text-[18px] transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}>
            chevron_left
          </span>
        </button>

        <div className={`flex h-16 shrink-0 items-center border-b border-gray-100 px-6 dark:border-gray-800 ${isCollapsed ? 'justify-center px-0' : ''}`}>
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex shrink-0 items-center justify-center w-8 h-8 rounded-lg bg-primary text-white">
              <span className="material-symbols-outlined text-xl">apartment</span>
            </div>
            {!isCollapsed && (
              <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white truncate">RentalMgr</span>
            )}
          </div>
        </div>

        <div className={`flex flex-1 flex-col gap-1 overflow-y-auto ${isCollapsed ? 'px-2' : 'px-3'} py-4 no-scrollbar`}>
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `group flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} rounded-lg py-2.5 transition-all ${
                  isActive
                    ? 'bg-primary/10 font-bold text-primary dark:bg-primary/20'
                    : 'text-text-secondary hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                }`
              }
              title={isCollapsed ? item.label : undefined}
            >
              <span className={`material-symbols-outlined ${isCollapsed ? 'text-[24px]' : 'text-[22px]'}`}>{item.icon}</span>
              {!isCollapsed && (
                <span className="truncate whitespace-nowrap overflow-hidden">
                  {t(item.path === '/' ? 'dashboard' : item.label?.replace(' ', '').charAt(0).toLowerCase() + item.label?.replace(' ', '').slice(1) as any)}
                </span>
              )}
            </NavLink>
          ))}
        </div>

        <div className="border-t border-gray-200 p-3 dark:border-gray-700">
          <div className={`rounded-xl bg-gray-50 p-2 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 ${isCollapsed ? 'flex flex-col items-center gap-3' : ''}`}>
            <div className={`flex ${isCollapsed ? 'flex-col' : 'items-center'} gap-3 w-full`}>
              <img
                alt={session.displayName}
                className="h-10 w-10 rounded-full object-cover shrink-0 border-2 border-white dark:border-gray-700"
                src={`https://picsum.photos/seed/${session.username}/100/100`}
              />
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-gray-900 dark:text-white leading-tight">{session.displayName}</div>
                  <span className="truncate text-[11px] text-gray-500 dark:text-gray-400 capitalize">{primaryRole} • Online</span>
                </div>
              )}
            </div>
            
            <button
              className={`flex items-center justify-center rounded-lg border border-gray-200 font-semibold transition-all hover:bg-white dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-900/40 active:scale-95 ${
                isCollapsed ? 'h-8 w-8' : 'w-full py-1.5 mt-2 text-xs text-gray-600'
              }`}
              disabled={loggingOut}
              onClick={() => void handleLogout()}
              type="button"
              title={t('sign_out')}
            >
              <span className={`material-symbols-outlined text-[18px] ${isCollapsed ? '' : 'mr-1'}`}>logout</span>
              {!isCollapsed && (loggingOut ? '...' : t('sign_out'))}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
