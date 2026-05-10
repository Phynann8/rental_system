import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { 
  Upload, 
  X, 
  CheckCircle2, 
  AlertCircle,
  CreditCard,
  FileImage,
  Loader2
} from 'lucide-react';
import { useCurrency } from '../../utils/CurrencyContext';

export default function ConfirmPayment() {
  const { formatKHR, convertToKHR } = useCurrency();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [invoiceId, setInvoiceId] = useState(searchParams.get('invoiceId') || '');
  const [amount, setAmount] = useState(searchParams.get('amount') || '');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (!selected.type.startsWith('image/')) {
        setError('Please upload an image file (JPG, PNG).');
        return;
      }
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceId || !amount || !file) {
      setError('Missing required fields: Invoice, Amount, and Receipt image.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append('invoiceId', invoiceId);
    formData.append('amount', amount);
    if (notes) formData.append('notes', notes);
    formData.append('receipt', file);

    try {
      await api.submitPortalPayment(formData);
      setSuccess(true);
      setTimeout(() => navigate('/portal/invoices'), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="p-8 max-w-md mx-auto mt-20 text-center space-y-4">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Payment Submitted!</h2>
        <p className="text-slate-500">
          Your payment is now pending verification. Staff will review your receipt and update the invoice status shortly.
        </p>
        <p className="text-sm text-slate-400">Redirecting to invoices...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Confirm Payment</h1>
        <p className="text-slate-500 mt-1">Upload your bank transfer or QR payment receipt.</p>
      </header>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        {error && (
          <div className="p-4 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 flex items-center gap-3">
            <AlertCircle size={20} />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700">Invoice ID</label>
            <input 
              type="number" 
              readOnly={!!searchParams.get('invoiceId')}
              value={invoiceId}
              onChange={e => setInvoiceId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              placeholder="e.g. 1042"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700">Amount Paid ($)</label>
            <input 
              type="number" 
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              placeholder="0.00"
            />
            {amount && !isNaN(Number(amount)) && (
              <p className="text-xs font-bold text-indigo-600 mt-1">
                ≈ {formatKHR(convertToKHR(Number(amount)))} (at current rate)
              </p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-bold text-slate-700">Payment Notes (Optional)</label>
          <textarea 
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            rows={2}
            placeholder="e.g. Paid via ABA Bank at 10:30 AM"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-bold text-slate-700">Receipt Image</label>
          {!preview ? (
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full mb-3 group-hover:scale-110 transition-transform">
                  <Upload size={24} />
                </div>
                <p className="mb-2 text-sm text-slate-600">
                  <span className="font-bold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-slate-400">JPG, PNG or GIF (MAX. 5MB)</p>
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            </label>
          ) : (
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 group">
              <img src={preview} alt="Receipt Preview" className="w-full h-auto max-h-96 object-contain bg-slate-100" />
              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                 <button 
                  type="button"
                  onClick={() => { setFile(null); setPreview(null); }}
                  className="p-3 bg-white text-rose-500 rounded-full hover:scale-110 transition-transform shadow-xl"
                 >
                   <X size={20} />
                 </button>
              </div>
              <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-xs font-bold text-slate-700 flex items-center gap-2">
                <FileImage size={14} />
                {file?.name}
              </div>
            </div>
          )}
        </div>

        <button 
          type="submit" 
          disabled={submitting}
          className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-100 flex items-center justify-center gap-3 transition-all"
        >
          {submitting ? (
            <>
              <Loader2 size={24} className="animate-spin" />
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <CreditCard size={24} />
              <span>Submit Payment for Verification</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
