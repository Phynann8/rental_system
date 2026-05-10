import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { SystemSetting } from '../types';

const SettingsLive: React.FC = () => {
  const [settings, setSettings] = useState<SystemSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    void loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await api.getSettings();
      setSettings(data);
    } catch (err) {
      setError('Failed to load settings from server.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      await api.updateSettings(settings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof SystemSetting, value: string | number) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

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

      <div className="flex-1 bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden relative">
        <div className="p-6 md:p-8 border-b border-gray-100 flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">Settings <span className="material-symbols-outlined text-[14px]">chevron_right</span> <span className="text-primary font-bold">System Configuration</span></div>
            <h2 className="text-3xl font-bold tracking-tight">Global Configurations</h2>
          </div>
          <div className="flex items-center gap-4">
            {success && <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-full animate-pulse border border-green-200">Settings Saved</span>}
            <button 
              onClick={handleSave} 
              disabled={loading || saving}
              className="bg-primary hover:bg-primary-dark disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow-lg shadow-primary/20 transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">{saving ? 'autorenew' : 'save'}</span> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {loading || !settings ? (
          <div className="flex-1 flex justify-center items-center">
            <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-12">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg font-medium">{error}</div>}
            
            <section className="flex flex-col lg:flex-row gap-8">
               <div className="lg:w-1/3 space-y-2">
                  <h3 className="text-lg font-bold flex items-center gap-2"><span className="material-symbols-outlined text-primary">business</span> General Defaults</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">Basic organization identity and system-wide default behaviors.</p>
               </div>
               <div className="lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                     <label className="block text-sm font-bold">Company / Property Name</label>
                     <input 
                       type="text" 
                       className="w-full px-4 py-2.5 border border-gray-300 rounded-lg font-medium shadow-sm focus:ring-primary focus:border-primary transition-all" 
                       value={settings.companyName}
                       onChange={e => updateSetting('companyName', e.target.value)}
                     />
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                     <label className="block text-sm font-bold">Default Invoice Due (Days)</label>
                     <div className="relative">
                       <input 
                         type="number" 
                         className="w-full pl-4 pr-16 py-2.5 border border-gray-300 rounded-lg font-bold shadow-sm focus:ring-primary focus:border-primary transition-all" 
                         value={settings.defaultInvoiceDueDays}
                         onChange={e => updateSetting('defaultInvoiceDueDays', Number(e.target.value) || 0)}
                       />
                       <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">DAYS</span>
                     </div>
                  </div>
               </div>
            </section>

            <hr className="border-gray-100" />

            <section className="flex flex-col lg:flex-row gap-8">
               <div className="lg:w-1/3 space-y-2">
                  <h3 className="text-lg font-bold flex items-center gap-2"><span className="material-symbols-outlined text-primary">water_drop</span> Utility Rates</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">Configure base rates for utilities applied automatically to all new invoices.</p>
               </div>
               <div className="lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                     <div className="flex justify-between items-start">
                       <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg"><span className="material-symbols-outlined">bolt</span></div>
                       <span className="text-xs font-bold text-gray-400 bg-white px-2 py-1 rounded border shadow-sm">Per kWh</span>
                     </div>
                     <label className="block text-sm font-bold">Electricity Rate</label>
                     <div className="relative flex items-center">
                       <span className="absolute inset-y-0 left-0 pl-3 flex items-center justify-center font-bold text-gray-400">៛</span>
                       <input 
                          type="number" 
                          className="w-full pl-8 py-2.5 border border-gray-300 rounded-lg font-bold text-lg focus:ring-primary focus:border-primary transition-all pr-4" 
                          value={settings.defaultElectricityRate}
                          onChange={(e) => updateSetting('defaultElectricityRate', Number(e.target.value) || 0)}
                       />
                     </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                     <div className="flex justify-between items-start">
                       <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><span className="material-symbols-outlined">water_drop</span></div>
                       <span className="text-xs font-bold text-gray-400 bg-white px-2 py-1 rounded border shadow-sm">Per m³</span>
                     </div>
                     <label className="block text-sm font-bold">Water Rate</label>
                     <div className="relative flex items-center">
                       <span className="absolute inset-y-0 left-0 pl-3 flex items-center justify-center font-bold text-gray-400">៛</span>
                       <input 
                         type="number" 
                         className="w-full pl-8 py-2.5 border border-gray-300 rounded-lg font-bold text-lg focus:ring-primary focus:border-primary transition-all pr-4" 
                         value={settings.defaultWaterRate}
                         onChange={(e) => updateSetting('defaultWaterRate', Number(e.target.value) || 0)}
                       />
                     </div>
                  </div>
               </div>
            </section>

            <hr className="border-gray-100" />

            <section className="flex flex-col lg:flex-row gap-8">
               <div className="lg:w-1/3 space-y-2">
                  <h3 className="text-lg font-bold flex items-center gap-2"><span className="material-symbols-outlined text-primary">currency_exchange</span> Currency & Exchange</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">Set primary operating currency symbol and fixed exchange rates for invoicing.</p>
               </div>
               <div className="lg:w-2/3 space-y-6">
                  <div className="bg-gray-50 dark:bg-gray-800 p-5 rounded-xl border border-gray-200 flex justify-between items-center gap-4">
                     <div>
                       <p className="text-sm font-bold">Currency Symbol</p>
                       <p className="text-xs text-gray-500">Displayed on financial reports and invoices</p>
                     </div>
                     <div className="w-24">
                        <input 
                          type="text" 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg font-bold text-center text-lg focus:ring-primary focus:border-primary shadow-sm" 
                          value={settings.currencySymbol}
                          onChange={(e) => updateSetting('currencySymbol', e.target.value)}
                        />
                     </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-5 rounded-xl border border-gray-200 flex justify-between items-center gap-4">
                     <div>
                       <p className="text-sm font-bold">Exchange Rate</p>
                       <p className="text-xs text-gray-500">Fixed rate for invoicing conversion</p>
                     </div>
                     <div className="flex items-center gap-3">
                       <span className="text-sm font-bold text-gray-400">1 USD =</span>
                       <div className="relative w-36">
                          <input 
                            type="number" 
                            className="w-full pl-4 pr-12 py-2 border border-gray-300 rounded-lg font-bold text-right text-lg focus:ring-primary focus:border-primary shadow-sm" 
                            value={settings.exchangeRateUsdToKhr}
                            onChange={(e) => updateSetting('exchangeRateUsdToKhr', Number(e.target.value) || 0)}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">KHR</span>
                       </div>
                     </div>
                  </div>
               </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsLive;
