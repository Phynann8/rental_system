import React from 'react';

interface ActivityRowProps {
  type: string;
  title: string;
  time: string;
  description: string;
}

export const ActivityRow: React.FC<ActivityRowProps> = ({
  type,
  title,
  time,
  description,
}) => {
  const icon = type === 'Payment' ? 'payments' : 'contract_edit';
  const color = type === 'Payment' ? 'green' : 'blue';

  return (
    <li className="px-6 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
      <div className="flex gap-4">
        <div className={`mt-1 flex h-8 w-8 flex-none items-center justify-center rounded-full bg-${color}-100 text-${color}-600 dark:bg-${color}-900/30 dark:text-${color}-400`}>
          <span className="material-symbols-outlined text-lg">{icon}</span>
        </div>
        <div className="flex-auto">
          <div className="flex items-baseline justify-between gap-x-4">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{title}</p>
            <p className="flex-none text-xs text-gray-500 dark:text-gray-400">{time}</p>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
      </div>
    </li>
  );
};
