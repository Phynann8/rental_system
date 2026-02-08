
import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Buildings from './pages/Buildings';
import Rooms from './pages/Rooms';
import Readings from './pages/Readings';
import Invoices from './pages/Invoices';
import Tenants from './pages/Tenants';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import NewLease from './pages/NewLease';
import PrintPreview from './pages/PrintPreview';

const Sidebar = () => {
  return (
    <aside className="hidden w-64 flex-col bg-surface-light dark:bg-surface-dark border-r border-gray-200 dark:border-gray-700 md:flex z-50">
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white">
            <span className="material-symbols-outlined text-xl">apartment</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">RentalMgr</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        {[
          { to: '/', icon: 'dashboard', label: 'Dashboard' },
          { to: '/buildings', icon: 'domain', label: 'Properties' },
          { to: '/rooms', icon: 'grid_view', label: 'Rooms' },
          { to: '/tenants', icon: 'group', label: 'Tenants' },
          { to: '/invoices', icon: 'receipt_long', label: 'Invoices', badge: 4 },
          { to: '/readings', icon: 'edit_note', label: 'Readings' },
          { to: '/reports', icon: 'bar_chart', label: 'Reports' },
        ].map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                isActive
                  ? 'bg-primary/10 text-primary font-bold'
                  : 'text-text-secondary hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
              }`
            }
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            {item.label}
            {item.badge && (
              <span className="ml-auto rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
        <div className="my-2 h-px bg-gray-200 dark:bg-gray-700 mx-3"></div>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `group flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
              isActive
                ? 'bg-primary/10 text-primary font-bold'
                : 'text-text-secondary hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
            }`
          }
        >
          <span className="material-symbols-outlined">settings</span>
          Settings
        </NavLink>
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-3 rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
          <img
            alt="Profile"
            className="h-10 w-10 rounded-full object-cover"
            src="https://picsum.photos/seed/vibol/100/100"
          />
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-sm font-medium text-gray-900 dark:text-white">Vibol Sok</span>
            <span className="truncate text-xs text-gray-500 dark:text-gray-400">Manager • Online</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

const Header = () => {
  const location = useLocation();
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path === '/buildings') return 'Properties';
    if (path === '/rooms') return 'Room Inventory';
    if (path === '/tenants') return 'Tenant Directory';
    if (path === '/invoices') return 'Invoice Management';
    if (path === '/readings') return 'Monthly Utility Readings';
    if (path === '/reports') return 'Financial Reports';
    if (path === '/settings') return 'Settings';
    if (path === '/new-lease') return 'New Lease Agreement';
    if (path === '/print') return 'Print Preview';
    return 'RentalMgr';
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-surface-light dark:bg-surface-dark dark:border-gray-700 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-4">
        <button className="md:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{getPageTitle()}</h1>
        <div className="hidden sm:flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
          System Online
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative hidden sm:block">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <span className="material-symbols-outlined text-[20px]">search</span>
          </span>
          <input
            className="block w-64 rounded-lg border-0 bg-gray-100 py-2 pl-10 pr-3 text-sm text-gray-900 focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 transition-all"
            placeholder="Search..."
            type="text"
          />
        </div>
        <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors">
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-900"></span>
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <NavLink
          to="/invoices"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900 shadow-sm transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          <span className="hidden sm:inline">New Invoice</span>
        </NavLink>
      </div>
    </header>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <div className="flex-1 overflow-y-auto no-scrollbar">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/buildings" element={<Buildings />} />
              <Route path="/rooms" element={<Rooms />} />
              <Route path="/readings" element={<Readings />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/tenants" element={<Tenants />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/new-lease" element={<NewLease />} />
              <Route path="/print" element={<PrintPreview />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
};

export default App;
