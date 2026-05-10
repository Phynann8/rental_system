import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { TenantDashboard } from '../../types';
import { 
  CreditCard, 
  FileText, 
  Home, 
  AlertCircle,
  TrendingUp,
  Clock
} from 'lucide-react';
import { useCurrency } from '../../utils/CurrencyContext';
import { useLanguage } from '../../utils/LanguageContext';

export default function PortalDashboard() {
  const { t } = useLanguage();
  const { formatUSD, formatKHR, convertToKHR } = useCurrency();
  const [data, setData] = useState<TenantDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getPortalDashboard()
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 animate-pulse text-slate-400">Loading dashboard...</div>;
  if (error) return <div className="p-8 text-rose-500 bg-rose-50 rounded-lg m-4 border border-rose-100">{error}</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Welcome Header */}
      <header>
        <h1 className="text-3xl font-bold text-slate-900">{t('tenant_portal')}</h1>
        <p className="text-slate-500 mt-1">{t('welcome_back')}</p>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">{t('total_balance')}</p>
            <p className="text-2xl font-bold text-slate-900">{formatUSD(data?.totalBalance ?? 0)}</p>
            <p className="text-xs text-slate-400">≈ {formatKHR(convertToKHR(data?.totalBalance ?? 0))}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">{t('unpaid_invoices')}</p>
            <p className="text-2xl font-bold text-slate-900">{data?.unpaidInvoicesCount}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <Home size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">{t('active_leases')}</p>
            <p className="text-2xl font-bold text-slate-900">{data?.activeLeases.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lease Cards */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <Home size={20} className="text-slate-400" />
            {t('my_active_leases')}
          </h2>
          {data?.activeLeases.map(lease => (
            <div key={lease.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <h3 className="font-bold text-lg text-slate-900">Room {lease.roomNumber}</h3>
                  <p className="text-slate-500">{lease.buildingName}</p>
                </div>
                <div className="flex gap-4">
                    <div className="text-right">
                       <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Monthly Rent</p>
                       <p className="text-xl font-bold text-indigo-600">{formatUSD(lease.rentPrice)}</p>
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">≈ {formatKHR(convertToKHR(lease.rentPrice))}</p>
                    </div>
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center gap-6">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Clock size={16} />
                  <span>Start: {new Date(lease.startDate).toLocaleDateString()}</span>
                </div>
                {lease.endDate && (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Clock size={16} />
                    <span>End: {new Date(lease.endDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          {data?.activeLeases.length === 0 && (
             <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <p className="text-slate-400">No active leases found.</p>
             </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <CreditCard size={20} className="text-slate-400" />
            {t('quick_actions')}
          </h2>
          <div className="space-y-3">
             <a href="/portal/invoices" className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 group transition-all">
                <div className="flex items-center gap-3 text-slate-600 group-hover:text-indigo-600 font-medium">
                   <FileText size={20} />
                   <span>{t('view_my_invoices')}</span>
                </div>
                <CreditCard size={18} className="text-slate-300 group-hover:text-indigo-400" />
             </a>
             <a href="/portal/confirm-payment" className="flex items-center justify-between p-4 bg-indigo-600 rounded-xl text-white hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all">
                <div className="flex items-center gap-3 font-medium">
                   <CreditCard size={20} />
                   <span>{t('confirm_payment')}</span>
                </div>
                <TrendingUp size={18} className="opacity-50" />
             </a>
          </div>
        </div>
      </div>
    </div>
  );
}
