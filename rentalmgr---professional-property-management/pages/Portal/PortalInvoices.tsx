import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { TenantInvoice } from '../../types';
import { 
  FileText, 
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  Link as LinkIcon
} from 'lucide-react';
import { useCurrency } from '../../utils/CurrencyContext';
import { useLanguage } from '../../utils/LanguageContext';

export default function PortalInvoices() {
  const { t } = useLanguage();
  const { formatUSD, formatKHR, convertToKHR } = useCurrency();
  const [invoices, setInvoices] = useState<TenantInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getPortalInvoices()
      .then(setInvoices)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'overdue': return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'partial': return 'bg-amber-50 text-amber-700 border-amber-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return <CheckCircle2 size={16} />;
      case 'overdue': return <AlertCircle size={16} />;
      case 'partial': return <Clock size={16} />;
      default: return <Clock size={16} />;
    }
  };

  if (loading) return <div className="p-8 animate-pulse text-slate-400">Loading invoices...</div>;
  if (error) return <div className="p-8 text-rose-500">{error}</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t('invoices')}</h1>
          <p className="text-slate-500 mt-1">{t('welcome_back')}</p>
        </div>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('invoice')}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('due_date')}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('amount')}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('paid_amount')}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('balance')}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('status')}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">#{inv.invoiceNumber}</td>
                  <td className="px-6 py-4 text-slate-600">
                     <div className="text-sm">{t('issue_date')}: {new Date(inv.date).toLocaleDateString()}</div>
                     <div className="text-xs text-rose-500 font-medium">{t('due')}: {new Date(inv.dueDate).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">
                    <div>{formatUSD(inv.totalAmount)}</div>
                    <div className="text-[10px] text-slate-400 font-medium">≈ {formatKHR(convertToKHR(inv.totalAmount))}</div>
                  </td>
                  <td className="px-6 py-4 text-emerald-600 font-medium">
                    <div>{formatUSD(inv.paidAmount)}</div>
                    <div className="text-[10px] text-slate-400 font-medium">≈ {formatKHR(convertToKHR(inv.paidAmount))}</div>
                  </td>
                  <td className="px-6 py-4 text-rose-600 font-bold">
                    <div>{formatUSD(inv.balance)}</div>
                    <div className="text-[10px] text-slate-400 font-medium font-mono">≈ {formatKHR(convertToKHR(inv.balance))}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(inv.status)}`}>
                      {getStatusIcon(inv.status)}
                      {t(inv.status.toLowerCase() as any)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => api.downloadInvoice(inv.id)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="Download PDF"
                      >
                        <FileText size={18} />
                      </button>
                      {inv.balance > 0 && (
                        <a 
                          href={`/portal/confirm-payment?invoiceId=${inv.id}&amount=${inv.balance}`}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                          title="Confirm Payment"
                        >
                          <CreditCard size={18} />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">
                    No invoices recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
