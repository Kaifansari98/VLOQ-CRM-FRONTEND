'use client';

import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: ReactNode;
  subtitle?: string;
}

export default function KPICard({ title, value, change, trend, icon, subtitle }: KPICardProps) {
  const trendConfig = {
    up:      { icon: TrendingUp,   color: 'text-green-600', bg: 'bg-green-50 border-green-200'  },
    down:    { icon: TrendingDown, color: 'text-red-600',   bg: 'bg-red-50 border-red-200'      },
    neutral: { icon: Minus,        color: 'text-muted-foreground', bg: 'bg-muted border-border' },
  };

  const t = trendConfig[trend ?? 'neutral'];
  const TrendIcon = t.icon;

  return (
    <div className="bg-card border border-border rounded-xl p-5">

      {/* Row 1: icon + title */}
      <div className="flex items-center gap-2.5 mb-2">
        <div className="shrink-0 w-12 h-12 rounded-lg bg-muted border border-border flex items-center justify-center">
          {icon}
        </div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest leading-none">
          {title}
        </p>
      </div>

      {/* Row 2: value */}
      <p className="text-[28px] font-bold text-foreground tabular-nums leading-none mb-2">
        {value}
      </p>

      {/* Row 3: trend + subtitle */}
      <div className="flex items-center gap-2 pt-3">
        {trend && change && (
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[10px] font-semibold ${t.bg} ${t.color}`}>
            <TrendIcon className="w-3 h-3 shrink-0" />
            {change}
          </span>
        )}
        {subtitle && (
          <p className="text-[11px] text-muted-foreground leading-none truncate">
            {subtitle}
          </p>
        )}
      </div>

    </div>
  );
}