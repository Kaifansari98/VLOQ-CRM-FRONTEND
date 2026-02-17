'use client';

import { Operator } from '@/types';

interface TopOperatorsProps {
  operators: Operator[];
}

export default function TopOperators({ operators }: TopOperatorsProps) {
  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gray-900';
      case 2:
        return 'bg-gray-700';
      case 3:
        return 'bg-gray-600';
      case 4:
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="border-b border-gray-200 p-6 pb-4">
        <h2 className="text-lg font-bold text-gray-900">Top Performing Operators</h2>
        <p className="text-sm text-gray-500 mt-1">Based on items processed today</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rank
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Operator
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Items
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Avg Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Efficiency
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {operators.map((operator, index) => (
              <tr key={operator.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 ${getRankBadgeColor(
                      index + 1
                    )} text-white text-xs font-bold rounded`}
                  >
                    {index + 1}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{operator.name}</div>
                  <div className="text-xs text-gray-500">{operator.machine}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                  {operator.itemsProcessed}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {operator.avgTime}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                  {operator.efficiency}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
