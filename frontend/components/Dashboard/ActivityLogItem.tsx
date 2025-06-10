
import React from 'react';
import { AuditLogEntry } from '../../types';
import { formatDate } from '../../utils/helpers';
import { PackageIcon, PencilIcon, PlusIcon, TrashIcon, TruckIcon } from '../Common/Icons'; // Assuming generic icons

interface ActivityLogItemProps {
  log: AuditLogEntry;
}

const getIconForAction = (action: string) => {
  if (action.toLowerCase().includes('create')) return <PlusIcon className="w-4 h-4 text-green-500" />;
  if (action.toLowerCase().includes('update') || action.toLowerCase().includes('edit')) return <PencilIcon className="w-4 h-4 text-blue-500" />;
  if (action.toLowerCase().includes('delete')) return <TrashIcon className="w-4 h-4 text-red-500" />;
  if (action.toLowerCase().includes('package')) return <PackageIcon className="w-4 h-4 text-purple-500" />;
  return <TruckIcon className="w-4 h-4 text-gray-500" />;
};

export const ActivityLogItem: React.FC<ActivityLogItemProps> = ({ log }) => {
  return (
    <li className="py-3 sm:py-4">
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0 p-2 bg-gray-100 rounded-full">
          {getIconForAction(log.action)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {log.action}
          </p>
          {log.details && (
            <p className="text-xs text-gray-500 truncate" title={log.details}>
              {log.details.length > 50 ? `${log.details.substring(0, 50)}...` : log.details}
            </p>
          )}
        </div>
        <div className="inline-flex items-center text-xs text-gray-500">
          {formatDate(log.timestamp)}
        </div>
      </div>
    </li>
  );
};
