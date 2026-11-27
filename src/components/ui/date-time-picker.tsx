"use client";

import * as React from "react";
import { format, parseISO, isValid, addDays } from "date-fns";
import { Clock, X, ChevronDown, Calendar as CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface DateTimePickerProps {
  value?: string; // Format: "YYYY-MM-DDTHH:mm"
  onChange: (value: string) => void;
  baseDate?: string; // Format: "YYYY-MM-DD" e.g. "2026-11-04"
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
}

const COMMON_PRESETS = [
  { label: "09:00 AM", h: 9, m: 0, p: "AM" as const },
  { label: "09:30 AM", h: 9, m: 30, p: "AM" as const },
  { label: "10:00 AM", h: 10, m: 0, p: "AM" as const },
  { label: "01:00 PM", h: 1, m: 0, p: "PM" as const },
  { label: "06:00 PM", h: 6, m: 0, p: "PM" as const },
  { label: "06:30 PM", h: 6, m: 30, p: "PM" as const },
  { label: "07:00 PM", h: 7, m: 0, p: "PM" as const },
  { label: "08:00 PM", h: 8, m: 0, p: "PM" as const },
];

export function DateTimePicker({
  value,
  onChange,
  baseDate,
  placeholder = "Select date & time",
  className,
  disabled,
  id,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Compute fallback / initial date
  const defaultDateStr = React.useMemo(() => {
    if (baseDate && /^\d{4}-\d{2}-\d{2}$/.test(baseDate)) return baseDate;
    return format(new Date(), "yyyy-MM-dd");
  }, [baseDate]);

  const nextDayStr = React.useMemo(() => {
    try {
      const d = parseISO(defaultDateStr);
      if (isValid(d)) return format(addDays(d, 1), "yyyy-MM-dd");
    } catch {}
    return defaultDateStr;
  }, [defaultDateStr]);

  // Parse internal state from value
  const parsed = React.useMemo(() => {
    if (!value || !value.includes("T")) {
      return {
        date: defaultDateStr,
        hour12: 9,
        minute: 0,
        ampm: "AM" as "AM" | "PM",
        hasValue: false,
      };
    }

    const [datePart, timePart] = value.split("T");
    const [hStr, mStr] = (timePart || "09:00").split(":");
    const hNum = parseInt(hStr, 10) || 0;
    const mNum = parseInt(mStr, 10) || 0;

    const ampm: "AM" | "PM" = hNum >= 12 ? "PM" : "AM";
    const hour12 = hNum % 12 === 0 ? 12 : hNum % 12;

    return {
      date: datePart || defaultDateStr,
      hour12,
      minute: mNum,
      ampm,
      hasValue: true,
    };
  }, [value, defaultDateStr]);

  const [selectedDate, setSelectedDate] = React.useState(parsed.date);
  const [hour12, setHour12] = React.useState(parsed.hour12);
  const [minute, setMinute] = React.useState(parsed.minute);
  const [ampm, setAmpm] = React.useState<"AM" | "PM">(parsed.ampm);
  const [customDateMode, setCustomDateMode] = React.useState(false);

  // Sync internal state when value or open changes
  React.useEffect(() => {
    setSelectedDate(parsed.date);
    setHour12(parsed.hour12);
    setMinute(parsed.minute);
    setAmpm(parsed.ampm);
  }, [parsed, open]);

  // When baseDate changes externally and value exists, update date part if needed
  React.useEffect(() => {
    if (baseDate && value && value.includes("T")) {
      const [oldDate, timePart] = value.split("T");
      // If it was on old baseDate, align with new baseDate
      if (oldDate !== baseDate && oldDate !== nextDayStr) {
        onChange(`${baseDate}T${timePart}`);
      }
    }
  }, [baseDate]);

  const commitValue = (
    newDate: string,
    newHour12: number,
    newMinute: number,
    newAmpm: "AM" | "PM"
  ) => {
    let h24 = newHour12 % 12;
    if (newAmpm === "PM") h24 += 12;

    const formattedTime = `${String(h24).padStart(2, "0")}:${String(
      newMinute
    ).padStart(2, "0")}`;
    const fullValue = `${newDate}T${formattedTime}`;
    onChange(fullValue);
  };

  const handleHourSelect = (h: number) => {
    setHour12(h);
    commitValue(selectedDate, h, minute, ampm);
  };

  const handleMinuteSelect = (m: number) => {
    setMinute(m);
    commitValue(selectedDate, hour12, m, ampm);
  };

  const handleAmpmChange = (p: "AM" | "PM") => {
    setAmpm(p);
    commitValue(selectedDate, hour12, minute, p);
  };

  const handleDateSelect = (d: string) => {
    setSelectedDate(d);
    commitValue(d, hour12, minute, ampm);
  };

  const handlePresetSelect = (h: number, m: number, p: "AM" | "PM") => {
    setHour12(h);
    setMinute(m);
    setAmpm(p);
    commitValue(selectedDate, h, m, p);
  };

  const handleClear = () => {
    onChange("");
    setOpen(false);
  };

  // Label to display in trigger button
  const displayLabel = React.useMemo(() => {
    if (!value || !value.includes("T")) return null;
    try {
      const parsedIso = parseISO(value);
      if (isValid(parsedIso)) {
        return format(parsedIso, "dd MMM yyyy, hh:mm a");
      }
    } catch {}
    return value;
  }, [value]);

  const formattedSelectedDate = React.useMemo(() => {
    try {
      const d = parseISO(selectedDate);
      if (isValid(d)) return format(d, "EEE, dd MMM yyyy");
    } catch {}
    return selectedDate;
  }, [selectedDate]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring select-none text-left",
            disabled && "cursor-not-allowed opacity-50",
            className
          )}
        >
          <div className="flex items-center gap-2 truncate">
            <Clock className="size-4 text-muted-foreground shrink-0" />
            {displayLabel ? (
              <span className="font-medium text-foreground truncate">
                {displayLabel}
              </span>
            ) : (
              <span className="text-muted-foreground truncate">
                {placeholder}
              </span>
            )}
          </div>
          {value ? (
            <span
              role="button"
              tabIndex={0}
              aria-label="Clear time"
              className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 transition-colors ml-1"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  handleClear();
                }
              }}
            >
              <X className="size-3.5" />
            </span>
          ) : (
            <ChevronDown className="size-3.5 text-muted-foreground opacity-50 shrink-0 ml-1" />
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[310px] p-3 rounded-xl shadow-lg border z-[120]"
      >
        {/* Date Selection Header */}
        <div className="pb-2.5 mb-2.5 border-b space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">Punch Date</span>
            <span className="font-semibold text-foreground">
              {formattedSelectedDate}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 p-0.5 bg-muted/40 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setCustomDateMode(false);
                handleDateSelect(defaultDateStr);
              }}
              className={cn(
                "px-2 py-1 text-xs font-medium rounded-md transition-colors text-center truncate",
                selectedDate === defaultDateStr && !customDateMode
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Same day
            </button>
            <button
              type="button"
              onClick={() => {
                setCustomDateMode(false);
                handleDateSelect(nextDayStr);
              }}
              className={cn(
                "px-2 py-1 text-xs font-medium rounded-md transition-colors text-center truncate",
                selectedDate === nextDayStr && !customDateMode
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Next day (+1)
            </button>
          </div>
        </div>

        {/* Time Big Display & AM/PM Switcher */}
        <div className="flex items-center justify-between pb-2 mb-2">
          <div className="text-2xl font-bold tracking-tight font-mono text-foreground">
            {String(hour12).padStart(2, "0")} : {String(minute).padStart(2, "0")}
          </div>

          <div className="flex items-center rounded-lg border p-0.5 bg-muted/40">
            <button
              type="button"
              onClick={() => handleAmpmChange("AM")}
              className={cn(
                "px-2.5 py-1 text-xs font-semibold rounded-md transition-colors",
                ampm === "AM"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              AM
            </button>
            <button
              type="button"
              onClick={() => handleAmpmChange("PM")}
              className={cn(
                "px-2.5 py-1 text-xs font-semibold rounded-md transition-colors",
                ampm === "PM"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              PM
            </button>
          </div>
        </div>

        {/* Hours Grid (1 to 12) */}
        <div>
          <p className="text-[11px] font-medium text-muted-foreground mb-1.5">
            Hour
          </p>
          <div className="grid grid-cols-6 gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => handleHourSelect(h)}
                className={cn(
                  "h-7 rounded-md text-xs font-medium transition-colors select-none flex items-center justify-center",
                  hour12 === h
                    ? "bg-primary text-primary-foreground font-bold shadow-xs"
                    : "hover:bg-muted text-foreground"
                )}
              >
                {h}
              </button>
            ))}
          </div>
        </div>

        {/* Minutes Grid */}
        <div className="mt-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[11px] font-medium text-muted-foreground">
              Minute
            </p>
            <input
              type="number"
              min={0}
              max={59}
              value={minute}
              onChange={(e) => {
                const val = Math.min(59, Math.max(0, parseInt(e.target.value, 10) || 0));
                handleMinuteSelect(val);
              }}
              className="w-12 h-6 text-center text-xs font-mono rounded border bg-muted/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring tabular-nums"
              aria-label="Custom minute"
            />
          </div>
          <div className="grid grid-cols-6 gap-1">
            {[0, 10, 15, 20, 30, 45].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => handleMinuteSelect(m)}
                className={cn(
                  "h-7 rounded-md text-xs font-medium transition-colors select-none flex items-center justify-center",
                  minute === m
                    ? "bg-primary text-primary-foreground font-bold shadow-xs"
                    : "hover:bg-muted text-foreground"
                )}
              >
                :{String(m).padStart(2, "0")}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Common Presets */}
        <div className="mt-2.5 pt-2 border-t">
          <p className="text-[10px] font-medium text-muted-foreground mb-1.5">
            Common punch times
          </p>
          <div className="grid grid-cols-4 gap-1">
            {COMMON_PRESETS.map((preset) => {
              const isSelected =
                hour12 === preset.h &&
                minute === preset.m &&
                ampm === preset.p;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() =>
                    handlePresetSelect(preset.h, preset.m, preset.p)
                  }
                  className={cn(
                    "px-1 py-1 text-[10px] rounded border transition-colors text-center truncate",
                    isSelected
                      ? "bg-primary/10 border-primary text-primary font-semibold"
                      : "bg-muted/30 border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/70"
                  )}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-3 pt-2 border-t flex items-center justify-between">
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-1 py-0.5"
          >
            Clear
          </button>
          <Button
            type="button"
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={() => setOpen(false)}
          >
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

