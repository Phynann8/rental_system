import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { Invoice, InvoiceListResponse, InvoiceStatus, PaymentMethod, InvoiceDetail } from '../types';
import { formatDate, formatMonthLabel, fromMonthInputValue, toMonthInputValue } from '../utils/format';
import { useCurrency } from '../utils/CurrencyContext';
import { useLanguage } from '../utils/LanguageContext';

const invoiceFilters: Array<'All' | InvoiceStatus> = ['All', 'Unpaid', 'Paid', 'Overdue'];
const paymentMethods: PaymentMethod[] = ['Cash', 'BankTransfer', 'QRCode'];

const currentDate = new Date();

const InvoicesLive: React.FC = () => {
  const { t } = useLanguage();
  const { formatUSD, formatKHR, convertToKHR } = useCurrency();
  const [year, setYear] = useState(currentDate.getFullYear());
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [data, setData] = useState<InvoiceListResponse | null>(null);
  const [filter, setFilter] = useState<'All' | InvoiceStatus>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [generateBuildingId, setGenerateBuildingId] = useState<number>(0);
  const [paymentTarget, setPaymentTarget] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [paymentDate, setPaymentDate] = useState(currentDate.toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [verificationTarget, setVerificationTarget] = useState<number | null>(null);
  const [detail, setDetail] = useState<InvoiceDetail | null>(null);

  const loadInvoices = async (nextYear = year, nextMonth = month) => {
    setLoading(true);
    setError(null);
    try {
      const payload = await api.getInvoices(nextYear, nextMonth);
      setData(payload);
      setGenerateBuildingId((current) => current || payload.buildings[0]?.id || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load invoices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadInvoices();
  }, []);

  const filteredInvoices = useMemo(() => {
    if (!data) {
      return [];
    }

    const query = searchQuery.trim().toLowerCase();
    return data.invoices.filter((invoice) => {
      const statusMatch = filter === 'All' || invoice.status === filter;
      const queryMatch =
        !query ||
        invoice.tenant.toLowerCase().includes(query) ||
        invoice.room.toLowerCase().includes(query) ||
        invoice.building.toLowerCase().includes(query);

      return statusMatch && queryMatch;
    });
  }, [data, filter, searchQuery]);

  const handleMonthChange = (value: string) => {
    const next = fromMonthInputValue(value);
    setYear(next.year);
    setMonth(next.month);
    void loadInvoices(next.year, next.month);
  };

  const generateInvoices = async () => {
    if (!generateBuildingId) {
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const invoiceDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const result = await api.generateInvoices({
        buildingId: generateBuildingId,
        dueInDays: 5,
        invoiceDate,
      });
      setSuccess(`Generated ${result.generated} invoice(s); skipped ${result.skipped} existing lease(s).`);
      await loadInvoices(year, month);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate invoices.');
    } finally {
      setSubmitting(false);
    }
  };

  const openPayment = (invoice: Invoice) => {
    setPaymentTarget(invoice);
    setPaymentAmount(invoice.balance);
    setPaymentMethod('Cash');
    setPaymentDate(currentDate.toISOString().slice(0, 10));
  };

  const submitPayment = async () => {
    if (!paymentTarget) {
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await api.recordPayment(paymentTarget.id, {
        amount: paymentAmount,
        method: paymentMethod,
        date: paymentDate,
      });
      setData((current) =>
        current
          ? {
              ...current,
              invoices: current.invoices.map((invoice) => (invoice.id === updated.id ? updated : invoice)),
              summary: current.summary,
            }
          : current,
      );
      await loadInvoices(year, month);
      setSuccess(`Payment recorded for ${updated.tenant}.`);
      setPaymentTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to record payment.');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteInvoice = async (id: number) => {
    setSubmitting(true);
    setDeleteError(null);
    try {
      await api.deleteInvoice(id);
      setData((current) =>
        current
          ? {
              ...current,
              invoices: current.invoices.filter((invoice) => invoice.id !== id),
              summary: current.summary,
            }
          : current,
      );
      setDeletingId(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to delete invoice.';
      setDeleteError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const openVerification = async (invoiceId: number) => {
    setVerificationTarget(invoiceId);
    setLoading(true);
    try {
      const result = await api.getInvoice(invoiceId);
      setDetail(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load invoice details.');
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (paymentId: number, approved: boolean) => {
    setSubmitting(true);
    try {
      await api.verifyPayment(paymentId, { approved, notes: approved ? 'Approved by staff' : 'Rejected' });
      if (verificationTarget) {
        await openVerification(verificationTarget); // Refresh
      }
      await loadInvoices(); // Refresh list stats
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to verify payment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-8 p-4 sm:p-10">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Invoice Management</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage billing for {formatMonthLabel(year, month)} across all properties.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <input
            className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-surface-dark"
            onChange={(event) => handleMonthChange(event.target.value)}
            type="month"
            value={toMonthInputValue(year, month)}
          />
          <select
            className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-surface-dark"
            onChange={(event) => setGenerateBuildingId(Number(event.target.value))}
            value={generateBuildingId}
          >
            {data?.buildings.map((building) => (
              <option key={building.id} value={building.id}>
                {building.name}
              </option>
            ))}
          </select>
          <button className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-green-600/20 transition-all hover:bg-green-700" onClick={() => api.exportInvoices(year, month)} type="button">
            <span className="material-symbols-outlined text-[20px]">file_download</span> Export Excel
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-dark" disabled={submitting || !generateBuildingId} onClick={() => void generateInvoices()} type="button">
            <span className="material-symbols-outlined text-[20px]">add_circle</span> Bulk Generate
          </button>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>}

      {paymentTarget && (
        <div className="grid grid-cols-1 gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-surface-dark md:grid-cols-4">
          <div className="md:col-span-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Record Payment</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {paymentTarget.tenant} • Room {paymentTarget.room} • Remaining balance {formatUSD(paymentTarget.balance)} (≈ {formatKHR(convertToKHR(paymentTarget.balance))})
            </p>
          </div>
          <NumberField label="Amount" onChange={setPaymentAmount} value={paymentAmount} />
          <DateField label="Payment date" onChange={setPaymentDate} value={paymentDate} />
          <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
            Method
            <select className="h-11 rounded-lg border border-gray-200 bg-transparent px-4 dark:border-gray-700" onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)} value={paymentMethod}>
              {paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-3">
            <button className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold dark:border-gray-700" onClick={() => setPaymentTarget(null)} type="button">
              Cancel
            </button>
            <button className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white" disabled={submitting} onClick={() => void submitPayment()} type="button">
              {submitting ? 'Saving...' : 'Record Payment'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard color="blue" label={t('all')} sub={`≈ ${formatKHR(convertToKHR(data?.summary.totalInvoiced ?? 0))}`} value={formatUSD(data?.summary.totalInvoiced ?? 0)} />
        <SummaryCard color="gray" label={t('paid')} sub={`≈ ${formatKHR(convertToKHR(data?.summary.collected ?? 0))}`} value={formatUSD(data?.summary.collected ?? 0)} />
        <SummaryCard color="orange" label={t('unpaid')} sub={`≈ ${formatKHR(convertToKHR(data?.summary.pending ?? 0))}`} value={formatUSD(data?.summary.pending ?? 0)} />
        <SummaryCard color="red" label={t('overdue')} sub={`≈ ${formatKHR(convertToKHR(data?.summary.overdue ?? 0))}`} value={formatUSD(data?.summary.overdue ?? 0)} />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-surface-dark">
        <div className="flex flex-col justify-between gap-4 border-b border-gray-100 p-4 dark:border-gray-800 md:flex-row md:items-center">
          <div className="flex flex-1 gap-3">
            <div className="relative w-full sm:max-w-xs">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400">search</span>
              <input
                className="h-11 w-full rounded-lg border border-gray-200 bg-transparent pl-10 pr-10 text-sm dark:border-gray-700"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search tenant or room..."
                value={searchQuery}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              )}
            </div>
          </div>
          <div className="flex rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
            {invoiceFilters.map((item) => (
              <button
                className={`rounded-md px-4 py-1.5 text-xs font-semibold transition-all ${filter === item ? 'bg-white text-primary shadow-sm dark:bg-gray-700' : 'text-gray-500'}`}
                key={item}
                onClick={() => setFilter(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">{t('invoice')}</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">{t('tenant')}</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">{t('status')}</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">{t('due_date')}</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-gray-400">{t('amount')}</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-gray-400">{t('balance')}</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-gray-400">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredInvoices.map((invoice) => (
                <tr className="group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50" key={invoice.id}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    <div>INV-{invoice.id}</div>
                    <div className="text-xs text-gray-500">{formatDate(invoice.date)}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">{invoice.initials || 'NA'}</div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{invoice.tenant}</div>
                        <div className="text-xs text-gray-500">{invoice.phone || t('no_phone_recorded')}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ring-1 ring-inset ${
                      invoice.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' :
                      invoice.status === 'Overdue' ? 'bg-rose-50 text-rose-700 ring-rose-600/20' :
                      'bg-amber-50 text-amber-700 ring-amber-600/20'
                    }`}>
                      {t(invoice.status.toLowerCase() as any)}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-sm ${invoice.status === 'Overdue' ? 'font-bold text-red-600' : 'text-gray-500'}`}>{formatDate(invoice.dueDate)}</td>
                  <td className="px-6 py-4 text-right font-mono text-sm font-bold text-gray-900 dark:text-white">{formatUSD(invoice.totalAmount)}</td>
                  <td className="px-6 py-4 text-right font-mono text-sm text-gray-600 dark:text-gray-300">
                    <div className="font-bold">{formatUSD(invoice.balance)}</div>
                    <div className="text-[10px] text-gray-400">≈ {formatKHR(convertToKHR(invoice.balance))}</div>
                    {invoice.hasUnverifiedPayments && (
                      <div className="flex justify-end mt-1">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                           <span className="material-symbols-outlined text-[12px]">info</span> {t('pending')}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <Link to={`/print?invoiceId=${invoice.id}`} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                        {t('print')}
                      </Link>
                      <button
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                        onClick={() => api.downloadInvoice(invoice.id)}
                        type="button"
                      >
                        {t('pdf')}
                      </button>
                      {invoice.hasUnverifiedPayments && (
                        <button 
                          className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-amber-600"
                          onClick={() => openVerification(invoice.id)}
                          type="button"
                        >
                          {t('review')}
                        </button>
                      )}
                      {invoice.status !== 'Paid' ? (
                        <button className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-white" onClick={() => openPayment(invoice)} type="button">
                          {t('collect')}
                        </button>
                      ) : (
                        <span className="text-xs font-medium text-green-600">{t('settled')}</span>
                      )}
                      <button className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/30" onClick={() => setDeletingId(invoice.id)} type="button">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filteredInvoices.length === 0 && (
                <tr>
                  <td className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400" colSpan={8}>
                    No invoices matched the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {deletingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-surface-dark">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Confirm Delete</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Are you sure you want to delete this invoice? This action cannot be undone.
            </p>
            {deleteError && <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{deleteError}</div>}
            <div className="mt-4 flex gap-2">
              <button
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold dark:border-gray-700"
                onClick={() => setDeletingId(null)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"
                disabled={submitting}
                onClick={() => void deleteInvoice(deletingId)}
                type="button"
              >
                {submitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {verificationTarget && detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-surface-dark flex flex-col">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-slate-50/50">
              <div>
                 <h2 className="text-xl font-bold text-gray-900 dark:text-white">Review Payments</h2>
                 <p className="text-sm text-gray-500">INV-{detail.id} • {detail.tenantName} • Balance: {formatUSD(detail.balance)} (≈ {formatKHR(convertToKHR(detail.balance))})</p>
              </div>
              <button onClick={() => setVerificationTarget(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
               {detail.payments.filter(p => !p.isVerified).map(payment => (
                 <div key={payment.id} className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="space-y-4">
                       <div className="flex justify-between items-start">
                          <div>
                             <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Payment Amount</p>
                             <p className="text-3xl font-black text-slate-900">{formatUSD(payment.amount)}</p>
                             <p className="text-sm font-bold text-slate-500 italic">≈ {formatKHR(convertToKHR(payment.amount))}</p>
                          </div>
                          <div className="text-right">
                             <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Submitted</p>
                             <p className="text-sm font-medium text-slate-600">{formatDate(payment.date)}</p>
                          </div>
                       </div>
                       
                       {payment.tenantNotes && (
                         <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm italic text-slate-600 text-sm">
                            "{payment.tenantNotes}"
                         </div>
                       )}

                       <div className="flex gap-3 pt-4">
                          <button 
                            disabled={submitting}
                            onClick={() => verifyPayment(payment.id, false)}
                            className="flex-1 py-3 bg-white text-rose-600 border border-rose-200 rounded-xl font-bold hover:bg-rose-50 transition-all flex items-center justify-center gap-2"
                          >
                            <span className="material-symbols-outlined">cancel</span> Reject
                          </button>
                          <button 
                            disabled={submitting}
                            onClick={() => verifyPayment(payment.id, true)}
                            className="flex-2 flex-[2] py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100 flex items-center justify-center gap-2"
                          >
                             <span className="material-symbols-outlined">check_circle</span> {submitting ? 'Approving...' : 'Approve Payment'}
                          </button>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Receipt Preview</p>
                       {payment.receiptPath ? (
                         <div className="rounded-xl overflow-hidden border border-slate-300 bg-slate-200 flex items-center justify-center min-h-[200px]">
                            <img 
                              src={payment.receiptPath} 
                              alt="Receipt" 
                              className="w-full h-auto object-contain cursor-zoom-in" 
                              onClick={() => window.open(payment.receiptPath, '_blank')}
                            />
                         </div>
                       ) : (
                         <div className="flex flex-col items-center justify-center h-48 bg-slate-100 rounded-xl border-2 border-dashed border-slate-200 text-slate-400">
                            <span className="material-symbols-outlined text-4xl mb-2">no_photography</span>
                            <p className="text-sm">No receipt image provided</p>
                         </div>
                       )}
                    </div>
                 </div>
               ))}
               {detail.payments.filter(p => !p.isVerified).length === 0 && (
                 <div className="text-center py-12 space-y-3">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center">
                       <span className="material-symbols-outlined text-3xl">done_all</span>
                    </div>
                    <p className="text-slate-500 font-medium">All payments for this invoice have been verified.</p>
                    <button onClick={() => setVerificationTarget(null)} className="text-primary font-bold hover:underline">Close Review</button>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SummaryCard = ({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
}) => (
  <div className={`flex flex-col gap-1 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-surface-dark ${color === 'red' ? 'border-l-4 border-l-red-500' : ''}`}>
    <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-gray-500">
      <span className={`material-symbols-outlined text-[18px] ${color === 'red' ? 'text-red-500' : ''}`}>{color === 'red' ? 'warning' : 'receipt_long'}</span>
      {label}
    </div>
    <div className={`text-2xl font-bold ${color === 'red' ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>{value}</div>
    <div className={`text-xs font-medium ${color === 'blue' ? 'text-green-600' : 'text-gray-400'}`}>{sub}</div>
  </div>
);

const NumberField = ({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) => (
  <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
    {label}
    <input className="h-11 rounded-lg border border-gray-200 bg-transparent px-4 dark:border-gray-700" min="0" onChange={(event) => onChange(Number(event.target.value))} step="0.01" type="number" value={value} />
  </label>
);

const DateField = ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => (
  <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
    {label}
    <input className="h-11 rounded-lg border border-gray-200 bg-transparent px-4 dark:border-gray-700" onChange={(event) => onChange(event.target.value)} type="date" value={value} />
  </label>
);

export default InvoicesLive;
