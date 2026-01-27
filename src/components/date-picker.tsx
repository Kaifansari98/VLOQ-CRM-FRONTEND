"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, isValid, parseISO } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import CustomeTooltip from "./custom-tooltip";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";

interface CustomeDatePickerProps {
  value?: string;
  onChange: (value?: string) => void;
  restriction?:
    | "none"
    | "pastOnly"
    | "futureOnly"
    | "futureAfterTwoDays"
    | "pastWeekOnly"
    | "pastMonthOnly"
    | "installationInterval";
  minDate?: string; // ✅ new
  disabledReason?: string; // ✅ new
  intervalStartDate?: string;
  intervalEndDate?: string;
  disabledDates?: string[];
  disabledDatesReason?: string;
}

export default function CustomeDatePicker({
  value,
  onChange,
  restriction = "none",
  minDate,
  disabledReason,
  intervalStartDate,
  intervalEndDate,
  disabledDates,
  disabledDatesReason,
}: CustomeDatePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(
    value ? parseISO(value) : undefined
  );
  const disabledDateSet = React.useMemo(
    () => new Set(disabledDates ?? []),
    [disabledDates]
  );
  const disabledDateObjects = React.useMemo(() => {
    if (!disabledDates?.length) return [];
    return disabledDates
      .map((dateString) => parseISO(dateString))
      .filter((parsed) => isValid(parsed));
  }, [disabledDates]);
  const blockedDatesTooltip =
    disabledDatesReason ?? "A report has already been uploaded for this date.";

  const DayButtonWithTooltip = React.useCallback(
    (props: React.ComponentProps<typeof CalendarDayButton>) => {
      const title = props.modifiers?.blocked ? blockedDatesTooltip : undefined;
      return <CalendarDayButton {...props} title={title} />;
    },
    [blockedDatesTooltip]
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

  // ---------------------------------------------------------------
  // 🔥 NEW INSTALLATION INTERVAL LOGIC
  // ---------------------------------------------------------------

  const disableDates = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (disabledDateSet.size > 0) {
      const dateKey = format(date, "yyyy-MM-dd");
      if (disabledDateSet.has(dateKey)) return true;
    }

    // ✔ Installation interval mode
    if (restriction === "installationInterval") {
      if (!intervalStartDate || !intervalEndDate) return true;

      const start = parseISO(intervalStartDate);
      const end = parseISO(intervalEndDate);

      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);

      // dynamic max date → min(today, expected_end)
      const maxSelectable = today < end ? today : end;

      return date < start || date > maxSelectable;
    }

    // ---------------------------------------------------------------
    // EXISTING LOGIC
    // ---------------------------------------------------------------
    if (restriction === "futureOnly") {
      if (minDate) {
        const min = parseISO(minDate);
        return date < min;
      }
      return date < today;
    }

    if (restriction === "futureAfterTwoDays") {
      const min = new Date();
      const currentHour = min.getHours();
      const daysToAdd = currentHour >= 15 ? 3 : 2;
      min.setDate(min.getDate() + daysToAdd);
      min.setHours(0, 0, 0, 0);
      return date < min;
    }

    if (restriction === "pastOnly") return date > today;
    if (restriction === "pastWeekOnly") {
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);
      return date < sevenDaysAgo || date > today;
    }
    if (restriction === "pastMonthOnly") {
      const monthAgo = new Date(today);
      monthAgo.setDate(today.getDate() - 30);
      return date < monthAgo || date > today;
    }

    return false;
  };

  if (disabledReason) {
    return (
      <CustomeTooltip
        value={disabledReason}
        truncateValue={
          <div className="opacity-60 w-full cursor-not-allowed">
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
          modifiers={
            disabledDateObjects.length > 0
              ? { blocked: disabledDateObjects }
              : undefined
          }
          modifiersClassNames={
            disabledDateObjects.length > 0
              ? { blocked: "opacity-60" }
              : undefined
          }
          components={{ DayButton: DayButtonWithTooltip }}
          disabled={disableDates}
        />
      </PopoverContent>
    </Popover>
  );
}
