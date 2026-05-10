import React from 'react';
import { useCurrency } from '../utils/CurrencyContext';
import type { BuildingComparison } from '../types';

interface BuildingCardProps {
  building: BuildingComparison;
}

export const BuildingCard: React.FC<BuildingCardProps> = ({ building }) => {
  const { formatUSD, formatKHR, convertToKHR } = useCurrency();
  
  return (
    <div className="group relative flex w-80 shrink-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-surface-light shadow-sm transition-all hover:shadow-xl dark:border-gray-700 dark:bg-surface-dark">
      <div className="relative h-40 overflow-hidden">
        <img
          alt={building.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          src={building.image}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h4 className="text-lg font-bold text-white">{building.name}</h4>
          <p className="truncate text-xs text-gray-200">{building.address}</p>
        </div>
        <div className="absolute top-4 right-4 rounded-full bg-white/20 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-md">
          ID: {building.id}
        </div>
      </div>
      <div className="flex-1 p-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase text-gray-400">Occupancy</p>
            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 rounded-full bg-gray-100 dark:bg-gray-700">
                <div
                  className={`h-full rounded-full ${
                    building.occupancyRate > 80 ? 'bg-emerald-500' : building.occupancyRate > 50 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${building.occupancyRate}%` }}
                />
              </div>
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{building.occupancyRate}%</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase text-gray-400">Tenants</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {building.activeTenants} / {building.totalRooms}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase text-gray-400">Collected</p>
            <p className="text-sm font-bold text-emerald-600">{formatUSD(building.collectedThisMonth)}</p>
            <p className="text-[9px] font-medium text-gray-400 leading-none">≈ {formatKHR(convertToKHR(building.collectedThisMonth))}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase text-gray-400">Outstanding</p>
            <p className="text-sm font-bold text-rose-600">{formatUSD(building.outstandingBalance)}</p>
            <p className="text-[9px] font-medium text-gray-400 leading-none">≈ {formatKHR(convertToKHR(building.outstandingBalance))}</p>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-gray-50 pt-4 dark:border-gray-800">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-gray-400">event_upcoming</span>
            <div className="flex flex-col">
              <span className="text-[10px] font-medium text-gray-500">Projected: {formatUSD(building.projectedRevenue)}</span>
              <span className="text-[9px] text-gray-400">≈ {formatKHR(convertToKHR(building.projectedRevenue))}</span>
            </div>
          </div>
          <button className="rounded-lg bg-gray-50 px-3 py-1.5 text-[10px] font-bold text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700">
            Details
          </button>
        </div>
      </div>
    </div>
  );
};
