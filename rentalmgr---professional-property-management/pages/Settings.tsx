
import React from 'react';

const Settings: React.FC = () => {
  return (
    <div className="p-4 sm:p-10 max-w-[1440px] mx-auto w-full h-full flex gap-8">
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full overflow-hidden">
        <div className="p-6 pb-2 border-b border-gray-100 dark:border-gray-800">
          <h1 className="text-xl font-bold">Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Manage system preferences</p>
        </div>
        <nav className="p-4 space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-all"><span className="material-symbols-outlined">settings</span> General</button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 text-primary font-bold"><span className="material-symbols-outlined">currency_exchange</span> Rates & Currency</button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-all"><span className="material-symbols-outlined">receipt_long</span> Templates</button>
        </nav>
      </aside>

      <div className="flex-1 bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
        <div className="p-6 md:p-8 border-b border-gray-100 flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">Settings <span className="material-symbols-outlined text-[14px]">chevron_right</span> <span className="text-primary font-bold">Rates & Currency</span></div>
            <h2 className="text-3xl font-bold tracking-tight">System Rates & Currency</h2>
          </div>
          <button className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow-lg shadow-primary/20 transition-all flex items-center gap-2">
             <span className="material-symbols-outlined text-[20px]">save</span> Save Changes
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-12">
          <section className="flex flex-col lg:flex-row gap-8">
             <div className="lg:w-1/3 space-y-2">
                <h3 className="text-lg font-bold flex items-center gap-2"><span className="material-symbols-outlined text-primary">water_drop</span> Utility Rates</h3>
                <p className="text-sm text-gray-500 leading-relaxed">Configure base rates for utilities applied automatically to all new invoices.</p>
             </div>
             <div className="lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                   <div className="flex justify-between items-start">
                     <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg"><span className="material-symbols-outlined">bolt</span></div>
                     <span className="text-xs font-bold text-gray-400 bg-white px-2 py-1 rounded border">Per kWh</span>
                   </div>
                   <label className="block text-sm font-bold">Electricity Rate</label>
                   <div className="relative">
                     <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400">៛</span>
                     <input type="number" className="w-full pl-8 py-2.5 border-gray-200 rounded-lg font-bold text-lg" defaultValue="1000" />
                   </div>
                   <p className="text-[10px] text-gray-400">Standard range: 800 - 1200 R</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                   <div className="flex justify-between items-start">
                     <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><span className="material-symbols-outlined">water_drop</span></div>
                     <span className="text-xs font-bold text-gray-400 bg-white px-2 py-1 rounded border">Per m³</span>
                   </div>
                   <label className="block text-sm font-bold">Water Rate</label>
                   <div className="relative">
                     <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400">៛</span>
                     <input type="number" className="w-full pl-8 py-2.5 border-gray-200 rounded-lg font-bold text-lg" defaultValue="1500" />
                   </div>
                   <p className="text-[10px] text-gray-400">Standard range: 1500 - 2500 R</p>
                </div>
             </div>
          </section>

          <hr className="border-gray-100" />

          <section className="flex flex-col lg:flex-row gap-8">
             <div className="lg:w-1/3 space-y-2">
                <h3 className="text-lg font-bold flex items-center gap-2"><span className="material-symbols-outlined text-primary">currency_exchange</span> Currency & Exchange</h3>
                <p className="text-sm text-gray-500 leading-relaxed">Set primary operating currency and fixed exchange rates for invoicing.</p>
             </div>
             <div className="lg:w-2/3 space-y-6">
                <div>
                  <label className="block text-sm font-bold mb-3">Primary Operating Currency</label>
                  <div className="flex bg-gray-100 p-1 rounded-lg w-fit">
                    <button className="px-6 py-2 bg-white text-primary rounded-md shadow-sm font-bold text-sm">USD ($)</button>
                    <button className="px-6 py-2 text-gray-500 font-bold text-sm">KHR (R)</button>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-5 rounded-xl border border-gray-200 flex justify-between items-center gap-4">
                   <div>
                     <p className="text-sm font-bold">Exchange Rate</p>
                     <p className="text-xs text-gray-500">Fixed rate for invoicing conversion</p>
                   </div>
                   <div className="flex items-center gap-3">
                     <span className="text-sm font-bold text-gray-400">1 USD =</span>
                     <div className="relative w-32">
                        <input type="number" className="w-full pr-10 border-gray-200 rounded-lg font-bold text-right text-lg" defaultValue="4100" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">KHR</span>
                     </div>
                   </div>
                </div>
             </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Settings;
