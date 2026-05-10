/// <reference types="vite/client" />
import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Route, Routes } from 'react-router-dom';

// Pages
import Dashboard from './pages/DashboardLive';
import Buildings from './pages/BuildingsLive';
import Rooms from './pages/RoomsLive';
import Readings from './pages/ReadingsLive';
import Invoices from './pages/InvoicesLive';
import Tenants from './pages/TenantsLive';
import Reports from './pages/ReportsLive';
import Settings from './pages/SettingsLive';
import NewLease from './pages/NewLeaseLive';
import PrintPreview from './pages/PrintPreview';
import MaintenanceLive from './pages/MaintenanceLive';
import PortalDashboard from './pages/Portal/PortalDashboard';
import PortalInvoices from './pages/Portal/PortalInvoices';
import ConfirmPayment from './pages/Portal/ConfirmPayment';
import SetupPassword from './pages/Portal/SetupPassword';
import SignupScreen from './pages/SignupScreen';
import BillingPage from './pages/BillingPage';
import LoginScreen from './pages/LoginScreen';

// Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Services & Utils
import { ApiError, api, onUnauthorized } from './services/api';
import type { AppRole, AuthSession } from './types';
import { LanguageProvider } from './utils/LanguageContext';
import { CurrencyProvider } from './utils/CurrencyContext';
import { ThemeProvider } from './utils/ThemeContext';

const routeConfigs: Array<{
  path: string;
  icon?: string;
  label?: string;
  element: React.ReactElement;
  roles: AppRole[];
}> = [
  { path: '/', icon: 'dashboard', label: 'Dashboard', element: <Dashboard />, roles: ['Admin', 'Manager', 'Billing'] },
  { path: '/buildings', icon: 'domain', label: 'Properties', element: <Buildings />, roles: ['Admin', 'Manager'] },
  { path: '/rooms', icon: 'grid_view', label: 'Rooms', element: <Rooms />, roles: ['Admin', 'Manager'] },
  { path: '/tenants', icon: 'group', label: 'Tenants', element: <Tenants />, roles: ['Admin', 'Manager'] },
  { path: '/new-lease', icon: 'key', label: 'New Lease', element: <NewLease />, roles: ['Admin', 'Manager'] },
  { path: '/invoices', icon: 'receipt_long', label: 'Invoices', element: <Invoices />, roles: ['Admin', 'Manager', 'Billing'] },
  { path: '/readings', icon: 'edit_note', label: 'Readings', element: <Readings />, roles: ['Admin', 'Manager', 'Billing'] },
  { path: '/reports', icon: 'bar_chart', label: 'Reports', element: <Reports />, roles: ['Admin', 'Manager', 'Billing'] },
  { path: '/maintenance', icon: 'plumbing', label: 'Maintenance', element: <MaintenanceLive />, roles: ['Admin', 'Manager'] },
  { path: '/settings', icon: 'settings', label: 'Settings', element: <Settings />, roles: ['Admin', 'Manager'] },
  { path: '/billing', icon: 'credit_card', label: 'Billing', element: <BillingPage />, roles: ['Admin', 'Manager'] },
  { path: '/print', element: <PrintPreview />, roles: ['Admin', 'Manager', 'Billing'] },
  
  // Portal Routes
  { path: '/portal', icon: 'dashboard', label: 'Dashboard', element: <PortalDashboard />, roles: ['Tenant'] },
  { path: '/portal/invoices', icon: 'receipt_long', label: 'Invoices', element: <PortalInvoices />, roles: ['Tenant'] },
  { path: '/portal/confirm-payment', icon: 'payments', label: 'Confirm Payment', element: <ConfirmPayment />, roles: ['Tenant'] },
];

const hasRole = (session: AuthSession, allowedRoles: AppRole[]) => allowedRoles.some((role) => session.roles.includes(role));

const AccessDeniedScreen: React.FC = () => (
  <div className="flex min-h-[60vh] items-center justify-center p-6">
    <div className="max-w-md rounded-3xl border border-amber-200 bg-amber-50 px-8 py-10 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
        <span className="material-symbols-outlined">lock</span>
      </div>
      <h2 className="mt-5 text-2xl font-black text-gray-900">Access denied</h2>
      <p className="mt-3 text-sm text-gray-600">Your account does not have permission to open this workspace.</p>
    </div>
  </div>
);

const AppShell: React.FC<{ session: AuthSession; onLogout: () => Promise<void> }> = ({ session, onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Sidebar 
        onLogout={onLogout} 
        session={session} 
        mobileMenuOpen={mobileMenuOpen} 
        setMobileMenuOpen={setMobileMenuOpen} 
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        navItems={routeConfigs.filter(item => item.label && item.icon)}
      />
      <main className="flex flex-1 flex-col overflow-hidden relative min-w-0">
        <Header onToggleMenu={() => setMobileMenuOpen(!mobileMenuOpen)} isSidebarCollapsed={sidebarCollapsed} />
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <Routes>
            {routeConfigs.map((route) => (
              <Route
                element={hasRole(session, route.roles) ? route.element : <AccessDeniedScreen />}
                key={route.path}
                path={route.path}
              />
            ))}
          </Routes>
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    onUnauthorized(() => {
      setSession(null);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      try {
        const currentSession = await api.getSession();
        if (!cancelled) {
          setSession(currentSession);
        }
      } catch (error) {
        if (!cancelled && (!(error instanceof ApiError) || error.status !== 401)) {
          setAuthError(error instanceof Error ? error.message : 'Unable to reach the backend.');
        }
      } finally {
        if (!cancelled) {
          setBootstrapping(false);
        }
      }
    };

    void loadSession();
    return () => { cancelled = true; };
  }, []);

  const handleLogin = async (username: string, password: string, rememberMe: boolean) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const nextSession = await api.login(username, password, rememberMe);
      setSession(nextSession);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Unable to sign in.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setSession(null);
    setAuthError(null);
  };

  if (bootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-4">
          <span className="material-symbols-outlined animate-spin">progress_activity</span>
          Restoring session...
        </div>
      </div>
    );
  }

  const content = !session ? (
    <Routes>
      <Route path="/register" element={<SignupScreen onRegisterSuccess={(s) => setSession(s)} />} />
      <Route path="/setup" element={<SetupPassword />} />
      <Route path="*" element={<LoginScreen error={authError} loading={authLoading} onLogin={handleLogin} />} />
    </Routes>
  ) : (
    <AppShell onLogout={handleLogout} session={session} />
  );

  return (
    <ThemeProvider>
      <LanguageProvider>
        <CurrencyProvider isAuthenticated={!!session}>
          <Router>
            {content}
          </Router>
        </CurrencyProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;
