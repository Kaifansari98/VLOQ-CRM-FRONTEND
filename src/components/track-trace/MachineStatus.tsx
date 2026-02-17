'use client';

import { Machine } from '@/types';

interface MachineStatusProps {
  machines: Machine[];
}

export default function MachineStatus({ machines }: MachineStatusProps) {
  const getStatusColor = (status: Machine['status']) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500';
      case 'IDLE':
        return 'bg-yellow-500';
      case 'MAINTENANCE':
        return 'bg-red-500';
      case 'INACTIVE':
        return 'bg-gray-400';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="border-b border-gray-200 p-6 pb-4">
        <h2 className="text-lg font-bold text-gray-900">Machine Status</h2>
        <p className="text-sm text-gray-500 mt-1">Current operational status</p>
      </div>
      <div className="p-6 pt-4">
        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {machines.map((machine) => (
            <div
              key={machine.id}
              className="flex items-center justify-between pb-3 border-b border-gray-100 last:border-0"
            >
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${getStatusColor(machine.status)}`}></span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{machine.name}</p>
                  <p className="text-xs text-gray-500">
                    {machine.operator || machine.status.charAt(0) + machine.status.slice(1).toLowerCase()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">{machine.utilization}%</p>
                <p className="text-xs text-gray-500">Util.</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
