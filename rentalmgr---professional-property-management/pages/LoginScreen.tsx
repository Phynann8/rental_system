import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

interface LoginScreenProps {
  error: string | null;
  loading: boolean;
  onLogin: (username: string, password: string, rememberMe: boolean) => Promise<void>;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ error, loading, onLogin }) => {
  const [username, setUsername] = useState(import.meta.env.DEV ? 'manager' : '');
  const [password, setPassword] = useState(import.meta.env.DEV ? 'Rental123!' : '');
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onLogin(username, password, rememberMe);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(19,127,236,0.18),_transparent_35%),linear-gradient(135deg,_#f8fafc_0%,_#e2e8f0_100%)] px-4 py-10">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="hidden rounded-3xl border border-white/40 bg-slate-900 p-10 text-white shadow-2xl lg:block">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white">
              <span className="material-symbols-outlined">apartment</span>
            </div>
            <div>
              <div className="text-lg font-bold">RentalMgr</div>
              <div className="text-sm text-slate-300">Property operations cockpit</div>
            </div>
          </div>
          <h1 className="max-w-md text-4xl font-black leading-tight">Run leasing, billing, utility readings, and cash collection from one authenticated workspace.</h1>
          <div className="mt-10 space-y-4 text-sm text-slate-300">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Protected API routes now back every core workflow in the SPA.</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Buildings, tenants, rooms, leases, readings, and invoices all persist to the backend.</div>
          </div>
        </div>
        <div className="rounded-3xl border border-gray-200 bg-white/95 p-8 shadow-2xl backdrop-blur dark:border-gray-700 dark:bg-surface-dark">
          <div className="mb-8">
            <div className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Secure Access</div>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-gray-900 dark:text-white">Sign in to RentalMgr</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Sign in with an assigned account. Access is enforced per role across the protected workflows.</p>
          </div>
          <form className="space-y-5" onSubmit={(event) => void handleSubmit(event)}>
            <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
              Username or email
              <input
                className="h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 text-base outline-none transition focus:border-primary focus:bg-white dark:border-gray-700 dark:bg-gray-900"
                onChange={(event) => setUsername(event.target.value)}
                value={username}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
              Password
              <input
                className="h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 text-base outline-none transition focus:border-primary focus:bg-white dark:border-gray-700 dark:bg-gray-900"
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                value={password}
              />
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
              <input
                checked={rememberMe}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                onChange={(event) => setRememberMe(event.target.checked)}
                type="checkbox"
              />
              Remember this device
            </label>
            {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            <button
              className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading}
              type="submit"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          {import.meta.env.DEV && (
            <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700">
              Development accounts: <span className="font-bold">manager</span> / <span className="font-bold">Rental123!</span>, <span className="font-bold">admin</span> / <span className="font-bold">Admin123!</span>, <span className="font-bold">billing</span> / <span className="font-bold">Billing123!</span>
            </div>
          )}

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              New to RentalMgr?{' '}
              <NavLink to="/register" className="font-bold text-primary hover:underline">
                Create a workspace
              </NavLink>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
