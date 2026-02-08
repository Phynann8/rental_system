
import React, { useState } from 'react';

const mockRooms = [
  { no: '101', prev: 1200, curr: 1250, usage: 50, status: 'Entered', type: 'OK' },
  { no: '102', prev: 1450, curr: '', usage: '-', status: 'Pending', type: 'Pending' },
  { no: '103', prev: 1100, curr: 1500, usage: 400, status: 'High Usage', type: 'Warning' },
  { no: '104', prev: 1320, curr: 1385, usage: 65, status: 'Entered', type: 'OK' },
  { no: '105', prev: 1250, curr: '', usage: '-', status: 'Pending', type: 'Pending' },
  { no: '106', prev: 1410, curr: 1410, usage: 0, status: 'Zero Usage', type: 'Warning' },
];

const Readings: React.FC = () => {
  const [utility, setUtility] = useState<'Electricity' | 'Water'>('Electricity');

  return (
    <div className="p-4 sm:p-10 max-w-[1440px] mx-auto w-full space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Monthly Utility Readings</h1>
          <p className="text-gray-500 dark:text-gray-400">Enter meter data for the current billing cycle.</p>
        </div>
        <button className="flex items-center gap-2 h-10 px-4 rounded-lg bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 text-sm font-bold shadow-sm">
          <span className="material-symbols-outlined text-[18px]">history</span> View History
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between bg-white dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap flex-1 gap-4 items-end">
          <label className="flex flex-col gap-1 flex-1 min-w-[150px]">
            <span className="text-xs font-bold uppercase text-gray-500">Building</span>
            <select className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg text-sm">
              <option>Phnom Penh Tower A</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 flex-1 min-w-[150px]">
            <span className="text-xs font-bold uppercase text-gray-500">Month</span>
            <input type="month" className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg text-sm" defaultValue="2023-10" />
          </label>
          <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <button 
              onClick={() => setUtility('Electricity')}
              className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${utility === 'Electricity' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}
            >
              <span className="material-symbols-outlined text-lg align-middle mr-1">bolt</span> Electricity
            </button>
            <button 
              onClick={() => setUtility('Water')}
              className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${utility === 'Water' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}
            >
              <span className="material-symbols-outlined text-lg align-middle mr-1">water_drop</span> Water
            </button>
          </div>
        </div>
        <div className="flex gap-2 text-xs font-bold text-gray-600 overflow-x-auto whitespace-nowrap">
           <button className="flex items-center gap-1 p-2 hover:bg-gray-50 rounded transition-all"><span className="material-symbols-outlined text-[18px]">upload</span> Import CSV</button>
           <button className="flex items-center gap-1 p-2 hover:bg-gray-50 rounded transition-all"><span className="material-symbols-outlined text-[18px]">download</span> Export Excel</button>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 uppercase text-xs font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">Room No.</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">Previous Reading</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">Current Reading</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">Usage</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">Status</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 w-16 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium divide-y divide-gray-100 dark:divide-gray-800">
              {mockRooms.map(room => (
                <tr key={room.no} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${room.type === 'Warning' ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                  <td className="px-6 py-3 font-bold">Room {room.no}</td>
                  <td className="px-6 py-3 text-gray-500 font-mono">{room.prev.toLocaleString()}</td>
                  <td className="px-6 py-3">
                    <input 
                      className={`w-full bg-white dark:bg-gray-800 border rounded-md p-2 text-sm font-mono ${room.type === 'Warning' ? 'border-red-300' : 'border-gray-200 dark:border-gray-700'}`}
                      defaultValue={room.curr}
                      placeholder="Enter reading..."
                    />
                  </td>
                  <td className="px-6 py-3 font-mono">
                    <span className={room.type === 'Warning' ? 'text-red-600 font-bold' : 'text-primary'}>{room.usage} {utility === 'Electricity' ? 'kWh' : 'm³'}</span>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                      room.type === 'OK' ? 'bg-green-100 text-green-700' :
                      room.type === 'Warning' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <span className="material-symbols-outlined text-sm">{room.type === 'OK' ? 'check_circle' : 'info'}</span>
                      {room.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <button className="text-gray-400 hover:text-primary"><span className="material-symbols-outlined">more_vert</span></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-8 text-sm">
            <div className="flex flex-col">
              <span className="text-xs uppercase font-bold text-gray-500 tracking-wider">Total Usage</span>
              <span className="text-lg font-black">515 <span className="text-sm font-medium text-gray-400">kWh</span></span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs uppercase font-bold text-gray-500 tracking-wider">Progress</span>
              <span className="text-lg font-black">4/6 <span className="text-sm font-medium text-gray-400">Units</span></span>
            </div>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none h-11 px-6 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-bold shadow-sm">Calculate Bills</button>
            <button className="flex-1 sm:flex-none h-11 px-6 bg-primary text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/30 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">save</span> Save Readings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Readings;
