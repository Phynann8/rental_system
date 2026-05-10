import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../services/api';
import type { OccupancyReportResponse, OutstandingReportResponse, RevenueReportResponse } from '../types';
import { useCurrency } from '../utils/CurrencyContext';

const ReportsLive: React.FC = () => {
  const { formatUSD, formatKHR, convertToKHR } = useCurrency();
  const [revenueData, setRevenueData] = useState<RevenueReportResponse | null>(null);
  const [occupancyData, setOccupancyData] = useState<OccupancyReportResponse | null>(null);
  const [outstandingData, setOutstandingData] = useState<OutstandingReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        const [rev, occ, outs] = await Promise.all([
          api.getRevenueReport(currentYear),
          api.getOccupancyReport(),
          api.getOutstandingReport(),
        ]);

        if (!cancelled) {
          setRevenueData(rev);
          setOccupancyData(occ);
          setOutstandingData(outs);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load report data');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [currentYear]);


  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <span className="material-symbols-outlined animate-spin">progress_activity</span>
          Loading reports...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
      </div>
    );
  }

  // Derive historical data for chart
  const chartData = occupancyData?.historical || [];

  return (
    <div className="p-4 sm:p-10 max-w-[1200px] mx-auto w-full space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Financial & Operational Reports</h1>
          <p className="text-gray-500 dark:text-gray-400">Monitor financial health and occupancy metrics across Cambodia.</p>
        </div>
        <div className="flex gap-3">
          <button className="h-10 px-4 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium shadow-sm transition-hover">Export PDF</button>
          <button className="h-10 px-4 bg-primary hover:bg-primary-dark tracking-wide text-white rounded-lg text-sm font-bold shadow-md shadow-blue-200 dark:shadow-none transition-all active:scale-95 flex items-center justify-center relative overflow-hidden">
             Export Excel
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date Range</span>
          <button className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700">
            Jan 1, {currentYear} - Dec 31, {currentYear} <span className="material-symbols-outlined text-[18px]">calendar_month</span>
          </button>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Property</span>
          <button className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700">
            All Buildings <span className="material-symbols-outlined text-[18px]">expand_more</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard title={`Total Revenue (YTD ${currentYear})`} value={formatUSD(revenueData?.totalYtd || 0)} khrValue={formatKHR(convertToKHR(revenueData?.totalYtd || 0))} icon="payments" color="blue" />
        <KPICard title="Current Occupancy Rate" value={`${occupancyData?.currentRate || 0}%`} icon="door_front" color="purple" />
        <KPICard title="Outstanding Balances" value={formatUSD(outstandingData?.totalOutstanding || 0)} khrValue={formatKHR(convertToKHR(outstandingData?.totalOutstanding || 0))} sub="All active buildings" icon="warning" color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-surface-dark p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-[400px]">
          <h3 className="text-lg font-bold mb-6 text-gray-900 dark:text-white">Occupancy Trends</h3>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={[...chartData].reverse()}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{ fill: '#6B7280' }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(val) => `${val}%`} tick={{ fill: '#6B7280' }} tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{ fill: 'rgba(0,0,0,0.05)' }} 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }} 
                formatter={(val: number) => [`${val}%`, 'Occupancy']}
              />
              <Bar dataKey="rate" fill="#137fec" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white dark:bg-surface-dark p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col">
          <h3 className="text-lg font-bold mb-6 text-gray-900 dark:text-white">Income Statement</h3>
          <div className="space-y-4 flex-1">
            <IncomeRow label="Rental Income" value={formatUSD(revenueData?.rentalIncome || 0)} khrValue={formatKHR(convertToKHR(revenueData?.rentalIncome || 0))} icon="arrow_downward" color="emerald" />
            <IncomeRow label="Utility Income" value={formatUSD(revenueData?.utilityIncome || 0)} khrValue={formatKHR(convertToKHR(revenueData?.utilityIncome || 0))} icon="water_drop" color="emerald" />
            <IncomeRow label="Maintenance" value={formatUSD(0)} icon="build" color="rose" />
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col items-end mt-auto">
              <span className="text-sm font-bold uppercase tracking-wider text-gray-500 w-full flex justify-between">
                <span>NOI</span>
                <span className="text-xl font-bold text-primary">{formatUSD((revenueData?.totalYtd || 0) - 0)}</span>
              </span>
              <span className="text-xs font-medium text-gray-400">≈ {formatKHR(convertToKHR((revenueData?.totalYtd || 0) - 0))}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const KPICard = ({ title, value, khrValue, trend, icon, color, sub }: any) => (
  <div className="bg-white dark:bg-surface-dark p-6 rounded-xl shadow-sm border border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600 transition-all flex flex-col justify-between h-42">
    <div className="flex justify-between items-start">
      <div className={`p-2.5 bg-${color}-50 text-${color}-600 dark:bg-${color}-900/20 dark:text-${color}-400 rounded-lg`}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      {trend && (
        <span className={`px-2 py-1 rounded-full text-[11px] font-bold ${trend.includes('+') ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
          {trend}
        </span>
      )}
      {sub && <span className="text-xs font-medium text-gray-400">{sub}</span>}
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <div className="flex flex-col">
        <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight">{value}</h3>
        {khrValue && <p className="text-xs font-bold text-gray-400 mt-1">≈ {khrValue}</p>}
      </div>
    </div>
  </div>
);

const IncomeRow = ({ label, value, khrValue, icon, color }: any) => (
  <div className="flex justify-between items-center pb-3 border-b border-gray-50 dark:border-gray-800/50">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded bg-${color}-50 text-${color}-600 dark:bg-${color}-900/20 dark:text-${color}-400`}><span className="material-symbols-outlined text-[18px]">{icon}</span></div>
      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</span>
    </div>
    <div className="flex flex-col items-end">
      <span className="font-bold text-gray-900 dark:text-white">{value}</span>
      {khrValue && <span className="text-[10px] text-gray-400 font-medium">≈ {khrValue}</span>}
    </div>
  </div>
);

export default ReportsLive;
