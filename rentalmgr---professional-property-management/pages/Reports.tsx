
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const chartData = [
  { name: 'Jul', val: 65 },
  { name: 'Aug', val: 72 },
  { name: 'Sep', val: 68 },
  { name: 'Oct', val: 85 },
  { name: 'Nov', val: 82 },
  { name: 'Dec', val: 88 },
];

const Reports: React.FC = () => {
  return (
    <div className="p-4 sm:p-10 max-w-[1200px] mx-auto w-full space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Financial & Operational Reports</h1>
          <p className="text-gray-500 dark:text-gray-400">Monitor financial health and occupancy metrics across Cambodia.</p>
        </div>
        <div className="flex gap-3">
          <button className="h-10 px-4 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium shadow-sm transition-all">Export PDF</button>
          <button className="h-10 px-4 bg-primary text-white rounded-lg text-sm font-medium shadow-sm shadow-blue-200 transition-all">Export Excel</button>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date Range</span>
          <button className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">Jan 1, 2023 - Dec 31, 2023 <span className="material-symbols-outlined text-[18px]">calendar_month</span></button>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Property</span>
          <button className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">All Buildings (4) <span className="material-symbols-outlined text-[18px]">expand_more</span></button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard title="Total Revenue (YTD)" value="$124,500" trend="+12.5%" icon="payments" color="blue" />
        <KPICard title="Avg. Occupancy Rate" value="88%" trend="-2.1%" icon="door_front" color="purple" />
        <KPICard title="Outstanding Balances" value="$3,200" sub="Due > 30 Days" icon="warning" color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-surface-dark p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-[400px]">
          <h3 className="text-lg font-bold mb-6">Occupancy Trends</h3>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="val" fill="#137fec" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white dark:bg-surface-dark p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold mb-6">Income Statement</h3>
          <div className="space-y-4">
            <IncomeRow label="Rental Income" value="$145,200" icon="arrow_downward" color="emerald" />
            <IncomeRow label="Utility Income" value="$12,450" icon="water_drop" color="emerald" />
            <IncomeRow label="Maintenance" value="($8,320)" icon="build" color="rose" />
            <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
              <span className="text-sm font-bold uppercase">Net Operating Income</span>
              <span className="text-xl font-bold text-primary">$149,330</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const KPICard = ({ title, value, trend, icon, color, sub }: any) => (
  <div className="bg-white dark:bg-surface-dark p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col justify-between h-40">
    <div className="flex justify-between items-start">
      <div className={`p-2 bg-${color}-50 text-${color}-600 rounded-lg`}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      {trend && (
        <span className={`px-2 py-1 rounded-full text-xs font-bold ${trend.includes('+') ? 'bg-green-50 text-green-600' : 'bg-rose-50 text-rose-600'}`}>
          {trend}
        </span>
      )}
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
    <div>
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <h3 className="text-3xl font-bold">{value}</h3>
    </div>
  </div>
);

const IncomeRow = ({ label, value, icon, color }: any) => (
  <div className="flex justify-between items-center pb-3 border-b border-gray-100">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded bg-${color}-50 text-${color}-600`}><span className="material-symbols-outlined text-[18px]">{icon}</span></div>
      <span className="text-sm font-medium">{label}</span>
    </div>
    <span className="font-bold">{value}</span>
  </div>
);

export default Reports;
