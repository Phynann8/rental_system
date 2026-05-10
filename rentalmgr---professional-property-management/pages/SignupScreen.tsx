import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { api } from '../services/api';
import type { AuthSession } from '../types';

interface SignupScreenProps {
  onRegisterSuccess: (session: AuthSession) => void;
}

const SignupScreen: React.FC<SignupScreenProps> = ({ onRegisterSuccess }) => {
  const [formData, setFormData] = useState({
    organizationName: '',
    username: '',
    email: '',
    displayName: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const session = await api.register({
        organizationName: formData.organizationName,
        username: formData.username,
        email: formData.email,
        displayName: formData.displayName,
        password: formData.password
      });
      onRegisterSuccess(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(19,127,236,0.18),_transparent_35%),linear-gradient(135deg,_#f8fafc_0%,_#e2e8f0_100%)] px-4 py-10 dark:bg-[radial-gradient(circle_at_top,_rgba(19,127,236,0.1),_transparent_35%),#0f172a]">
      <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div className="hidden flex-col justify-between rounded-3xl border border-white/40 bg-slate-900 p-12 text-white shadow-2xl lg:flex">
          <div>
            <div className="mb-12 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/40">
                <span className="material-symbols-outlined text-3xl">apartment</span>
              </div>
              <div>
                <div className="text-xl font-black tracking-tight">RentalMgr</div>
                <div className="text-sm font-medium text-slate-400">Enterprise SaaS Edition</div>
              </div>
            </div>
            
            <h1 className="text-5xl font-black leading-tight tracking-tight">
              Start your <span className="text-primary italic">property</span> empire today.
            </h1>
            <p className="mt-6 text-lg text-slate-400 max-w-md">
              Join thousands of property managers using RentalMgr to automate billing, tracking, and tenant communication.
            </p>

            <div className="mt-12 space-y-6">
              {[
                { icon: 'filter_list', title: 'Data Isolation', desc: 'Secure, logical multi-tenancy architecture.' },
                { icon: 'payments', title: 'Automated Billing', desc: 'Generate invoices and track payments effortlessly.' },
                { icon: 'monitoring', title: 'Advanced Analytics', desc: 'Real-time insights on your property portfolio.' }
              ].map((item, i) => (
                <div key={i} className="group flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 group-hover:bg-primary/20 group-hover:border-primary/40 transition-all">
                    <span className="material-symbols-outlined text-primary text-xl font-bold">{item.icon}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100">{item.title}</h3>
                    <p className="text-sm text-slate-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-sm">
            <div className="text-sm font-bold text-slate-400 mb-2 italic">"The transition to RentalMgr was the best decision for our portfolio. We saved 15+ hours a week in paperwork."</div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-[10px] font-black">JS</div>
              <div className="text-xs font-bold text-slate-300">James S., Property Group CEO</div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white/95 p-8 sm:p-12 shadow-2xl backdrop-blur dark:border-gray-700 dark:bg-surface-dark transition-all">
          <div className="mb-8">
            <div className="text-sm font-black uppercase tracking-[0.3em] text-primary">Onboarding</div>
            <h2 className="mt-3 text-4xl font-black tracking-tighter text-gray-900 dark:text-white">Create your workspace</h2>
            <p className="mt-3 text-gray-500 dark:text-gray-400 leading-relaxed">
              Sign up today and get your first 30 days of <span className="font-bold text-primary">Pro Tier</span> features for free.
            </p>
          </div>

          <form className="grid gap-5 sm:grid-cols-2" onSubmit={handleSubmit}>
            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">Organization / Company Name</label>
              <input
                required
                name="organizationName"
                placeholder="e.g. Skyline Apartments LLC"
                className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-base outline-none transition focus:border-primary focus:bg-white dark:border-gray-700 dark:bg-gray-900"
                onChange={handleChange}
                value={formData.organizationName}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">Username</label>
              <input
                required
                name="username"
                className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-base outline-none transition focus:border-primary focus:bg-white dark:border-gray-700 dark:bg-gray-900"
                onChange={handleChange}
                value={formData.username}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">Full Name</label>
              <input
                required
                name="displayName"
                placeholder="Admin Name"
                className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-base outline-none transition focus:border-primary focus:bg-white dark:border-gray-700 dark:bg-gray-900"
                onChange={handleChange}
                value={formData.displayName}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">Email Address</label>
              <input
                required
                type="email"
                name="email"
                className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-base outline-none transition focus:border-primary focus:bg-white dark:border-gray-700 dark:bg-gray-900"
                onChange={handleChange}
                value={formData.email}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">Password</label>
              <input
                required
                type="password"
                name="password"
                className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-base outline-none transition focus:border-primary focus:bg-white dark:border-gray-700 dark:bg-gray-900"
                onChange={handleChange}
                value={formData.password}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">Confirm Password</label>
              <input
                required
                type="password"
                name="confirmPassword"
                className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-base outline-none transition focus:border-primary focus:bg-white dark:border-gray-700 dark:bg-gray-900"
                onChange={handleChange}
                value={formData.confirmPassword}
              />
            </div>

            {error && (
              <div className="sm:col-span-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm animate-pulse-subtle">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">error</span>
                  <span className="font-bold">Error:</span> {error}
                </div>
              </div>
            )}

            <div className="sm:col-span-2 mt-4">
              <button
                className="flex h-14 w-full items-center justify-center rounded-xl bg-primary text-base font-black text-white shadow-xl shadow-primary/25 transition hover:bg-primary-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading}
                type="submit"
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    Creating Workspace...
                  </div>
                ) : (
                  'Create My Workspace'
                )}
              </button>
            </div>
            
            <div className="sm:col-span-2 text-center mt-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Already have a workspace?{' '}
                <NavLink to="/" className="font-bold text-primary hover:underline">
                  Sign in here
                </NavLink>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignupScreen;
