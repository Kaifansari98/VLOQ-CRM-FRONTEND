'use client';

import { ActivityLog } from '@/types';
import { Download } from 'lucide-react';

interface ActivityLogTableProps {
  logs: ActivityLog[];
}

export default function ActivityLogTable({ logs }: ActivityLogTableProps) {
  const getStatusColor = (status: ActivityLog['status']) => {
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

  const getStatusDotColor = (status: ActivityLog['status']) => {
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

  const getStatusLabel = (status: ActivityLog['status']) => {
    switch (status) {
      case 'in_process':
        return 'In Process';
      case 'queued':
        return 'Pending';
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
          <div>
            <h2 className="text-lg font-bold text-gray-900">Detailed Activity Log</h2>
            <p className="text-sm text-gray-500 mt-1">Complete tracking history for selected period</p>
          </div>
          <button className="px-4 py-2 border border-gray-300 text-sm font-medium rounded hover:bg-gray-50 transition flex items-center gap-2">
            <Download className="w-4 h-4" />
            Download CSV
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Item ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Project
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Machine
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Operator
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{log.time}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {log.itemId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.project}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.machine}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {log.operator || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{log.action}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {log.duration || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${getStatusColor(
                      log.status
                    )}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${getStatusDotColor(log.status)}`}></span>
                    {getStatusLabel(log.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">Showing 1-5 of 1,247 entries</p>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-gray-300 text-sm font-medium rounded hover:bg-white transition">
              Previous
            </button>
            <button className="px-3 py-1 bg-gray-900 text-white text-sm font-medium rounded hover:bg-gray-800 transition">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
