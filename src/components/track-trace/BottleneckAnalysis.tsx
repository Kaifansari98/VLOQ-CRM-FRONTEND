'use client';

import { BottleneckData } from '@/types/track-trace';
import { AlertCircle } from 'lucide-react';

interface BottleneckAnalysisProps {
  bottlenecks: BottleneckData[];
}

export default function BottleneckAnalysis({ bottlenecks }: BottleneckAnalysisProps) {
  const getSeverityColor = (severity: BottleneckData['severity']) => {
    switch (severity) {
      case 'high':
        return { bar: 'bg-red-500', text: 'text-red-600' };
      case 'medium':
        return { bar: 'bg-yellow-500', text: 'text-yellow-600' };
      case 'low':
        return { bar: 'bg-green-500', text: 'text-green-600' };
      default:
        return { bar: 'bg-gray-500', text: 'text-gray-600' };
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="border-b border-gray-200 p-6 pb-4">
        <h2 className="text-lg font-bold text-gray-900">Bottleneck Analysis</h2>
        <p className="text-sm text-gray-500 mt-1">Machines with highest queue times</p>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {bottlenecks.map((bottleneck, index) => {
            const colors = getSeverityColor(bottleneck.severity);
            return (
              <div key={index} className="flex items-center gap-4">
                <div className="flex-shrink-0 w-32">
                  <p className="text-sm font-medium text-gray-900">{bottleneck.machine}</p>
                  <p className="text-xs text-gray-500">{bottleneck.operator || 'Unassigned'}</p>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Queue: {bottleneck.queueCount} items</span>
                    <span className="text-xs font-medium text-gray-900">
                      Avg Wait: {bottleneck.avgWait}
                    </span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-3">
                    <div
                      className={`${colors.bar} h-3 rounded-full`}
                      style={{ width: `${bottleneck.percentage}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex-shrink-0 w-20 text-right">
                  <span className={`text-sm font-bold ${colors.text} capitalize`}>
                    {bottleneck.severity}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
{/* 
        <div className="mt-6 p-4 bg-gray-50 rounded border border-gray-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-gray-700 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Recommendation</p>
              <p className="text-sm text-gray-600 mt-1">
                Consider redistributing CNC Router workload to available machines or scheduling
                additional operators during peak hours.
              </p>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
}
