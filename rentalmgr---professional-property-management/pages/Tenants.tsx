
import React from 'react';
import { Tenant } from '../types';

const mockTenants: Tenant[] = [
  { id: 'KH-1928301', name: 'Sothea Chan', phone: '+855 12 345 678', room: 'Room 302', leaseExpiry: 'Oct 12, 2024', status: 'Active' },
  { id: 'KH-8821902', name: 'Bopha Keo', phone: '+855 70 987 654', room: 'Room 205', leaseExpiry: 'Sep 30, 2024', status: 'Active' },
  { id: 'KH-3345112', name: 'Dara Sok', phone: '+855 92 123 456', room: 'Room 101', leaseExpiry: 'Nov 01, 2024', status: 'Pending' },
  { id: 'KH-5542109', name: 'Vibol Meng', phone: '+855 17 555 888', room: 'Room 410', leaseExpiry: 'Dec 15, 2024', status: 'Active' },
  { id: 'KH-9912304', name: 'Nary Chea', phone: '+855 11 222 333', room: 'Room 105', leaseExpiry: 'Aug 20, 2024', status: 'Former' },
];

const Tenants: React.FC = () => {
  return (
    <div className="p-4 sm:p-10 max-w-7xl mx-auto w-full space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Tenant Directory</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage your tenants, view profiles, and track lease statuses.</p>
        </div>
        <div className="flex gap-3">
          <button className="h-10 px-4 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-all">
            <span className="material-symbols-outlined text-[20px]">file_download</span> Export
          </button>
          <button className="h-10 px-4 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all">
            <span className="material-symbols-outlined text-[20px]">add</span> Add New Tenant
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-full md:w-auto">
          {['Active', 'Pending', 'Former'].map((tab: any) => (
            <button
              key={tab}
              className={`px-6 py-1.5 rounded-md text-sm font-bold transition-all ${tab === 'Active' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary' : 'text-gray-500'}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-80">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400">search</span>
          <input className="w-full pl-10 h-11 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-transparent" placeholder="Search tenants..." />
        </div>
      </div>

      <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 text-gray-500 uppercase text-xs font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Tenant</th>
                <th className="px-6 py-4">Contact Info</th>
                <th className="px-6 py-4">Assigned Room</th>
                <th className="px-6 py-4">Lease Expiry</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {mockTenants.map(t => (
                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 overflow-hidden">
                        <img src={`https://picsum.photos/seed/${t.id}/100/100`} alt="" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{t.name}</p>
                        <p className="text-xs text-gray-500">ID: {t.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">call</span> {t.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">{t.room}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium">{t.leaseExpiry}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                      t.status === 'Active' ? 'bg-green-100 text-green-800 border-green-200' :
                      t.status === 'Pending' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                      'bg-gray-100 text-gray-600 border-gray-200'
                    }`}>
                      <span className={`size-1.5 rounded-full ${t.status === 'Active' ? 'bg-green-500' : t.status === 'Pending' ? 'bg-amber-500' : 'bg-gray-400'}`}></span>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-primary font-bold text-xs bg-primary/5 px-3 py-1.5 rounded-md hover:bg-primary/10 transition-colors">View Profile</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Tenants;
