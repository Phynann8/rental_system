import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import type { CreateLeaseRequest, LeaseOptionsResponse } from '../types';
import { formatCurrency, formatDate } from '../utils/format';

const today = new Date();
const defaultStart = today.toISOString().slice(0, 10);
const defaultEnd = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()).toISOString().slice(0, 10);

const emptyState: CreateLeaseRequest = {
  tenantId: 0,
  roomId: 0,
  startDate: defaultStart,
  endDate: defaultEnd,
  rentPrice: 0,
  depositAmount: 0,
};

const NewLeaseLive: React.FC = () => {
  const [step, setStep] = useState(1);
  const [options, setOptions] = useState<LeaseOptionsResponse>({ tenants: [], rooms: [] });
  const [form, setForm] = useState<CreateLeaseRequest>(emptyState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadOptions = async () => {
      setLoading(true);
      setError(null);
      try {
        const payload = await api.getLeaseOptions();
        setOptions(payload);

        const firstRoom = payload.rooms[0];
        const firstTenant = payload.tenants[0];

        setForm((current) => ({
          ...current,
          tenantId: current.tenantId || firstTenant?.id || 0,
          roomId: current.roomId || firstRoom?.id || 0,
          rentPrice: current.rentPrice || firstRoom?.basePrice || 0,
          depositAmount: current.depositAmount || firstRoom?.basePrice || 0,
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load lease options.');
      } finally {
        setLoading(false);
      }
    };

    void loadOptions();
  }, []);

  const selectedRoom = useMemo(() => options.rooms.find((room) => room.id === form.roomId) ?? null, [options.rooms, form.roomId]);
  const selectedTenant = useMemo(() => options.tenants.find((tenant) => tenant.id === form.tenantId) ?? null, [options.tenants, form.tenantId]);

  const chooseRoom = (roomId: number) => {
    const room = options.rooms.find((item) => item.id === roomId);
    setForm((current) => ({
      ...current,
      roomId,
      rentPrice: room?.basePrice ?? current.rentPrice,
      depositAmount: room?.basePrice ?? current.depositAmount,
    }));
  };

  const submitLease = async () => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const lease = await api.createLease(form);
      setSuccessMessage(`Lease created for ${lease.tenantName} in room ${lease.roomNumber}.`);
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create lease.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 p-4 sm:p-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>Leases</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="font-bold text-primary">New Agreement</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Create New Lease Agreement</h1>
          <p className="text-gray-500">
            {selectedRoom ? `Assigning ${selectedRoom.roomNumber} in ${selectedRoom.building}` : 'Choose a tenant and an available room.'}
          </p>
        </div>
        <button className="flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-bold transition-all hover:bg-gray-50" onClick={() => setStep(1)} type="button">
          <span className="material-symbols-outlined text-[18px]">replay</span> Reset Steps
        </button>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {successMessage && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{successMessage}</div>}

      <div className="relative flex items-center justify-between">
        <div className="absolute left-0 top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-gray-100"></div>
        <div className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-primary transition-all duration-500" style={{ width: `${(step - 1) * 33}%` }}></div>
        {[
          { icon: 'person', label: 'Tenant & Room' },
          { icon: 'calendar_month', label: 'Terms' },
          { icon: 'payments', label: 'Financials' },
          { icon: 'check_circle', label: 'Review' },
        ].map((item, index) => (
          <div className={`z-10 flex cursor-pointer flex-col items-center gap-2 ${step === index + 1 ? 'opacity-100' : 'opacity-40'}`} key={item.label}>
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ring-4 ring-white shadow-sm transition-all ${step === index + 1 ? 'bg-primary text-white' : 'border bg-white text-gray-400'}`}>
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${step === index + 1 ? 'text-primary' : 'text-gray-400'}`}>{item.label}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-surface-dark">
          <div className="border-b border-gray-100 p-6 dark:border-gray-800">
            <h3 className="text-xl font-bold">{step}. {['Select Tenant & Unit', 'Lease Duration', 'Rent & Deposit', 'Review & Submit'][step - 1]}</h3>
            <p className="mt-1 text-sm text-gray-500">Complete each section to create an active lease.</p>
          </div>
          <div className="flex-1 space-y-8 p-8">
            {loading ? (
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">Loading available tenants and rooms...</div>
            ) : (
              <>
                {step === 1 && (
                  <div className="space-y-6">
                    <label className="flex flex-col gap-2 text-sm font-bold uppercase tracking-wider text-gray-500">
                      Primary Tenant
                      <select
                        className="h-12 rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        onChange={(event) => setForm((current) => ({ ...current, tenantId: Number(event.target.value) }))}
                        value={form.tenantId}
                      >
                        {options.tenants.map((tenant) => (
                          <option key={tenant.id} value={tenant.id}>
                            {tenant.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="flex flex-col gap-2 text-sm font-bold uppercase tracking-wider text-gray-500">
                      Vacant Room
                      <select
                        className="h-12 rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        onChange={(event) => chooseRoom(Number(event.target.value))}
                        value={form.roomId}
                      >
                        {options.rooms.map((room) => (
                          <option key={room.id} value={room.id}>
                            {room.building} • {room.roomNumber} • {room.roomType}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                )}

                {step === 2 && (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <DateField label="Start date" onChange={(value) => setForm((current) => ({ ...current, startDate: value }))} value={form.startDate} />
                    <DateField label="End date" onChange={(value) => setForm((current) => ({ ...current, endDate: value }))} value={form.endDate} />
                  </div>
                )}

                {step === 3 && (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <NumberField label="Monthly rent" onChange={(value) => setForm((current) => ({ ...current, rentPrice: value }))} value={form.rentPrice} />
                    <NumberField label="Deposit amount" onChange={(value) => setForm((current) => ({ ...current, depositAmount: value }))} value={form.depositAmount} />
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-900/40">
                    <SummaryRow label="Tenant" value={selectedTenant?.name ?? 'N/A'} />
                    <SummaryRow label="Room" value={selectedRoom ? `${selectedRoom.building} • ${selectedRoom.roomNumber}` : 'N/A'} />
                    <SummaryRow label="Lease term" value={`${formatDate(form.startDate)} to ${formatDate(form.endDate)}`} />
                    <SummaryRow label="Rent" value={formatCurrency(form.rentPrice)} />
                    <SummaryRow label="Deposit" value={formatCurrency(form.depositAmount)} />
                  </div>
                )}
              </>
            )}
          </div>
          <div className="flex justify-between gap-4 border-t border-gray-100 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-800">
            <button className="rounded-lg border border-gray-200 px-6 py-2.5 text-sm font-bold transition-all hover:bg-gray-100" onClick={() => setStep(1)} type="button">
              Start Over
            </button>
            <div className="flex gap-2">
              <button className="rounded-lg border border-gray-200 px-6 py-2.5 text-sm font-bold disabled:opacity-30" disabled={step === 1} onClick={() => setStep((current) => Math.max(1, current - 1))} type="button">
                Back
              </button>
              {step < 4 ? (
                <button className="flex items-center gap-2 rounded-lg bg-primary px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20" disabled={loading} onClick={() => setStep((current) => Math.min(4, current + 1))} type="button">
                  Next Step <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              ) : (
                <button className="flex items-center gap-2 rounded-lg bg-primary px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20" disabled={saving || loading} onClick={() => void submitLease()} type="button">
                  {saving ? 'Creating...' : 'Create Lease'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="w-full flex-shrink-0 space-y-6 lg:w-80">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-surface-dark">
            <h4 className="mb-4 text-lg font-bold">Completion</h4>
            <div className="mb-4 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${step * 25}%` }}></div>
              </div>
              <span className="text-sm font-bold text-green-600">{step * 25}%</span>
            </div>
            <ul className="space-y-4 text-sm">
              {['Tenant Info', 'Lease Dates', 'Rent & Fees', 'Review'].map((label, index) => (
                <li className={`flex items-center gap-2 ${step > index ? 'font-bold text-primary' : 'text-gray-400'}`} key={label}>
                  <span className="material-symbols-outlined text-lg">{step > index ? 'radio_button_checked' : 'radio_button_unchecked'}</span> {label}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50 p-5">
            <span className="material-symbols-outlined text-primary">lightbulb</span>
            <div>
              <p className="text-sm font-bold text-gray-900">Pricing Hint</p>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">
                Available room base rent is prefilled automatically. Adjust it here if the lease needs a custom rate.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DateField = ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => (
  <label className="flex flex-col gap-2 text-sm font-bold uppercase tracking-wider text-gray-500">
    {label}
    <input className="h-12 rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white" onChange={(event) => onChange(event.target.value)} type="date" value={value} />
  </label>
);

const NumberField = ({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) => (
  <label className="flex flex-col gap-2 text-sm font-bold uppercase tracking-wider text-gray-500">
    {label}
    <input className="h-12 rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white" min="0" onChange={(event) => onChange(Number(event.target.value))} step="0.01" type="number" value={value} />
  </label>
);

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-4 border-b border-gray-200 pb-3 text-sm last:border-b-0 last:pb-0 dark:border-gray-700">
    <span className="font-semibold text-gray-500">{label}</span>
    <span className="font-bold text-gray-900 dark:text-white">{value}</span>
  </div>
);

export default NewLeaseLive;
