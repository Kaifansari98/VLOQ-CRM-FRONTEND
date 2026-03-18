"use client";

import type { Column } from "@tanstack/react-table";
import { CalendarIcon, XCircle } from "lucide-react";
import * as React from "react";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

type DateSelection = Date[] | DateRange;

function getIsDateRange(value: DateSelection): value is DateRange {
  return value && typeof value === "object" && !Array.isArray(value);
}

function parseAsDate(timestamp: number | string | undefined): Date | undefined {
  if (!timestamp) return undefined;
  const numericTimestamp =
    typeof timestamp === "string" ? Number(timestamp) : timestamp;
  const date = new Date(numericTimestamp);
  return !Number.isNaN(date.getTime()) ? date : undefined;
}

function parseColumnFilterValue(value: unknown) {
  if (value === null || value === undefined) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((item) => {
      if (typeof item === "number" || typeof item === "string") {
        return item;
      }
      return undefined;
    });
  }

  if (typeof value === "string" || typeof value === "number") {
    return [value];
  }

  return [];
}

// Compact date formatting
function formatDateCompact(date: Date): string {
  const day = date.getDate();
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const year = date.getFullYear();
  const currentYear = new Date().getFullYear();

  // Show year only if different from current year
  return currentYear === year ? `${day} ${month}` : `${day} ${month} ${year}`;
}

interface DataTableDateFilterProps<TData> {
  column: Column<TData, unknown>;
  title?: string;
  multiple?: boolean;
  compact?: boolean; // New prop for compact mode
}

export function DataTableDateFilter<TData>({
  column,
  title,
  multiple,
  compact = true, // Default to compact mode
}: DataTableDateFilterProps<TData>) {
  const columnFilterValue = column.getFilterValue();

  const selectedDates = React.useMemo<DateSelection>(() => {
    if (!columnFilterValue) {
      return multiple ? { from: undefined, to: undefined } : [];
    }

    if (multiple) {
      const timestamps = parseColumnFilterValue(columnFilterValue);
      return {
        from: parseAsDate(timestamps[0]),
        to: parseAsDate(timestamps[1]),
      };
    }

    const timestamps = parseColumnFilterValue(columnFilterValue);
    const date = parseAsDate(timestamps[0]);
    return date ? [date] : [];
  }, [columnFilterValue, multiple]);

  const onSelect = React.useCallback(
    (date: Date | DateRange | undefined) => {
      if (!date) {
        column.setFilterValue(undefined);
        return;
      }

      if (multiple && !("getTime" in date)) {
        const from = date.from?.getTime();
        const to = date.to?.getTime();
        column.setFilterValue(from || to ? [from, to] : undefined);
      } else if (!multiple && "getTime" in date) {
        column.setFilterValue(date.getTime());
      }
    },
    [column, multiple],
  );

  const onReset = React.useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      column.setFilterValue(undefined);
    },
    [column],
  );

  const hasValue = React.useMemo(() => {
    if (multiple) {
      if (!getIsDateRange(selectedDates)) return false;
      return selectedDates.from || selectedDates.to;
    }
    if (!Array.isArray(selectedDates)) return false;
    return selectedDates.length > 0;
  }, [multiple, selectedDates]);

  const formatDateRange = React.useCallback(
    (range: DateRange) => {
      if (!range.from && !range.to) return "";

      const safeDate = range.from || range.to;

      if (!safeDate) return "";

      if (range.from && range.to) {
        return compact
          ? `${formatDateCompact(range.from)} - ${formatDateCompact(range.to)}`
          : `${formatDate(range.from)} - ${formatDate(range.to)}`;
      }

      return compact ? formatDateCompact(safeDate) : formatDate(safeDate);
    },
    [compact],
  );

  const label = React.useMemo(() => {
    if (multiple) {
      if (!getIsDateRange(selectedDates)) return null;

      const hasSelectedDates = selectedDates.from || selectedDates.to;

      if (compact && hasSelectedDates) {
        // Compact mode: Show only title with badge
        return (
          <span className="flex items-center gap-1.5">
            <span className="truncate max-w-[80px]">{title}</span>
            <Badge
              variant="secondary"
              className="font-normal px-1.5 py-0 h-5 text-xs"
            >
              {selectedDates.from && selectedDates.to ? "Range" : "1"}
            </Badge>
          </span>
        );
      }

      const dateText = hasSelectedDates
        ? formatDateRange(selectedDates)
        : "Select date range";

      return (
        <span className="flex items-center gap-2">
          <span>{title}</span>
          {hasSelectedDates && (
            <>
              <Separator
                orientation="vertical"
                className="mx-0.5 data-[orientation=vertical]:h-4"
              />
              <span className="truncate max-w-[200px]">{dateText}</span>
            </>
          )}
        </span>
      );
    }

    if (getIsDateRange(selectedDates)) return null;

    const hasSelectedDate = selectedDates.length > 0;

    if (compact && hasSelectedDate) {
      // Compact mode: Show only title with badge
      return (
        <span className="flex items-center gap-1.5">
          <span className="truncate max-w-[80px]">{title}</span>
          <Badge
            variant="secondary"
            className="font-normal px-1.5 py-0 h-5 text-xs"
          >
            1
          </Badge>
        </span>
      );
    }

    const dateText = hasSelectedDate
      ? compact
        ? formatDateCompact(selectedDates[0])
        : formatDate(selectedDates[0])
      : "Select date";

    return (
      <span className="flex items-center gap-2">
        <span>{title}</span>
        {hasSelectedDate && (
          <>
            <Separator
              orientation="vertical"
              className="mx-0.5 data-[orientation=vertical]:h-4"
            />
            <span className="truncate max-w-[120px]">{dateText}</span>
          </>
        )}
      </span>
    );
  }, [selectedDates, multiple, formatDateRange, title, compact]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`border-dashed ${compact ? "max-w-[180px]" : ""}`}
        >
          {hasValue ? (
            <div
              role="button"
              aria-label={`Clear ${title} filter`}
              tabIndex={0}
              onClick={onReset}
              className="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring flex-shrink-0"
            >
              <XCircle className="h-4 w-4" />
            </div>
          ) : (
            <CalendarIcon className="h-4 w-4 flex-shrink-0" />
          )}
          <span className="truncate">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        {/* Show selected dates in popover header */}
        {hasValue && (
          <div className="p-3 border-b bg-muted/50">
            <div className="text-sm font-medium mb-1">{title}</div>
            <div className="text-xs text-muted-foreground">
              {multiple && getIsDateRange(selectedDates) ? (
                <>
                  {selectedDates.from && (
                    <div>From: {formatDate(selectedDates.from)}</div>
                  )}
                  {selectedDates.to && (
                    <div>To: {formatDate(selectedDates.to)}</div>
                  )}
                </>
              ) : (
                !getIsDateRange(selectedDates) &&
                selectedDates[0] && <div>{formatDate(selectedDates[0])}</div>
              )}
            </div>
          </div>
        )}

        {multiple ? (
          <Calendar
            initialFocus
            mode="range"
            selected={
              getIsDateRange(selectedDates)
                ? selectedDates
                : { from: undefined, to: undefined }
            }
            onSelect={onSelect}
          />
        ) : (
          <Calendar
            initialFocus
            mode="single"
            selected={
              !getIsDateRange(selectedDates) ? selectedDates[0] : undefined
            }
            onSelect={onSelect}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
