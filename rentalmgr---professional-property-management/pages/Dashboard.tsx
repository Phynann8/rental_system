
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getInsights } from '../services/geminiService';

const data = [
  { name: 'Jan', value: 8400 },
  { name: 'Feb', value: 6200 },
  { name: 'Mar', value: 10500 },
  { name: 'Apr', value: 9100 },
  { name: 'May', value: 11900 },
  { name: 'Jun', value: 14500 },
];

const Dashboard: React.FC = () => {
  const [insights, setInsights] = useState<string[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const stats = {
    totalBuildings: 12,
    occupancy: 84,
    unpaidCount: 4,
    unpaidAmount: 800,
    activeTenants: 132
  };

  const fetchAIInsights = async () => {
    setLoadingInsights(true);
    const result = await getInsights(stats);
    setInsights(result);
    setLoadingInsights(false);
  };

  useEffect(() => {
    fetchAIInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Welcome Banner */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-blue-600 shadow-lg relative p-6 sm:p-8">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Welcome back, Vibol!</h2>
            <p className="text-blue-100 max-w-xl">Here's what's happening with your properties today. You have {stats.unpaidCount} invoices pending review.</p>
          </div>
          <div className="mt-4 sm:mt-0 text-center px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm border border-white/10">
            <p className="text-xs text-blue-100 uppercase tracking-wider">Phnom Penh</p>
            <p className="text-lg font-bold text-white">32°C</p>
          </div>
        </div>
      </div>

      {/* AI Insights Bar */}
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4">
        <div className="flex items-center gap-2 text-primary shrink-0">
          <span className="material-symbols-outlined animate-pulse">lightbulb</span>
          <span className="font-bold text-sm uppercase">AI Insights</span>
        </div>
        <div className="flex-1 text-sm text-text-secondary dark:text-gray-400">
          {loadingInsights ? (
            <span className="italic">Generating smart suggestions...</span>
          ) : (
            <ul className="flex flex-wrap gap-x-6 gap-y-1 list-disc list-inside">
              {insights.map((ins, i) => <li key={i}>{ins}</li>)}
            </ul>
          )}
        </div>
        <button onClick={fetchAIInsights} className="text-primary text-xs font-bold hover:underline shrink-0">Refresh Insights</button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Today's Income" value="$1,250.00" trend="+12%" sub="vs yesterday" icon="payments" color="blue" />
        <StatCard title="Unpaid Invoices" value={`4 ($${stats.unpaidAmount}.00)`} trend="Action Needed" sub="2 overdue > 7 days" icon="warning" color="orange" />
        <StatCard title="Active Leases" value={`${stats.occupancy}%`} trend="Occupancy" sub="42 / 50 Rooms" icon="key" color="emerald" progress={stats.occupancy} />
      </div>

      {/* Charts & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-surface-light dark:border-gray-700 dark:bg-surface-dark shadow-sm flex flex-col">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-700">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Monthly Revenue</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Income over the last 6 months</p>
            </div>
            <select className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              <option>USD ($)</option>
              <option>KHR (៛)</option>
            </select>
          </div>
          <div className="p-6 flex-1 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <Tooltip 
                   cursor={{ fill: '#f3f4f6' }}
                   contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                   {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === data.length - 1 ? '#137fec' : '#137fec66'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-surface-light dark:border-gray-700 dark:bg-surface-dark shadow-sm flex flex-col">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Activity</h3>
            <button className="text-sm font-medium text-primary hover:text-primary-dark">View All</button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              <ActivityItem icon="build" color="red" title="Maintenance Request" time="2h ago" desc="Unit 204 reported AC Leaking." />
              <ActivityItem icon="attach_money" color="green" title="Payment Received" time="4h ago" desc="Dara paid Invoice #1042 for Unit 101." />
              <ActivityItem icon="contract_edit" color="blue" title="Lease Created" time="Yesterday" desc="New 6-month lease for Unit 305." />
              <ActivityItem icon="person_add" color="purple" title="New Tenant Added" time="2d ago" desc="Sophea Chan added to system." />
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, trend, sub, icon, color, progress }: any) => (
  <div className="rounded-xl border border-gray-200 bg-surface-light p-6 shadow-sm dark:border-gray-700 dark:bg-surface-dark transition-all hover:shadow-md">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-text-secondary dark:text-gray-400">{title}</p>
        <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
      <div className={`rounded-full p-3 bg-${color}-50 text-${color}-600 dark:bg-${color}-900/20 dark:text-${color}-400`}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
    </div>
    <div className="mt-4 flex items-center text-sm">
      {progress !== undefined ? (
        <div className="flex-1 flex items-center gap-3">
          <div className="flex-1 h-2 bg-gray-100 rounded-full dark:bg-gray-700 overflow-hidden">
            <div className={`h-full bg-${color}-500 rounded-full`} style={{ width: `${progress}%` }}></div>
          </div>
          <span className={`font-medium text-${color}-600`}>{progress}%</span>
        </div>
      ) : (
        <>
          <span className={`flex items-center font-medium ${trend.includes('+') ? 'text-green-600' : 'text-orange-600'}`}>
            {trend}
          </span>
          <span className="ml-2 text-gray-500 dark:text-gray-400">{sub}</span>
        </>
      )}
    </div>
  </div>
);

const ActivityItem = ({ icon, color, title, time, desc }: any) => (
  <li className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
    <div className="flex gap-4">
      <div className={`mt-1 flex h-8 w-8 flex-none items-center justify-center rounded-full bg-${color}-100 text-${color}-600 dark:bg-${color}-900/30 dark:text-${color}-400`}>
        <span className="material-symbols-outlined text-lg">{icon}</span>
      </div>
      <div className="flex-auto">
        <div className="flex items-baseline justify-between gap-x-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{title}</p>
          <p className="flex-none text-xs text-gray-500 dark:text-gray-400">{time}</p>
        </div>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{desc}</p>
      </div>
    </div>
  </li>
);

export default Dashboard;
