import React, { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../services/api';
import { formatRelativeTime } from '../utils/format';
import { IntelligenceInsights } from '../components/IntelligenceInsights';
import { StatCard } from '../components/StatCard';
import { BuildingCard } from '../components/BuildingCard';
import { ActivityRow } from '../components/ActivityRow';
import { useCurrency } from '../utils/CurrencyContext';
import { useLanguage } from '../utils/LanguageContext';
import type { DashboardResponse, BuildingComparison } from '../types';

const emptyDashboard: DashboardResponse = {
  totalBuildings: 0,
  totalRooms: 0,
  occupiedRooms: 0,
  occupancyRate: 0,
  activeTenants: 0,
  unpaidCount: 0,
  unpaidAmount: 0,
  projectedRevenue: 0,
  collectedThisMonth: 0,
  revenue: [],
  activity: [],
};

const DashboardLive: React.FC = () => {
  const { t } = useLanguage();
  const { formatUSD, formatKHR, convertToKHR } = useCurrency();
  const [dashboardStats, setDashboardStats] = useState<DashboardResponse>(emptyDashboard);
  const [buildings, setBuildings] = useState<BuildingComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [stats, buildingComparisons] = await Promise.all([
        api.getDashboard(),
        api.getBuildingComparisons()
      ]);
      setDashboardStats(stats);
      setBuildings(buildingComparisons);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-blue-600 p-6 shadow-lg sm:p-8">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
        <div className="relative flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="mb-2 text-2xl font-bold text-white">{t('ops_snapshot')} <span className="text-xs font-normal opacity-50">v3001</span></h2>
            <p className="max-w-xl text-blue-100">
              {dashboardStats.unpaidCount > 0
                ? t('unpaid_follow_up', { count: dashboardStats.unpaidCount })
                : t('no_unpaid')}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-center backdrop-blur-sm">
            <p className="text-xs uppercase tracking-wider text-blue-100">{t('projected_rent')}</p>
            <p className="text-lg font-bold text-white">{formatUSD(dashboardStats.projectedRevenue)}</p>
            <p className="text-[10px] font-medium text-blue-200">≈ {formatKHR(convertToKHR(dashboardStats.projectedRevenue))}</p>
          </div>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <IntelligenceInsights />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard color="blue" icon="payments" sub={`≈ ${formatKHR(convertToKHR(dashboardStats.collectedThisMonth))}`} title={t('cash_collected')} value={formatUSD(dashboardStats.collectedThisMonth)} />
        <StatCard color="orange" icon="warning" sub={`≈ ${formatKHR(convertToKHR(dashboardStats.unpaidAmount))}`} title={t('outstanding')} value={formatUSD(dashboardStats.unpaidAmount)} />
        <StatCard color="emerald" icon="key" progress={dashboardStats.occupancyRate} title={t('occupancy')} value={`${dashboardStats.occupancyRate.toFixed(1)}%`} />
        <StatCard color="violet" icon="group" sub={`${dashboardStats.totalBuildings} ${t('building')}`} title={t('active_tenants')} value={`${dashboardStats.activeTenants}`} />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('properties')}</h3>
          <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Performance Breakdown</p>
        </div>
        <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar">
          {buildings.map((building) => (
            <BuildingCard building={building} key={building.id} />
          ))}
          {buildings.length === 0 && !loading && (
            <div className="flex w-full items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-12 text-gray-400 dark:border-gray-700">
              No buildings registered.
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="flex flex-col rounded-xl border border-gray-200 bg-surface-light shadow-sm dark:border-gray-700 dark:bg-surface-dark lg:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5 dark:border-gray-700">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('monthly_revenue')}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Payments received in the last 6 months</p>
            </div>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              {loading ? 'Loading...' : `${dashboardStats.revenue.length} months`}
            </span>
          </div>
          <div className="h-[300px] w-full p-6">
            <ResponsiveContainer height={300} width="100%">
              <BarChart data={dashboardStats.revenue}>
                <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />
                <XAxis axisLine={false} dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} tickLine={false} />
                <YAxis axisLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} tickFormatter={(value) => `$${value}`} tickLine={false} />
                <Tooltip
                  cursor={{ fill: '#f3f4f6' }}
                  formatter={(value: number) => [formatUSD(value), 'Total Revenue']}
                  labelFormatter={(label) => `Month: ${label}`}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {dashboardStats.revenue.map((entry, index) => (
                    <Cell key={entry.name} fill={index === dashboardStats.revenue.length - 1 ? '#137fec' : '#137fec66'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col rounded-xl border border-gray-200 bg-surface-light shadow-sm dark:border-gray-700 dark:bg-surface-dark">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('recent_activity')}</h3>
            <button className="text-sm font-medium text-primary hover:text-primary-dark" onClick={() => void fetchDashboardData()} type="button">
              Refresh
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {dashboardStats.activity.map((activity, index) => (
                <ActivityRow
                  description={activity.description}
                  key={activity.id || `act-${index}`}
                  time={formatRelativeTime(activity.at)}
                  title={activity.title}
                  type={activity.type}
                />
              ))}
              {!loading && dashboardStats.activity.length === 0 && (
                <li className="px-6 py-8 text-sm text-gray-500 dark:text-gray-400">No activity recorded yet.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLive;
