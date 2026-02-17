'use client';

import { Alert } from '@/types';
import { AlertTriangle, Info, CheckCircle, AlertCircle } from 'lucide-react';

interface AlertsProps {
  alerts: Alert[];
}

export default function Alerts({ alerts }: AlertsProps) {
  const getAlertConfig = (type: Alert['type']) => {
    switch (type) {
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-900',
          subtext: 'text-red-700',
          icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-900',
          subtext: 'text-yellow-700',
          icon: <AlertCircle className="w-5 h-5 text-yellow-600" />,
        };
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-900',
          subtext: 'text-green-700',
          icon: <CheckCircle className="w-5 h-5 text-green-600" />,
        };
      case 'info':
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-900',
          subtext: 'text-gray-700',
          icon: <Info className="w-5 h-5 text-gray-600" />,
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-900',
          subtext: 'text-gray-700',
          icon: <Info className="w-5 h-5 text-gray-600" />,
        };
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="border-b border-gray-200 p-6 pb-4">
        <h2 className="text-lg font-bold text-gray-900">Insights & Alerts</h2>
        <p className="text-sm text-gray-500 mt-1">Action items & notifications</p>
      </div>
      <div className="p-6 pt-4">
        <div className="space-y-4">
          {alerts.map((alert) => {
            const config = getAlertConfig(alert.type);
            return (
              <div
                key={alert.id}
                className={`p-4 ${config.bg} border ${config.border} rounded`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">{config.icon}</div>
                  <div>
                    <p className={`text-sm font-medium ${config.text}`}>{alert.title}</p>
                    <p className={`text-xs ${config.subtext} mt-1`}>{alert.message}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
