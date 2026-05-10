import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { InvoiceDetail, SystemSetting } from '../types';
import { formatCurrency, formatDate } from '../utils/format';

const PrintPreview: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const invoiceIdParam = searchParams.get('invoiceId');
  
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [settings, setSettings] = useState<SystemSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!invoiceIdParam) {
      setError("No Invoice ID provided in URL.");
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        const [invData, setConfig] = await Promise.all([
          api.getInvoice(Number(invoiceIdParam)),
          api.getSettings()
        ]);
        setInvoice(invData);
        setSettings(setConfig);
      } catch (err) {
        setError("Unable to load invoice or configuration. Make sure it exists.");
      } finally {
        setLoading(false);
      }
    };
    
    void loadData();
  }, [invoiceIdParam]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex justify-center items-center">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
      </div>
    );
  }

  if (error || !invoice || !settings) {
    return (
      <div className="min-h-screen bg-slate-100 flex justify-center items-center p-6">
        <div className="bg-white rounded-xl shadow-lg p-10 max-w-md w-full text-center">
           <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl">error</span>
           </div>
           <h2 className="text-xl font-bold mb-2">Printing Error</h2>
           <p className="text-gray-500 text-sm mb-6">{error || 'Invoice not found.'}</p>
           <button onClick={() => navigate('/invoices')} className="bg-primary hover:bg-primary-dark transition text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-md w-full">
             Back to Invoices
           </button>
        </div>
      </div>
    );
  }

  const invoiceNum = `INV-${invoice.invoiceDate.substring(0,4)}-${String(invoice.id).padStart(4, '0')}`;
  const khmerTotal = Math.round(invoice.totalAmount * settings.exchangeRateUsdToKhr).toLocaleString() + ' ៛';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col overflow-hidden">
      <header className="no-print flex items-center justify-between bg-white border-b px-8 py-3 shadow-sm z-10 sticky top-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-slate-50 transition-colors text-slate-500">
             <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex flex-col">
            <h2 className="text-lg font-bold">Print Preview</h2>
            <p className="text-xs text-slate-500 flex items-center gap-1">Receipt #{invoiceNum} • Ready to print</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <button className="h-10 px-6 bg-primary text-white text-sm font-bold rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center gap-2" onClick={() => window.print()}>
             <span className="material-symbols-outlined text-[20px]">print</span> Print Now
           </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-4 md:p-8 flex justify-center items-start bg-slate-100/50">
        <div className="bg-white shadow-2xl w-full max-w-[794px] min-h-[1123px] flex flex-col p-8 md:p-12 space-y-8 relative print:shadow-none print:m-0 print:p-0 print:border-none border border-slate-200">
           {/* Render Two identical copies vertically in one A4 sheet logic */}
           {[1, 2].map((i) => (
             <div key={i} className={`flex-1 flex flex-col ${i === 1 ? 'border-b-2 border-dashed border-slate-100 pb-16' : 'pt-8'}`}>
               <div className="flex justify-between items-start mb-8">
                 <div className="flex gap-4">
                   <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-primary"><span className="material-symbols-outlined text-4xl">apartment</span></div>
                   <div>
                     <h1 className="text-xl font-black uppercase tracking-tight text-gray-900">{settings.companyName}</h1>
                     <p className="text-xs text-slate-500 leading-relaxed max-w-[200px] mt-1">{invoice.buildingName}<br/>{invoice.buildingAddress}</p>
                   </div>
                 </div>
                 <div className="text-right">
                   <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded uppercase tracking-widest mb-2">{i === 1 ? 'Official Receipt' : 'Owner Copy'}</span>
                   <h3 className="text-2xl font-bold text-gray-900">#{invoiceNum}</h3>
                   <p className="text-xs text-slate-500 font-medium mt-1">Date: {formatDate(invoice.invoiceDate)}</p>
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 mb-8">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Received From</span>
                    <p className="font-bold text-gray-900">{invoice.tenantName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Tenant ID: {invoice.tenantId}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Property Unit</span>
                    <p className="font-bold text-gray-900">Room {invoice.roomNumber}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{invoice.buildingName}</p>
                  </div>
               </div>

               <table className="w-full text-sm mb-8">
                 <thead>
                   <tr className="border-b border-slate-200 text-[10px] font-bold uppercase text-slate-400">
                     <th className="text-left py-2 px-1">Description</th>
                     <th className="text-right py-2 px-1 w-20">Usage</th>
                     <th className="text-right py-2 px-1 w-24">Rate</th>
                     <th className="text-right py-2 px-1 w-28">Amount</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 text-gray-800">
                    {invoice.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-3 px-1 font-medium text-slate-900">
                          {item.description}
                        </td>
                        <td className="text-right py-3 px-1">
                          {item.quantity === 1 ? '-' : item.quantity}
                        </td>
                        <td className="text-right py-3 px-1 text-slate-500">
                          {item.quantity === 1 ? '-' : formatCurrency(item.rate)}
                        </td>
                        <td className="text-right py-3 px-1 font-bold">
                          {formatCurrency(item.amount)}
                        </td>
                      </tr>
                    ))}
                 </tbody>
               </table>

               <div className="flex justify-end pt-4 border-t-2 border-slate-100">
                 <div className="w-64 space-y-3">
                    <div className="flex justify-between items-center text-slate-600 px-2">
                       <span className="text-sm font-medium">Subtotal</span>
                       <span className="font-bold">{formatCurrency(invoice.totalAmount)}</span>
                    </div>
                    {invoice.paidAmount > 0 && (
                      <div className="flex justify-between items-center text-green-600 px-2">
                         <span className="text-sm font-medium border border-green-200 bg-green-50 px-2 py-0.5 rounded text-xs uppercase">Paid</span>
                         <span className="font-bold">-{formatCurrency(invoice.paidAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center bg-gray-50 rounded-lg p-3 border border-gray-100">
                       <span className="text-sm font-bold text-gray-900">{invoice.balance > 0 ? 'Total Due' : 'Paid in Full'}</span>
                       <span className="text-xl font-black text-primary">{formatCurrency(invoice.balance <= 0 ? invoice.totalAmount : invoice.balance)}</span>
                    </div>
                    {invoice.balance > 0 && (
                      <div className="flex justify-between items-center bg-blue-50/50 p-2 rounded text-[10px]">
                         <span className="text-slate-500 italic">Rate: 1 {settings.currencySymbol} = {settings.exchangeRateUsdToKhr.toLocaleString()} KHR</span>
                         <span className="font-bold text-slate-700">{khmerTotal}</span>
                      </div>
                    )}
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-12 mt-auto pt-10 text-center text-[10px] font-bold uppercase text-slate-400">
                 <div className="space-y-2"><div className="border-b border-slate-300"></div>Paid By (Tenant Signature)</div>
                 <div className="space-y-2"><div className="border-b border-slate-300"></div>Received By (Owner Signature)</div>
               </div>
             </div>
           ))}
        </div>
      </main>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          .no-print { display: none !important; }
          body, html { background: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          main { padding: 0 !important; overflow: visible !important; display: block !important; }
          .shadow-2xl { box-shadow: none !important; border: none !important; }
          @page { margin: 0; }
        }
      `}} />
    </div>
  );
};

export default PrintPreview;
