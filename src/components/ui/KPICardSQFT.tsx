'use client';

import { ReactNode } from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: ReactNode;
  subtitle?: string;
  sqft?: SQFT
}

interface SQFT{
    value : number,
    change: string,
    subtitle: string,
    trend:string

}

export default function KPICardSQFT({ title, value, change, trend, icon, subtitle,sqft }: KPICardProps) {
  const getTrendColor = () => {
    if (!sqft?.trend) return 'text-gray-600';
    return sqft?.trend === 'up' ? 'text-green-600' : sqft?.trend === 'down' ? 'text-red-600' : 'text-gray-600';
  };

  return (
    <div className="stat-card bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}<small className='text-xs font-medium'>  ({sqft?.value} sqft)</small></p>
          <div className="flex items-center gap-2 mt-3">
            {sqft?.change && <span className="text-xs text-gray-600">{sqft?.change}</span>}
            {sqft?.subtitle && <span className={`text-xs font-medium ${getTrendColor()}`}>{sqft?.subtitle}</span>}
          </div>
        </div>
        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  );
}
