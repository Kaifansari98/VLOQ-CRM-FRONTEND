'use client';

import { Item } from '@/types';

interface RealTimeTrackingProps {
  items: Item[];
}

export default function RealTimeTracking({ items }: RealTimeTrackingProps) {
  const getStatusColor = (status: Item['status']) => {
    switch (status) {
      case 'in_process':
        return 'bg-green-100 text-green-800';
      case 'queued':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'on_hold':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDotColor = (status: Item['status']) => {
    switch (status) {
      case 'in_process':
        return 'bg-green-500';
      case 'queued':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-gray-500';
      case 'on_hold':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: Item['status']) => {
    switch (status) {
      case 'in_process':
        return 'In Process';
      case 'queued':
        return 'Queued';
      case 'completed':
        return 'Completed';
      case 'on_hold':
        return 'On Hold';
      default:
        return status;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="border-b border-gray-200 p-6 pb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Real-Time Item Tracking</h2>
          <span className="w-2 h-2 bg-green-500 rounded-full pulse-dot"></span>
        </div>
        <p className="text-sm text-gray-500 mt-1">Live updates every 5 seconds</p>
      </div>
      <div className="p-6 pt-4">
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center gap-4 p-4 bg-gray-50 rounded border border-gray-200"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gray-900 text-white rounded flex items-center justify-center font-bold text-sm">
                  {String.fromCharCode(65 + (index % 4))}{(index % 3) + 1}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900">{item.project.project_name} - {item.lead.lead_code}</p>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-green-100 text-green-800`}
                  >
                    <span className={`w-2 h-2 rounded-full bg-green-500`}></span>
                    Scanned
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {item.cut_list.item_name} • {item.cut_list.material_details} • {item.cut_list.description}
                </p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-sm font-medium text-gray-900">{item.machine.machine_name}</p>
                <p className="text-xs text-gray-500">
                  {item.operator.user_name || 'Waiting'} • {item.actual_in_at_formatted || 'Next in queue'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
