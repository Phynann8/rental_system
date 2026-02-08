
import React from 'react';
import { Building } from '../types';

const mockBuildings: Building[] = [
  { id: 'BLD-001', name: 'Phnom Penh Heights', address: '#123 Monivong Blvd', rooms: 24, status: 'Active', image: 'https://picsum.photos/seed/b1/200/200' },
  { id: 'BLD-002', name: 'Siem Reap Villa', address: 'Wat Bo Road', rooms: 12, status: 'Active', image: 'https://picsum.photos/seed/b2/200/200' },
  { id: 'BLD-003', name: 'Battambang Residences', address: 'Road 1', rooms: 18, status: 'Inactive', image: 'https://picsum.photos/seed/b3/200/200' },
  { id: 'BLD-004', name: 'Kampot Riverside', address: 'Riverside Road', rooms: 8, status: 'Active', image: 'https://picsum.photos/seed/b4/200/200' },
  { id: 'BLD-005', name: 'Sihanoukville Condo', address: 'Independence Beach', rooms: 64, status: 'Maintenance', image: 'https://picsum.photos/seed/b5/200/200' },
];

const Buildings: React.FC = () => {
  return (
    <div className="p-4 sm:p-10 max-w-[1400px] mx-auto w-full space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Building Management</h1>
          <p className="text-gray-500 dark:text-gray-400 text-base font-normal mt-1">Manage your properties and view occupancy status.</p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-primary hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg shadow-blue-500/20">
          <span className="material-symbols-outlined">add</span>
          Add New Building
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard icon="domain" label="Total Buildings" value="12" color="blue" />
        <StatsCard icon="door_front" label="Total Rooms" value="148" color="green" />
        <StatsCard icon="person" label="Active Tenants" value="132" color="purple" />
      </div>

      <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-96">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400">search</span>
            <input className="w-full pl-10 pr-3 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-lg text-sm" placeholder="Search by name or address..." />
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2">
               <span className="material-symbols-outlined text-[20px]">tune</span> Filter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Building Name</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Address</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Rooms</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {mockBuildings.map(b => (
                <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-4">
                      <img src={b.image} className="h-10 w-10 rounded-lg object-cover" alt="" />
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{b.name}</p>
                        <p className="text-xs text-gray-400">ID: {b.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {b.address}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">{b.rooms}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                      b.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30' :
                      b.status === 'Maintenance' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700'
                    }`}>
                      <span className={`size-1.5 rounded-full ${
                         b.status === 'Active' ? 'bg-green-600' :
                         b.status === 'Maintenance' ? 'bg-yellow-500' : 'bg-gray-500'
                      }`}></span>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex justify-end gap-3 text-gray-400">
                      <button className="hover:text-primary transition-colors"><span className="material-symbols-outlined text-[20px]">visibility</span></button>
                      <button className="hover:text-primary transition-colors"><span className="material-symbols-outlined text-[20px]">edit</span></button>
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

const StatsCard = ({ icon, label, value, color }: any) => (
  <div className="bg-white dark:bg-surface-dark p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
    <div className={`size-12 rounded-full bg-${color}-50 dark:bg-${color}-900/20 flex items-center justify-center text-${color}-600`}>
      <span className="material-symbols-outlined">{icon}</span>
    </div>
    <div>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  </div>
);

export default Buildings;
