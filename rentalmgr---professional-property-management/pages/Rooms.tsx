
import React from 'react';
import { Room } from '../types';

const mockRooms: Room[] = [
  { id: 'A-101', building: 'Golden Tower', floor: '1st Floor', type: 'Studio', rent: 250, status: 'Occupied', tenant: 'Sokha C.', leaseEnd: 'Dec 2024' },
  { id: 'A-102', building: 'Golden Tower', floor: '1st Floor', type: '1 Bedroom', rent: 280, status: 'Vacant' },
  { id: 'A-104', building: 'Golden Tower', floor: '1st Floor', type: 'Studio', rent: 240, status: 'Vacant' },
  { id: 'A-201', building: 'Golden Tower', floor: '2nd Floor', type: '2 Bedroom', rent: 450, status: 'Maintenance', issue: 'AC leaking water' },
  { id: 'A-202', building: 'Golden Tower', floor: '2nd Floor', type: '2 Bedroom', rent: 450, status: 'Occupied', tenant: 'David K.', leaseEnd: 'Jan 2025' },
  { id: 'A-203', building: 'Golden Tower', floor: '2nd Floor', type: 'Studio', rent: 250, status: 'Occupied', tenant: 'Jessica S.', overdue: true },
];

const Rooms: React.FC = () => {
  return (
    <div className="p-4 sm:p-10 max-w-[1440px] mx-auto w-full space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Room Inventory</h1>
          <p className="text-gray-500 dark:text-gray-400 text-base">Manage property units across all buildings.</p>
        </div>
        <button className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white font-bold py-2.5 px-5 rounded-lg transition-all shadow-lg shadow-blue-500/20">
          <span className="material-symbols-outlined text-[20px]">add</span>
          Add New Room
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard label="Total Rooms" value="124" icon="domain" color="blue" trend="+2 this month" />
        <StatsCard label="Occupancy Rate" value="85%" icon="pie_chart" color="purple" sub="Target: 90%" progress={85} />
        <StatsCard label="Vacant Rooms" value="18" icon="meeting_room" color="orange" sub="Action Required" />
      </div>

      <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-center">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 sm:w-64">
             <select className="w-full h-11 pl-4 pr-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:ring-primary appearance-none">
              <option>All Properties</option>
              <option>Golden Tower</option>
            </select>
          </div>
          <div className="relative flex-1 sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400">search</span>
            <input className="w-full pl-10 h-11 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-transparent" placeholder="Search room or tenant..." />
          </div>
        </div>
        <div className="flex items-center gap-2">
           <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <button className="p-1.5 rounded bg-white dark:bg-gray-700 shadow-sm text-primary"><span className="material-symbols-outlined text-[20px]">grid_view</span></button>
            <button className="p-1.5 rounded text-gray-500"><span className="material-symbols-outlined text-[20px]">view_list</span></button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {mockRooms.map(room => (
          <div key={room.id} className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden relative group">
            <div className={`absolute top-0 left-0 w-1.5 h-full ${
              room.status === 'Occupied' ? 'bg-green-500' :
              room.status === 'Maintenance' ? 'bg-orange-400' : 'bg-primary'
            }`}></div>
            <div className="p-5 flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold dark:text-white">{room.id}</h3>
                  <p className="text-xs text-gray-500 font-medium">{room.building} • {room.floor}</p>
                </div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                  room.status === 'Occupied' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                  room.status === 'Maintenance' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                  'bg-blue-100 text-primary dark:bg-blue-900/30'
                }`}>
                  {room.status}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-y border-gray-100 dark:border-gray-800 mb-4">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-400 uppercase">Type</span>
                  <span className="text-sm font-semibold">{room.type}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-gray-400 uppercase">Rent</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">${room.rent}/mo</span>
                </div>
              </div>

              {room.status === 'Occupied' && (
                <div className="mt-auto space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-gray-200 overflow-hidden">
                       <img src={`https://picsum.photos/seed/${room.tenant}/100/100`} alt="" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{room.tenant}</p>
                      <p className={`text-xs ${room.overdue ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
                        {room.overdue ? 'Payment Overdue' : `Lease ends: ${room.leaseEnd}`}
                      </p>
                    </div>
                  </div>
                  <button className={`w-full py-2 px-4 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                    room.overdue ? 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100' : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50'
                  }`}>
                    {room.overdue ? <><span className="material-symbols-outlined text-[18px]">payments</span> Send Reminder</> : 'View Details'}
                  </button>
                </div>
              )}

              {room.status === 'Vacant' && (
                <div className="mt-auto space-y-4">
                   <div className="flex items-center gap-3 opacity-60">
                    <div className="size-8 rounded-full border border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                      <span className="material-symbols-outlined text-sm">person_add</span>
                    </div>
                    <span className="text-sm font-medium">No tenant assigned</span>
                  </div>
                  <button className="w-full py-2 px-4 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all font-bold text-sm">Assign Tenant</button>
                </div>
              )}

              {room.status === 'Maintenance' && (
                <div className="mt-auto space-y-4">
                  <div className="bg-orange-50 dark:bg-orange-900/10 p-2 rounded text-xs font-medium text-orange-600 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">build</span> {room.issue}
                  </div>
                   <button className="w-full py-2 px-4 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition-colors">Update Status</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const StatsCard = ({ label, value, icon, color, sub, trend, progress }: any) => (
  <div className="bg-white dark:bg-surface-dark p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col gap-1">
    <div className="flex justify-between items-start">
      <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">{label}</p>
      <div className={`p-1.5 bg-${color}-50 dark:bg-${color}-900/20 text-${color}-600 rounded-lg`}>
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </div>
    </div>
    <div className="flex items-baseline gap-2 mt-2">
      <p className="text-3xl font-bold dark:text-white">{value}</p>
      {trend && <span className="text-green-600 text-xs font-bold">{trend}</span>}
      {sub && <span className="text-sm text-gray-500">{sub}</span>}
    </div>
    {progress && (
      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 mt-2">
        <div className={`bg-${color}-500 h-1.5 rounded-full`} style={{ width: `${progress}%` }}></div>
      </div>
    )}
  </div>
);

export default Rooms;
