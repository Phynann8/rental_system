import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  sub?: string;
  icon: string;
  color: string;
  progress?: number;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  sub,
  icon,
  color,
  progress,
}) => (
  <div className="rounded-xl border border-gray-200 bg-surface-light p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-surface-dark">
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
        <div className="flex flex-1 items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
            <div className={`h-full rounded-full bg-${color}-500`} style={{ width: `${Math.min(progress, 100)}%` }}></div>
          </div>
          <span className={`font-medium text-${color}-600`}>{progress}%</span>
        </div>
      ) : (
        <span className="text-gray-500 dark:text-gray-400">{sub}</span>
      )}
    </div>
  </div>
);
