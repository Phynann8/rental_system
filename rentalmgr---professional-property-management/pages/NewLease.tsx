
import React, { useState } from 'react';

const NewLease: React.FC = () => {
  const [step, setStep] = useState(1);

  return (
    <div className="p-4 sm:p-10 max-w-5xl mx-auto w-full space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <span>Leases</span> <span className="material-symbols-outlined text-xs">chevron_right</span> <span className="text-primary font-bold">New Agreement</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Create New Lease Agreement</h1>
          <p className="text-gray-500">Drafting a new lease for <span className="font-bold text-gray-900">Riverside Apartments</span></p>
        </div>
        <button className="h-10 px-4 bg-white border border-gray-200 rounded-lg text-sm font-bold flex items-center gap-2 transition-all hover:bg-gray-50">
          <span className="material-symbols-outlined text-[18px]">save</span> Save Draft
        </button>
      </div>

      <div className="flex items-center justify-between w-full relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 rounded-full"></div>
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full transition-all duration-500" style={{ width: `${(step-1) * 33}%` }}></div>
        {[
          { icon: 'person', label: 'Tenant & Room' },
          { icon: 'calendar_month', label: 'Terms' },
          { icon: 'payments', label: 'Financials' },
          { icon: 'folder_open', label: 'Documents' },
        ].map((s, i) => (
          <div key={i} className={`flex flex-col items-center gap-2 cursor-pointer z-10 ${step === i + 1 ? 'opacity-100' : 'opacity-40'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ring-4 ring-white shadow-sm transition-all ${step === i + 1 ? 'bg-primary text-white' : 'bg-white text-gray-400 border'}`}>
              <span className="material-symbols-outlined text-xl">{s.icon}</span>
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${step === i + 1 ? 'text-primary' : 'text-gray-400'}`}>{s.label}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 dark:border-gray-800">
             <h3 className="text-xl font-bold">{step}. {['Select Tenant & Unit', 'Lease Duration', 'Rent & Currency', 'Upload Documents'][step-1]}</h3>
             <p className="text-sm text-gray-500 mt-1">Provide necessary details to complete this section.</p>
          </div>
          <div className="p-8 space-y-8 flex-1">
             {step === 1 && (
               <div className="space-y-6 animate-in fade-in duration-500">
                  <div className="space-y-2">
                    <div className="flex justify-between items-end"><label className="text-sm font-bold uppercase tracking-wider text-gray-500">Primary Tenant</label><button className="text-primary text-xs font-bold">+ New Tenant</button></div>
                    <div className="relative">
                       <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                       <input className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-primary" placeholder="Search by name, phone, or ID..." />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-sm font-bold uppercase tracking-wider text-gray-500">Building</label>
                       <select className="w-full h-11 border-gray-200 rounded-lg text-sm"><option>Riverside Apartments</option></select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-bold uppercase tracking-wider text-gray-500">Unit / Room</label>
                       <select className="w-full h-11 border-gray-200 rounded-lg text-sm"><option>Select Room</option></select>
                    </div>
                  </div>
               </div>
             )}
             {step > 1 && (
               <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-100 rounded-xl text-gray-400">
                  <span className="material-symbols-outlined text-4xl mb-2">construction</span>
                  <p className="text-sm">Additional fields for step {step} would go here.</p>
               </div>
             )}
          </div>
          <div className="p-6 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 flex justify-between gap-4">
            <button className="px-6 py-2.5 rounded-lg border border-gray-200 text-sm font-bold transition-all hover:bg-gray-100">Cancel</button>
            <div className="flex gap-2">
               <button onClick={() => setStep(Math.max(1, step-1))} disabled={step === 1} className="px-6 py-2.5 rounded-lg border border-gray-200 text-sm font-bold disabled:opacity-30">Back</button>
               <button onClick={() => setStep(Math.min(4, step+1))} className="px-8 py-2.5 bg-primary text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20 flex items-center gap-2">
                 {step === 4 ? 'Finish' : 'Next Step'} <span className="material-symbols-outlined text-sm">arrow_forward</span>
               </button>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
          <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-gray-200 shadow-sm">
             <h4 className="font-bold text-lg mb-4">Completion</h4>
             <div className="flex items-center gap-3 mb-4">
               <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                 <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${step * 25}%` }}></div>
               </div>
               <span className="text-sm font-bold text-green-600">{step * 25}%</span>
             </div>
             <ul className="space-y-4 text-sm">
               {['Tenant Info', 'Lease Dates', 'Rent & Fees', 'Contracts'].map((l, i) => (
                 <li key={i} className={`flex items-center gap-2 ${step > i ? 'text-primary font-bold' : 'text-gray-400'}`}>
                   <span className="material-symbols-outlined text-lg">{step > i ? 'radio_button_checked' : 'radio_button_unchecked'}</span> {l}
                 </li>
               ))}
             </ul>
          </div>
          <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 flex gap-3">
             <span className="material-symbols-outlined text-primary">lightbulb</span>
             <div>
               <p className="text-sm font-bold text-gray-900">Pro Tip</p>
               <p className="text-xs text-gray-500 leading-relaxed mt-1">Multiple tenants can be assigned to one room if they share the lease.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewLease;
