"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, CalendarIcon, XCircle } from "lucide-react";

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
        <Button variant="outline" size="sm" className="border-dashed max-w-[190px]">
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
              <XCircle className="h-4 w-4" />
            </div>
          ) : (
            <CalendarIcon className="h-4 w-4 flex-shrink-0" />
          )}

          <span className="flex items-center gap-1.5 truncate">
            <span className="truncate">{title}</span>
            {hasValue && (
              <>
                <Separator
                  orientation="vertical"
                  className="mx-0.5 data-[orientation=vertical]:h-4"
                />
                <Badge
                  variant="secondary"
                  className="font-normal px-1.5 py-0 h-5 text-xs truncate"
                >
                  {label}
                </Badge>
              </>
            )}
          </span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[320px] p-4" align="start">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setVisibleYear((prev) => prev - 1)}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label="Previous year"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="text-xl font-semibold">{visibleYear}</div>

          <button
            type="button"
            onClick={() => setVisibleYear((prev) => prev + 1)}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label="Next year"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3">
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
                  "rounded-xl px-3 py-4 text-sm font-medium transition-colors",
                  isSelected
                    ? "bg-slate-900 text-white"
                    : "hover:bg-accent hover:text-accent-foreground",
                ].join(" ")}
              >
                {monthLabel}
              </button>
            );
          })}
        </div>

        {hasValue && (
          <div className="mt-4 flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(undefined)}
            >
              Remove Filter
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
