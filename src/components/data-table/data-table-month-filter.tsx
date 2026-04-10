"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarIcon,
  XCircle,
  FilterX,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

type MonthFilterValue = {
  month: number;
  year: number;
};

const MONTHS = [
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

interface DataTableMonthFilterProps {
  title: string;
  value?: MonthFilterValue;
  onChange: (value?: MonthFilterValue) => void;
}

export function DataTableMonthFilter({
  title,
  value,
  onChange,
}: DataTableMonthFilterProps) {
  const [visibleYear, setVisibleYear] = React.useState(
    value?.year ?? new Date().getFullYear(),
  );

  React.useEffect(() => {
    if (value?.year) {
      setVisibleYear(value.year);
    }
  }, [value?.year]);

  const hasValue = Boolean(value);

  const label = value ? `${MONTHS[value.month]} ${value.year}` : null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-dashed w-[280px] justify-start gap-2 pr-3"
        >
          {hasValue ? (
            <div
              role="button"
              aria-label={`Clear ${title} filter`}
              tabIndex={0}
              onClick={(event) => {
                event.stopPropagation();
                onChange(undefined);
              }}
              className="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring flex-shrink-0"
            >
              <XCircle className="h-3.5 w-3.5" />
            </div>
          ) : (
            <CalendarIcon className="h-3.5 w-3.5 flex-shrink-0" />
          )}

          <span className="flex min-w-0 flex-1 items-center gap-2">
            <span className="shrink-0 text-xs font-medium">{title}</span>
            {hasValue && (
              <>
                <Separator
                  orientation="vertical"
                  className="mx-0.5 data-[orientation=vertical]:h-4"
                />
                <Badge
                  variant="secondary"
                  className="ml-auto max-w-[150px] truncate px-2 py-0 h-5 text-[11px] font-medium"
                >
                  {label}
                </Badge>
              </>
            )}
          </span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[360px] rounded-2xl border p-4 shadow-xl" align="start">
        <div className="mb-4 rounded-xl border bg-muted/30 p-3">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Service Month
              </div>
              <div className="text-base font-semibold leading-none">{visibleYear}</div>
            </div>
            {hasValue && (
              <Badge
                variant="secondary"
                className="h-6 rounded-full px-2.5 text-[11px] font-medium"
              >
                {label}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setVisibleYear((prev) => prev - 1)}
              className="rounded-full border bg-background p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              aria-label="Previous year"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            <div className="text-xs font-medium text-muted-foreground">
              Select month
            </div>

            <button
              type="button"
              onClick={() => setVisibleYear((prev) => prev + 1)}
              className="rounded-full border bg-background p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              aria-label="Next year"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-muted/20 p-2">
          {MONTHS.map((monthLabel, monthIndex) => {
            const isSelected =
              value?.year === visibleYear && value?.month === monthIndex;

            return (
              <button
                key={monthLabel}
                type="button"
                onClick={() =>
                  onChange({
                    month: monthIndex,
                    year: visibleYear,
                  })
                }
                className={[
                  "group rounded-xl border px-3 py-3 text-left transition-all",
                  isSelected
                    ? "border-slate-900 bg-slate-950 text-white shadow-sm"
                    : "border-transparent bg-background hover:border-border hover:bg-accent/50",
                ].join(" ")}
              >
                <div
                  className={[
                    "text-[11px] uppercase tracking-[0.16em]",
                    isSelected
                      ? "text-white/70"
                      : "text-muted-foreground group-hover:text-foreground/70",
                  ].join(" ")}
                >
                  {String(monthIndex + 1).padStart(2, "0")}
                </div>
                <div className="mt-1 text-xs font-semibold leading-tight">
                  {monthLabel}
                </div>
              </button>
            );
          })}
        </div>

        {hasValue && (
          <div className="mt-4 flex justify-end">
            <Button
              type="button"
              size="sm"
              onClick={() => onChange(undefined)}
              className="h-9 rounded-xl bg-slate-950 px-3 text-xs font-medium text-white hover:bg-slate-800"
            >
              <FilterX className="mr-1.5 h-3.5 w-3.5" />
              Remove Filter
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
