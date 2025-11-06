"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, parseISO } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import CustomeTooltip from "./cutome-tooltip";

interface CustomeDatePickerProps {
  value?: string;
  onChange: (value?: string) => void;
  restriction?:
    | "none"
    | "pastOnly"
    | "futureOnly"
    | "pastWeekOnly"
    | "pastMonthOnly";
  minDate?: string; // ✅ new
  disabledReason?: string; // ✅ new
}

export default function CustomeDatePicker({
  value,
  onChange,
  restriction = "none",
  minDate,
  disabledReason,
}: CustomeDatePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(
    value ? parseISO(value) : undefined
  );

  React.useEffect(() => {
    if (value) setDate(parseISO(value));
    else setDate(undefined);
  }, [value]);

  const handleSelect = (selected?: Date) => {
    if (selected) {
      setDate(selected);
      onChange(format(selected, "yyyy-MM-dd"));
    } else {
      setDate(undefined);
      onChange(undefined);
    }
  };

  const handleReset = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    setDate(undefined);
    onChange(undefined);
  };

  // disable logic
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const disableDates = (date: Date) => {
    if (restriction === "futureOnly") {
      if (minDate) {
        const min = parseISO(minDate);
        return date < min; // block dates before minDate
      }
      return date < today;
    }

    if (restriction === "pastOnly") {
      return date > today;
    }
    if (restriction === "pastWeekOnly") {
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);
      return date < sevenDaysAgo || date > today;
    }
    if (restriction === "pastMonthOnly") {
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);
      return date < thirtyDaysAgo || date > today;
    }
    return false;
  };

  if (disabledReason) {
    return (
      <CustomeTooltip
        value={disabledReason}
        truncateValue={
          <div className="opacity-60 cursor-not-allowed">
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start"
              disabled
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? (
                <span>{format(date, "PPP")}</span>
              ) : (
                <span>Date selection unavailable</span>
              )}
            </Button>
          </div>
        }
      />
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="relative w-full">
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : <span>Pick a date</span>}
          </Button>
          {date && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute top-1/2 right-2 -translate-y-1/2"
              onClick={handleReset}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          autoFocus
          disabled={disableDates}
        />
      </PopoverContent>
    </Popover>
  );
}
