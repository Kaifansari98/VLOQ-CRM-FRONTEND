import React from 'react';
import { cn } from '@/lib/utils';

interface CountBadgeProps {
  count: number | undefined;
  isLoading?: boolean;
  className?: string;
}

export const CountBadge: React.FC<CountBadgeProps> = ({ 
  count, 
  isLoading = false, 
  className 
}) => {
  if (isLoading) {
    return (
      <div className={cn(
        "flex items-center justify-center w-2 h-2 rounded-full bg-muted animate-pulse",
        className
      )}>
        <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
      </div>
    );
  }

  if (count === undefined || count === 0) {
    return null;
  }

  return (
    <div className={cn(
      "flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-primary text-primary-foreground text-[11px] font-medium ml-auto",
      className
    )}>
      {count > 99 ? '99+' : count}
    </div>
  );
};