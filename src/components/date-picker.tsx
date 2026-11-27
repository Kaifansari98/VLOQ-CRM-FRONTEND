"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, isValid, parseISO } from "date-fns";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import CustomeTooltip from "./custom-tooltip";
import { cn } from "@/lib/utils";

interface CustomeDatePickerProps {
  value?: string;
  onChange: (value?: string) => void;
  className?: string;
  dateFormat?: string;
  placeholder?: string;
  captionLayout?: "label" | "dropdown";
  fromYear?: number;
  toYear?: number;
  restriction?:
    | "none"
    | "pastOnly"
    | "futureOnly"
    | "futureAfterTwoDays"
    | "pastWeekOnly"
    | "pastMonthOnly"
    | "installationInterval"
    | "lastThreeDays";
  minDate?: string;
  disabledReason?: string;
  intervalStartDate?: string;
  intervalEndDate?: string;
  disabledDates?: string[];
  disabledDatesReason?: string;
  disableSundays?: boolean;
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

const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function CustomeDatePicker({
  value,
  onChange,
  className,
  dateFormat = "dd MMM yyyy",
  placeholder,
  restriction = "none",
  minDate,
  disabledReason,
  intervalStartDate,
  intervalEndDate,
  disabledDates,
  disabledDatesReason,
  disableSundays = false,
}: CustomeDatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [view, setView] = React.useState<"days" | "months" | "years">("days");

  // Selected Date
  const parsedDate = React.useMemo(() => {
    if (!value) return undefined;
    const p = parseISO(value);
    return isValid(p) ? p : undefined;
  }, [value]);

  // Browsing Month and Year
  const [currentMonth, setCurrentMonth] = React.useState<number>(() => {
    return parsedDate ? parsedDate.getMonth() : new Date().getMonth();
  });
  const [currentYear, setCurrentYear] = React.useState<number>(() => {
    return parsedDate ? parsedDate.getFullYear() : new Date().getFullYear();
  });
  const [yearPage, setYearPage] = React.useState<number>(() => {
    const y = parsedDate ? parsedDate.getFullYear() : new Date().getFullYear();
    return Math.floor(y / 12) * 12;
  });

  // Sync browsing view when value changes or popover opens
  React.useEffect(() => {
    if (parsedDate) {
      setCurrentMonth(parsedDate.getMonth());
      setCurrentYear(parsedDate.getFullYear());
      setYearPage(Math.floor(parsedDate.getFullYear() / 12) * 12);
    }
  }, [parsedDate]);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      setView("days");
      if (parsedDate) {
        setCurrentMonth(parsedDate.getMonth());
        setCurrentYear(parsedDate.getFullYear());
        setYearPage(Math.floor(parsedDate.getFullYear() / 12) * 12);
      }
    }
  };

  const disabledDateSet = React.useMemo(
    () => new Set(disabledDates ?? []),
    [disabledDates],
  );

  const isDateDisabled = React.useCallback(
    (checkDate: Date) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const target = new Date(checkDate);
      target.setHours(0, 0, 0, 0);

      if (disableSundays && target.getDay() === 0) return true;

      if (disabledDateSet.size > 0) {
        const dateKey = format(target, "yyyy-MM-dd");
        if (disabledDateSet.has(dateKey)) return true;
      }

      if (restriction === "installationInterval") {
        if (!intervalStartDate || !intervalEndDate) return true;
        const start = parseISO(intervalStartDate);
        const end = parseISO(intervalEndDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        const maxSelectable = today < end ? today : end;
        return target < start || target > maxSelectable;
      }

      if (restriction === "futureOnly") {
        if (minDate) {
          const min = parseISO(minDate);
          min.setHours(0, 0, 0, 0);
          return target < min;
        }
        return target < today;
      }

      if (restriction === "futureAfterTwoDays") {
        const min = new Date();
        const currentHour = min.getHours();
        const daysToAdd = currentHour >= 15 ? 3 : 2;
        min.setDate(min.getDate() + daysToAdd);
        min.setHours(0, 0, 0, 0);
        return target < min;
      }

      if (restriction === "pastOnly") return target > today;

      if (restriction === "pastWeekOnly") {
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        return target < sevenDaysAgo || target > today;
      }

      if (restriction === "pastMonthOnly") {
        const monthAgo = new Date(today);
        monthAgo.setDate(today.getDate() - 30);
        return target < monthAgo || target > today;
      }

      if (restriction === "lastThreeDays") {
        const twoDaysAgo = new Date(today);
        twoDaysAgo.setDate(today.getDate() - 2);
        return target < twoDaysAgo || target > today;
      }

      return false;
    },
    [
      disableSundays,
      disabledDateSet,
      restriction,
      intervalStartDate,
      intervalEndDate,
      minDate,
    ],
  );

  const handleSelectDay = (day: number) => {
    const selected = new Date(currentYear, currentMonth, day);
    if (isDateDisabled(selected)) return;
    onChange(format(selected, "yyyy-MM-dd"));
    setOpen(false);
  };

  const handleReset = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(undefined);
  };

  const handleSelectToday = () => {
    const now = new Date();
    if (!isDateDisabled(now)) {
      onChange(format(now, "yyyy-MM-dd"));
      setCurrentMonth(now.getMonth());
      setCurrentYear(now.getFullYear());
      setOpen(false);
    }
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Calendar calculations
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  // Disabled Reason Tooltip
  if (disabledReason) {
    return (
      <CustomeTooltip
        value={disabledReason}
        truncateValue={
          <div className="opacity-60 w-full cursor-not-allowed">
            <Button
              type="button"
              variant="outline"
              className={cn("w-full justify-start text-xs font-normal", className)}
              disabled
            >
              <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
              {parsedDate ? (
                <span className="truncate">{format(parsedDate, dateFormat)}</span>
              ) : (
                <span>Date selection unavailable</span>
              )}
            </Button>
          </div>
        }
      />
    );
  }

  const today = new Date();
  const isTodayDate = (day: number) =>
    today.getDate() === day &&
    today.getMonth() === currentMonth &&
    today.getFullYear() === currentYear;

  const isSelectedDate = (day: number) =>
    Boolean(
      parsedDate &&
        parsedDate.getDate() === day &&
        parsedDate.getMonth() === currentMonth &&
        parsedDate.getFullYear() === currentYear,
    );

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <div className="relative w-full">
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-start text-xs font-normal",
              className,
              parsedDate && "!pr-8 has-[>svg]:!pr-8",
            )}
          >
            <CalendarIcon className="mr-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            {parsedDate ? (
              <span className="truncate">{format(parsedDate, dateFormat)}</span>
            ) : (
              <span className="truncate text-muted-foreground">
                {placeholder ?? "Pick a date"}
              </span>
            )}
          </Button>
          {parsedDate && (
            <button
              type="button"
              aria-label="Clear date"
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none"
              onClick={handleReset}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[280px] p-3 shadow-md rounded-xl z-[100]"
        align="start"
      >
        {/* ─── 1. Header (Navigation & View Switcher) ─── */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b">
          {view === "days" && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={prevMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs font-semibold hover:bg-accent flex items-center gap-1"
                  onClick={() => setView("months")}
                >
                  {MONTH_NAMES[currentMonth]}
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs font-semibold hover:bg-accent flex items-center gap-1"
                  onClick={() => {
                    setYearPage(Math.floor(currentYear / 12) * 12);
                    setView("years");
                  }}
                >
                  {currentYear}
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={nextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {view === "months" && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => setCurrentYear((y) => y - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs font-semibold hover:bg-accent flex items-center gap-1"
                onClick={() => {
                  setYearPage(Math.floor(currentYear / 12) * 12);
                  setView("years");
                }}
              >
                {currentYear}
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => setCurrentYear((y) => y + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {view === "years" && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => setYearPage((y) => y - 12)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-semibold text-foreground">
                {yearPage} – {yearPage + 11}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => setYearPage((y) => y + 12)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {/* ─── 2. View: Days ─── */}
        {view === "days" && (
          <div>
            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {DAYS_OF_WEEK.map((d) => (
                <span
                  key={d}
                  className="text-[11px] font-medium text-muted-foreground py-1"
                >
                  {d}
                </span>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="h-8 w-8" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const checkDate = new Date(currentYear, currentMonth, day);
                const disabled = isDateDisabled(checkDate);
                const selected = isSelectedDate(day);
                const isToday = isTodayDate(day);

                return (
                  <button
                    key={day}
                    type="button"
                    disabled={disabled}
                    onClick={() => handleSelectDay(day)}
                    className={cn(
                      "h-8 w-8 rounded-lg text-xs transition-colors flex items-center justify-center font-normal",
                      selected &&
                        "bg-primary text-primary-foreground font-semibold shadow-xs hover:bg-primary",
                      isToday &&
                        !selected &&
                        "border border-primary font-medium text-primary",
                      !selected &&
                        !isToday &&
                        !disabled &&
                        "hover:bg-accent hover:text-accent-foreground text-foreground",
                      disabled &&
                        "text-muted-foreground/30 cursor-not-allowed pointer-events-none",
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="pt-2.5 mt-2.5 border-t flex items-center justify-between text-xs">
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors px-1 py-0.5"
                onClick={() => {
                  onChange(undefined);
                  setOpen(false);
                }}
              >
                Clear
              </button>
              <button
                type="button"
                className="text-xs font-medium text-primary hover:underline px-1 py-0.5"
                onClick={handleSelectToday}
              >
                Today
              </button>
            </div>
          </div>
        )}

        {/* ─── 3. View: Months ─── */}
        {view === "months" && (
          <div className="grid grid-cols-3 gap-2 py-1">
            {MONTH_SHORT.map((m, idx) => {
              const isSelectedMonth =
                idx === currentMonth &&
                (!parsedDate || parsedDate.getFullYear() === currentYear);
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setCurrentMonth(idx);
                    setView("days");
                  }}
                  className={cn(
                    "h-10 rounded-lg text-xs font-medium transition-colors flex items-center justify-center",
                    isSelectedMonth
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "hover:bg-accent text-foreground",
                  )}
                >
                  {m}
                </button>
              );
            })}
          </div>
        )}

        {/* ─── 4. View: Years ─── */}
        {view === "years" && (
          <div className="grid grid-cols-3 gap-2 py-1">
            {Array.from({ length: 12 }).map((_, i) => {
              const y = yearPage + i;
              const isSelectedYear = y === currentYear;
              return (
                <button
                  key={y}
                  type="button"
                  onClick={() => {
                    setCurrentYear(y);
                    setView("days");
                  }}
                  className={cn(
                    "h-10 rounded-lg text-xs font-medium transition-colors flex items-center justify-center",
                    isSelectedYear
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "hover:bg-accent text-foreground",
                  )}
                >
                  {y}
                </button>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
