"use client";

import * as React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MonthPickerProps {
  value: string; // e.g. "2026-11"
  onChange: (value: string) => void;
  maxMonth?: string; // e.g. "2026-11" to prevent future months
  minMonth?: string;
  className?: string;
  isLoading?: boolean;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function MonthPicker({
  value,
  onChange,
  maxMonth,
  minMonth,
  className,
  isLoading,
}: MonthPickerProps) {
  const [open, setOpen] = React.useState(false);

  // Parse current selected year and month
  const [selectedYear, selectedMonthIndex] = React.useMemo(() => {
    if (!value || !value.includes("-")) {
      const now = new Date();
      return [now.getFullYear(), now.getMonth()];
    }
    const [y, m] = value.split("-").map(Number);
    return [y, (m || 1) - 1];
  }, [value]);

  // Browsing year state in popover
  const [viewYear, setViewYear] = React.useState<number>(selectedYear);

  // Keep viewYear in sync when value changes or popover opens
  React.useEffect(() => {
    setViewYear(selectedYear);
  }, [selectedYear, open]);

  const maxYear = maxMonth ? parseInt(maxMonth.split("-")[0], 10) : undefined;
  const maxMonthNum = maxMonth ? parseInt(maxMonth.split("-")[1], 10) - 1 : undefined;

  const minYear = minMonth ? parseInt(minMonth.split("-")[0], 10) : undefined;
  const minMonthNum = minMonth ? parseInt(minMonth.split("-")[1], 10) - 1 : undefined;

  const isMonthDisabled = (monthIdx: number) => {
    if (maxYear !== undefined && maxMonthNum !== undefined) {
      if (viewYear > maxYear) return true;
      if (viewYear === maxYear && monthIdx > maxMonthNum) return true;
    }
    if (minYear !== undefined && minMonthNum !== undefined) {
      if (viewYear < minYear) return true;
      if (viewYear === minYear && monthIdx < minMonthNum) return true;
    }
    return false;
  };

  const handleSelectMonth = (monthIdx: number) => {
    if (isMonthDisabled(monthIdx)) return;
    const formatted = `${viewYear}-${String(monthIdx + 1).padStart(2, "0")}`;
    onChange(formatted);
    setOpen(false);
  };

  const handleSelectCurrentMonth = () => {
    const now = new Date();
    const formatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    onChange(formatted);
    setViewYear(now.getFullYear());
    setOpen(false);
  };

  const displayLabel = React.useMemo(() => {
    if (selectedMonthIndex >= 0 && selectedMonthIndex < 12) {
      return `${MONTH_NAMES[selectedMonthIndex]} ${selectedYear}`;
    }
    return value;
  }, [selectedMonthIndex, selectedYear, value]);

  const now = new Date();
  const currentCalYear = now.getFullYear();
  const currentCalMonth = now.getMonth();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring select-none",
            className
          )}
        >
          {isLoading ? (
            <Loader2 className="size-3.5 text-muted-foreground animate-spin shrink-0" />
          ) : (
            <CalendarDays className="size-3.5 text-muted-foreground shrink-0" />
          )}
          <span className="truncate">{displayLabel}</span>
          <ChevronDown className="size-3 text-muted-foreground opacity-60 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[260px] p-3 shadow-md rounded-xl z-[100]"
        align="center"
      >
        {/* Header: Year navigation */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-foreground"
            onClick={() => setViewYear((y) => y - 1)}
            disabled={minYear !== undefined && viewYear <= minYear}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm font-semibold text-foreground tracking-tight">
            {viewYear}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-foreground"
            onClick={() => setViewYear((y) => y + 1)}
            disabled={maxYear !== undefined && viewYear >= maxYear}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        {/* 12 Months Grid */}
        <div className="grid grid-cols-3 gap-2 py-1">
          {MONTH_SHORT.map((m, idx) => {
            const isSelected =
              viewYear === selectedYear && idx === selectedMonthIndex;
            const isCurrentCalMonth =
              viewYear === currentCalYear && idx === currentCalMonth;
            const disabled = isMonthDisabled(idx);

            return (
              <button
                key={m}
                type="button"
                disabled={disabled}
                onClick={() => handleSelectMonth(idx)}
                className={cn(
                  "h-9 rounded-lg text-xs font-medium transition-colors flex items-center justify-center select-none",
                  isSelected &&
                    "bg-primary text-primary-foreground font-semibold shadow-xs",
                  isCurrentCalMonth &&
                    !isSelected &&
                    "border border-primary text-primary font-medium",
                  !isSelected &&
                    !isCurrentCalMonth &&
                    !disabled &&
                    "text-foreground hover:bg-accent hover:text-accent-foreground",
                  disabled &&
                    "text-muted-foreground/30 cursor-not-allowed pointer-events-none"
                )}
              >
                {m}
              </button>
            );
          })}
        </div>

        {/* Footer: Quick jump */}
        <div className="pt-2 mt-2 border-t flex items-center justify-between text-xs">
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-1 py-0.5"
            onClick={() => setOpen(false)}
          >
            Close
          </button>
          <button
            type="button"
            className="text-xs font-medium text-primary hover:underline px-1 py-0.5"
            onClick={handleSelectCurrentMonth}
          >
            This month
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

