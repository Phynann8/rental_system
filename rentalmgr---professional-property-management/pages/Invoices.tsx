
import React, { useState } from 'react';
import { Invoice } from '../types';

const mockInvoices: Invoice[] = [
  { id: '#INV-2023-001', tenant: 'Sokha Chan', phone: '+855 12 345 678', room: 'B-402', status: 'Unpaid', dueDate: 'Nov 05, 2023', amount: 450, initials: 'SC' },
  { id: '#INV-2023-002', tenant: 'John Doe', phone: '+855 98 765 432', room: 'A-101', status: 'Overdue', dueDate: 'Oct 30, 2023', amount: 300, initials: 'JD' },
  { id: '#INV-2023-003', tenant: 'Lisa Manoban', phone: 'lisa.m@example.com', room: 'C-505', status: 'Paid', dueDate: 'Nov 01, 2023', amount: 1200, initials: 'LM' },
  { id: '#INV-2023-004', tenant: 'Dara Kim', phone: '+855 11 222 333', room: 'B-301', status: 'Unpaid', dueDate: 'Nov 05, 2023', amount: 550, initials: 'DK' },
  { id: '#INV-2023-005', tenant: 'Sopheak Vong', phone: 's.vong@email.com', room: 'A-204', status: 'Overdue', dueDate: 'Oct 25, 2023', amount: 800, initials: 'SV' },
];

const Invoices: React.FC = () => {
  const [filter, setFilter] = useState<'All' | 'Unpaid' | 'Paid' | 'Overdue'>('All');

  const filteredInvoices = mockInvoices.filter(inv => filter === 'All' || inv.status === filter);

  return (
    <div className="p-4 sm:p-10 max-w-[1440px] mx-auto w-full space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Invoice Management</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage billing for November 2023 across all properties.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-semibold transition-all">
            <span className="material-symbols-outlined text-[20px]">calendar_month</span> Nov 2023
          </button>
          <button className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20 transition-all">
            <span className="material-symbols-outlined text-[20px]">add_circle</span> Bulk Generate
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Total Invoiced" value="$12,450.00" sub="+5% from last month" color="blue" />
        <SummaryCard label="Collected" value="$8,200.00" sub="65% of total" color="gray" />
        <SummaryCard label="Pending" value="$3,150.00" sub="12 invoices pending" color="orange" />
        <SummaryCard label="Overdue" value="$1,100.00" sub="Action required" color="red" />
      </div>

      <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800">
           <div className="flex flex-1 gap-3">
             <div className="relative w-full sm:max-w-xs">
               <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400">search</span>
               <input className="w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-800" placeholder="Search tenant..." />
             </div>
           </div>
           <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
             {['All', 'Unpaid', 'Paid', 'Overdue'].map((f: any) => (
               <button
                 key={f}
                 onClick={() => setFilter(f)}
                 className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${filter === f ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}
               >
                 {f}
               </button>
             ))}
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-4 text-left"><input type="checkbox" className="rounded" /></th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Invoice ID</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tenant</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Room</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredInvoices.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                  <td className="px-6 py-4"><input type="checkbox" className="rounded" /></td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{inv.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 mr-3">{inv.initials}</div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{inv.tenant}</div>
                        <div className="text-xs text-gray-500">{inv.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{inv.room}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                      inv.status === 'Paid' ? 'bg-green-100 text-green-800 border-green-200' :
                      inv.status === 'Overdue' ? 'bg-red-100 text-red-800 border-red-200' :
                      'bg-yellow-100 text-yellow-800 border-yellow-200'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-sm ${inv.status === 'Overdue' ? 'text-red-600 font-bold' : 'text-gray-500'}`}>{inv.dueDate}</td>
                  <td className="px-6 py-4 text-sm font-bold text-right text-gray-900 dark:text-white font-mono">${inv.amount.toFixed(2)}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="text-primary p-1.5 rounded-full hover:bg-gray-100 transition-all"><span className="material-symbols-outlined text-[20px]">visibility</span></button>
                      <button className="text-gray-400 p-1.5 rounded-full hover:bg-gray-100 transition-all"><span className="material-symbols-outlined text-[20px]">more_vert</span></button>
                    </div>
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

const SummaryCard = ({ label, value, sub, color }: any) => (
  <div className={`p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark shadow-sm flex flex-col gap-1 ${color === 'red' ? 'border-l-4 border-l-red-500' : ''}`}>
    <div className="flex items-center gap-2 text-gray-500 text-sm font-medium uppercase tracking-wider">
      <span className={`material-symbols-outlined text-[18px] ${color === 'red' ? 'text-red-500' : ''}`}>
        {color === 'red' ? 'warning' : 'receipt_long'}
      </span>
      {label}
    </div>
    <div className={`text-2xl font-bold ${color === 'red' ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>{value}</div>
    <div className={`text-xs font-medium ${color === 'blue' ? 'text-green-600' : 'text-gray-400'}`}>
      {sub}
    </div>
  </div>
);

export default Invoices;
