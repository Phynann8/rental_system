import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useLanguage } from '../utils/LanguageContext';
import { useTheme } from '../utils/ThemeContext';
import NotificationBell from './NotificationBell';

interface HeaderProps {
  onToggleMenu: () => void;
  isSidebarCollapsed?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onToggleMenu, isSidebarCollapsed }) => {
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return t('dashboard');
    if (path === '/buildings') return t('properties');
    if (path === '/rooms') return t('rooms');
    if (path === '/tenants') return t('tenants');
    if (path === '/new-lease') return t('newLease');
    if (path === '/invoices') return t('invoices');
    if (path === '/readings') return t('readings');
    if (path === '/reports') return t('reports');
    if (path === '/maintenance') return t('maintenance');
    if (path === '/settings') return t('settings');
    if (path === '/billing') return t('billing');
    if (path === '/print') return t('print');
    if (path.startsWith('/portal')) {
      if (path === '/portal') return t('dashboard');
      if (path === '/portal/invoices') return t('invoices');
      if (path === '/portal/confirm-payment') return t('record_payment');
      return 'Portal';
    }
    return 'RentalMgr';
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-surface-light dark:bg-surface-dark dark:border-gray-700 px-4 sm:px-6 lg:px-8 transition-all duration-300">
      <div className="flex items-center gap-4 min-w-0">
        <button 
          onClick={onToggleMenu}
          className="lg:hidden flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 shadow-sm transition-all active:scale-95"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <h1 className="text-xl font-extrabold text-gray-900 dark:text-white transition-all duration-300 truncate tracking-tight">{getPageTitle()}</h1>
        <div className="hidden md:flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-[11px] font-bold text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800">
          <span className="flex h-1.5 w-1.5 rounded-full bg-green-500 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          </span>
          <span className="uppercase tracking-wider">{t('system_online')}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 ml-4">
        <div className="relative hidden xl:block">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <span className="material-symbols-outlined text-[20px]">search</span>
          </span>
          <input
            className="block w-64 rounded-xl border-0 bg-gray-100/80 py-2 pl-10 pr-3 text-sm text-gray-900 focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 transition-all border border-transparent dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700/50"
            placeholder="Search..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden xs:flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 p-0.5 bg-gray-50 dark:bg-gray-800 shadow-inner">
            <button 
              onClick={() => setLanguage('en')}
              className={`px-2 py-1 text-[10px] font-bold rounded ${language === 'en' ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
            >
              EN
            </button>
            <button 
              onClick={() => setLanguage('km')}
              className={`px-3 py-1 text-[10px] font-bold rounded ${language === 'km' ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
            >
              ខ្មែរ
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-500 hover:bg-white hover:text-primary dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 transition-all active:scale-90 shadow-sm"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              <span className="material-symbols-outlined text-[20px]">
                {theme === 'light' ? 'dark_mode' : 'light_mode'}
              </span>
            </button>
            <NotificationBell />
          </div>

          <NavLink
            to="/invoices"
            className="hidden sm:flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/20 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900 shadow-md transition-all active:scale-95 whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            {t('new_invoice')}
          </NavLink>
        </div>
      </div>
    </header>
  );
};

export default Header;
